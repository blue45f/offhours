import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService
  ) {}

  async listMine(userId: string) {
    const memberships = await this.prisma.chatMembership.findMany({
      where: { userId },
      include: {
        chat: {
          include: {
            members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
            messages: { take: 1, orderBy: { createdAt: 'desc' } },
            reservation: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return memberships.map((m) => {
      const peer = m.chat.members.find((mm) => mm.userId !== userId)?.user
      const last = m.chat.messages[0]
      const unreadCount = m.lastReadAt
        ? 0
        : m.chat.messages.filter((msg) => msg.senderId !== userId).length
      return {
        id: m.chat.id,
        reservationId: m.chat.reservationId,
        peerName: peer?.name ?? '',
        peerAvatarUrl: peer?.avatarUrl ?? null,
        lastMessage: last?.body ?? null,
        lastMessageAt: last?.createdAt.toISOString() ?? null,
        unreadCount,
      }
    })
  }

  async messages(userId: string, chatId: string) {
    await this.ensureMember(userId, chatId)
    const items = await this.prisma.chatMessage.findMany({
      where: { chatId },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' },
      take: 200,
    })
    await this.prisma.chatMembership.updateMany({
      where: { chatId, userId },
      data: { lastReadAt: new Date() },
    })
    return items.map((m) => ({
      id: m.id,
      chatId: m.chatId,
      senderId: m.senderId,
      senderName: m.sender.name,
      senderAvatarUrl: m.sender.avatarUrl,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
    }))
  }

  async send(userId: string, chatId: string, body: string) {
    const membership = await this.ensureMember(userId, chatId)
    const msg = await this.prisma.chatMessage.create({
      data: { chatId, senderId: userId, body },
    })
    const others = await this.prisma.chatMembership.findMany({
      where: { chatId, userId: { not: userId } },
      select: { userId: true },
    })
    for (const o of others) {
      await this.notifications.create(o.userId, {
        type: 'CHAT_MESSAGE',
        title: '새 메시지',
        body: body.slice(0, 80),
        data: { chatId },
      })
    }
    return msg
  }

  async openForReservation(userId: string, reservationId: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { space: { include: { venue: { include: { host: true } } } } },
    })
    if (!reservation) throw new NotFoundException()
    const hostUserId = reservation.space.venue.host.userId
    if (![reservation.guestId, hostUserId].includes(userId)) throw new ForbiddenException()

    let chat = await this.prisma.chat.findUnique({ where: { reservationId } })
    if (!chat) {
      chat = await this.prisma.chat.create({
        data: {
          reservationId,
          members: {
            create: [{ userId: reservation.guestId }, { userId: hostUserId }],
          },
        },
      })
    }
    return chat
  }

  private async ensureMember(userId: string, chatId: string) {
    const m = await this.prisma.chatMembership.findUnique({
      where: { chatId_userId: { chatId, userId } },
    })
    if (!m) throw new ForbiddenException()
    return m
  }
}
