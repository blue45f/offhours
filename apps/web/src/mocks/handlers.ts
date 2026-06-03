import { http, HttpResponse } from 'msw'
import { paginated } from '@offhours/shared'
import type { Paginated, SpaceCard, Slot } from '@offhours/shared'

import { galleryFor, mockSpaces, toCard, toDetail } from './data'

/**
 * MSW READ-only 핸들러: 브라우징·검색·상세 디자인 이터레이션/데모용.
 * money-movement(결제/정산/환불/quote)는 의도적으로 mock하지 않는다 —
 * 해당 요청은 onUnhandledRequest: 'bypass'로 실제 네트워크(or 기존 mock-as-is)로 흘려보낸다.
 */
const API = '*/api'

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((res) => setTimeout(() => res(value), ms))
}

const num = (v: string | null) => (v != null && v !== '' ? Number(v) : undefined)

function matchesSearch(card: SpaceCard, sp: URLSearchParams): boolean {
  const q = sp.get('q')?.trim().toLowerCase()
  if (q) {
    const hay = `${card.title} ${card.summary} ${card.region} ${card.district}`.toLowerCase()
    if (!hay.includes(q)) return false
  }
  const region = sp.get('region')
  if (region && card.region !== region) return false
  const district = sp.get('district')
  if (district && card.district !== district) return false
  const category = sp.get('category')
  if (category && card.category !== category) return false
  const capacity = num(sp.get('capacity'))
  if (capacity != null && card.capacityMax < capacity) return false
  const priceMin = num(sp.get('priceMin'))
  if (priceMin != null && card.basePriceKRW < priceMin) return false
  const priceMax = num(sp.get('priceMax'))
  if (priceMax != null && card.basePriceKRW > priceMax) return false
  if (sp.get('instantBook') === 'true' && !card.instantBook) return false
  if (sp.get('verifiedOnly') === 'true' && !card.verifiedBusiness) return false
  const useCases = sp.get('useCases')?.split(',').filter(Boolean)
  if (useCases?.length && !useCases.some((u) => card.useCases.includes(u as never))) return false
  return true
}

function sortCards(cards: SpaceCard[], sort: string | null): SpaceCard[] {
  const out = [...cards]
  switch (sort) {
    case 'price-asc':
      return out.sort((a, b) => a.basePriceKRW - b.basePriceKRW)
    case 'price-desc':
      return out.sort((a, b) => b.basePriceKRW - a.basePriceKRW)
    case 'rating':
      return out.sort((a, b) => b.ratingAvg - a.ratingAvg)
    case 'newest':
      return out.sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false))
    case 'distance':
      return out.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
    case 'popular':
    default:
      return out.sort((a, b) => b.ratingCount - a.ratingCount)
  }
}

function buildSlots(spaceId: string, from?: string, to?: string): Slot[] {
  const space = mockSpaces.find((s) => s.id === spaceId)
  const price = space?.basePriceKRW ?? 50_000
  const start = from ? new Date(from) : new Date()
  const days = 5
  const slots: Slot[] = []
  for (let d = 0; d < days; d++) {
    for (const hour of [19, 20, 21]) {
      const startAt = new Date(start)
      startAt.setDate(start.getDate() + d)
      startAt.setHours(hour, 0, 0, 0)
      if (to && startAt > new Date(to)) continue
      const endAt = new Date(startAt)
      endAt.setHours(hour + 1)
      slots.push({
        id: `${spaceId}_slot_${d}_${hour}`,
        spaceId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        priceKRW: price,
        isOpen: true,
        isReserved: (d + hour) % 4 === 0,
      })
    }
  }
  return slots
}

export const handlers = [
  http.get(`${API}/health`, () =>
    HttpResponse.json({ ok: true, app: 'offhours-mock', ts: new Date().toISOString() })
  ),

  // Search / list — GET /api/spaces?q=&region=&category=&sort=&page=&pageSize=
  http.get(`${API}/spaces`, async ({ request }) => {
    const sp = new URL(request.url).searchParams
    const filtered = sortCards(
      mockSpaces.map(toCard).filter((c) => matchesSearch(c, sp)),
      sp.get('sort')
    )
    const page = num(sp.get('page')) ?? 1
    const pageSize = num(sp.get('pageSize')) ?? 20
    const startIdx = (page - 1) * pageSize
    const items = filtered.slice(startIdx, startIdx + pageSize)
    const payload: Paginated<SpaceCard> = paginated(items, filtered.length, page, pageSize)
    return HttpResponse.json(await delay(payload))
  }),

  // Personalized rail — GET /api/spaces/for-you
  http.get(`${API}/spaces/for-you`, async ({ request }) => {
    const sp = new URL(request.url).searchParams
    const limit = num(sp.get('limit')) ?? 8
    const items = mockSpaces.map(toCard).slice(0, limit)
    return HttpResponse.json(await delay(items))
  }),

  // Compare board hydration — GET /api/spaces/by-slugs?slugs=a,b,c
  http.get(`${API}/spaces/by-slugs`, async ({ request }) => {
    const sp = new URL(request.url).searchParams
    const slugs = (sp.get('slugs') ?? '').split(',').filter(Boolean)
    const items = mockSpaces.filter((s) => slugs.includes(s.slug)).map(toCard)
    return HttpResponse.json(await delay(items))
  }),

  // Host's own spaces — GET /api/spaces/mine
  http.get(`${API}/spaces/mine`, async () => {
    const mine = mockSpaces.slice(0, 2).map((s) => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      basePriceKRW: s.basePriceKRW,
      status: s.detail.status,
      capacityMax: s.capacityMax,
      venueId: s.detail.venue.id,
      photos: s.detail.photos.map((p) => ({ url: p.url })),
      venue: {
        name: s.detail.venue.name,
        region: s.region,
        district: s.district,
      },
    }))
    return HttpResponse.json(await delay(mine))
  }),

  // Gallery — GET /api/spaces/slug/:slug/gallery
  http.get(`${API}/spaces/slug/:slug/gallery`, async ({ params }) => {
    const space = mockSpaces.find((s) => s.slug === params.slug)
    if (!space) return new HttpResponse('not found', { status: 404 })
    return HttpResponse.json(await delay(galleryFor(space)))
  }),

  // Nearby bundle — GET /api/spaces/slug/:slug/nearby-bundle
  http.get(`${API}/spaces/slug/:slug/nearby-bundle`, async ({ params, request }) => {
    const space = mockSpaces.find((s) => s.slug === params.slug)
    if (!space) return new HttpResponse('not found', { status: 404 })
    const sp = new URL(request.url).searchParams
    const max = num(sp.get('max')) ?? 4
    const items = mockSpaces
      .filter((s) => s.slug !== space.slug && s.region === space.region)
      .slice(0, max)
      .map(toCard)
    return HttpResponse.json(await delay(items))
  }),

  // Detail — GET /api/spaces/slug/:slug
  http.get(`${API}/spaces/slug/:slug`, async ({ params }) => {
    const space = mockSpaces.find((s) => s.slug === params.slug)
    if (!space) return new HttpResponse('not found', { status: 404 })
    return HttpResponse.json(await delay(toDetail(space)))
  }),

  // Availability slots — GET /api/spaces/:spaceId/slots (read-only browsing of openings)
  http.get(`${API}/spaces/:spaceId/slots`, async ({ params, request }) => {
    const sp = new URL(request.url).searchParams
    return HttpResponse.json(
      await delay(
        buildSlots(String(params.spaceId), sp.get('from') ?? undefined, sp.get('to') ?? undefined)
      )
    )
  }),

  // Reviews — GET /api/reviews/space/:spaceId
  http.get(`${API}/reviews/space/:spaceId`, async ({ params }) => {
    const space = mockSpaces.find((s) => s.id === params.spaceId)
    const total = space?.ratingCount ?? 0
    const samples = [
      {
        rating: 5,
        comment: '뷰가 정말 좋고 호스트분이 친절하셨어요. 파티하기 딱이에요!',
        hostResponse: '즐거우셨다니 기뻐요. 또 찾아주세요 :)',
      },
      {
        rating: 5,
        comment: '사진보다 실물이 더 좋았습니다. 청소 상태도 깔끔했어요.',
        hostResponse: null,
      },
      {
        rating: 4,
        comment: '위치 찾기가 조금 어려웠지만 공간 자체는 만족스러웠습니다.',
        hostResponse: '안내가 부족했네요. 도착 가이드 보완하겠습니다.',
      },
    ]
    const items = samples.map((r, i) => ({
      id: `${params.spaceId}_review_${i}`,
      authorName: ['민지', '준호', '서연'][i],
      authorAvatarUrl: null,
      rating: r.rating,
      comment: r.comment,
      hostResponse: r.hostResponse,
      createdAt: new Date(Date.now() - (i + 1) * 86_400_000 * 3).toISOString(),
    }))
    return HttpResponse.json(await delay({ items, total }))
  }),
]
