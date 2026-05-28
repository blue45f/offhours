import { z } from 'zod'

export const FavoriteSchema = z.object({
  spaceId: z.string(),
  createdAt: z.string(),
})
export type Favorite = z.infer<typeof FavoriteSchema>
