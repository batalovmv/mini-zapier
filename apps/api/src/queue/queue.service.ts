import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Job, Queue } from 'bullmq';

import {
  WORKFLOW_EXECUTION_JOB_NAME,
  WORKFLOW_EXECUTION_QUEUE_NAME,
} from './queue.constants';

declare const process: {
  env: Record<string, string | undefined>;
};

export interface WorkflowExecutionJobData {
  executionId: string;
}

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly workflowExecutionQueue = new Queue<WorkflowExecutionJobData>(
    WORKFLOW_EXECUTION_QUEUE_NAME,
    {
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: this.parseRedisPort(process.env.REDIS_PORT),
      },
    },
  );

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

  async onModuleDestroy(): Promise<void> {
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
