import { z } from 'zod'
import { PurposeSchema } from './enums'

export const GalleryPhotoSchema = z.object({
  url: z.string(),
  purpose: PurposeSchema,
  completedAt: z.string().nullable(),
})
export type GalleryPhoto = z.infer<typeof GalleryPhotoSchema>
