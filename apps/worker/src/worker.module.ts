import { Module } from '@nestjs/common';

import { ActionModule } from './action/action.module';
import { ChainResolver } from './engine/chain-resolver';
import { ExecutionEngine } from './engine/execution-engine';
import { LogModule } from './log/log.module';
import { WorkflowExecutionProcessor } from './processor/workflow-execution.processor';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, ActionModule, LogModule],
  providers: [ChainResolver, ExecutionEngine, WorkflowExecutionProcessor],
})
export class WorkerModule {}
