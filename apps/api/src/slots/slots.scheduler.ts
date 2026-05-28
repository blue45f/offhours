import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { PrismaService } from '../prisma/prisma.service'
import { SlotsService } from './slots.service'

@Injectable()
export class SlotsScheduler {
  private readonly logger = new Logger(SlotsScheduler.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly slots: SlotsService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { timeZone: 'Asia/Seoul' })
  async regenerateAll() {
    const spaces = await this.prisma.space.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    })
    this.logger.log(`Regenerating slots for ${spaces.length} active spaces`)
    for (const s of spaces) {
      try {
        await this.slots.regenerate(s.id, 60)
      } catch (e) {
        this.logger.error(`Failed to regenerate ${s.id}: ${(e as Error).message}`)
      }
    }
  }
}
