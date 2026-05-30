import { describe, expect, it, vi } from 'vitest'
import { TRUST_SCORE, clampTrust } from '@offhours/shared'

import { ReviewsService } from './reviews.service'

/**
 * 후기 회귀 방지 — 양방향(게스트↔호스트) 더블블라인드 공개와 공간 평점 집계를 잠근다.
 * 평점은 isHot·우수 호스트 뱃지와 검색 랭킹의 입력이라 정합성이 중요하다. 불변식:
 * ① 양측이 모두 작성해야 공개(publish) + 공간 평점 재집계, ② 한쪽만이면 비공개·집계 없음,
 * ③ 평점별 trustScore 양방향 갱신(5→+3 … 1→−5, 0~100 클램프), ④ 완료·중복·당사자 가드.
 */
const completed = {
  id: 'res1',
  status: 'COMPLETED',
  guestId: 'g1',
  spaceId: 'sp1',
  space: { venue: { host: { userId: 'h1' } } },
}

function makeReviews(opts: {
  reservation?: any
  existing?: any
  counterpart?: any
  agg?: any
  user?: any
}) {
  const prisma: any = {
    reservation: { findUnique: vi.fn().mockResolvedValue(opts.reservation ?? null) },
    review: {
      findUnique: vi.fn().mockResolvedValue(opts.existing ?? null),
      create: vi.fn().mockResolvedValue({ id: 'rv1' }),
      findFirst: vi.fn().mockResolvedValue(opts.counterpart ?? null),
      updateMany: vi.fn().mockResolvedValue({ count: 2 }),
      aggregate: vi.fn().mockResolvedValue(opts.agg ?? { _avg: { rating: 4.5 }, _count: 2 }),
    },
    space: { update: vi.fn().mockResolvedValue({}) },
    user: {
      findUnique: vi.fn().mockResolvedValue(opts.user ?? { trustScore: 50 }),
      update: vi.fn().mockResolvedValue({}),
    },
  }
  return { svc: new ReviewsService(prisma), prisma }
}

const input = { reservationId: 'res1', rating: 5, comment: '정말 깨끗하고 좋았어요 추천합니다' }

describe('ReviewsService.create', () => {
  it('양측 모두 작성(counterpart 존재) → 공개 + 공간 평점 재집계 + trust 가산', async () => {
    const { svc, prisma } = makeReviews({ reservation: completed, counterpart: { id: 'rvH' } })
    await svc.create('g1', input)

    // 더블블라인드 공개
    expect(prisma.review.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isPublished: true }) })
    )
    // 공간 평점 재집계 (isHot·우수 호스트·랭킹 입력)
    expect(prisma.space.update).toHaveBeenCalledWith({
      where: { id: 'sp1' },
      data: { ratingAvg: 4.5, ratingCount: 2 },
    })
    // 평점 5 → trustScore +3, 0~100 클램프
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'h1' },
        data: { trustScore: clampTrust(50 + TRUST_SCORE.REVIEW_DELTA[5]) },
      })
    )
  })

  it('한쪽만 작성 → 비공개 유지, 평점 집계 없음 (trust 가산은 발생)', async () => {
    const { svc, prisma } = makeReviews({ reservation: completed, counterpart: null })
    await svc.create('g1', input)
    expect(prisma.review.updateMany).not.toHaveBeenCalled()
    expect(prisma.space.update).not.toHaveBeenCalled()
    expect(prisma.user.update).toHaveBeenCalled() // trust 가산은 공개와 무관
  })

  it('이용 완료 전이면 작성 불가', async () => {
    const { svc } = makeReviews({ reservation: { ...completed, status: 'PAID' } })
    await expect(svc.create('g1', input)).rejects.toThrow()
  })

  it('이미 작성한 리뷰가 있으면 중복 거절', async () => {
    const { svc } = makeReviews({ reservation: completed, existing: { id: 'old' } })
    await expect(svc.create('g1', input)).rejects.toThrow()
  })

  it('예약 당사자(게스트/호스트)가 아니면 Forbidden', async () => {
    const { svc } = makeReviews({ reservation: { ...completed, guestId: 'someoneelse' } })
    await expect(svc.create('g1', input)).rejects.toThrow()
  })
})
