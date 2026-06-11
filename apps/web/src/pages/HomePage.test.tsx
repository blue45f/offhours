import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import HomePage from './HomePage'

// jsdom 에는 IntersectionObserver 가 없어 framer-motion whileInView 가 크래시 — no-op 스텁
beforeAll(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
})

afterAll(() => {
  vi.unstubAllGlobals()
})

// CategoryRow 외 섹션은 react-query·geolocation 의존이라 페이지 단위 테스트에서는 잘라낸다
vi.mock('../components/space/HeroSearch', () => ({ HeroSearch: () => null }))
vi.mock('../components/space/SpaceCardGrid', () => ({ SpaceCardGrid: () => null }))
vi.mock('../components/space/FeaturedSpacesBand', () => ({ FeaturedSpacesBand: () => null }))
vi.mock('../components/space/LiveNearbyRail', () => ({ LiveNearbyRail: () => null }))
vi.mock('../components/space/UseCaseDiscovery', () => ({ UseCaseDiscovery: () => null }))
vi.mock('../components/space/ForYouSection', () => ({ ForYouSection: () => null }))
vi.mock('../features/spaces/api', () => ({
  useSpacesSearch: () => ({ data: undefined, isLoading: false }),
}))
vi.mock('../hooks/useGeolocation', () => ({
  SEOUL_FALLBACK: { lat: 37.5663, lng: 126.978 },
  useGeolocation: () => ({ coords: null, status: 'idle', request: vi.fn() }),
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  )
}

describe('HomePage 카테고리 칩', () => {
  it('칩 색은 raw oklch 값이 아니라 카테고리 틴트 토큰에서 온다 (다크 테마 보정 지점)', () => {
    renderPage()

    const link = screen.getByRole('link', { name: '카페' })
    expect(link).toHaveAttribute('href', '/spaces?category=CAFE')

    const disc = link.querySelector('span[style]')
    expect(disc?.getAttribute('style')).toContain('oklch(var(--category-tint-bg)')
    expect(disc?.getAttribute('style')).toContain('oklch(var(--category-tint-fg)')
  })

  it('12개 카테고리 칩이 모두 검색 링크로 렌더된다', () => {
    renderPage()

    const chips = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href')?.startsWith('/spaces?category='))
    expect(chips).toHaveLength(12)
  })
})
