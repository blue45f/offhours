import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import type {
  ConnectExternalCalendarInput,
  CreateManualBlockInput,
  ExternalCalendar,
  HostCalendarOverview,
  VenueBlock as SharedVenueBlock,
} from '@offhours/shared'

import { PrismaService } from '../prisma/prisma.service'
import { parseIcs } from './ics-parser'
import { assertSafeIcsUrl, fetchIcsSafely } from './ics-url'

@Injectable()
export class CalendarsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(userId: string): Promise<HostCalendarOverview> {
    const venues = await this.prisma.venue.findMany({
      where: { host: { userId } },
      select: { id: true, name: true },
    })
    const venueIds = venues.map((v) => v.id)
    if (venueIds.length === 0) return { blocks: [], calendars: [] }
    const nameMap = new Map(venues.map((v) => [v.id, v.name]))

    const blocks = await this.prisma.venueBlock.findMany({
      where: { venueId: { in: venueIds }, endAt: { gte: new Date() } },
      include: { externalCalendar: { select: { label: true } } },
      orderBy: { startAt: 'asc' },
    })
    const calendars = await this.prisma.externalCalendar.findMany({
      where: { venueId: { in: venueIds } },
      include: { _count: { select: { blocks: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return {
      blocks: blocks.map((b) => this.toBlock(b, nameMap.get(b.venueId) ?? '')),
      calendars: calendars.map((c) => this.toCalendar(c, nameMap.get(c.venueId) ?? '')),
    }
  }

  async createManualBlock(
    userId: string,
    input: CreateManualBlockInput
  ): Promise<SharedVenueBlock> {
    await this.ensureOwner(userId, input.venueId)
    const venue = await this.prisma.venue.findUnique({
      where: { id: input.venueId },
      select: { name: true },
    })
    const block = await this.prisma.venueBlock.create({
      data: {
        venueId: input.venueId,
        label: input.label,
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
        color: input.color,
        source: 'MANUAL',
      },
      include: { externalCalendar: { select: { label: true } } },
    })
    return this.toBlock(block, venue?.name ?? '')
  }

  async deleteBlock(userId: string, blockId: string) {
    const block = await this.prisma.venueBlock.findUnique({
      where: { id: blockId },
      include: { venue: { include: { host: true } } },
    })
    if (!block) throw new NotFoundException()
    if (block.venue.host.userId !== userId) throw new ForbiddenException()
    await this.prisma.venueBlock.delete({ where: { id: blockId } })
    return { deleted: true }
  }

  async connectExternal(
    userId: string,
    input: ConnectExternalCalendarInput
  ): Promise<ExternalCalendar> {
    await this.ensureOwner(userId, input.venueId)
    assertSafeIcsUrl(input.icsUrl) // SSRF 방어 — 내부 주소 ICS URL 거부
    const venue = await this.prisma.venue.findUnique({
      where: { id: input.venueId },
      select: { name: true },
    })
    const cal = await this.prisma.externalCalendar.create({
      data: {
        venueId: input.venueId,
        label: input.label,
        icsUrl: input.icsUrl,
        color: input.color,
      },
    })
    await this.syncCalendar(cal.id)
    const fresh = await this.prisma.externalCalendar.findUnique({
      where: { id: cal.id },
      include: { _count: { select: { blocks: true } } },
    })
    return this.toCalendar(fresh!, venue?.name ?? '')
  }

  async deleteCalendar(userId: string, calendarId: string) {
    const cal = await this.prisma.externalCalendar.findUnique({
      where: { id: calendarId },
      include: { venue: { include: { host: true } } },
    })
    if (!cal) throw new NotFoundException()
    if (cal.venue.host.userId !== userId) throw new ForbiddenException()
    await this.prisma.externalCalendar.delete({ where: { id: calendarId } })
    return { deleted: true }
  }

  async resync(userId: string, calendarId: string) {
    const cal = await this.prisma.externalCalendar.findUnique({
      where: { id: calendarId },
      include: { venue: { include: { host: true } } },
    })
    if (!cal) throw new NotFoundException()
    if (cal.venue.host.userId !== userId) throw new ForbiddenException()
    return this.syncCalendar(calendarId)
  }

  /**
   * 외부 캘린더 fetch + 파싱 + 차이만큼만 차단 이벤트 upsert.
   * 실패는 lastError 에 기록하고 sync 자체는 성공 처리(다음 트리거에서 재시도).
   */
  private async syncCalendar(calendarId: string) {
    const cal = await this.prisma.externalCalendar.findUnique({ where: { id: calendarId } })
    if (!cal) return { ok: false, error: 'Calendar gone' }
    try {
      // 저장된 URL도 매 fetch 전 재검증 + DNS 해석 IP·리다이렉트 매 홉 재검증(SSRF/DNS rebinding 방어)
      const res = await fetchIcsSafely(cal.icsUrl, {
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      const events = parseIcs(text)
      let upserts = 0
      for (const ev of events) {
        if (!ev.uid || !ev.startAt || !ev.endAt) continue
        await this.prisma.venueBlock.upsert({
          where: {
            externalCalendarId_externalUid: {
              externalCalendarId: cal.id,
              externalUid: ev.uid,
            },
          },
          create: {
            venueId: cal.venueId,
            label: ev.summary ?? cal.label,
            startAt: ev.startAt,
            endAt: ev.endAt,
            source: 'EXTERNAL',
            externalCalendarId: cal.id,
            externalUid: ev.uid,
            color: cal.color,
          },
          update: {
            label: ev.summary ?? cal.label,
            startAt: ev.startAt,
            endAt: ev.endAt,
            color: cal.color,
          },
        })
        upserts++
      }
      await this.prisma.externalCalendar.update({
        where: { id: calendarId },
        data: { lastSyncedAt: new Date(), lastError: null },
      })
      return { ok: true, upserts }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      await this.prisma.externalCalendar.update({
        where: { id: calendarId },
        data: { lastSyncedAt: new Date(), lastError: msg },
      })
      return { ok: false, error: msg }
    }
  }

  private async ensureOwner(userId: string, venueId: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      include: { host: true },
    })
    if (!venue) throw new NotFoundException('Venue not found')
    if (venue.host.userId !== userId) throw new ForbiddenException()
    return venue
  }

  private toBlock(
    b: {
      id: string
      venueId: string
      label: string
      startAt: Date
      endAt: Date
      source: 'MANUAL' | 'EXTERNAL'
      externalCalendarId: string | null
      externalCalendar: { label: string } | null
      color: string | null
    },
    venueName: string
  ): SharedVenueBlock {
    return {
      id: b.id,
      venueId: b.venueId,
      venueName,
      label: b.label,
      startAt: b.startAt.toISOString(),
      endAt: b.endAt.toISOString(),
      source: b.source,
      externalCalendarId: b.externalCalendarId,
      externalCalendarLabel: b.externalCalendar?.label ?? null,
      color: b.color,
    }
  }

  private toCalendar(
    c: {
      id: string
      venueId: string
      label: string
      icsUrl: string
      color: string | null
      lastSyncedAt: Date | null
      lastError: string | null
      _count: { blocks: number }
    },
    venueName: string
  ): ExternalCalendar {
    return {
      id: c.id,
      venueId: c.venueId,
      venueName,
      label: c.label,
      icsUrl: c.icsUrl,
      color: c.color,
      lastSyncedAt: c.lastSyncedAt?.toISOString() ?? null,
      lastError: c.lastError,
      blockCount: c._count.blocks,
    }
  }
}
