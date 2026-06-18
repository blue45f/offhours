/**
 * DeskCloud 네이티브 데이터 훅 — TanStack Query 로 SDK(pk_ 브라우저 클라이언트)를 감싼다.
 * 위젯 임베드 없이 데이터만 받아 offhours 컴포넌트로 렌더한다. 클라이언트가 null(=env
 * 미설정)이면 쿼리는 `enabled:false` 로 비활성, 호출부가 1st-party/빈 상태로 폴백한다.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  changelogClient,
  communityClient,
  COMMUNITY_BOARD_SLUG,
  moderationClient,
  reviewClient,
  REVIEW_SUBJECT_ID,
} from './clients'

import type {
  CreatePostInput,
  PostList,
  PostReceipt,
  PublicChangelog,
  ReportReceipt,
  ReviewAggregate,
  ReviewReceipt,
  ReviewSubmission,
  ReviewWall,
} from '@heejun/deskcloud'

/* ───────────────────────────── ChangelogDesk ───────────────────────────── */

export function useChangelog(limit = 30) {
  const client = changelogClient()
  return useQuery<PublicChangelog>({
    queryKey: ['deskcloud', 'changelog', limit],
    enabled: client !== null,
    staleTime: 60_000,
    queryFn: ({ signal }) => client!.getWall({ limit, signal }),
  })
}

/* ────────────────────────────── ReviewDesk ─────────────────────────────── */

export function useTestimonials(limit = 9) {
  const client = reviewClient()
  return useQuery<ReviewWall>({
    queryKey: ['deskcloud', 'reviews', 'wall', limit],
    enabled: client !== null,
    staleTime: 60_000,
    queryFn: ({ signal }) => client!.getWall({ limit, signal }),
  })
}

export function useReviewAggregate() {
  const client = reviewClient()
  return useQuery<ReviewAggregate>({
    queryKey: ['deskcloud', 'reviews', 'aggregate', REVIEW_SUBJECT_ID],
    enabled: client !== null,
    staleTime: 60_000,
    queryFn: () => client!.getAggregate({ subjectId: REVIEW_SUBJECT_ID }),
  })
}

export function useSubmitTestimonial() {
  const client = reviewClient()
  const qc = useQueryClient()
  return useMutation<ReviewReceipt, Error, ReviewSubmission>({
    mutationFn: (input) => {
      if (!client) throw new Error('ReviewDesk 가 설정되지 않았어요')
      return client.submit(input)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deskcloud', 'reviews'] })
    },
  })
}

/* ──────────────────────────── CommunityDesk ────────────────────────────── */

export function useCommunityFeed(boardSlug: string = COMMUNITY_BOARD_SLUG, limit = 20) {
  const client = communityClient()
  return useQuery<PostList>({
    queryKey: ['deskcloud', 'community', boardSlug, limit],
    enabled: client !== null,
    staleTime: 30_000,
    queryFn: ({ signal }) => client!.listPosts({ boardSlug, limit, signal }),
  })
}

export function useCreateCommunityPost(boardSlug: string = COMMUNITY_BOARD_SLUG) {
  const client = communityClient()
  const qc = useQueryClient()
  return useMutation<PostReceipt, Error, CreatePostInput>({
    mutationFn: (input) => {
      if (!client) throw new Error('CommunityDesk 가 설정되지 않았어요')
      return client.createPost(input)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deskcloud', 'community', boardSlug] })
    },
  })
}

/* ─────────────────────────── ModerationDesk ────────────────────────────── */

export interface ReportSubmission {
  subjectType: string
  subjectId: string
  reason: string
  reporterId?: string
}

export function useSubmitReport() {
  const client = moderationClient()
  return useMutation<ReportReceipt, Error, ReportSubmission>({
    mutationFn: (input) => {
      if (!client) throw new Error('ModerationDesk 가 설정되지 않았어요')
      return client.report(input)
    },
  })
}
