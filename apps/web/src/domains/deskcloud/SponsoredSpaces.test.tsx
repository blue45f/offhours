import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi, type Mock } from 'vitest'

import { adClient } from './clients'
import { SponsoredSpaces } from './SponsoredSpaces'

// AdDesk is env-gated via clients.ts; mock the factory + slots to control state.
vi.mock('./clients', () => ({
  adClient: vi.fn(),
  adSlots: ['home-spotlight-1'],
}))

// Embla needs real layout (ResizeObserver) jsdom lacks; the carousel handles a
// null api, so stub the hook to a ref + no api.
vi.mock('embla-carousel-react', () => ({ default: () => [vi.fn(), undefined] }))

const mockAdClient = adClient as unknown as Mock

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('SponsoredSpaces', () => {
  it('renders nothing when AdDesk is off (no client)', () => {
    mockAdClient.mockReturnValue(null)
    const { container } = render(<SponsoredSpaces />)
    expect(container.querySelector('section')).toBeNull()
    expect(container.textContent).toBe('')
  })

  it('renders a sponsored card when a slot serves a creative', async () => {
    const serve = vi.fn().mockResolvedValue({
      served: true,
      creativeId: 'c1',
      imageUrl: 'https://cdn.example.com/ad-1.png',
      linkUrl: 'https://example.com/go',
      alt: '추천 공간',
      size: null,
    })
    mockAdClient.mockReturnValue({
      serve,
      trackImpression: vi.fn().mockResolvedValue({ ok: true, count: 1 }),
      trackClick: vi.fn().mockResolvedValue({ ok: true, count: 1 }),
    })

    const { container } = render(<SponsoredSpaces />)
    await waitFor(() => expect(container.querySelector('img')).not.toBeNull())

    const link = container.querySelector('a[rel~="sponsored"]')
    expect(link?.getAttribute('href')).toBe('https://example.com/go')
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      'https://cdn.example.com/ad-1.png'
    )
    expect(serve).toHaveBeenCalledWith(expect.objectContaining({ slot: 'home-spotlight-1' }))
  })
})
