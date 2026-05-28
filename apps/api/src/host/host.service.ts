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
