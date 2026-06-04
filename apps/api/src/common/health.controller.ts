import { Controller, Get, HttpStatus, Res } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import type { Response } from 'express'

import { PrismaService } from '../prisma/prisma.service'

/**
 * Health probes for hosted deploys (Cloud Run / Railway / Docker).
 *
 * - `GET /health` and `GET /health/live` are cheap liveness checks that never
 *   touch the DB, so they stay green while the process is up even if the
 *   database blips.
 * - `GET /health/ready` pings the database and returns HTTP 503 when it is
 *   unreachable, so the platform can hold traffic until the API can serve.
 *
 * `@SkipThrottle()` keeps frequent platform probes from consuming the global
 * rate-limit budget (ThrottlerGuard, 120 req/min).
 */
@SkipThrottle()
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: '서버 상태 확인 (liveness, DB 미접근)' })
  check() {
    return {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      env: process.env.NODE_ENV ?? 'development',
    }
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness 별칭 (DB 미접근)' })
  live() {
    return this.check()
  }

  @Get('ready')
  @ApiOperation({ summary: '준비성 체크 (DB ping, 미접속 시 503)' })
  async ready(@Res({ passthrough: true }) res: Response) {
    let database: boolean
    try {
      await this.prisma.$queryRaw`SELECT 1`
      database = true
    } catch {
      database = false
    }

    res.status(database ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
    return {
      status: database ? ('ok' as const) : ('down' as const),
      timestamp: new Date().toISOString(),
      checks: { database },
    }
  }
}
