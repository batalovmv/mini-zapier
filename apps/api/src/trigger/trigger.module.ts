import { Module } from '@nestjs/common';

import { ExecutionModule } from '../execution/execution.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TriggerController } from './trigger.controller';
import { CronTriggerStrategy } from './strategies/cron.trigger';
import { TriggerService } from './trigger.service';

@Module({
  imports: [PrismaModule, ExecutionModule],
  controllers: [TriggerController],
  providers: [CronTriggerStrategy, TriggerService],
  exports: [TriggerService],
})
export class TriggerModule {}
