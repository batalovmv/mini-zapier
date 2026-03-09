import { Injectable } from '@nestjs/common';
import { DataTransformConfig } from '@mini-zapier/shared';

import { ActionStrategy } from './action-strategy.interface';
import {
  ensureSignalNotAborted,
  interpolateValue,
  isPlainObject,
  readRequiredString,
  readRequiredStringRecord,
} from './template-interpolation.util';

@Injectable()
export class DataTransformAction implements ActionStrategy {
  async execute(
    config: Record<string, unknown>,
    _credentials: Record<string, string> | null,
    inputData: unknown,
    signal?: AbortSignal,
  ): Promise<unknown> {
    ensureSignalNotAborted(signal);

    if (!isPlainObject(config)) {
      throw new Error('Data transform config must be an object.');
    }

    const transformConfig = config as Partial<DataTransformConfig>;

    if (transformConfig.mode === 'template') {
      const template = readRequiredString(
        transformConfig.template,
        'Data transform template',
      );
      return interpolateValue(template, inputData);
    }

    if (transformConfig.mode === 'mapping') {
      const mapping = readRequiredStringRecord(
        transformConfig.mapping,
        'Data transform mapping',
      );
      return interpolateValue(mapping, inputData);
    }

    throw new Error('Data transform mode must be either "template" or "mapping".');
  }
}
