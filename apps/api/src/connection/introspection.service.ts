import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConnectionType } from '@mini-zapier/shared';
import { Client, type ClientConfig } from 'pg';

import { ConnectionService } from './connection.service';

const PREVIEW_ROW_LIMIT = 50;
const STATEMENT_TIMEOUT_MS = '10000';
const SYSTEM_SCHEMAS = ['information_schema', 'pg_catalog'];

function parseTableReference(value: string): {
  schema: string;
  table: string;
} {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new BadRequestException('Table name is required.');
  }

  const separatorIndex = trimmed.indexOf('.');

  if (separatorIndex === -1) {
    return {
      schema: 'public',
      table: trimmed,
    };
  }

  const schema = trimmed.slice(0, separatorIndex).trim();
  const table = trimmed.slice(separatorIndex + 1).trim();

  if (!schema || !table) {
    throw new BadRequestException('Table name must use schema.table format.');
  }

  return { schema, table };
}

// Reuse worker's credential parsing pattern (db-query.action.ts:29-51)
function readPort(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const port = Number.parseInt(value, 10);

  if (!Number.isInteger(port) || port <= 0) {
    throw new BadRequestException(
      'PostgreSQL credentials.port must be a positive integer.',
    );
  }

  return port;
}

function buildClientConfig(
  credentials: Record<string, string>,
): ClientConfig {
  if (credentials.connectionString?.trim()) {
    return {
      connectionString: credentials.connectionString.trim(),
    };
  }

  return {
    host: credentials.host,
    port: readPort(credentials.port),
    user: credentials.user,
    password: credentials.password,
    database: credentials.database,
  };
}

/**
 * Strip trailing whitespace/semicolons, reject embedded semicolons.
 */
function sanitizeSingleStatement(rawQuery: string): string {
  const trimmed = rawQuery.trim().replace(/;+\s*$/, '');

  if (trimmed.includes(';')) {
    throw new BadRequestException(
      'Only single SQL statements are allowed. Semicolon chaining is forbidden.',
    );
  }

  return trimmed;
}

/**
 * Validate that the query is a single SELECT or WITH statement.
 */
function validateReadOnlyQuery(rawQuery: string): string {
  const trimmed = sanitizeSingleStatement(rawQuery);
  const firstWord = trimmed.split(/\s+/)[0]?.toUpperCase();

  if (firstWord !== 'SELECT' && firstWord !== 'WITH') {
    throw new BadRequestException(
      'Only SELECT and WITH statements are allowed for test queries.',
    );
  }

  return trimmed;
}

/**
 * Validate that the query is a single INSERT, UPDATE or DELETE statement.
 */
function validateMutationQuery(rawQuery: string): string {
  const trimmed = sanitizeSingleStatement(rawQuery);
  const firstWord = trimmed.split(/\s+/)[0]?.toUpperCase();

  if (
    firstWord !== 'INSERT' &&
    firstWord !== 'UPDATE' &&
    firstWord !== 'DELETE'
  ) {
    throw new BadRequestException(
      'Only INSERT, UPDATE and DELETE statements are allowed for mutation test.',
    );
  }

  // Reject RETURNING clause to prevent materializing large result sets in preview
  if (/\bRETURNING\b/i.test(trimmed)) {
    throw new BadRequestException(
      'RETURNING clause is not allowed in mutation preview.',
    );
  }

  return trimmed;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
}

@Injectable()
export class IntrospectionService {
  constructor(private readonly connectionService: ConnectionService) {}

  async getTables(
    userId: string,
    connectionId: string,
  ): Promise<{ tables: string[] }> {
    const client = await this.createClient(userId, connectionId);

    try {
      await client.connect();

      const result = await client.query<{
        relation_schema: string;
        relation_name: string;
      }>(
        `SELECT n.nspname AS relation_schema, c.relname AS relation_name
         FROM pg_catalog.pg_class AS c
         INNER JOIN pg_catalog.pg_namespace AS n
           ON n.oid = c.relnamespace
         WHERE c.relkind IN ('r', 'p', 'v', 'm', 'f')
           AND n.nspname NOT IN (${SYSTEM_SCHEMAS.map((_, index) => `$${index + 1}`).join(', ')})
           AND n.nspname NOT LIKE 'pg_toast%'
           AND n.nspname NOT LIKE 'pg_temp_%'
           AND (
             pg_catalog.has_table_privilege(c.oid, 'SELECT')
             OR pg_catalog.has_table_privilege(c.oid, 'INSERT')
             OR pg_catalog.has_table_privilege(c.oid, 'UPDATE')
             OR pg_catalog.has_table_privilege(c.oid, 'DELETE')
             OR pg_catalog.has_any_column_privilege(c.oid, 'SELECT')
             OR pg_catalog.has_any_column_privilege(c.oid, 'INSERT')
             OR pg_catalog.has_any_column_privilege(c.oid, 'UPDATE')
             OR pg_catalog.has_any_column_privilege(c.oid, 'REFERENCES')
           )
         ORDER BY
           CASE WHEN n.nspname = 'public' THEN 0 ELSE 1 END,
           n.nspname,
           c.relname`,
        SYSTEM_SCHEMAS,
      );

      return {
        tables: result.rows.map((row) =>
          row.relation_schema === 'public'
            ? row.relation_name
            : `${row.relation_schema}.${row.relation_name}`,
        ),
      };
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  async getColumns(
    userId: string,
    connectionId: string,
    table: string,
  ): Promise<{ columns: ColumnInfo[] }> {
    const client = await this.createClient(userId, connectionId);
    const tableRef = parseTableReference(table);

    try {
      await client.connect();

      const result = await client.query<{
        column_name: string;
        data_type: string;
        is_nullable: boolean;
      }>(
        `SELECT
           a.attname AS column_name,
           pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
           NOT a.attnotnull AS is_nullable
         FROM pg_catalog.pg_class AS c
         INNER JOIN pg_catalog.pg_namespace AS n
           ON n.oid = c.relnamespace
         INNER JOIN pg_catalog.pg_attribute AS a
           ON a.attrelid = c.oid
         WHERE n.nspname = $1
           AND c.relname = $2
           AND a.attnum > 0
           AND NOT a.attisdropped
         ORDER BY a.attnum`,
        [tableRef.schema, tableRef.table],
      );

      return {
        columns: result.rows.map((row) => ({
          name: row.column_name,
          type: row.data_type,
          nullable: row.is_nullable,
        })),
      };
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  async testQuery(
    userId: string,
    connectionId: string,
    rawQuery: string,
    params: unknown[],
  ): Promise<{ rows: unknown[]; rowCount: number }> {
    const query = validateReadOnlyQuery(rawQuery);
    const client = await this.createClient(userId, connectionId);

    try {
      await client.connect();

      // Read-only transaction with server-side timeout (SET LOCAL scoped to txn)
      await client.query('BEGIN READ ONLY');
      await client.query(
        `SET LOCAL statement_timeout = '${STATEMENT_TIMEOUT_MS}'`,
      );

      // Wrap in subquery with LIMIT to cap rows at DB level
      const wrappedQuery = `SELECT * FROM (${query}) AS _q LIMIT ${PREVIEW_ROW_LIMIT}`;
      const result = await client.query(wrappedQuery, params);

      await client.query('COMMIT');

      // JSON round-trip for Date/BigInt/Buffer safety (matches db-query.action.ts:108)
      const rows = JSON.parse(JSON.stringify(result.rows)) as unknown[];

      return {
        rows,
        rowCount: result.rowCount ?? 0,
      };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);

      if (error instanceof BadRequestException) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : 'Query execution failed.';
      throw new BadRequestException(`Query error: ${message}`);
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  async testMutation(
    userId: string,
    connectionId: string,
    rawQuery: string,
    params: unknown[],
  ): Promise<{ rowCount: number }> {
    const query = validateMutationQuery(rawQuery);
    const client = await this.createClient(userId, connectionId);

    try {
      await client.connect();

      await client.query('BEGIN');
      await client.query(
        `SET LOCAL statement_timeout = '${STATEMENT_TIMEOUT_MS}'`,
      );

      const result = await client.query(query, params);
      const rowCount = result.rowCount ?? 0;

      // Always rollback — mutation preview must not persist changes
      await client.query('ROLLBACK');

      return { rowCount };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);

      if (error instanceof BadRequestException) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : 'Query execution failed.';
      throw new BadRequestException(`Query error: ${message}`);
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  private async createClient(
    userId: string,
    connectionId: string,
  ): Promise<Client> {
    const { credentials, type } =
      await this.connectionService.getDecryptedCredentials(userId, connectionId);

    if (type !== ConnectionType.POSTGRESQL) {
      throw new BadRequestException(
        'Introspection is only available for PostgreSQL connections.',
      );
    }

    return new Client(buildClientConfig(credentials));
  }
}
