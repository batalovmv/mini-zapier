import { Injectable, Logger } from '@nestjs/common';
import { ActionType, StepTestResponse } from '@mini-zapier/shared';
import { buildFieldTree, decrypt, redactCredentials } from '@mini-zapier/server-utils';
import { Client, type ClientConfig } from 'pg';

import { ActionService } from '../action/action.service';
import {
  interpolateValue,
  isPlainObject,
  readRequiredString,
} from '../action/strategies/template-interpolation.util';
import { PrismaService } from '../prisma/prisma.service';

const STATEMENT_TIMEOUT_MS = '10000';
const PREVIEW_ROW_LIMIT = 50;
const ACTION_TIMEOUT_MS = 30_000;

function readPort(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const port = Number.parseInt(value, 10);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PostgreSQL credentials.port must be a positive integer.');
  }

  return port;
}

function buildClientConfig(
  credentials: Record<string, string>,
): ClientConfig {
  if (credentials.connectionString?.trim()) {
    return { connectionString: credentials.connectionString.trim() };
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

const ALLOWED_READ = new Set(['SELECT', 'WITH']);
const ALLOWED_MUTATION = new Set(['INSERT', 'UPDATE', 'DELETE']);

function classifyQuery(query: string): 'read' | 'mutation' {
  const firstWord = query.trim().split(/\s+/)[0]?.toUpperCase();

  if (firstWord && ALLOWED_READ.has(firstWord)) {
    return 'read';
  }

  if (firstWord && ALLOWED_MUTATION.has(firstWord)) {
    return 'mutation';
  }

  throw new Error(
    `Only SELECT, WITH, INSERT, UPDATE and DELETE statements are allowed. Got: ${firstWord ?? '(empty)'}`,
  );
}

@Injectable()
export class StepTestEngine {
  private readonly logger = new Logger(StepTestEngine.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly actionService: ActionService,
  ) {}

  async executeTest(
    nodeType: string,
    config: Record<string, unknown>,
    connectionId: string | null,
    inputData: unknown,
  ): Promise<StepTestResponse> {
    const startedAt = Date.now();

    try {
      const credentials = await this.loadCredentials(connectionId);

      if (nodeType === ActionType.DB_QUERY) {
        return await this.executeDbQueryTest(
          config,
          credentials,
          inputData,
          startedAt,
        );
      }

      const outputData = await this.executeActionWithTimeout(
        nodeType,
        config,
        credentials,
        inputData,
      );

      const outputDataSchema = buildFieldTree(redactCredentials(outputData));

      return {
        status: 'SUCCESS',
        outputData: redactCredentials(outputData),
        outputDataSchema:
          outputDataSchema.length > 0 ? outputDataSchema : undefined,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Step test failed.';

      this.logger.warn(`Step test failed: ${errorMessage}`);

      return {
        status: 'FAILED',
        errorMessage,
        durationMs: Date.now() - startedAt,
      };
    }
  }

  private async executeDbQueryTest(
    config: Record<string, unknown>,
    credentials: Record<string, string> | null,
    inputData: unknown,
    startedAt: number,
  ): Promise<StepTestResponse> {
    if (!credentials) {
      throw new Error(
        'PostgreSQL credentials are required for DB_QUERY action.',
      );
    }

    const interpolatedConfig = interpolateValue(config, inputData);

    if (!isPlainObject(interpolatedConfig)) {
      throw new Error('DB query config must be an object.');
    }

    const query = readRequiredString(
      (interpolatedConfig as Record<string, unknown>).query,
      'DB query query',
    );
    const rawParams = (interpolatedConfig as Record<string, unknown>).params;
    const params =
      rawParams === undefined
        ? []
        : Array.isArray(rawParams)
          ? rawParams
          : (() => {
              throw new Error('DB query params must be an array.');
            })();

    const queryType = classifyQuery(query);

    if (queryType === 'mutation' && /\bRETURNING\b/i.test(query)) {
      throw new Error('RETURNING clause is not allowed in mutation preview.');
    }

    const client = new Client(buildClientConfig(credentials));

    try {
      await client.connect();

      if (queryType === 'read') {
        await client.query('BEGIN READ ONLY');
        await client.query(
          `SET LOCAL statement_timeout = '${STATEMENT_TIMEOUT_MS}'`,
        );

        const wrappedQuery = `SELECT * FROM (${query}) AS _q LIMIT ${PREVIEW_ROW_LIMIT}`;
        const result = await client.query(wrappedQuery, params);

        await client.query('ROLLBACK');

        const rows = JSON.parse(JSON.stringify(result.rows)) as unknown[];
        const outputData = { rows, rowCount: result.rowCount ?? 0 };
        const outputDataSchema = buildFieldTree(
          redactCredentials(outputData),
        );

        return {
          status: 'SUCCESS',
          outputData,
          outputDataSchema:
            outputDataSchema.length > 0 ? outputDataSchema : undefined,
          durationMs: Date.now() - startedAt,
        };
      }

      // Mutation path: BEGIN → SET LOCAL → execute → ROLLBACK
      await client.query('BEGIN');
      await client.query(
        `SET LOCAL statement_timeout = '${STATEMENT_TIMEOUT_MS}'`,
      );

      const result = await client.query(query, params);
      const rowCount = result.rowCount ?? 0;

      await client.query('ROLLBACK');

      const outputData = { rowCount };
      const outputDataSchema = buildFieldTree(redactCredentials(outputData));

      return {
        status: 'SUCCESS',
        outputData,
        outputDataSchema:
          outputDataSchema.length > 0 ? outputDataSchema : undefined,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  private async executeActionWithTimeout(
    nodeType: string,
    config: Record<string, unknown>,
    credentials: Record<string, string> | null,
    inputData: unknown,
  ): Promise<unknown> {
    const controller = new AbortController();
    let timeoutHandle: NodeJS.Timeout | undefined;

    try {
      const actionPromise = this.actionService.execute(
        nodeType,
        config,
        credentials,
        inputData,
        controller.signal,
      );

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          controller.abort();
          reject(new Error(`Step test timed out after ${ACTION_TIMEOUT_MS}ms.`));
        }, ACTION_TIMEOUT_MS);
      });

      return await Promise.race([actionPromise, timeoutPromise]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private async loadCredentials(
    connectionId: string | null,
  ): Promise<Record<string, string> | null> {
    if (!connectionId) {
      return null;
    }

    const connection = await this.prisma.connection.findUnique({
      where: { id: connectionId },
      select: { credentials: true },
    });

    if (!connection) {
      throw new Error(`Connection "${connectionId}" not found.`);
    }

    const encryptionKey = process.env.APP_ENCRYPTION_KEY;

    if (!encryptionKey) {
      throw new Error('APP_ENCRYPTION_KEY is required to decrypt credentials.');
    }

    const decryptedValue = decrypt(connection.credentials, encryptionKey);
    const parsedValue: unknown = JSON.parse(decryptedValue);

    if (!isPlainObject(parsedValue)) {
      throw new Error(
        `Connection "${connectionId}" credentials must decrypt to an object.`,
      );
    }

    const credentials: Record<string, string> = {};

    for (const [key, value] of Object.entries(parsedValue)) {
      if (typeof value !== 'string') {
        throw new Error(
          `Connection "${connectionId}" credentials must contain string values.`,
        );
      }

      credentials[key] = value;
    }

    return credentials;
  }
}
