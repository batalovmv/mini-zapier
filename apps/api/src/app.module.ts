import { Module } from '@nestjs/common';

import { ConnectionModule } from './connection/connection.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConnectionModule],
})
export class AppModule {}
