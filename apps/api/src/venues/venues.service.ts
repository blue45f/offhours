import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import type { CreateVenueInput, UpdateVenueInput } from '@offhours/shared'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class VenuesService {
  constructor(private readonly prisma: PrismaService) {}

  async createForHost(userId: string, input: CreateVenueInput) {
    const host = await this.prisma.hostProfile.findUnique({ where: { userId } })
    if (!host) throw new ForbiddenException('호스트 프로필을 먼저 등록해주세요')

    return this.prisma.venue.create({
      data: {
        hostId: host.id,
        name: input.name,
        category: input.category,
        addressJibun: input.addressJibun,
        addressRoad: input.addressRoad,
        addressDetail: input.addressDetail ?? null,
        lat: input.lat,
        lng: input.lng,
        region: input.region,
        district: input.district,
        description: input.description,
        businessHours: { create: input.businessHours },
        holidays: {
          create: input.holidays.map((h) => ({
            date: new Date(h.date),
            repeat: h.repeat,
            reason: h.reason ?? null,
          })),
        },
        status: 'PENDING_REVIEW',
      },
      include: { businessHours: true, holidays: true },
    })
  }

  async update(userId: string, venueId: string, input: UpdateVenueInput) {
    const venue = await this.ensureOwner(userId, venueId)
    const data: Prisma.VenueUpdateInput = {
      name: input.name ?? undefined,
      category: input.category ?? undefined,
      addressJibun: input.addressJibun ?? undefined,
      addressRoad: input.addressRoad ?? undefined,
      addressDetail: input.addressDetail ?? undefined,
      lat: input.lat ?? undefined,
      lng: input.lng ?? undefined,
      region: input.region ?? undefined,
      district: input.district ?? undefined,
      description: input.description ?? undefined,
    }
    if (input.businessHours) {
      await this.prisma.businessHour.deleteMany({ where: { venueId: venue.id } })
      data.businessHours = { create: input.businessHours }
    }
    if (input.holidays) {
      await this.prisma.holiday.deleteMany({ where: { venueId: venue.id } })
      data.holidays = {
        create: input.holidays.map((h) => ({
          date: new Date(h.date),
          repeat: h.repeat,
          reason: h.reason ?? null,
        })),
      }
    }
    return this.prisma.venue.update({
      where: { id: venueId },
      data,
      include: { businessHours: true, holidays: true },
    })
  }

  async listMine(userId: string) {
    const host = await this.prisma.hostProfile.findUnique({ where: { userId } })
    if (!host) return []
    return this.prisma.venue.findMany({
      where: { hostId: host.id },
      include: { businessHours: true, holidays: true, spaces: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getOne(userId: string, venueId: string) {
    return this.ensureOwner(userId, venueId)
  }

  private async ensureOwner(userId: string, venueId: string) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      include: { businessHours: true, holidays: true, host: true, spaces: true },
    })
    if (!venue) throw new NotFoundException('Venue not found')
    if (venue.host.userId !== userId) throw new ForbiddenException()
    return venue
  }
}
