import { z } from 'zod'

export const HeatmapCellSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  hour: z.number().int().min(0).max(23),
  occupancy: z.number().min(0).max(1),
  bookings: z.number().int().nonnegative(),
})
export type HeatmapCell = z.infer<typeof HeatmapCellSchema>

export const DemandHeatmapSchema = z.object({
  /** 7×24 = 168 셀, idx = weekday*24 + hour, 값은 0~1 점유율 */
  cells: z.array(z.number().min(0).max(1)).length(168),
  topSlots: z.array(HeatmapCellSchema),
  totalBookings: z.number().int().nonnegative(),
})
export type DemandHeatmap = z.infer<typeof DemandHeatmapSchema>

export const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']
