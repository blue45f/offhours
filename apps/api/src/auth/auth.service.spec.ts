import { describe, expect, it, vi } from 'vitest'

import { AuthService } from './auth.service'

/**
 * Refresh 토큰 회전·재사용 탐지 회귀 방지 (보안). 불변식:
 * ① 정상 refresh → 기존 토큰 폐기 후 같은 family 로 새 토큰 발급(rotation),
 * ② 이미 폐기된 토큰 재사용 → 탈취 정황으로 같은 family 전체 폐기 + 거부(reuse detection),
 * ③ 만료/미존재 토큰 거부.
 */
function makeAuth(record: any) {
  const prisma: any = {
    refreshToken: {
      findUnique: vi.fn().mockResolvedValue(record),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 3 }),
      create: vi.fn().mockResolvedValue({}),
    },
  }
  const jwt: any = { signAsync: vi.fn().mockResolvedValue('access.jwt.token') }
  const config: any = { get: vi.fn().mockReturnValue('15m') }
  return { svc: new AuthService(prisma, jwt, config), prisma }
}

const user = {
  id: 'u1',
  email: 'a@offhours.kr',
  name: '게스트',
  phone: null,
  avatarUrl: null,
  role: 'USER',
  isVerified: false,
  isSuspended: false,
  withdrawnAt: null,
  marketingOptIn: false,
  referralCode: 'REF123',
  pointsKRW: 0,
  trustScore: 50,
  createdAt: new Date('2026-01-01T00:00:00Z'),
}

const validRecord = {
  id: 'rt1',
  userId: 'u1',
  family: 'famA',
  revokedAt: null,
  expiresAt: new Date('2099-01-01T00:00:00Z'),
  user,
}

describe('AuthService.refresh', () => {
  it('정상 refresh → 기존 토큰 폐기 + 같은 family 로 새 토큰 발급(rotation)', async () => {
    const { svc, prisma } = makeAuth(validRecord)
    const res: any = await svc.refresh('raw-refresh-token')
    expect(res.accessToken).toBe('access.jwt.token')
    expect(res.refreshToken).toBeTruthy()
    // 기존 토큰 1건만 폐기 (재사용 아님 → family 일괄 폐기 호출 안 함)
    expect(prisma.refreshToken.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'rt1' }, data: { revokedAt: expect.any(Date) } })
    )
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled()
    // 새 토큰은 같은 family 유지
    expect(prisma.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ family: 'famA' }) })
    )
  })

  it('이미 폐기된 토큰 재사용 → 같은 family 전체 폐기 + 거부 (reuse detection)', async () => {
    const { svc, prisma } = makeAuth({
      ...validRecord,
      revokedAt: new Date('2026-05-01T00:00:00Z'),
    })
    await expect(svc.refresh('stolen-token')).rejects.toThrow()
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { family: 'famA', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    })
    // 재사용은 회전하지 않는다 (새 토큰 발급 없음)
    expect(prisma.refreshToken.create).not.toHaveBeenCalled()
  })

  it('만료된 토큰 → 거부, family 폐기 없음', async () => {
    const { svc, prisma } = makeAuth({
      ...validRecord,
      expiresAt: new Date('2020-01-01T00:00:00Z'),
    })
    await expect(svc.refresh('expired-token')).rejects.toThrow()
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled()
    expect(prisma.refreshToken.create).not.toHaveBeenCalled()
  })

  it('탈퇴한 계정 refresh → 사용자 활성 토큰 전체 폐기 + 거부', async () => {
    const { svc, prisma } = makeAuth({
      ...validRecord,
      user: { ...user, withdrawnAt: new Date('2026-06-01T00:00:00Z') },
    })
    await expect(svc.refresh('withdrawn-token')).rejects.toThrow('탈퇴한 계정이에요.')
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    })
    expect(prisma.refreshToken.create).not.toHaveBeenCalled()
  })

  it('존재하지 않는 토큰 → 거부', async () => {
    const { svc, prisma } = makeAuth(null)
    await expect(svc.refresh('unknown')).rejects.toThrow()
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled()
  })
})
