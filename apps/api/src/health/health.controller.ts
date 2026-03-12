import Redis from 'ioredis';

import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../auth/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

declare const process: {
  env: Record<string, string | undefined>;
};

interface AppResponse {
  status(code: number): AppResponse;
  json(body: unknown): void;
}

@ApiTags('Health')
@Controller('api')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Liveness check — process is alive' })
  check() {
    return { status: 'ok' };
  }

  @Public()
  @Get('readiness')
  @ApiOperation({ summary: 'Readiness check — DB and Redis are reachable' })
  async readiness(
    @Res({ passthrough: false }) res: AppResponse,
  ): Promise<void> {
    const checks: Record<string, 'ok' | string> = {
      postgres: 'ok',
      redis: 'ok',
    };
    let allOk = true;

    // Check PostgreSQL via Prisma
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
    } catch (err: unknown) {
      allOk = false;
      checks.postgres =
        err instanceof Error ? err.message : 'connection failed';
    }

    // Check Redis via one-shot ioredis client (same lib as BullMQ)
    try {
      const redisHost = process.env.REDIS_HOST ?? 'localhost';
      const redisPort = this.parseRedisPort(process.env.REDIS_PORT);
      const client = new Redis({
        host: redisHost,
        port: redisPort,
        connectTimeout: 3000,
        maxRetriesPerRequest: 0,
        lazyConnect: true,
      });
      await client.connect();
      await client.ping();
      client.disconnect();
    } catch (err: unknown) {
      allOk = false;
      checks.redis =
        err instanceof Error ? err.message : 'connection failed';
    }

    const status = allOk ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    res.status(status).json({ status: allOk ? 'ready' : 'not_ready', checks });
  }

  private parseRedisPort(value: string | undefined): number {
    if (value === undefined) {
      return 6380;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : 6380;
  }
}
