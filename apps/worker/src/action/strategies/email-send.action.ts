import { Injectable } from '@nestjs/common';
import { EmailActionConfig } from '@mini-zapier/shared';
import nodemailer from 'nodemailer';

import { ActionStrategy } from './action-strategy.interface';
import {
  ensureSignalNotAborted,
  interpolateValue,
  isPlainObject,
  readRequiredString,
} from './template-interpolation.util';

function readPort(value: unknown): number {
  const numericValue =
    typeof value === 'string' ? Number.parseInt(value, 10) : value;

  if (
    typeof numericValue !== 'number' ||
    !Number.isInteger(numericValue) ||
    numericValue <= 0
  ) {
    throw new Error('SMTP credentials.port must be a positive integer.');
  }

  return numericValue;
}

function readSecure(value: string | undefined, port: number): boolean {
  if (value === undefined) {
    return port === 465;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new Error('SMTP credentials.secure must be "true" or "false".');
}

@Injectable()
export class EmailSendAction implements ActionStrategy {
  async execute(
    config: Record<string, unknown>,
    credentials: Record<string, string> | null,
    inputData: unknown,
    signal?: AbortSignal,
  ): Promise<unknown> {
    ensureSignalNotAborted(signal);

    if (!credentials) {
      throw new Error('SMTP credentials are required for EMAIL action.');
    }

    const interpolatedConfig = interpolateValue(config, inputData);

    if (!isPlainObject(interpolatedConfig)) {
      throw new Error('Email action config must be an object.');
    }

    const host = readRequiredString(credentials.host, 'SMTP credentials.host');
    const port = readPort(credentials.port);
    const user = readRequiredString(credentials.user, 'SMTP credentials.user');
    const pass = readRequiredString(credentials.pass, 'SMTP credentials.pass');
    const from = credentials.from?.trim() || user;
    const secure = readSecure(credentials.secure, port);

    const emailConfig = interpolatedConfig as Partial<EmailActionConfig>;
    const to = readRequiredString(emailConfig.to, 'Email action to');
    const subject = readRequiredString(
      emailConfig.subject,
      'Email action subject',
    );
    const body = readRequiredString(emailConfig.body, 'Email action body');

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    const abortHandler = (): void => {
      transporter.close();
    };

    signal?.addEventListener('abort', abortHandler, { once: true });

    try {
      const result = await transporter.sendMail({
        from,
        to,
        subject,
        text: body,
      });

      ensureSignalNotAborted(signal);

      return {
        messageId: result.messageId,
        accepted: result.accepted,
      };
    } finally {
      signal?.removeEventListener('abort', abortHandler);
      transporter.close();
    }
  }
}
