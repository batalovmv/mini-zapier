import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker } from 'bullmq';

import { StepTestEngine } from '../engine/step-test-engine';
import {
  STEP_TEST_QUEUE_NAME,
  StepTestJobData,
} from '../queue/queue.constants';

@Injectable()
export class StepTestProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StepTestProcessor.name);
  private worker?: Worker<StepTestJobData>;

  constructor(private readonly stepTestEngine: StepTestEngine) {}

  async onModuleInit(): Promise<void> {
    this.worker = new Worker<StepTestJobData>(
      STEP_TEST_QUEUE_NAME,
      async (job) => {
        return this.stepTestEngine.executeTest(
          job.data.nodeType,
          job.data.config,
          job.data.connectionId,
          job.data.inputData,
        );
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
        `Step test job "${job?.id ?? 'unknown'}" failed: ${error.message}`,
      );
    });

    await this.worker.waitUntilReady();

    this.logger.log(
      `Connected to BullMQ queue "${STEP_TEST_QUEUE_NAME}".`,
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
