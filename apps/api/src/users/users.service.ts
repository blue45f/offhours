import { Injectable, NotFoundException } from '@nestjs/common'
import type { UpdateProfileInput } from '@offhours/shared'
import type { User } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async update(userId: string, input: UpdateProfileInput) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name ?? undefined,
        phone: input.phone === '' ? null : (input.phone ?? undefined),
        avatarUrl: input.avatarUrl === '' ? null : (input.avatarUrl ?? undefined),
        marketingOptIn: input.marketingOptIn ?? undefined,
      },
    })
    return user
  }

  async withdraw(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundException('User not found')

    const withdrawnAt = user.withdrawnAt ?? new Date()
    const [withdrawn] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          email: this.withdrawnEmail(userId),
          passwordHash: null,
          provider: 'withdrawn',
          googleSub: null,
          name: '탈퇴한 사용자',
          phone: null,
          avatarUrl: null,
          isVerified: false,
          marketingOptIn: false,
          withdrawnAt,
        },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: withdrawnAt },
      }),
    ])
    return withdrawn
  }

  async getPublic(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        role: true,
        trustScore: true,
        hostedCount: true,
        guestedCount: true,
        createdAt: true,
      },
    })
    if (!user) throw new NotFoundException('User not found')
    return { ...user, createdAt: user.createdAt.toISOString() }
  }

  private withdrawnEmail(userId: User['id']) {
    return `withdrawn-${userId}@withdrawn.offhours.local`
  }
}
