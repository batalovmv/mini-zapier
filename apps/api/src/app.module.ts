import { Module } from '@nestjs/common';

import { ConnectionModule } from './connection/connection.module';
import { ExecutionModule } from './execution/execution.module';
import { PrismaModule } from './prisma/prisma.module';
import { TriggerModule } from './trigger/trigger.module';
import { WorkflowModule } from './workflow/workflow.module';

@Module({
  imports: [
    PrismaModule,
    ConnectionModule,
    WorkflowModule,
    ExecutionModule,
    TriggerModule,
  ],
})
export class AppModule {}
