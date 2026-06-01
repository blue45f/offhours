import { Injectable, NotFoundException } from '@nestjs/common'
import { type CreateRsvpInput, type EventSummary } from '@offhours/shared'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async getByCode(code: string, viewerToken?: string): Promise<EventSummary> {
    const r = await this.prisma.reservation.findUnique({
      where: { code },
      include: {
        space: {
          include: {
            photos: { take: 1, orderBy: { order: 'asc' } },
            venue: { include: { host: { include: { user: true } } } },
          },
        },
        rsvps: { orderBy: { createdAt: 'asc' } },
      },
    })
    if (!r) throw new NotFoundException('이벤트를 찾을 수 없어요')

    const counts = { going: 0, maybe: 0, no: 0 }
    for (const rsvp of r.rsvps) {
      if (rsvp.status === 'GOING') counts.going++
      else if (rsvp.status === 'MAYBE') counts.maybe++
      else if (rsvp.status === 'NO') counts.no++
    }

    return {
      code: r.code,
      spaceTitle: r.space.title,
      spaceThumbnailUrl: r.space.photos[0]?.url ?? null,
      region: r.space.venue.region,
      district: r.space.venue.district,
      hostName: r.space.venue.host.user.name,
      startAt: r.startAt.toISOString(),
      endAt: r.endAt.toISOString(),
      headcount: r.headcount,
      purpose: r.purpose,
      reservationStatus: r.status,
      rsvps: r.rsvps.map((rsvp) => ({
        id: rsvp.id,
        name: rsvp.name,
        status: rsvp.status,
        createdAt: rsvp.createdAt.toISOString(),
        // 이름이 아니라 clientToken 으로 본인 응답을 식별(동명이인 오인·중복 방지)
        mine: !!viewerToken && rsvp.clientToken === viewerToken,
      })),
      counts,
    }
  }

  async rsvp(code: string, dto: CreateRsvpInput): Promise<EventSummary> {
    const r = await this.prisma.reservation.findUnique({ where: { code } })
    if (!r) throw new NotFoundException('이벤트를 찾을 수 없어요')

    await this.prisma.eventRsvp.upsert({
      where: { reservationId_clientToken: { reservationId: r.id, clientToken: dto.clientToken } },
      update: { name: dto.name, status: dto.status },
      create: {
        reservationId: r.id,
        name: dto.name,
        status: dto.status,
        clientToken: dto.clientToken,
      },
    })

    return this.getByCode(code, dto.clientToken)
  }
}
