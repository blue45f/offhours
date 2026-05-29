import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Prisma, Role } from '@prisma/client'
import type {
  ArrivalGuide,
  CreateHostProfileInput,
  HostEarnings,
  HostVenueArrival,
  UpdateHostProfileInput,
} from '@offhours/shared'

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

  async listVenueArrivalGuides(userId: string): Promise<HostVenueArrival[]> {
    const profile = await this.prisma.hostProfile.findUnique({ where: { userId } })
    if (!profile) return []
    const venues = await this.prisma.venue.findMany({
      where: { hostId: profile.id },
      select: {
        id: true,
        name: true,
        arrivalGuide: true,
        _count: { select: { spaces: true } },
      },
      orderBy: { createdAt: 'asc' },
    })
    return venues.map((v) => {
      const guide = (v.arrivalGuide as ArrivalGuide | null) ?? null
      const hasGuide =
        !!guide && Object.values(guide).some((x) => typeof x === 'string' && x.trim().length > 0)
      return {
        venueId: v.id,
        venueName: v.name,
        hasGuide,
        guide,
        spaceCount: v._count.spaces,
      }
    })
  }

  async upsertArrivalGuide(userId: string, venueId: string, guide: ArrivalGuide) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      include: { host: true },
    })
    if (!venue) throw new NotFoundException('Venue not found')
    if (venue.host.userId !== userId) throw new ForbiddenException()
    // 빈 문자열은 잘라내고 저장 — 모두 비면 null 로
    const cleaned: Record<string, string> = {}
    for (const [k, v] of Object.entries(guide)) {
      if (typeof v === 'string' && v.trim().length > 0) cleaned[k] = v.trim()
    }
    const next = Object.keys(cleaned).length > 0 ? (cleaned as Prisma.InputJsonValue) : null
    await this.prisma.venue.update({
      where: { id: venueId },
      data: { arrivalGuide: next ?? Prisma.JsonNull },
    })
    return { hasGuide: !!next }
  }

  async earnings(userId: string): Promise<HostEarnings> {
    const zeroed: HostEarnings = {
      totals: { thisMonthNetKRW: 0, pendingNetKRW: 0, allTimeNetKRW: 0, count: 0 },
      upcoming: [],
      byMonth: [],
    }

    const profile = await this.prisma.hostProfile.findUnique({ where: { userId } })
    if (!profile) return zeroed

    const payoutDays = profile.payoutCycle === 'D14' ? 14 : 7

    const reservations = await this.prisma.reservation.findMany({
      where: {
        space: { venue: { hostId: profile.id } },
        status: { in: ['PAID', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED'] },
      },
      select: {
        id: true,
        code: true,
        status: true,
        totalKRW: true,
        feeKRW: true,
        protectionFeeKRW: true,
        startAt: true,
        endAt: true,
        checkedOutAt: true,
        space: { select: { title: true } },
      },
      orderBy: { startAt: 'desc' },
      take: 200,
    })

    if (reservations.length === 0) return zeroed

    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Build 6-month buckets (current month - 5 .. current month)
    const monthBuckets = new Map<string, number>()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthBuckets.set(key, 0)
    }

    let allTimeNetKRW = 0
    let thisMonthNetKRW = 0
    let pendingNetKRW = 0
    let completedCount = 0

    const upcomingList: HostEarnings['upcoming'] = []

    for (const r of reservations) {
      // 보장료는 게스트 부담·보장 풀 적립이므로 호스트 순수입에서 제외
      const net = r.totalKRW - r.feeKRW - r.protectionFeeKRW
      const base = r.checkedOutAt ?? r.endAt
      const payoutAt = new Date(base.getTime() + payoutDays * 24 * 60 * 60 * 1000)

      if (r.status === 'COMPLETED') {
        allTimeNetKRW += net
        completedCount++
        if (r.startAt >= thisMonthStart) {
          thisMonthNetKRW += net
        }
        // byMonth — use startAt month for attribution
        const mo = `${r.startAt.getFullYear()}-${String(r.startAt.getMonth() + 1).padStart(2, '0')}`
        if (monthBuckets.has(mo)) {
          monthBuckets.set(mo, (monthBuckets.get(mo) ?? 0) + net)
        }
      } else {
        // PAID / CHECKED_IN / CHECKED_OUT — pending
        pendingNetKRW += net
      }

      // upcoming = payout is in the future OR status not yet COMPLETED
      if (payoutAt > now || r.status !== 'COMPLETED') {
        upcomingList.push({
          reservationId: r.id,
          code: r.code,
          spaceTitle: r.space.title,
          startAt: r.startAt.toISOString(),
          netKRW: net,
          payoutAt: payoutAt.toISOString(),
        })
      }
    }

    // Sort upcoming by payoutAt asc, take 8
    upcomingList.sort((a, b) => a.payoutAt.localeCompare(b.payoutAt))
    const upcoming = upcomingList.slice(0, 8)

    const byMonth = Array.from(monthBuckets.entries()).map(([month, netKRW]) => ({ month, netKRW }))

    return {
      totals: { thisMonthNetKRW, pendingNetKRW, allTimeNetKRW, count: completedCount },
      upcoming,
      byMonth,
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
