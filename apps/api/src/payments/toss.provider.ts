import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

const TOSS_BASE = 'https://api.tosspayments.com/v1'

export interface TossConfirmResponse {
  paymentKey: string
  orderId: string
  status: string
  totalAmount: number
  method: string
  approvedAt?: string
  receipt?: { url: string }
}

@Injectable()
export class TossProvider {
  private readonly logger = new Logger(TossProvider.name)

  constructor(private readonly config: ConfigService) {}

  private get authHeader() {
    const secret = this.config.get<string>('TOSS_SECRET_KEY') ?? ''
    return 'Basic ' + Buffer.from(`${secret}:`).toString('base64')
  }

  async confirm(input: {
    paymentKey: string
    orderId: string
    amount: number
  }): Promise<TossConfirmResponse> {
    if (!this.config.get<string>('TOSS_SECRET_KEY')) {
      this.logger.warn('TOSS_SECRET_KEY not set — returning mock confirm response')
      return {
        paymentKey: input.paymentKey,
        orderId: input.orderId,
        status: 'DONE',
        totalAmount: input.amount,
        method: 'CARD',
        approvedAt: new Date().toISOString(),
        receipt: { url: '' },
      }
    }

    const res = await fetch(`${TOSS_BASE}/payments/confirm`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })
    if (!res.ok) {
      const detail = await res.text()
      throw new Error(`Toss confirm failed: ${res.status} ${detail}`)
    }
    return (await res.json()) as TossConfirmResponse
  }

  async refund(paymentKey: string, opts: { cancelReason: string; cancelAmount?: number }) {
    if (!this.config.get<string>('TOSS_SECRET_KEY')) {
      this.logger.warn('TOSS_SECRET_KEY not set — skipping real refund')
      return { ok: true, mock: true }
    }
    const res = await fetch(`${TOSS_BASE}/payments/${paymentKey}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(opts),
    })
    if (!res.ok) {
      const detail = await res.text()
      throw new Error(`Toss cancel failed: ${res.status} ${detail}`)
    }
    return await res.json()
  }
}
