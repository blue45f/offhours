import { z } from 'zod'

export const PageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(20),
})
export type PageQuery = z.infer<typeof PageQuerySchema>

export const SortDirSchema = z.enum(['asc', 'desc']).default('desc')
export type SortDir = z.infer<typeof SortDirSchema>

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function paginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): Paginated<T> {
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}
