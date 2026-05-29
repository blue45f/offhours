import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Role } from '@prisma/client'
import type { CreateHostProfileInput, UpdateHostProfileInput } from '@offhours/shared'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class HostService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertProfile(userId: string, input: CreateHostProfileInput) {
    const existing = await this.prisma.hostProfile.findUnique({ where: { userId } })
    const dupNumber = await this.prisma.hostProfile.findUnique({
      where: { businessNumber: input.businessNumber },
    })
    if (dupNumber && dupNumber.userId !== userId) {
      throw new ConflictException('이미 등록된 사업자등록번호에요')
    }

    if (existing) {
      return this.prisma.hostProfile.update({
        where: { userId },
        data: input,
      })
    }
    const created = await this.prisma.hostProfile.create({
      data: { ...input, userId },
    })
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: Role.HOST },
    })
    return created
  }

  async updateProfile(userId: string, input: UpdateHostProfileInput) {
    const existing = await this.prisma.hostProfile.findUnique({ where: { userId } })
    if (!existing) throw new NotFoundException('호스트 프로필이 없어요')
    return this.prisma.hostProfile.update({
      where: { userId },
      data: input,
    })
  }

  async getProfile(userId: string) {
    return this.prisma.hostProfile.findUnique({ where: { userId } })
  }

  /**
   * 호스트의 7×24 수요 히트맵 — 최근 60일 예약(PAID 이상)을 요일·시간 격자에 누적.
   * 각 셀의 점유율 = 해당 (요일,시간) 슬롯 중 예약된 비율.
   * 게스트 입장의 인기 시간대를 호스트가 한 번에 보고 가격·슬롯 조정 동기 형성.
   */
  async getDemandHeatmap(userId: string) {
    const profile = await this.prisma.hostProfile.findUnique({ where: { userId } })
    if (!profile)
      return { cells: Array.from({ length: 7 * 24 }, () => 0), topSlots: [], totalBookings: 0 }
    const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)

    const [reservations, slots] = await Promise.all([
      this.prisma.reservation.findMany({
        where: {
          space: { venue: { hostId: profile.id } },
          status: { in: ['PAID', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED'] },
          startAt: { gte: since },
        },
        select: { startAt: true },
      }),
      this.prisma.slot.findMany({
        where: {
          space: { venue: { hostId: profile.id } },
          startAt: { gte: since },
        },
        select: { startAt: true },
      }),
    ])

    const bookingCells = new Array(7 * 24).fill(0)
    const slotCells = new Array(7 * 24).fill(0)
    for (const r of reservations) {
      const wd = r.startAt.getDay()
      const h = r.startAt.getHours()
      bookingCells[wd * 24 + h]++
    }
    for (const s of slots) {
      const wd = s.startAt.getDay()
      const h = s.startAt.getHours()
      slotCells[wd * 24 + h]++
    }

    // 점유율 = booking / slot. 분모 0 이어도 booking 만 있으면 셀이 살아있도록 정규화.
    // 최종 값은 0~1: max(slot점유율, 셀 booking 비중) — 데모/콜드스타트 보정.
    const maxBookingInCell = Math.max(1, ...bookingCells)
    const cells = bookingCells.map((b, i) => {
      if (b === 0) return 0
      const occ = slotCells[i] > 0 ? Math.min(1, b / slotCells[i]) : 0
      const intensity = b / maxBookingInCell
      return Math.max(occ, intensity * 0.6)
    })

    // top 3 slots — 예약 ≥ 1건 인 셀, 강도 내림차순
    const topSlots = cells
      .map((occupancy, idx) => ({
        weekday: Math.floor(idx / 24),
        hour: idx % 24,
        occupancy,
        bookings: bookingCells[idx],
      }))
      .filter((c) => c.bookings >= 1)
      .sort((a, b) => b.occupancy - a.occupancy)
      .slice(0, 3)

    return {
      cells,
      topSlots,
      totalBookings: reservations.length,
    }
  }

  async getStats(userId: string) {
    const profile = await this.prisma.hostProfile.findUnique({ where: { userId } })
    if (!profile) return null
    const [venues, spaces, reservations, settlements, ratings] = await Promise.all([
      this.prisma.venue.count({ where: { hostId: profile.id } }),
      this.prisma.space.count({ where: { venue: { hostId: profile.id } } }),
      this.prisma.reservation.count({
        where: { space: { venue: { hostId: profile.id } } },
      }),
      this.prisma.settlement.aggregate({
        _sum: { amountKRW: true },
        where: { hostId: profile.id, status: 'PAID' },
      }),
      this.prisma.space.aggregate({
        _avg: { ratingAvg: true },
        _sum: { ratingCount: true },
        where: { venue: { hostId: profile.id } },
      }),
    ])
    return {
      venues,
      spaces,
      reservations,
      revenueKRW: settlements._sum.amountKRW ?? 0,
      ratingAvg: ratings._avg.ratingAvg ?? 0,
      reviewCount: ratings._sum.ratingCount ?? 0,
    }
  }
}
