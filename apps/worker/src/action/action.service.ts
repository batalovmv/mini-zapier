import { Injectable } from '@nestjs/common';
import { ActionType } from '@mini-zapier/shared';

import { ActionStrategy } from './strategies/action-strategy.interface';
import { NoopAction } from './strategies/noop.action';

@Injectable()
export class ActionService {
  private readonly registry = new Map<string, ActionStrategy>();

  constructor(noopAction: NoopAction) {
    this.registry.set(ActionType.HTTP_REQUEST, noopAction);
    this.registry.set(ActionType.EMAIL, noopAction);
    this.registry.set(ActionType.TELEGRAM, noopAction);
    this.registry.set(ActionType.DB_QUERY, noopAction);
    this.registry.set(ActionType.DATA_TRANSFORM, noopAction);
  }

  resolve(nodeType: string): ActionStrategy {
    const strategy = this.registry.get(nodeType);

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
