import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const RECENT_MAX = 12

interface RecentlyViewedState {
  slugs: string[]
  push: (slug: string) => void
  clear: () => void
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      slugs: [],
      push: (slug) => {
        const cur = get().slugs.filter((s) => s !== slug)
        cur.unshift(slug)
        set({ slugs: cur.slice(0, RECENT_MAX) })
      },
      clear: () => set({ slugs: [] }),
    }),
    { name: 'offh.recently-viewed' }
  )
)
