import { Injectable, Logger } from '@nestjs/common';
import type { ConnectionTestResultDto } from '@mini-zapier/shared';
import { ConnectionType } from '@mini-zapier/shared';
import nodemailer from 'nodemailer';
import { Client as PgClient } from 'pg';

import { ConnectionService } from './connection.service';

const TEST_TIMEOUT_MS = 10_000;

@Injectable()
export class ConnectionTestService {
  private readonly logger = new Logger(ConnectionTestService.name);

  constructor(private readonly connectionService: ConnectionService) {}

  async test(
    userId: string,
    connectionId: string,
  ): Promise<ConnectionTestResultDto> {
    const { credentials, type } =
      await this.connectionService.getDecryptedCredentials(
        userId,
        connectionId,
      );

    const start = Date.now();

    try {
      const message = await this.withTimeout(
        this.dispatch(type as ConnectionType, credentials),
        TEST_TIMEOUT_MS,
      );

      return { success: true, message, durationMs: Date.now() - start };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.warn(
        `Connection test failed [${connectionId}]: ${message}`,
      );

      return { success: false, message, durationMs: Date.now() - start };
    }
  }

  private dispatch(
    type: ConnectionType,
    credentials: Record<string, string>,
  ): Promise<string> {
    switch (type) {
      case ConnectionType.SMTP:
        return this.testSmtp(credentials);
      case ConnectionType.TELEGRAM:
        return this.testTelegram(credentials);
      case ConnectionType.POSTGRESQL:
        return this.testPostgresql(credentials);
      case ConnectionType.WEBHOOK:
        return Promise.resolve(
          'Webhook secrets do not require connection testing.',
        );
    }
  }

  private async testSmtp(
    credentials: Record<string, string>,
  ): Promise<string> {
    const port = Number(credentials.port ?? 587);
    const transport = nodemailer.createTransport({
      host: credentials.host,
      port,
      secure: port === 465,
      auth: { user: credentials.user, pass: credentials.pass },
    });

    try {
      await transport.verify();
      return `SMTP connection to ${credentials.host}:${port} verified.`;
    } finally {
      transport.close();
    }
  }

  private async testTelegram(
    credentials: Record<string, string>,
  ): Promise<string> {
    const token = credentials.botToken;
    const response = await fetch(
      `https://api.telegram.org/bot${token}/getMe`,
    );
    const body = (await response.json()) as {
      ok: boolean;
      result?: { username?: string };
      description?: string;
    };

    if (!body.ok) {
      throw new Error(body.description ?? 'Telegram API returned error');
    }

    return `Bot @${body.result?.username ?? 'unknown'} is reachable.`;
  }

  private async testPostgresql(
    credentials: Record<string, string>,
  ): Promise<string> {
    const client = credentials.connectionString
      ? new PgClient({ connectionString: credentials.connectionString })
      : new PgClient({
          host: credentials.host,
          port: credentials.port ? Number(credentials.port) : undefined,
          user: credentials.user,
          password: credentials.password,
          database: credentials.database,
        });

    try {
      await client.connect();
      await client.query('SELECT 1');
      return 'PostgreSQL connection verified.';
    } finally {
      await client.end();
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`Connection test timed out after ${ms}ms`)),
        ms,
      );

      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        },
      );
    });
  }
}
