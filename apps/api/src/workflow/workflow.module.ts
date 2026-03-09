import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { TriggerModule } from '../trigger/trigger.module';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';

@Module({
  imports: [PrismaModule, TriggerModule],
  controllers: [WorkflowController],
  providers: [WorkflowService],
})
export class WorkflowModule {}
