import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { validateWorkerEnv } from './common/validate-env';
import { WorkflowExecutionProcessor } from './processor/workflow-execution.processor';
import { WorkerModule } from './worker.module';

async function bootstrap(): Promise<void> {
  validateWorkerEnv();

  const app = await NestFactory.createApplicationContext(WorkerModule);
  const logger = new Logger('WorkerBootstrap');

  app.enableShutdownHooks();
  app.get(WorkflowExecutionProcessor);

  logger.log('Worker application context started.');
}

void bootstrap();
