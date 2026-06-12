import { describe, expect, it, vi } from 'vitest'

import { UsersService } from './users.service'

function makeUsersService(user: any, withdrawn: any = {}) {
  const updated = {
    ...user,
    ...withdrawn,
  }
  const prisma: any = {
    user: {
      findUnique: vi.fn().mockResolvedValue(user),
      update: vi.fn().mockResolvedValue(updated),
    },
    refreshToken: {
      updateMany: vi.fn().mockResolvedValue({ count: 2 }),
    },
    $transaction: vi.fn((ops: Array<Promise<unknown>>) => Promise.all(ops)),
  }
  return { svc: new UsersService(prisma), prisma }
}

describe('UsersService.withdraw', () => {
  it('사용자 식별 정보를 익명화하고 활성 refresh 토큰을 모두 폐기한다', async () => {
    const user = {
      id: 'user_123',
      email: 'me@offhours.kr',
      passwordHash: 'hash',
      provider: 'password',
      googleSub: 'google-sub',
      name: '김오프',
      phone: '01012345678',
      avatarUrl: 'https://example.com/avatar.png',
      isVerified: true,
      marketingOptIn: true,
      withdrawnAt: null,
    }
    const { svc, prisma } = makeUsersService(user, { withdrawnAt: new Date() })

    await svc.withdraw(user.id)

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: expect.objectContaining({
        email: 'withdrawn-user_123@withdrawn.offhours.local',
        passwordHash: null,
        provider: 'withdrawn',
        googleSub: null,
        name: '탈퇴한 사용자',
        phone: null,
        avatarUrl: null,
        isVerified: false,
        marketingOptIn: false,
        withdrawnAt: expect.any(Date),
      }),
    })
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    })
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
  })
})
