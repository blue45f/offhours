import { z } from 'zod'
import { SpaceCardSchema } from './space'

export const CreateCollectionSchema = z.object({
  name: z.string().trim().min(1).max(40),
  description: z.string().trim().max(280).optional(),
  emoji: z.string().trim().max(4).optional(),
  isPublic: z.boolean().default(true),
})
export type CreateCollectionInput = z.infer<typeof CreateCollectionSchema>

export const UpdateCollectionSchema = CreateCollectionSchema.partial()
export type UpdateCollectionInput = z.infer<typeof UpdateCollectionSchema>

export const CollectionSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  emoji: z.string().nullable(),
  description: z.string().nullable(),
  isPublic: z.boolean(),
  itemCount: z.number(),
  coverPhotoUrls: z.array(z.string()),
  ownerName: z.string(),
  ownerAvatarUrl: z.string().nullable(),
  updatedAt: z.string(),
})
export type CollectionSummary = z.infer<typeof CollectionSummarySchema>

export const CollectionDetailSchema = CollectionSummarySchema.extend({
  items: z.array(
    SpaceCardSchema.extend({
      note: z.string().nullable(),
      addedAt: z.string(),
    })
  ),
})
export type CollectionDetail = z.infer<typeof CollectionDetailSchema>

export const AddToCollectionSchema = z.object({
  spaceId: z.string().min(1),
  note: z.string().trim().max(280).optional(),
})
export type AddToCollectionInput = z.infer<typeof AddToCollectionSchema>
