import { Injectable, NotFoundException } from '@nestjs/common'
import { Logger } from '@nestjs/common'
import {
  addonAmount,
  lastMinuteDiscountRate,
  protectionCoverage,
  protectionFee,
  type AddonLine,
  type AddonSelection,
} from '@offhours/shared'

import { PrismaService } from '../prisma/prisma.service'
import { generateOffhoursPlans, pricePerHour } from './slots.engine'

@Injectable()
export class SlotsService {
  private readonly logger = new Logger(SlotsService.name)

  constructor(private readonly prisma: PrismaService) {}

  async regenerate(spaceId: string, days = 60) {
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        venue: { include: { businessHours: true, holidays: true } },
        pricingRules: true,
      },
    })
    if (!space) throw new NotFoundException('Space not found')

    const now = new Date()
    const plans = generateOffhoursPlans({
      fromDate: now,
      days,
      businessHours: space.venue.businessHours,
      holidays: space.venue.holidays,
      cleaningMinutes: space.cleaningMinutes,
      basePriceKRW: space.basePriceKRW,
      pricingRules: space.pricingRules,
    })

    const upper = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    await this.prisma.slot.deleteMany({
      where: {
        spaceId,
        startAt: { gte: now, lte: upper },
        reservation: null,
      },
    })

    await this.prisma.$transaction(
      plans.map((p) =>
        this.prisma.slot.upsert({
          where: {
            spaceId_startAt_endAt: { spaceId, startAt: p.startAt, endAt: p.endAt },
          },
          update: { priceKRW: p.pricePerHourKRW, isOpen: true },
          create: {
            spaceId,
            startAt: p.startAt,
            endAt: p.endAt,
            priceKRW: p.pricePerHourKRW,
            isOpen: true,
          },
        })
      )
    )
    this.logger.log(`Regenerated ${plans.length} slots for space ${spaceId}`)
    return { count: plans.length }
  }

  async list(spaceId: string, from: Date, to: Date) {
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      select: { venueId: true },
    })
    const [slots, blocks] = await Promise.all([
      this.prisma.slot.findMany({
        where: {
          spaceId,
          startAt: { gte: from, lte: to },
        },
        include: { reservation: { select: { id: true } } },
        orderBy: { startAt: 'asc' },
      }),
      space
        ? this.prisma.venueBlock.findMany({
            where: { venueId: space.venueId, endAt: { gt: from }, startAt: { lt: to } },
            select: { startAt: true, endAt: true },
          })
        : Promise.resolve([] as { startAt: Date; endAt: Date }[]),
    ])
    return slots.map((s) => {
      const blocked = blocks.some((b) => b.startAt < s.endAt && b.endAt > s.startAt)
      return {
        id: s.id,
        spaceId: s.spaceId,
        startAt: s.startAt.toISOString(),
        endAt: s.endAt.toISOString(),
        priceKRW: s.priceKRW,
        // 외부 차단된 시간대는 isOpen=false 로 노출해 UI 가 잡힌 상태로 표시
        isOpen: s.isOpen && !blocked,
        isReserved: !!s.reservation,
      }
    })
  }

  async availableHours(spaceId: string, startAt: Date, endAt: Date) {
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      select: { venueId: true },
    })
    const slot = await this.prisma.slot.findFirst({
      where: {
        spaceId,
        startAt: { lte: startAt },
        endAt: { gte: endAt },
        isOpen: true,
        reservation: null,
      },
    })
    if (!slot || !space) return slot
    // 외부 차단(VenueBlock) 과 겹치는 경우 사용 불가
    const conflict = await this.prisma.venueBlock.findFirst({
      where: { venueId: space.venueId, startAt: { lt: endAt }, endAt: { gt: startAt } },
      select: { id: true },
    })
    if (conflict) return null
    return slot
  }

  async calcAmount(
    spaceId: string,
    startAt: Date,
    endAt: Date,
    addonSelections: AddonSelection[] = []
  ) {
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      include: { pricingRules: true },
    })
    if (!space) throw new NotFoundException('Space not found')
    const hours = Math.max(1, Math.ceil((endAt.getTime() - startAt.getTime()) / (60 * 60 * 1000)))
    const hourlyRate = pricePerHour(space.basePriceKRW, space.pricingRules, startAt, endAt)
    const base = hourlyRate * hours
    // 라스트미닛 자동 할인 — 시작 6h 이내 슬롯은 5/10/15% 차감.
    const discountRate = lastMinuteDiscountRate(startAt)
    const discountKRW = Math.round(base * discountRate)
    const discountedBase = base - discountKRW

    // 유료 옵션(애드온) — 같은 영업 외 시간에 장비·케이터링·세팅까지 팔아 객단가를 올린다.
    // 할인은 공간 본가에만 적용하고 옵션·청소비에는 적용하지 않는다.
    const addons: AddonLine[] = []
    let addonsKRW = 0
    if (addonSelections.length > 0) {
      const records = await this.prisma.spaceAddon.findMany({
        where: { spaceId, isActive: true, id: { in: addonSelections.map((s) => s.addonId) } },
      })
      const byId = new Map(records.map((a) => [a.id, a]))
      for (const sel of addonSelections) {
        const a = byId.get(sel.addonId)
        if (!a) continue
        const amountKRW = addonAmount(a.unit, a.priceKRW, sel.qty, hours)
        addonsKRW += amountKRW
        addons.push({
          addonId: a.id,
          name: a.name,
          unit: a.unit,
          qty: sel.qty,
          unitPriceKRW: a.priceKRW,
          amountKRW,
        })
      }
    }

    // 호스트 매출 기준 소계 — 플랫폼 수수료(12%)는 이 소계에만 적용된다.
    const subtotalKRW = discountedBase + space.cleaningFeeKRW + addonsKRW
    // 안심 보장료 — 게스트가 별도로 부담하고 보장 풀을 적립(수수료 대상 아님).
    const protectionFeeKRW = protectionFee(space.protectionTier, discountedBase)
    const protectionCoverageKRW = protectionCoverage(space.protectionTier)

    return {
      hours,
      hourlyRate,
      baseAmountKRW: base,
      discountRate,
      discountKRW,
      discountedBaseAmountKRW: discountedBase,
      cleaningFeeKRW: space.cleaningFeeKRW,
      addonsKRW,
      addons,
      protectionTier: space.protectionTier,
      protectionFeeKRW,
      protectionCoverageKRW,
      subtotalKRW,
      totalKRW: subtotalKRW + protectionFeeKRW,
    }
  }
}
