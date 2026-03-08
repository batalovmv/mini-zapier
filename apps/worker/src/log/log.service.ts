import { Injectable } from '@nestjs/common';
import { redactCredentials, truncatePayload } from '@mini-zapier/server-utils';
import { Prisma, StepStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

@Injectable()
export class LogService {
  constructor(private readonly prisma: PrismaService) {}

  async createStepLog(
    executionId: string,
    nodeId: string,
    nodeLabel: string,
    nodeType: string,
    inputData: unknown,
  ): Promise<{ id: string; truncated: boolean }> {
    const inputPayload = this.preparePayload(inputData);
    const stepLog = await this.prisma.executionStepLog.create({
      data: {
        executionId,
        nodeId,
        nodeLabel,
        nodeType,
        status: StepStatus.RUNNING,
        inputData: inputPayload.value,
        truncated: inputPayload.truncated,
        startedAt: new Date(),
      },
      select: {
        id: true,
        truncated: true,
      },
    });

    return stepLog;
  }

  async markStepSuccess(
    stepLogId: string,
    outputData: unknown,
    durationMs: number,
  ): Promise<void> {
    const existingStepLog = await this.prisma.executionStepLog.findUnique({
      where: { id: stepLogId },
      select: { truncated: true },
    });

    if (!existingStepLog) {
      throw new Error(`ExecutionStepLog "${stepLogId}" not found.`);
    }

    const outputPayload = this.preparePayload(outputData);

    await this.prisma.executionStepLog.update({
      where: { id: stepLogId },
      data: {
        status: StepStatus.SUCCESS,
        outputData: outputPayload.value,
        truncated: existingStepLog.truncated || outputPayload.truncated,
        completedAt: new Date(),
        durationMs,
        errorMessage: null,
      },
    });
  }

  async markStepFailed(
    stepLogId: string,
    errorMessage: string,
    retryAttempt: number,
    durationMs: number,
  ): Promise<void> {
    await this.prisma.executionStepLog.update({
      where: { id: stepLogId },
      data: {
        status: StepStatus.FAILED,
        errorMessage,
        retryAttempt,
        completedAt: new Date(),
        durationMs,
      },
    });
  }

  private preparePayload(value: unknown): {
    value: Prisma.InputJsonValue | typeof Prisma.JsonNull;
    truncated: boolean;
  } {
    const redactedValue = redactCredentials(value);
    const truncatedPayload = truncatePayload(redactedValue);

    return {
      value: this.normalizeNullableJsonValue(truncatedPayload.data),
      truncated: truncatedPayload.truncated,
    };
  }

  private normalizeNullableJsonValue(
    value: unknown,
  ): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    if (value === undefined || value === null) {
      return Prisma.JsonNull;
    }

    return this.normalizeJsonValue(value);
  }

  private normalizeJsonValue(value: unknown): Prisma.InputJsonValue {
    if (typeof value === 'string' || typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        throw new Error('Payload must not contain non-finite numbers.');
      }

      return value;
    }

    if (Array.isArray(value)) {
      return value.map((entry) =>
        entry === null ? null : this.normalizeJsonValue(entry),
      ) as Prisma.InputJsonArray;
    }

    if (isPlainObject(value)) {
      const result: Record<string, Prisma.InputJsonValue | null> = {};

      for (const [key, entry] of Object.entries(value)) {
        result[key] = entry === null ? null : this.normalizeJsonValue(entry);
      }

      return result as Prisma.InputJsonObject;
    }

    throw new Error('Payload must contain only JSON-serializable values.');
  }
}
