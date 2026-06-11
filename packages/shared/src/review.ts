import { z } from 'zod'
import { AttachmentListSchema } from './attachment'

export const CreateReviewSchema = z.object({
  reservationId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(2000),
  attachments: AttachmentListSchema.default([]),
})
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>

export const RespondReviewSchema = z.object({
  response: z.string().trim().min(10).max(1500),
})
export type RespondReviewInput = z.infer<typeof RespondReviewSchema>

/** 후기 1단 답글 — 후기 작성자와 호스트만 이어갈 수 있는 평면 스레드 */
export const CreateReviewReplySchema = z.object({
  body: z.string().trim().min(2).max(1000),
})
export type CreateReviewReplyInput = z.infer<typeof CreateReviewReplySchema>

export const ReviewReplySchema = z.object({
  id: z.string(),
  reviewId: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  authorAvatarUrl: z.string().nullable(),
  /** 작성자가 해당 공간 호스트인지 — 스레드의 호스트 뱃지 표시용 */
  isHost: z.boolean(),
  body: z.string(),
  createdAt: z.string(),
})
export type ReviewReply = z.infer<typeof ReviewReplySchema>

export const ReviewSchema = z.object({
  id: z.string(),
  reservationId: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  authorAvatarUrl: z.string().nullable(),
  subjectId: z.string(),
  spaceId: z.string().nullable(),
  rating: z.number(),
  comment: z.string(),
  attachments: z.array(z.string()).default([]),
  hostResponse: z.string().nullable(),
  hostResponseAt: z.string().nullable(),
  replies: z.array(ReviewReplySchema).default([]),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
})
export type Review = z.infer<typeof ReviewSchema>

/**
 * 예약 상세에 붙는 "내가 쓴 후기" 요약 — 더블 블라인드(양측 작성 시 공개)라 비공개 상태를
 * UI 가 정직하게 안내할 수 있도록 isPublished 를 함께 내려준다.
 */
export const MyReservationReviewSchema = z.object({
  id: z.string(),
  rating: z.number(),
  comment: z.string(),
  attachments: z.array(z.string()).default([]),
  isPublished: z.boolean(),
  publishedAt: z.string().nullable(),
  hostResponse: z.string().nullable(),
  hostResponseAt: z.string().nullable(),
  createdAt: z.string(),
})
export type MyReservationReview = z.infer<typeof MyReservationReviewSchema>
