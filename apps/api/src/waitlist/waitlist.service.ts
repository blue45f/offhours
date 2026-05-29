import { Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class WaitlistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService
  ) {}

  async status(spaceId: string, userId?: string) {
    const [count, mine] = await Promise.all([
      this.prisma.spaceWaitlist.count({ where: { spaceId } }),
      userId
        ? this.prisma.spaceWaitlist.findUnique({
            where: { spaceId_userId: { spaceId, userId } },
          })
        : Promise.resolve(null),
    ])
    return { count, joined: !!mine }
  }

  async join(spaceId: string, userId: string, desiredDate?: string) {
    const space = await this.prisma.space.findUnique({ where: { id: spaceId } })
    if (!space) throw new NotFoundException('Space not found')
    await this.prisma.spaceWaitlist.upsert({
      where: { spaceId_userId: { spaceId, userId } },
      create: {
        spaceId,
        userId,
        desiredDate: desiredDate ? new Date(desiredDate) : null,
      },
      update: { desiredDate: desiredDate ? new Date(desiredDate) : null, notifiedAt: null },
    })
    return this.status(spaceId, userId)
  }

  async leave(spaceId: string, userId: string) {
    await this.prisma.spaceWaitlist.deleteMany({ where: { spaceId, userId } })
    return this.status(spaceId, userId)
  }

  /**
   * 슬롯이 빌 때(취소·환불) 대기자에게 알림. 한 번 알린 사람은 notifiedAt 으로 중복 방지.
   * 예약 취소 플로우에서 호출.
   */
  async notifyOnSlotFreed(spaceId: string) {
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      select: { title: true, slug: true },
    })
    if (!space) return { notified: 0 }
    const waiters = await this.prisma.spaceWaitlist.findMany({
      where: { spaceId, notifiedAt: null },
      select: { id: true, userId: true },
    })
    for (const w of waiters) {
      await this.notifications.create(w.userId, {
        type: 'SYSTEM',
        title: '기다리던 공간에 빈자리가 났어요',
        body: `${space.title} — 지금 바로 예약할 수 있어요`,
        data: { spaceSlug: space.slug },
      })
    }
    if (waiters.length > 0) {
      await this.prisma.spaceWaitlist.updateMany({
        where: { id: { in: waiters.map((w) => w.id) } },
        data: { notifiedAt: new Date() },
      })
    }
    return { notified: waiters.length }
  }
}
