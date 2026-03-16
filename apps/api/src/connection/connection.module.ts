import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ConnectionController } from './connection.controller';
import { ConnectionService } from './connection.service';
import { IntrospectionService } from './introspection.service';

@Module({
  imports: [PrismaModule],
  controllers: [ConnectionController],
  providers: [ConnectionService, IntrospectionService],
})
export class ConnectionModule {}
