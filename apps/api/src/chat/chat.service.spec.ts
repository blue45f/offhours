import { describe, expect, it, vi } from 'vitest'

import { ChatService } from './chat.service'

/**
 * 채팅 회귀 방지 — 예약 전 문의(쪽지) 가드와 읽음/숨김 정합성을 잠근다. 불변식:
 * ① 자기 공간에는 문의 불가, ② 같은 공간·같은 게스트 문의는 기존 스레드 재사용,
 * ③ unread 는 lastReadAt 이후 + 상대 발신 + 숨김 제외만 센다,
 * ④ 숨김 메시지는 본문·첨부가 마스킹된 채 자리만 남는다(스레드 흐름 보존).
 */
function makeChat(opts: { space?: any; existingChat?: any; membership?: any; messages?: any[] }) {
  const prisma: any = {
    space: { findUnique: vi.fn().mockResolvedValue(opts.space ?? null) },
    chat: {
      findFirst: vi.fn().mockResolvedValue(opts.existingChat ?? null),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: 'chat-new', spaceId: 'sp1' }),
    },
    chatMembership: {
      findUnique: vi.fn().mockResolvedValue(opts.membership ?? null),
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    chatMessage: {
      findMany: vi.fn().mockResolvedValue(opts.messages ?? []),
      findFirst: vi.fn().mockResolvedValue(null),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn().mockResolvedValue({ id: 'msg1' }),
    },
    reservation: { findUnique: vi.fn().mockResolvedValue(null) },
  }
  const notifications: any = { create: vi.fn().mockResolvedValue({}) }
  return { svc: new ChatService(prisma, notifications), prisma, notifications }
}

const activeSpace = {
  id: 'sp1',
  status: 'ACTIVE',
  venue: { host: { userId: 'h1' } },
}

describe('ChatService.openForSpace', () => {
  it('게스트가 문의 → 새 스레드 생성 (게스트+호스트 멤버)', async () => {
    const { svc, prisma } = makeChat({ space: activeSpace })
    await svc.openForSpace('g1', 'sp1')
    expect(prisma.chat.create).toHaveBeenCalledWith({
      data: {
        spaceId: 'sp1',
        members: { create: [{ userId: 'g1' }, { userId: 'h1' }] },
      },
    })
  })

  it('같은 공간·같은 게스트면 기존 스레드 재사용 (중복 생성 없음)', async () => {
    const existing = { id: 'chat-old', spaceId: 'sp1' }
    const { svc, prisma } = makeChat({ space: activeSpace, existingChat: existing })
    const chat = await svc.openForSpace('g1', 'sp1')
    expect(chat).toBe(existing)
    expect(prisma.chat.create).not.toHaveBeenCalled()
  })

  it('호스트 본인 공간에는 문의 불가', async () => {
    const { svc, prisma } = makeChat({ space: activeSpace })
    await expect(svc.openForSpace('h1', 'sp1')).rejects.toThrow()
    expect(prisma.chat.create).not.toHaveBeenCalled()
  })

  it('비활성 공간에는 문의 불가 (NotFound)', async () => {
    const { svc } = makeChat({ space: { ...activeSpace, status: 'SUSPENDED' } })
    await expect(svc.openForSpace('g1', 'sp1')).rejects.toThrow()
  })
})

describe('ChatService.messages — 숨김 마스킹 + 읽음 갱신', () => {
  const membership = { chatId: 'c1', userId: 'g1', lastReadAt: null }

  it('숨김 메시지는 본문·첨부가 비워진 채 isHidden 플래그만 남는다', async () => {
    const { svc } = makeChat({
      membership,
      messages: [
        {
          id: 'm1',
          chatId: 'c1',
          senderId: 'h1',
          body: '욕설 메시지',
          attachments: ['data:image/jpeg;base64,xxxx'],
          isHidden: true,
          createdAt: new Date('2026-06-01T00:00:00Z'),
          sender: { id: 'h1', name: '호스트', avatarUrl: null },
        },
      ],
    })
    const items = await svc.messages('g1', 'c1')
    expect(items[0].body).toBe('')
    expect(items[0].attachments).toEqual([])
    expect(items[0].isHidden).toBe(true)
  })

  it('조회 시 내 lastReadAt 이 갱신된다 (읽음 처리)', async () => {
    const { svc, prisma } = makeChat({ membership, messages: [] })
    await svc.messages('g1', 'c1')
    expect(prisma.chatMembership.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { chatId: 'c1', userId: 'g1' } })
    )
  })
})

describe('ChatService.send — 읽음·알림', () => {
  const membership = { chatId: 'c1', userId: 'g1', lastReadAt: null }

  it('첨부만 있는 메시지는 알림 본문이 "사진을 보냈어요"', async () => {
    const { svc, prisma, notifications } = makeChat({ membership })
    prisma.chatMembership.findMany.mockResolvedValue([{ userId: 'h1' }])
    await svc.send('g1', 'c1', { body: '', attachments: ['data:image/jpeg;base64,aaaa'] })
    expect(notifications.create).toHaveBeenCalledWith(
      'h1',
      expect.objectContaining({ body: '사진을 보냈어요', data: { chatId: 'c1' } })
    )
  })

  it('보낸 직후 내 lastReadAt 도 갱신된다 (내 unread 가 늘지 않게)', async () => {
    const { svc, prisma } = makeChat({ membership })
    await svc.send('g1', 'c1', { body: '안녕하세요', attachments: [] })
    expect(prisma.chatMembership.updateMany).toHaveBeenCalled()
  })
})
