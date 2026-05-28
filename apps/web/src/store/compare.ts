import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const COMPARE_MAX = 4

interface CompareState {
  slugs: string[]
  add: (slug: string) => boolean
  remove: (slug: string) => void
  toggle: (slug: string) => boolean
  clear: () => void
  has: (slug: string) => boolean
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      slugs: [],
      add: (slug) => {
        const cur = get().slugs
        if (cur.includes(slug)) return true
        if (cur.length >= COMPARE_MAX) return false
        set({ slugs: [...cur, slug] })
        return true
      },
      remove: (slug) => set({ slugs: get().slugs.filter((s) => s !== slug) }),
      toggle: (slug) => {
        const cur = get().slugs
        if (cur.includes(slug)) {
          set({ slugs: cur.filter((s) => s !== slug) })
          return false
        }
        if (cur.length >= COMPARE_MAX) return false
        set({ slugs: [...cur, slug] })
        return true
      },
      clear: () => set({ slugs: [] }),
      has: (slug) => get().slugs.includes(slug),
    }),
    { name: 'offh.compare' }
  )
)
