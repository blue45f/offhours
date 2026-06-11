import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { SpaceCard as SpaceCardType } from '@offhours/shared'

import { SpaceCard } from './SpaceCard'

const space: SpaceCardType = {
  id: 's1',
  slug: 'mapo-closed-cafe',
  title: '마감 후의 마포 카페',
  summary: '영업이 끝난 뒤 통대관할 수 있는 카페',
  capacityMin: 2,
  capacityMax: 20,
  basePriceKRW: 55000,
  ratingAvg: 4.9,
  ratingCount: 12,
  thumbnailUrl: null,
  blurhash: null,
  photoUrls: [],
  region: '서울',
  district: '마포구',
  category: 'CAFE',
  instantBook: false,
  useCases: [],
  isHot: true,
}

function renderCard(overrides: Partial<SpaceCardType> = {}) {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <SpaceCard space={{ ...space, ...overrides }} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('SpaceCard 뱃지 토큰', () => {
  it('🔥 인기 뱃지는 액센트 soft 토큰으로 칠해진다', () => {
    renderCard()

    const badge = screen.getByText('🔥 인기')
    expect(badge.className).toContain('bg-[var(--color-accent-soft)]')
    expect(badge.className).toContain('text-[var(--color-accent)]')
  })

  it('폐기된 옛 테라코타(#e76f51) 하드코딩이 되살아나지 않는다', () => {
    const { container } = renderCard()
    expect(container.innerHTML).not.toMatch(/e76f51/i)
  })
})
