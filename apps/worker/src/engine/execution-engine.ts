import { Injectable, Logger } from '@nestjs/common';
import { buildFieldTree, decrypt, redactCredentials } from '@mini-zapier/server-utils';
import { ExecutionStatus, WorkflowStatus } from '@mini-zapier/shared';

import { ActionService } from '../action/action.service';
import { LogService } from '../log/log.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChainResolver, SnapshotNode } from './chain-resolver';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function wait(delayMs: number): Promise<void> {
  if (delayMs <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

const AUTO_PAUSE_FAILURE_THRESHOLD = 5;

class ActionExecutionError extends Error {
  constructor(
    message: string,
    readonly retryAttempt: number,
  ) {
    super(message);
    this.name = 'ActionExecutionError';
  }
}

@Injectable()
export class ExecutionEngine {
  private readonly logger = new Logger(ExecutionEngine.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chainResolver: ChainResolver,
    private readonly actionService: ActionService,
    private readonly logService: LogService,
  ) {}

  async execute(executionId: string): Promise<void> {
    const execution = await this.prisma.workflowExecution.findUnique({
      where: { id: executionId },
      select: {
        id: true,
        workflowId: true,
        triggerData: true,
        definitionSnapshot: true,
      },
    });

    if (!execution) {
      this.logger.error(`WorkflowExecution "${executionId}" not found.`);
      return;
    }

    const triggerDataRaw =
      execution.triggerData === null ? undefined : execution.triggerData;
    const triggerDataSchema = buildFieldTree(redactCredentials(triggerDataRaw));

    await this.prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: ExecutionStatus.RUNNING,
        startedAt: new Date(),
        completedAt: null,
        errorMessage: null,
        triggerDataSchema:
          triggerDataSchema.length > 0
            ? (triggerDataSchema as object[])
            : undefined,
      },
    });

    try {
      const actionNodes = this.chainResolver.resolve(execution.definitionSnapshot);
      let dataContext: unknown = triggerDataRaw;

      for (const actionNode of actionNodes) {
        const stepStartedAt = Date.now();
        const stepLog = await this.logService.createStepLog(
          executionId,
          actionNode.id,
          actionNode.label,
          actionNode.nodeType,
          dataContext,
        );

        try {
          const credentials = await this.loadCredentials(actionNode.connectionId);
          const outputData = await this.executeActionWithRetry(
            actionNode,
            credentials,
            dataContext,
          );

          await this.logService.markStepSuccess(
            stepLog.id,
            outputData,
            Date.now() - stepStartedAt,
          );

          dataContext = outputData;
        } catch (error) {
          const actionError = this.toActionExecutionError(error);

          await this.logService.markStepFailed(
            stepLog.id,
            actionError.message,
            actionError.retryAttempt,
            Date.now() - stepStartedAt,
          );

          await this.markExecutionFailed(
            executionId,
            execution.workflowId,
            actionError.message,
          );
          return;
        }
      }

      await this.prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: ExecutionStatus.SUCCESS,
          completedAt: new Date(),
          errorMessage: null,
        },
      });
    } catch (error) {
      const errorMessage = this.toErrorMessage(error);

      this.logger.error(
        `Execution "${executionId}" failed before completing the action chain: ${errorMessage}`,
      );

      await this.markExecutionFailed(
        executionId,
        execution.workflowId,
        errorMessage,
      );
    }
  }

  private async executeActionWithRetry(
    actionNode: SnapshotNode,
    credentials: Record<string, string> | null,
    inputData: unknown,
  ): Promise<unknown> {
    const retryCount = this.normalizeNonNegativeInteger(
      actionNode.retryCount,
      'retryCount',
    );
    const retryBackoff = this.normalizeNonNegativeInteger(
      actionNode.retryBackoff,
      'retryBackoff',
    );

    for (let attempt = 0; attempt <= retryCount; attempt += 1) {
      try {
        return await this.executeActionWithTimeout(
          actionNode,
          credentials,
          inputData,
        );
      } catch (error) {
        const errorMessage = this.toErrorMessage(error);

        if (attempt >= retryCount) {
          throw new ActionExecutionError(errorMessage, attempt);
        }

        await wait(retryBackoff * 2 ** attempt);
      }
    }

    throw new ActionExecutionError('Action execution exhausted retries.', retryCount);
  }

  private async executeActionWithTimeout(
    actionNode: SnapshotNode,
    credentials: Record<string, string> | null,
    inputData: unknown,
  ): Promise<unknown> {
    const timeoutMs =
      actionNode.timeoutMs === null || actionNode.timeoutMs === undefined
        ? undefined
        : this.normalizePositiveInteger(actionNode.timeoutMs, 'timeoutMs');

    if (timeoutMs === undefined) {
      return this.actionService.execute(
        actionNode.nodeType,
        actionNode.config,
        credentials,
        inputData,
      );
    }

    const controller = new AbortController();

    let timeoutHandle: NodeJS.Timeout | undefined;

    try {
      const actionPromise = this.actionService.execute(
        actionNode.nodeType,
        actionNode.config,
        credentials,
        inputData,
        controller.signal,
      );

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(() => {
          controller.abort();
          reject(
            new Error(
              `Action "${actionNode.label}" timed out after ${timeoutMs}ms.`,
            ),
          );
        }, timeoutMs);
      });

      return await Promise.race([actionPromise, timeoutPromise]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private async loadCredentials(
    connectionId: string | null | undefined,
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

  private async markExecutionFailed(
    executionId: string,
    workflowId: string,
    errorMessage: string,
  ): Promise<void> {
    const autoPaused = await this.prisma.$transaction(async (tx) => {
      await tx.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: ExecutionStatus.FAILED,
          completedAt: new Date(),
          errorMessage,
        },
      });

      const latestExecutions = await tx.workflowExecution.findMany({
        where: { workflowId },
        take: AUTO_PAUSE_FAILURE_THRESHOLD,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: { status: true },
      });

      if (latestExecutions.length < AUTO_PAUSE_FAILURE_THRESHOLD) {
        return false;
      }

      if (
        latestExecutions.some(
          (execution) => execution.status !== ExecutionStatus.FAILED,
        )
      ) {
        return false;
      }

      const updateResult = await tx.workflow.updateMany({
        where: {
          id: workflowId,
          status: WorkflowStatus.ACTIVE,
        },
        data: {
          status: WorkflowStatus.PAUSED,
        },
      });

      return updateResult.count > 0;
    });

    if (autoPaused) {
      this.logger.warn(
        `Workflow "${workflowId}" auto-paused after ${AUTO_PAUSE_FAILURE_THRESHOLD} consecutive failed executions.`,
      );
    }
  }

  private toActionExecutionError(error: unknown): ActionExecutionError {
    if (error instanceof ActionExecutionError) {
      return error;
    }

    return new ActionExecutionError(this.toErrorMessage(error), 0);
  }

  private toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown execution error.';
  }

  private normalizeNonNegativeInteger(
    value: number | null | undefined,
    fieldName: string,
  ): number {
    if (value === null || value === undefined) {
      return 0;
    }

    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`${fieldName} must be a non-negative integer.`);
    }

    return value;
  }

  private normalizePositiveInteger(value: number, fieldName: string): number {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${fieldName} must be a positive integer.`);
    }

    return value;
  }
}
