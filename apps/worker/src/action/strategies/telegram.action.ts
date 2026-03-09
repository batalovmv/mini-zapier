import { Injectable } from '@nestjs/common';
import { TelegramActionConfig } from '@mini-zapier/shared';
import axios from 'axios';

import { ActionStrategy } from './action-strategy.interface';
import {
  ensureSignalNotAborted,
  interpolateValue,
  isPlainObject,
  readRequiredString,
} from './template-interpolation.util';

interface TelegramSendMessageResponse {
  ok: boolean;
  result?: {
    message_id?: number;
  };
  description?: string;
}

@Injectable()
export class TelegramAction implements ActionStrategy {
  async execute(
    config: Record<string, unknown>,
    credentials: Record<string, string> | null,
    inputData: unknown,
    signal?: AbortSignal,
  ): Promise<unknown> {
    ensureSignalNotAborted(signal);

    if (!credentials) {
      throw new Error('Telegram credentials are required for TELEGRAM action.');
    }

    const interpolatedConfig = interpolateValue(config, inputData);

    if (!isPlainObject(interpolatedConfig)) {
      throw new Error('Telegram action config must be an object.');
    }

    const botToken = readRequiredString(
      credentials.botToken,
      'Telegram credentials.botToken',
    );
    const telegramConfig = interpolatedConfig as Partial<TelegramActionConfig>;
    const chatId = readRequiredString(
      telegramConfig.chatId,
      'Telegram action chatId',
    );
    const message = readRequiredString(
      telegramConfig.message,
      'Telegram action message',
    );

    const response = await axios.post<TelegramSendMessageResponse>(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        chat_id: chatId,
        text: message,
      },
      {
        signal,
      },
    );

    if (!response.data.ok) {
      throw new Error(
        response.data.description || 'Telegram API responded with ok=false.',
      );
    }

    return {
      messageId: response.data.result?.message_id ?? null,
      ok: response.data.ok,
    };
  }
}
