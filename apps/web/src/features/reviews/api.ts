import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateReviewInput, ReviewReply } from '@offhours/shared'

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
  attachments: string[]
  hostResponse: string | null
  hostResponseAt: string | null
  replies: ReviewReply[]
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

/** 게스트(또는 호스트)가 이용 완료 예약에 후기 작성 — 더블 블라인드로 양측 작성 시 공개 */
export function useCreateReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateReviewInput) => api.post('/reviews', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reservations'] })
      qc.invalidateQueries({ queryKey: ['reviews'] })
      qc.invalidateQueries({ queryKey: ['spaces'] })
    },
  })
}

/** 후기 1단 답글 — 후기 작성자·호스트의 평면 스레드 */
export function useAddReviewReply() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ reviewId, body }: { reviewId: string; body: string }) =>
      api.post<ReviewReply>(`/reviews/${reviewId}/replies`, { body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews'] })
      qc.invalidateQueries({ queryKey: ['spaces'] })
    },
  })
}
