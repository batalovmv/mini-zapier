import { Injectable } from '@nestjs/common';
import { ActionType } from '@mini-zapier/shared';

import { ActionStrategy } from './strategies/action-strategy.interface';
import { DataTransformAction } from './strategies/data-transform.action';
import { DbQueryAction } from './strategies/db-query.action';
import { EmailSendAction } from './strategies/email-send.action';
import { HttpRequestAction } from './strategies/http-request.action';
import { TelegramAction } from './strategies/telegram.action';

@Injectable()
export class ActionService {
  private readonly registry = new Map<ActionType, ActionStrategy>();

  constructor(
    httpRequestAction: HttpRequestAction,
    emailSendAction: EmailSendAction,
    telegramAction: TelegramAction,
    dbQueryAction: DbQueryAction,
    dataTransformAction: DataTransformAction,
  ) {
    this.registry.set(ActionType.HTTP_REQUEST, httpRequestAction);
    this.registry.set(ActionType.EMAIL, emailSendAction);
    this.registry.set(ActionType.TELEGRAM, telegramAction);
    this.registry.set(ActionType.DB_QUERY, dbQueryAction);
    this.registry.set(ActionType.DATA_TRANSFORM, dataTransformAction);
  }

  resolve(nodeType: string): ActionStrategy {
    if (!Object.values(ActionType).includes(nodeType as ActionType)) {
      throw new Error(`Unknown action type "${nodeType}".`);
    }

    const strategy = this.registry.get(nodeType as ActionType);

    if (!strategy) {
      throw new Error(`No action strategy registered for nodeType "${nodeType}".`);
    }

    return strategy;
  }

  async execute(
    nodeType: string,
    config: Record<string, unknown>,
    credentials: Record<string, string> | null,
    inputData: unknown,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const strategy = this.resolve(nodeType);
    return strategy.execute(config, credentials, inputData, signal);
  }
}
