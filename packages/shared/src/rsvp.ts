import { z } from 'zod'
import { PurposeSchema } from './enums'

export const RsvpStatusSchema = z.enum(['GOING', 'MAYBE', 'NO'])
export type RsvpStatus = z.infer<typeof RsvpStatusSchema>

export const RsvpStatusLabel: Record<RsvpStatus, string> = {
  GOING: '참석',
  MAYBE: '미정',
  NO: '불참',
}

export const RsvpSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: RsvpStatusSchema,
  createdAt: z.string(),
})
export type Rsvp = z.infer<typeof RsvpSchema>

/** 공유 링크에서 닉네임 한 번으로 참석 응답 — clientToken(localStorage)으로 1인 1표 멱등 */
export const CreateRsvpSchema = z.object({
  name: z.string().trim().min(1).max(40),
  status: RsvpStatusSchema,
  clientToken: z.string().min(8).max(100),
})
export type CreateRsvpInput = z.infer<typeof CreateRsvpSchema>

/**
 * 공개 모임 허브 요약 — 예약 코드(공유 토큰)로 누구나 볼 수 있는 안전 필드만 노출.
 * 주소·결제·체크인 코드 같은 민감 정보는 포함하지 않는다.
 */
export const EventSummarySchema = z.object({
  code: z.string(),
  spaceTitle: z.string(),
  spaceThumbnailUrl: z.string().nullable(),
  region: z.string(),
  district: z.string(),
  hostName: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  headcount: z.number(),
  purpose: PurposeSchema,
  /** 예약 상태 (확정 뱃지 표기용) */
  reservationStatus: z.string(),
  rsvps: z.array(RsvpSchema),
  counts: z.object({
    going: z.number(),
    maybe: z.number(),
    no: z.number(),
  }),
})
export type EventSummary = z.infer<typeof EventSummarySchema>
