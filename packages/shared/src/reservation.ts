import { z } from 'zod'
import { PurposeSchema, ReservationStatusSchema } from './enums'

export const CreateReservationSchema = z
  .object({
    spaceId: z.string().min(1),
    startAt: z.string(),
    endAt: z.string(),
    headcount: z.number().int().min(1).max(500),
    purpose: PurposeSchema,
    note: z.string().trim().max(500).optional(),
  })
  .refine((v) => new Date(v.endAt).getTime() > new Date(v.startAt).getTime(), {
    message: '종료 시간은 시작 시간 이후여야 해요',
    path: ['endAt'],
  })
export type CreateReservationInput = z.infer<typeof CreateReservationSchema>

export const CancelReservationSchema = z.object({
  reason: z.string().trim().min(2).max(300),
})
export type CancelReservationInput = z.infer<typeof CancelReservationSchema>

export const ApproveReservationSchema = z.object({
  note: z.string().trim().max(300).optional(),
})
export type ApproveReservationInput = z.infer<typeof ApproveReservationSchema>

export const RejectReservationSchema = z.object({
  reason: z.string().trim().min(2).max(300),
})
export type RejectReservationInput = z.infer<typeof RejectReservationSchema>

export const ReservationSchema = z.object({
  id: z.string(),
  code: z.string(),
  spaceId: z.string(),
  spaceTitle: z.string(),
  spaceThumbnailUrl: z.string().nullable(),
  guestId: z.string(),
  guestName: z.string(),
  hostId: z.string(),
  hostName: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  headcount: z.number(),
  purpose: PurposeSchema,
  note: z.string().nullable(),
  status: ReservationStatusSchema,
  baseAmountKRW: z.number(),
  cleaningFeeKRW: z.number(),
  depositKRW: z.number(),
  totalKRW: z.number(),
  feeKRW: z.number(),
  cancelReason: z.string().nullable(),
  checkInCode: z.string().nullable(),
  checkedInAt: z.string().nullable(),
  checkedOutAt: z.string().nullable(),
  createdAt: z.string(),
})
export type Reservation = z.infer<typeof ReservationSchema>

export function calcReservationFee(totalKRW: number): number {
  return Math.round(totalKRW * 0.12)
}
