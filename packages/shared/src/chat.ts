import { z } from 'zod'
import { AttachmentListSchema } from './attachment'
import { ReservationStatusSchema } from './enums'

export const SendMessageSchema = z
  .object({
    body: z.string().trim().max(2000).default(''),
    attachments: AttachmentListSchema.default([]),
  })
  .refine((v) => v.body.length > 0 || v.attachments.length > 0, {
    message: '메시지 내용이나 사진을 입력해주세요',
    path: ['body'],
  })
export type SendMessageInput = z.infer<typeof SendMessageSchema>

export const ChatMessageSchema = z.object({
  id: z.string(),
  chatId: z.string(),
  senderId: z.string(),
  senderName: z.string(),
  senderAvatarUrl: z.string().nullable(),
  body: z.string(),
  attachments: z.array(z.string()).default([]),
  /** 신고 처리로 관리자 숨김 — 본문·첨부는 마스킹되고 자리 표시만 남는다 */
  isHidden: z.boolean().default(false),
  createdAt: z.string(),
})
export type ChatMessage = z.infer<typeof ChatMessageSchema>

export const ChatSummarySchema = z.object({
  id: z.string(),
  reservationId: z.string().nullable(),
  peerId: z.string(),
  peerName: z.string(),
  peerAvatarUrl: z.string().nullable(),
  /** 상대가 스레드를 마지막으로 읽은 시각 — 내 메시지 "읽음" 표시 기준 */
  peerLastReadAt: z.string().nullable(),
  /** 스레드 맥락 — 예약 채팅·예약 전 문의 모두 공간 정보를 채운다 */
  spaceId: z.string().nullable(),
  spaceSlug: z.string().nullable(),
  spaceTitle: z.string().nullable(),
  spaceThumbnailUrl: z.string().nullable(),
  reservationCode: z.string().nullable(),
  reservationStatus: ReservationStatusSchema.nullable(),
  reservationStartAt: z.string().nullable(),
  lastMessage: z.string().nullable(),
  lastMessageAt: z.string().nullable(),
  unreadCount: z.number().int().min(0),
})
export type ChatSummary = z.infer<typeof ChatSummarySchema>
