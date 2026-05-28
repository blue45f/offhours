import { Injectable, NotFoundException } from '@nestjs/common'
import type { UpdateProfileInput } from '@offhours/shared'

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
}
