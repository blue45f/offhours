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
    /** true 면 corporateProfile 을 동결해 예약에 첨부, 세금계산서 발행 워크플로우 진입 */
    useCorporateBilling: z.boolean().optional(),
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

/**
 * 호스트 체크아웃 체크리스트 — 청소 SLA의 운영 마지막 단계.
 * 모든 필수 항목을 체크하지 않으면 백엔드에서 거절한다.
 */
export const CHECKOUT_ITEMS = [
  { key: 'restored', label: '집기·테이블 원상복구', required: true },
  { key: 'trash', label: '쓰레기 분리·반출', required: true },
  { key: 'audio', label: '음향·전자기기 종료', required: true },
  { key: 'lights', label: '조명·냉난방 종료', required: true },
  { key: 'lock', label: '출입문 잠금 확인', required: true },
  { key: 'lost', label: '분실물 확인', required: false },
] as const

export type CheckoutItemKey = (typeof CHECKOUT_ITEMS)[number]['key']

export const CheckOutSchema = z.object({
  checklist: z.object({
    restored: z.boolean(),
    trash: z.boolean(),
    audio: z.boolean(),
    lights: z.boolean(),
    lock: z.boolean(),
    lost: z.boolean().optional(),
  }),
  note: z.string().trim().max(500).optional(),
  photoUrls: z.array(z.string().url()).max(5).optional(),
})
export type CheckOutInput = z.infer<typeof CheckOutSchema>

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
  /** 법인 결제일 때 동결된 회사 정보 (세금계산서 발행 대상). 일반 결제면 null */
  corporateSnapshot: z
    .object({
      companyName: z.string(),
      businessNumber: z.string(),
      ceoName: z.string(),
      billingEmail: z.string(),
      taxPayer: z.enum(['GENERAL', 'TAX_FREE']),
    })
    .nullable()
    .optional(),
})
export type Reservation = z.infer<typeof ReservationSchema>

export function calcReservationFee(totalKRW: number): number {
  return Math.round(totalKRW * 0.12)
}
