import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './auth/auth.module';
import { ConnectionModule } from './connection/connection.module';
import { ExecutionModule } from './execution/execution.module';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { StatsModule } from './stats/stats.module';
import { TriggerModule } from './trigger/trigger.module';
import { WorkflowModule } from './workflow/workflow.module';

@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot([
      {
        name: 'login',
        ttl: 60_000,
        limit: 5,
      },
      {
        name: 'trigger',
        ttl: 60_000,
        limit: 30,
      },
    ]),
    AuthModule,
    ConnectionModule,
    WorkflowModule,
    ExecutionModule,
    TriggerModule,
    StatsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
