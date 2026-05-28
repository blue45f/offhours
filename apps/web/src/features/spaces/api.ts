import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateSpaceInput,
  Paginated,
  Purpose,
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
  instantBook?: boolean
  sort?: 'popular' | 'newest' | 'price-asc' | 'price-desc' | 'rating'
  page?: number
  pageSize?: number
}

export const spacesKeys = {
  search: (q: SpaceSearchParams) => ['spaces', 'search', q] as const,
  detail: (slug: string) => ['spaces', 'detail', slug] as const,
  slots: (spaceId: string) => ['spaces', spaceId, 'slots'] as const,
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
    queryKey: spacesKeys.slots(spaceId ?? ''),
    enabled: !!spaceId,
    queryFn: () =>
      api.get<Slot[]>(`/spaces/${spaceId}/slots`, {
        params: { from, to },
      }),
  })
}

export function useQuote(spaceId?: string, startAt?: string, endAt?: string) {
  return useQuery({
    queryKey: ['spaces', spaceId, 'quote', startAt, endAt],
    enabled: !!spaceId && !!startAt && !!endAt,
    queryFn: () =>
      api.get<{
        hours: number
        hourlyRate: number
        baseAmountKRW: number
        cleaningFeeKRW: number
        totalKRW: number
      }>(`/spaces/${spaceId}/slots/quote`, {
        params: { startAt, endAt },
      }),
    staleTime: 30_000,
  })
}

export function useSpaceReviews(spaceId?: string) {
  return useQuery({
    queryKey: spacesKeys.reviews(spaceId ?? ''),
    enabled: !!spaceId,
    queryFn: () =>
      api.get<{
        items: Array<{
          id: string
          authorName: string
          authorAvatarUrl: string | null
          rating: number
          comment: string
          hostResponse: string | null
          createdAt: string
        }>
        total: number
      }>(`/reviews/space/${spaceId}`),
  })
}

export function useCreateSpace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSpaceInput) => api.post('/spaces', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['spaces'] }),
  })
}

export function useMySpaces() {
  return useQuery({
    queryKey: ['spaces', 'mine'],
    queryFn: () => api.get('/spaces/mine'),
  })
}
