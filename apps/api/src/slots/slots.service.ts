import { Injectable, NotFoundException } from '@nestjs/common'
import { Logger } from '@nestjs/common'

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
    const slots = await this.prisma.slot.findMany({
      where: {
        spaceId,
        startAt: { gte: from, lte: to },
      },
      include: { reservation: { select: { id: true } } },
      orderBy: { startAt: 'asc' },
    })
    return slots.map((s) => ({
      id: s.id,
      spaceId: s.spaceId,
      startAt: s.startAt.toISOString(),
      endAt: s.endAt.toISOString(),
      priceKRW: s.priceKRW,
      isOpen: s.isOpen,
      isReserved: !!s.reservation,
    }))
  }

  async availableHours(spaceId: string, startAt: Date, endAt: Date) {
    const slot = await this.prisma.slot.findFirst({
      where: {
        spaceId,
        startAt: { lte: startAt },
        endAt: { gte: endAt },
        isOpen: true,
        reservation: null,
      },
    })
    return slot
  }

  async calcAmount(spaceId: string, startAt: Date, endAt: Date) {
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      include: { pricingRules: true },
    })
    if (!space) throw new NotFoundException('Space not found')
    const hours = Math.max(1, Math.ceil((endAt.getTime() - startAt.getTime()) / (60 * 60 * 1000)))
    const hourlyRate = pricePerHour(space.basePriceKRW, space.pricingRules, startAt, endAt)
    const base = hourlyRate * hours
    return {
      hours,
      hourlyRate,
      baseAmountKRW: base,
      cleaningFeeKRW: space.cleaningFeeKRW,
      totalKRW: base + space.cleaningFeeKRW,
    }
  }
}
