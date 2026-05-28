import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../../services/api'

export type HostReviewFilter = 'all' | 'unanswered' | 'answered'

export interface HostReviewItem {
  id: string
  reservationId: string
  authorId: string
  authorName: string
  authorAvatarUrl: string | null
  subjectId: string
  spaceId: string | null
  spaceSlug: string | null
  spaceTitle: string | null
  rating: number
  comment: string
  hostResponse: string | null
  hostResponseAt: string | null
  publishedAt: string | null
  createdAt: string
}

export interface HostReviewList {
  items: HostReviewItem[]
  total: number
  page: number
  pageSize: number
}

export function useHostReviews(filter: HostReviewFilter = 'all') {
  return useQuery({
    queryKey: ['reviews', 'host', filter] as const,
    queryFn: () =>
      api.get<HostReviewList>('/reviews/host/me', { params: { filter, pageSize: 50 } }),
    staleTime: 15_000,
  })
}

export function useRespondReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, response }: { id: string; response: string }) =>
      api.post(`/reviews/${id}/respond`, { response }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] })
      qc.invalidateQueries({ queryKey: ['spaces', 'detail'] })
    },
  })
}
