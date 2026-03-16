import { Module } from '@nestjs/common';

import { ActionModule } from './action/action.module';
import { ChainResolver } from './engine/chain-resolver';
import { ExecutionEngine } from './engine/execution-engine';
import { StepTestEngine } from './engine/step-test-engine';
import { LogModule } from './log/log.module';
import { StepTestProcessor } from './processor/step-test.processor';
import { WorkflowExecutionProcessor } from './processor/workflow-execution.processor';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, ActionModule, LogModule],
  providers: [
    ChainResolver,
    ExecutionEngine,
    StepTestEngine,
    WorkflowExecutionProcessor,
    StepTestProcessor,
  ],
})
export class WorkerModule {}
