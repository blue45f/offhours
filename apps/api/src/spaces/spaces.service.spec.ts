import { describe, expect, it, vi } from 'vitest'
import type { SpaceSearch } from '@offhours/shared'

import { SpacesService } from './spaces.service'

/**
 * 공간 검색(search) 회귀 방지 — 가장 복잡한 미검증 서비스. 모든 게스트가 거치는 표면이라
 * ① 쿼리 → Prisma where 매핑, ② 정렬·페이지네이션(skip/take), ③ 지오(거리) 후처리 경로의
 * 반경 필터·거리 정렬·total 집계를 잠근다.
 */
function makeSpaces(opts: { findMany?: any[]; count?: number } = {}) {
  const prisma: any = {
    space: {
      findMany: vi.fn().mockResolvedValue(opts.findMany ?? []),
      count: vi.fn().mockResolvedValue(opts.count ?? 0),
    },
    slot: { findMany: vi.fn().mockResolvedValue([]) },
  }
  return { svc: new SpacesService(prisma, {} as any), prisma }
}

const baseQuery = { sort: 'popular', page: 1, pageSize: 20 } as SpaceSearch

function spaceFixture(id: string, lat: number, lng: number) {
  return {
    id,
    slug: `slug-${id}`,
    title: `공간 ${id}`,
    summary: '좋은 공간이에요',
    capacityMin: 1,
    capacityMax: 30,
    basePriceKRW: 30000,
    ratingAvg: 4.5,
    ratingCount: 5,
    instantBook: false,
    useCases: [],
    createdAt: new Date('2020-01-01T00:00:00Z'),
    photos: [],
    venue: {
      region: '서울',
      district: '강남구',
      category: 'CAFE',
      lat,
      lng,
      host: {
        approvedAt: null,
        isInsured: false,
        user: {
          responseMedianMin: null,
          responseRate24h: null,
          responseSampleCount: null,
          trustScore: 50,
          hostedCount: 1,
        },
      },
    },
  }
}

describe('SpacesService.search — 필터 매핑', () => {
  it('모든 필터를 Prisma where 로 정확히 매핑 + 정렬·페이지네이션', async () => {
    const { svc, prisma } = makeSpaces()
    await svc.search({
      ...baseQuery,
      q: '루프탑',
      region: '서울',
      district: '강남구',
      category: 'BAR',
      capacity: 10,
      priceMin: 10000,
      priceMax: 50000,
      amenities: ['wifi', 'parking'],
      useCases: ['BIRTHDAY'],
      instantBook: true,
      verifiedOnly: true,
      sort: 'newest',
      page: 2,
      pageSize: 12,
    } as SpaceSearch)
    const arg = prisma.space.findMany.mock.calls[0][0]
    expect(arg.where.status).toBe('ACTIVE')
    expect(arg.where.OR).toHaveLength(3) // q → title/summary/description contains
    expect(arg.where.venue).toMatchObject({
      region: '서울',
      district: '강남구',
      category: 'BAR',
      host: { approvedAt: { not: null } }, // verifiedOnly
    })
    expect(arg.where.capacityMax).toEqual({ gte: 10 })
    expect(arg.where.basePriceKRW).toEqual({ gte: 10000, lte: 50000 })
    expect(arg.where.amenities).toEqual({ hasEvery: ['wifi', 'parking'] })
    expect(arg.where.useCases).toEqual({ hasSome: ['BIRTHDAY'] })
    expect(arg.where.instantBook).toBe(true)
    expect(arg.orderBy).toEqual({ createdAt: 'desc' }) // newest
    expect(arg.skip).toBe(12) // (page2 − 1) × 12
    expect(arg.take).toBe(12)
  })

  it('필터 없으면 status=ACTIVE 만, 인기순(viewCount desc) 정렬', async () => {
    const { svc, prisma } = makeSpaces()
    await svc.search({ ...baseQuery })
    const arg = prisma.space.findMany.mock.calls[0][0]
    expect(arg.where).toEqual({ status: 'ACTIVE' })
    expect(arg.orderBy).toEqual({ viewCount: 'desc' })
  })

  it('가격 하한만 주면 gte 만 설정(상한 누락 안전)', async () => {
    const { svc, prisma } = makeSpaces()
    await svc.search({ ...baseQuery, priceMin: 20000 } as SpaceSearch)
    expect(prisma.space.findMany.mock.calls[0][0].where.basePriceKRW).toEqual({ gte: 20000 })
  })
})

describe('SpacesService.search — 거리(지오) 경로', () => {
  it('반경 밖 공간 제외 + 가까운 순 정렬 + take:240 후처리', async () => {
    const near = spaceFixture('near', 37.5, 127.0) // 0km
    const mid = spaceFixture('mid', 37.51, 127.0) // ~1.1km
    const far = spaceFixture('far', 38.0, 127.0) // ~55km
    const { svc, prisma } = makeSpaces({ findMany: [far, near, mid] }) // 일부러 섞음
    const res: any = await svc.search({
      ...baseQuery,
      sort: 'distance',
      lat: 37.5,
      lng: 127.0,
      radiusKm: 10,
    } as SpaceSearch)

    expect(res.total).toBe(2) // far(반경 밖) 제외
    expect(res.items.map((i: any) => i.id)).toEqual(['near', 'mid']) // 가까운 순
    expect(res.items[0].distanceKm).toBeLessThan(res.items[1].distanceKm)
    // 지오 경로는 skip 없이 take:240 으로 후보를 모아 인메모리 후처리
    expect(prisma.space.findMany.mock.calls[0][0].take).toBe(240)
    expect(prisma.space.findMany.mock.calls[0][0].skip).toBeUndefined()
  })
})
