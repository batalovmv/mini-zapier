import { Injectable } from '@nestjs/common';
import { DbQueryActionConfig } from '@mini-zapier/shared';
import { Client, type ClientConfig } from 'pg';

import { ActionStrategy } from './action-strategy.interface';
import {
  ensureSignalNotAborted,
  interpolateValue,
  isPlainObject,
  readRequiredString,
} from './template-interpolation.util';

function readPort(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const port = Number.parseInt(value, 10);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(
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
    host: readRequiredString(credentials.host, 'PostgreSQL credentials.host'),
    port: readPort(credentials.port),
    user: readRequiredString(credentials.user, 'PostgreSQL credentials.user'),
    password: readRequiredString(
      credentials.password,
      'PostgreSQL credentials.password',
    ),
    database: readRequiredString(
      credentials.database,
      'PostgreSQL credentials.database',
    ),
  };
}

function normalizeParams(value: unknown): unknown[] {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new Error('DB query params must be an array.');
  }

  return value;
}

@Injectable()
export class DbQueryAction implements ActionStrategy {
  async execute(
    config: Record<string, unknown>,
    credentials: Record<string, string> | null,
    inputData: unknown,
    signal?: AbortSignal,
  ): Promise<unknown> {
    ensureSignalNotAborted(signal);

    if (!credentials) {
      throw new Error('PostgreSQL credentials are required for DB_QUERY action.');
    }

    const interpolatedConfig = interpolateValue(config, inputData);

    if (!isPlainObject(interpolatedConfig)) {
      throw new Error('DB query config must be an object.');
    }

    const dbConfig = interpolatedConfig as Partial<DbQueryActionConfig>;
    const query = readRequiredString(dbConfig.query, 'DB query query');
    const params = normalizeParams(dbConfig.params);

    const client = new Client(buildClientConfig(credentials));

    const abortHandler = (): void => {
      void client.end().catch(() => undefined);
    };

    signal?.addEventListener('abort', abortHandler, { once: true });

    try {
      await client.connect();
      ensureSignalNotAborted(signal);

      const result = await client.query(query, params);

      ensureSignalNotAborted(signal);

      // Sanitize rows: pg returns Date, Buffer, BigInt etc. that are not
      // JSON-serializable.  A JSON round-trip converts them to strings/null
      // which keeps the downstream payload safe.
      const rows = JSON.parse(JSON.stringify(result.rows));

      return {
        rows,
        rowCount: result.rowCount,
      };
    } finally {
      signal?.removeEventListener('abort', abortHandler);
      await client.end().catch(() => undefined);
    }
  }
}
