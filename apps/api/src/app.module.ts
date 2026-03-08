import { Module } from '@nestjs/common';

import { ConnectionModule } from './connection/connection.module';
import { PrismaModule } from './prisma/prisma.module';
import { WorkflowModule } from './workflow/workflow.module';

@Module({
  imports: [PrismaModule, ConnectionModule, WorkflowModule],
})
export class AppModule {}
