import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { ChatSummary, SendMessageInput } from '@offhours/shared'

import { PrismaService } from '../prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'

/** 목록·단건 스레드가 같은 맥락(공간·예약·멤버)을 보도록 공유하는 include */
const chatInclude = {
  members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
  reservation: {
    include: {
      space: {
        select: {
          id: true,
          slug: true,
          title: true,
          photos: { take: 1, orderBy: { order: 'asc' as const }, select: { url: true } },
        },
      },
    },
  },
  space: {
    select: {
      id: true,
      slug: true,
      title: true,
      photos: { take: 1, orderBy: { order: 'asc' as const }, select: { url: true } },
    },
  },
} as const

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService
  ) {}

  async listMine(userId: string): Promise<ChatSummary[]> {
    const memberships = await this.prisma.chatMembership.findMany({
      where: { userId },
      include: { chat: { include: chatInclude } },
    })
    const summaries = await Promise.all(
      memberships.map((m) => this.toSummary(userId, m.chat, m.lastReadAt))
    )
    // 최근 대화가 위로 — 메시지가 없으면 스레드 생성 시각 기준
    return summaries
      .map((s, i) => ({ s, fallback: memberships[i].chat.createdAt.toISOString() }))
      .sort((a, b) =>
        (b.s.lastMessageAt ?? b.fallback).localeCompare(a.s.lastMessageAt ?? a.fallback)
      )
      .map((x) => x.s)
  }

  async thread(userId: string, chatId: string): Promise<ChatSummary> {
    const membership = await this.ensureMember(userId, chatId)
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: chatInclude,
    })
    if (!chat) throw new NotFoundException()
    return this.toSummary(userId, chat, membership.lastReadAt)
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
      // 숨김 메시지는 본문·첨부를 마스킹하고 자리만 남긴다 (스레드 흐름 보존)
      body: m.isHidden ? '' : m.body,
      attachments: m.isHidden ? [] : ((m.attachments as string[] | null) ?? []),
      isHidden: m.isHidden,
      createdAt: m.createdAt.toISOString(),
    }))
  }

  async send(userId: string, chatId: string, input: SendMessageInput) {
    await this.ensureMember(userId, chatId)
    const msg = await this.prisma.chatMessage.create({
      data: {
        chatId,
        senderId: userId,
        body: input.body,
        attachments:
          input.attachments && input.attachments.length > 0 ? input.attachments : undefined,
      },
    })
    // 내 메시지를 보낸 시점은 곧 스레드를 본 시점 — 내 unread 가 늘지 않게
    await this.prisma.chatMembership.updateMany({
      where: { chatId, userId },
      data: { lastReadAt: new Date() },
    })
    const others = await this.prisma.chatMembership.findMany({
      where: { chatId, userId: { not: userId } },
      select: { userId: true },
    })
    for (const o of others) {
      await this.notifications.create(o.userId, {
        type: 'CHAT_MESSAGE',
        title: '새 메시지',
        body: input.body ? input.body.slice(0, 80) : '사진을 보냈어요',
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

  /** 예약 전 문의 쪽지 — 공간 상세의 "문의하기". 같은 공간·같은 게스트면 기존 스레드 재사용 */
  async openForSpace(userId: string, spaceId: string) {
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      include: { venue: { include: { host: true } } },
    })
    if (!space || space.status !== 'ACTIVE') throw new NotFoundException()
    const hostUserId = space.venue.host.userId
    if (hostUserId === userId) {
      throw new BadRequestException('내 공간에는 문의를 보낼 수 없어요')
    }

    const existing = await this.prisma.chat.findFirst({
      where: { spaceId, members: { some: { userId } } },
    })
    if (existing) return existing
    return this.prisma.chat.create({
      data: {
        spaceId,
        members: { create: [{ userId }, { userId: hostUserId }] },
      },
    })
  }

  private async toSummary(
    userId: string,
    chat: {
      id: string
      reservationId: string | null
      members: Array<{
        userId: string
        lastReadAt: Date | null
        user: { id: string; name: string; avatarUrl: string | null }
      }>
      reservation: {
        code: string
        status: string
        startAt: Date
        space: { id: string; slug: string; title: string; photos: { url: string }[] }
      } | null
      space: { id: string; slug: string; title: string; photos: { url: string }[] } | null
    },
    lastReadAt: Date | null
  ): Promise<ChatSummary> {
    const peer = chat.members.find((mm) => mm.userId !== userId)
    const [last, unreadCount] = await Promise.all([
      this.prisma.chatMessage.findFirst({
        where: { chatId: chat.id, isHidden: false },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.chatMessage.count({
        where: {
          chatId: chat.id,
          senderId: { not: userId },
          isHidden: false,
          ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
        },
      }),
    ])
    const space = chat.reservation?.space ?? chat.space
    return {
      id: chat.id,
      reservationId: chat.reservationId,
      peerId: peer?.userId ?? '',
      peerName: peer?.user.name ?? '',
      peerAvatarUrl: peer?.user.avatarUrl ?? null,
      peerLastReadAt: peer?.lastReadAt?.toISOString() ?? null,
      spaceId: space?.id ?? null,
      spaceSlug: space?.slug ?? null,
      spaceTitle: space?.title ?? null,
      spaceThumbnailUrl: space?.photos[0]?.url ?? null,
      reservationCode: chat.reservation?.code ?? null,
      reservationStatus: (chat.reservation?.status as ChatSummary['reservationStatus']) ?? null,
      reservationStartAt: chat.reservation?.startAt.toISOString() ?? null,
      lastMessage: last ? last.body || (last.attachments ? '사진' : '') : null,
      lastMessageAt: last?.createdAt.toISOString() ?? null,
      unreadCount,
    }
  }

  private async ensureMember(userId: string, chatId: string) {
    const m = await this.prisma.chatMembership.findUnique({
      where: { chatId_userId: { chatId, userId } },
    })
    if (!m) throw new ForbiddenException()
    return m
  }
}
