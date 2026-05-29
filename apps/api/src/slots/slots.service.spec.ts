import { describe, expect, it, vi } from 'vitest'
import type { PricingRule } from '@prisma/client'

import { SlotsService } from './slots.service'

/**
 * 연장 추가 요금 회귀 방지 — calcExtension = 동적 시간당가 × 시간 × 용도 배수.
 * 예약 서비스의 extend 테스트는 이 메서드를 모킹하므로, 실제 가격 산식은 여기서 직접 검증한다.
 * fromAt/toAt 픽스처는 엔진 spec(pricePerHour)과 동일해 심야 룰 매칭이 TZ와 무관하게 일관된다.
 */
function makeSlots(basePriceKRW: number, pricingRules: PricingRule[] = []) {
  const prisma: any = {
    space: { findUnique: vi.fn().mockResolvedValue({ id: 's1', basePriceKRW, pricingRules }) },
  }
  return new SlotsService(prisma)
}

const nightRule: PricingRule = {
  id: 'night',
  spaceId: 's1',
  label: '심야 +50%',
  multiplier: 1.5,
  weekdayMask: 0b1111111,
  startMinute: 18 * 60,
  endMinute: 24 * 60,
  priority: 10,
}

describe('SlotsService.calcExtension', () => {
  const from = new Date('2026-06-01T20:00:00Z')
  const to = new Date('2026-06-01T22:00:00Z') // 2시간

  it('동적 룰 없으면 베이스가 × 시간 × 용도 배수 — PARTY(1.15)', async () => {
    const svc = makeSlots(50000)
    const r = await svc.calcExtension('s1', from, to, 'PARTY')
    expect(r.hours).toBe(2)
    expect(r.additionalKRW).toBe(115000) // round(50000 * 2 * 1.15)
  })

  it('심야 동적 룰(+50%)이 연장 구간에 적용되고 용도 배수와 곱해진다', async () => {
    const svc = makeSlots(50000, [nightRule])
    const r = await svc.calcExtension('s1', from, to, 'PARTY')
    expect(r.additionalKRW).toBe(172500) // round(75000 * 2 * 1.15)
  })

  it('MEETING(배수 1.0)은 용도 가산 없이 동적가만', async () => {
    const svc = makeSlots(50000)
    const r = await svc.calcExtension('s1', from, to, 'MEETING')
    expect(r.additionalKRW).toBe(100000) // round(50000 * 2 * 1.0)
  })

  it('1시간 미만 연장도 최소 1시간으로 올림', async () => {
    const svc = makeSlots(50000)
    const short = new Date('2026-06-01T20:30:00Z') // 30분
    const r = await svc.calcExtension('s1', from, short, 'OTHER')
    expect(r.hours).toBe(1)
    expect(r.additionalKRW).toBe(50000)
  })

  it('없는 공간이면 NotFound', async () => {
    const prisma: any = { space: { findUnique: vi.fn().mockResolvedValue(null) } }
    const svc = new SlotsService(prisma)
    await expect(svc.calcExtension('missing', from, to, 'OTHER')).rejects.toThrow()
  })
})
