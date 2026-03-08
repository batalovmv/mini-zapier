import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';

import { ExecutionEngine } from '../engine/execution-engine';
import {
  WORKFLOW_EXECUTION_QUEUE_NAME,
  WorkflowExecutionJobData,
} from '../queue/queue.constants';

@Injectable()
export class WorkflowExecutionProcessor
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(WorkflowExecutionProcessor.name);
  private worker?: Worker<WorkflowExecutionJobData>;

  constructor(private readonly executionEngine: ExecutionEngine) {}

  async onModuleInit(): Promise<void> {
    this.worker = new Worker<WorkflowExecutionJobData>(
      WORKFLOW_EXECUTION_QUEUE_NAME,
      async (job) => {
        await this.executionEngine.execute(job.data.executionId);
      },
      {
        connection: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: this.parseRedisPort(process.env.REDIS_PORT),
        },
      },
    );

    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `Job "${job?.id ?? 'unknown'}" failed: ${error.message}`,
      );
    });

    await this.worker.waitUntilReady();

    this.logger.log(
      `Connected to BullMQ queue "${WORKFLOW_EXECUTION_QUEUE_NAME}".`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
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
