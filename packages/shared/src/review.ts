import { z } from 'zod'

export const CreateReviewSchema = z.object({
  reservationId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(2000),
})
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>

export const RespondReviewSchema = z.object({
  response: z.string().trim().min(10).max(1500),
})
export type RespondReviewInput = z.infer<typeof RespondReviewSchema>

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
  hostResponse: z.string().nullable(),
  hostResponseAt: z.string().nullable(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
})
export type Review = z.infer<typeof ReviewSchema>
