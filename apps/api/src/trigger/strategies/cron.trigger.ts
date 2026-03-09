import { BadRequestException, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';

declare const process: {
  env: Record<string, string | undefined>;
};

export const CRON_TRIGGER_QUEUE_NAME = 'workflow-cron-trigger';
export const CRON_TRIGGER_JOB_NAME = 'workflow-cron-trigger';

export interface CronTriggerJobData {
  workflowId: string;
  cronExpression: string;
}

export interface CronWorkflowRegistrationTarget {
  id: string;
  timezone: string;
}

export interface CronTriggerNodeRegistrationTarget {
  config: unknown;
}

@Injectable()
export class CronTriggerStrategy implements OnModuleDestroy {
  private readonly cronTriggerQueue = new Queue<CronTriggerJobData>(
    CRON_TRIGGER_QUEUE_NAME,
    {
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: this.parseRedisPort(process.env.REDIS_PORT),
      },
    },
  );

  async register(
    workflow: CronWorkflowRegistrationTarget,
    triggerNode: CronTriggerNodeRegistrationTarget,
  ): Promise<void> {
    const cronExpression = this.getCronExpression(triggerNode.config);

    try {
      await this.cronTriggerQueue.upsertJobScheduler(
        this.getSchedulerId(workflow.id),
        {
          pattern: cronExpression,
          tz: workflow.timezone,
        },
        {
          name: CRON_TRIGGER_JOB_NAME,
          data: {
            workflowId: workflow.id,
            cronExpression,
          },
          opts: {
            removeOnComplete: 100,
            removeOnFail: 100,
          },
        },
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown cron registration error.';

      throw new BadRequestException(
        `Cron trigger config is invalid: ${message}`,
      );
    }
  }

  async unregister(workflowId: string): Promise<void> {
    await this.cronTriggerQueue.removeJobScheduler(
      this.getSchedulerId(workflowId),
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.cronTriggerQueue.close();
  }

  private getCronExpression(config: unknown): string {
    if (!this.isPlainObject(config) || typeof config.cronExpression !== 'string') {
      throw new BadRequestException(
        'Cron trigger config must contain a non-empty "cronExpression" field.',
      );
    }

    const cronExpression = config.cronExpression.trim();

    if (cronExpression.length === 0) {
      throw new BadRequestException(
        'Cron trigger config must contain a non-empty "cronExpression" field.',
      );
    }

    return cronExpression;
  }

  private getSchedulerId(workflowId: string): string {
    return `workflow:${workflowId}`;
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return Object.prototype.toString.call(value) === '[object Object]';
  }

  private parseRedisPort(value: string | undefined): number {
    if (value === undefined) {
      return 6380;
    }

    const parsedValue = Number.parseInt(value, 10);

    if (Number.isNaN(parsedValue) || parsedValue <= 0) {
      return 6380;
    }

    return parsedValue;
  }
}
