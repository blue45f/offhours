import { Injectable } from '@nestjs/common'
import { type NotificationType } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { NotificationChannels } from './channels.provider'

interface CreateNotificationInput {
  type: NotificationType
  title: string
  body: string
  data?: Record<string, unknown>
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly channels: NotificationChannels
  ) {}

  async create(userId: string, input: CreateNotificationInput) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data as object,
      },
    })
    // 인앱 외 채널(이메일·알림톡) 동시 발송 — 실패해도 인앱 알림은 유지(베스트 에포트)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true },
    })
    if (user) {
      void this.channels
        .dispatch({ email: user.email, phone: user.phone, title: input.title, body: input.body })
        .catch(() => null)
    }
    return notification
  }

  async list(userId: string, onlyUnread = false) {
    const where = onlyUnread ? { userId, readAt: null } : { userId }
    const items = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      data: (n.data as Record<string, unknown> | null) ?? null,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    }))
  }

  async unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, readAt: null } })
  }

  async markRead(userId: string, ids: string[]) {
    await this.prisma.notification.updateMany({
      where: { id: { in: ids }, userId },
      data: { readAt: new Date() },
    })
    return { ok: true }
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    })
    return { ok: true }
  }
}
