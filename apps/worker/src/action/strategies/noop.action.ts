import { Injectable } from '@nestjs/common';

import { ActionStrategy } from './action-strategy.interface';

@Injectable()
export class NoopAction implements ActionStrategy {
  async execute(
    _config: Record<string, unknown>,
    _credentials: Record<string, string> | null,
    inputData: unknown,
    signal?: AbortSignal,
  ): Promise<unknown> {
    if (signal?.aborted) {
      throw new Error('Action execution aborted.');
    }

    return inputData;
  }
}
