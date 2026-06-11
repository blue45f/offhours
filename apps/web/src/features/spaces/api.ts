import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  AddonLine,
  AddonSelection,
  CreateSpaceInput,
  GalleryPhoto,
  Paginated,
  ProtectionTier,
  Purpose,
  Review,
  SpaceCard,
  SpaceDetail,
  Slot,
  VenueCategory,
} from '@offhours/shared'

import { api } from '../../services/api'

export interface SpaceSearchParams {
  q?: string
  region?: string
  district?: string
  category?: VenueCategory
  purpose?: Purpose
  capacity?: number
  date?: string
  priceMin?: number
  priceMax?: number
  amenities?: string
  /** UseCase 코드 콤마 구분 — 백엔드에서 hasSome 매칭 */
  useCases?: string
  instantBook?: boolean
  verifiedOnly?: boolean
  lat?: number
  lng?: number
  radiusKm?: number
  liveWithinHours?: number
  sort?: 'popular' | 'newest' | 'price-asc' | 'price-desc' | 'rating' | 'distance' | 'live'
  page?: number
  pageSize?: number
}

export const spacesKeys = {
  search: (q: SpaceSearchParams) => ['spaces', 'search', q] as const,
  detail: (slug: string) => ['spaces', 'detail', slug] as const,
  slots: (spaceId: string, from?: string, to?: string) =>
    ['spaces', spaceId, 'slots', from, to] as const,
  reviews: (spaceId: string) => ['spaces', spaceId, 'reviews'] as const,
}

export function useSpacesSearch(query: SpaceSearchParams) {
  return useQuery({
    queryKey: spacesKeys.search(query),
    queryFn: () =>
      api.get<Paginated<SpaceCard>>('/spaces', {
        params: Object.fromEntries(
          Object.entries(query).filter(([, v]) => v !== undefined && v !== '')
        ),
      }),
    staleTime: 60_000,
  })
}

export function useSpaceDetail(slug?: string) {
  return useQuery({
    queryKey: spacesKeys.detail(slug ?? ''),
    enabled: !!slug,
    queryFn: () => api.get<SpaceDetail>(`/spaces/slug/${slug}`),
    staleTime: 60_000,
  })
}

export function useSpaceSlots(spaceId?: string, from?: string, to?: string) {
  return useQuery({
    queryKey: spacesKeys.slots(spaceId ?? '', from, to),
    enabled: !!spaceId,
    queryFn: () =>
      api.get<Slot[]>(`/spaces/${spaceId}/slots`, {
        params: { from, to },
      }),
  })
}

export function useQuote(
  spaceId?: string,
  startAt?: string,
  endAt?: string,
  addons: AddonSelection[] = [],
  purpose?: Purpose
) {
  const addonsParam = addons.map((a) => `${a.addonId}:${a.qty}`).join(',')
  return useQuery({
    queryKey: ['spaces', spaceId, 'quote', startAt, endAt, addonsParam, purpose],
    enabled: !!spaceId && !!startAt && !!endAt,
    queryFn: () =>
      api.get<{
        hours: number
        hourlyRate: number
        baseAmountKRW: number
        purposeMultiplier: number
        purposeSurchargeKRW: number
        discountRate: number
        discountKRW: number
        discountedBaseAmountKRW: number
        cleaningFeeKRW: number
        addonsKRW: number
        addons: AddonLine[]
        protectionTier: ProtectionTier
        protectionFeeKRW: number
        protectionCoverageKRW: number
        subtotalKRW: number
        totalKRW: number
      }>(`/spaces/${spaceId}/slots/quote`, {
        params: {
          startAt,
          endAt,
          ...(addonsParam ? { addons: addonsParam } : {}),
          ...(purpose ? { purpose } : {}),
        },
      }),
    staleTime: 30_000,
  })
}

export function useSpacesBySlugs(slugs: string[]) {
  const sortedKey = slugs.join(',')
  return useQuery({
    queryKey: ['spaces', 'by-slugs', sortedKey] as const,
    enabled: slugs.length > 0,
    queryFn: () => api.get<SpaceCard[]>('/spaces/by-slugs', { params: { slugs: sortedKey } }),
    staleTime: 60_000,
  })
}

export function useForYou(seedSlugs: string[], limit = 8) {
  const seedKey = seedSlugs.join(',')
  return useQuery({
    queryKey: ['spaces', 'for-you', seedKey, limit] as const,
    queryFn: () =>
      api.get<SpaceCard[]>('/spaces/for-you', {
        params: { seedSlugs: seedKey, limit },
      }),
    staleTime: 60_000,
  })
}

export function useSpaceGallery(slug?: string) {
  return useQuery({
    queryKey: ['spaces', 'gallery', slug] as const,
    enabled: !!slug,
    queryFn: () => api.get<GalleryPhoto[]>('/spaces/slug/' + slug + '/gallery'),
    staleTime: 60_000,
  })
}

export function useNearbyBundle(slug?: string, radiusKm = 1, max = 4) {
  return useQuery({
    queryKey: ['spaces', 'nearby-bundle', slug, radiusKm, max] as const,
    enabled: !!slug,
    queryFn: () =>
      api.get<SpaceCard[]>(`/spaces/slug/${slug}/nearby-bundle`, {
        params: { radiusKm, max },
      }),
    staleTime: 60_000,
  })
}

export function useSpaceReviews(spaceId?: string) {
  return useQuery({
    queryKey: spacesKeys.reviews(spaceId ?? ''),
    enabled: !!spaceId,
    queryFn: () => api.get<{ items: Review[]; total: number }>(`/reviews/space/${spaceId}`),
  })
}

export function useCreateSpace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSpaceInput) => api.post('/spaces', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spaces'] }),
  })
}

export interface MySpace {
  id: string
  slug: string
  title: string
  basePriceKRW: number
  status: string
  capacityMax: number
  venueId: string
  photos: { url: string }[]
  venue: { name: string; region: string; district: string }
}

export function useMySpaces() {
  return useQuery({
    queryKey: ['spaces', 'mine'],
    queryFn: () => api.get<MySpace[]>('/spaces/mine'),
  })
}
