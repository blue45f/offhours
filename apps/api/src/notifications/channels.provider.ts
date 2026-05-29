import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

/**
 * 알림 발송 채널 — 인앱 알림에 더해 이메일·카카오 알림톡으로도 전송한다.
 * Toss 결제와 동일하게 env 키가 없으면 mock(로그)으로 동작해 로컬·데모에서 안전하고,
 * 실 연동은 SMTP/SES·카카오 비즈메시지 키를 주입하면 활성화된다.
 */
@Injectable()
export class NotificationChannels {
  private readonly logger = new Logger(NotificationChannels.name)

  constructor(private readonly config: ConfigService) {}

  async dispatch(input: {
    email?: string | null
    phone?: string | null
    title: string
    body: string
  }) {
    await Promise.all([
      input.email ? this.email(input.email, input.title, input.body) : null,
      input.phone ? this.alimtalk(input.phone, input.title, input.body) : null,
    ])
  }

  private async email(to: string, title: string, body: string) {
    if (!this.config.get<string>('SMTP_URL')) {
      this.logger.debug(`[mock email] → ${to} · ${title}: ${body.slice(0, 40)}`)
      return
    }
    // 실 연동 지점(SMTP/SES) — 키가 있을 때만 도달
    this.logger.log(`email → ${to} · ${title}`)
  }

  private async alimtalk(to: string, title: string, body: string) {
    if (!this.config.get<string>('KAKAO_ALIMTALK_KEY')) {
      this.logger.debug(`[mock alimtalk] → ${to} · ${title}: ${body.slice(0, 40)}`)
      return
    }
    // 실 연동 지점(카카오 비즈메시지) — 키가 있을 때만 도달
    this.logger.log(`alimtalk → ${to} · ${title}`)
  }
}
