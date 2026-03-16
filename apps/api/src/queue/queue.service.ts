import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { StepTestResponse } from '@mini-zapier/shared';
import { Job, Queue, QueueEvents } from 'bullmq';

import {
  STEP_TEST_JOB_NAME,
  STEP_TEST_QUEUE_NAME,
  WORKFLOW_EXECUTION_JOB_NAME,
  WORKFLOW_EXECUTION_QUEUE_NAME,
} from './queue.constants';

declare const process: {
  env: Record<string, string | undefined>;
};

export interface WorkflowExecutionJobData {
  executionId: string;
}

export interface StepTestJobData {
  nodeType: string;
  config: Record<string, unknown>;
  connectionId: string | null;
  inputData: unknown;
}

const STEP_TEST_WAIT_TIMEOUT = 35_000;

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly redisConnection = {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: this.parseRedisPort(process.env.REDIS_PORT),
  };

  private readonly workflowExecutionQueue = new Queue<WorkflowExecutionJobData>(
    WORKFLOW_EXECUTION_QUEUE_NAME,
    { connection: this.redisConnection },
  );

  private readonly stepTestQueue = new Queue<StepTestJobData>(
    STEP_TEST_QUEUE_NAME,
    { connection: this.redisConnection },
  );

  private readonly stepTestQueueEvents = new QueueEvents(
    STEP_TEST_QUEUE_NAME,
    { connection: this.redisConnection },
  );

  async onModuleInit(): Promise<void> {
    await this.stepTestQueueEvents.waitUntilReady();
  }

  async addWorkflowExecutionJob(
    executionId: string,
  ): Promise<Job<WorkflowExecutionJobData>> {
    return this.workflowExecutionQueue.add(WORKFLOW_EXECUTION_JOB_NAME, {
      executionId,
    });
  }

  async removeWorkflowExecutionJob(jobId: string): Promise<void> {
    const job = await this.workflowExecutionQueue.getJob(jobId);

    if (job) {
      await job.remove();
    }
  }

  async addStepTestJob(data: StepTestJobData): Promise<StepTestResponse> {
    const job = await this.stepTestQueue.add(STEP_TEST_JOB_NAME, data);

    try {
      const result = await job.waitUntilFinished(
        this.stepTestQueueEvents,
        STEP_TEST_WAIT_TIMEOUT,
      );

      return result as StepTestResponse;
    } catch (error: unknown) {
      const message =
        error instanceof Error && error.message.includes('timed out')
          ? 'Step test timed out.'
          : `Step test failed: ${error instanceof Error ? error.message : String(error)}`;

      return {
        status: 'FAILED',
        errorMessage: message,
        durationMs: STEP_TEST_WAIT_TIMEOUT,
      };
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.stepTestQueueEvents.close();
    await this.stepTestQueue.close();
    await this.workflowExecutionQueue.close();
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
