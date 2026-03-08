import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { ExecutionController } from './execution.controller';
import { ExecutionService } from './execution.service';

@Module({
  imports: [PrismaModule, QueueModule],
  controllers: [ExecutionController],
  providers: [ExecutionService],
  exports: [ExecutionService],
})
export class ExecutionModule {}
