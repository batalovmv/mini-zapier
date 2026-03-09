import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { StatsController } from './stats.controller';

@Module({
  imports: [PrismaModule],
  controllers: [StatsController],
})
export class StatsModule {}
