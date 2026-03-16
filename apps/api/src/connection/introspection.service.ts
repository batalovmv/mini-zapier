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
 * Validate that the query is a single SELECT or WITH statement.
 * Strips trailing whitespace/semicolons, then rejects semicolons inside the body.
 */
function validateReadOnlyQuery(rawQuery: string): string {
  const trimmed = rawQuery.trim().replace(/;+\s*$/, '');

  if (trimmed.includes(';')) {
    throw new BadRequestException(
      'Only single SQL statements are allowed. Semicolon chaining is forbidden.',
    );
  }

  const firstWord = trimmed.split(/\s+/)[0]?.toUpperCase();

  if (firstWord !== 'SELECT' && firstWord !== 'WITH') {
    throw new BadRequestException(
      'Only SELECT and WITH statements are allowed for test queries.',
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

      const result = await client.query<{ table_name: string }>(
        `SELECT table_name
         FROM information_schema.tables
         WHERE table_schema = 'public'
         ORDER BY table_name`,
      );

      return { tables: result.rows.map((row) => row.table_name) };
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

    try {
      await client.connect();

      const result = await client.query<{
        column_name: string;
        data_type: string;
        is_nullable: string;
      }>(
        `SELECT column_name, data_type, is_nullable
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1
         ORDER BY ordinal_position`,
        [table],
      );

      return {
        columns: result.rows.map((row) => ({
          name: row.column_name,
          type: row.data_type,
          nullable: row.is_nullable === 'YES',
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
