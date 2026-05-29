import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { ReservationsService } from './reservations.service'

@Injectable()
export class ReservationsScheduler {
  private readonly logger = new Logger(ReservationsScheduler.name)

  constructor(private readonly reservations: ReservationsService) {}

  // 미응답 예약 요청 자동 만료 — 매시간 점검(이용 시작 경과 또는 48h 무응답)
  @Cron(CronExpression.EVERY_HOUR, { timeZone: 'Asia/Seoul' })
  async expireStale() {
    const { expired } = await this.reservations.expireStale()
    if (expired > 0) this.logger.log(`Auto-expired ${expired} stale reservation requests`)
  }
}
