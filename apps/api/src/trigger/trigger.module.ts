import { Module } from '@nestjs/common';

import { ExecutionModule } from '../execution/execution.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TriggerController } from './trigger.controller';

@Module({
  imports: [PrismaModule, ExecutionModule],
  controllers: [TriggerController],
})
export class TriggerModule {}
