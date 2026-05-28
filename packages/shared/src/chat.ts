import { z } from 'zod'

export const SendMessageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
})
export type SendMessageInput = z.infer<typeof SendMessageSchema>

export const ChatMessageSchema = z.object({
  id: z.string(),
  chatId: z.string(),
  senderId: z.string(),
  senderName: z.string(),
  senderAvatarUrl: z.string().nullable(),
  body: z.string(),
  createdAt: z.string(),
})
export type ChatMessage = z.infer<typeof ChatMessageSchema>

export const ChatSummarySchema = z.object({
  id: z.string(),
  reservationId: z.string().nullable(),
  peerName: z.string(),
  peerAvatarUrl: z.string().nullable(),
  lastMessage: z.string().nullable(),
  lastMessageAt: z.string().nullable(),
  unreadCount: z.number().int().min(0),
})
export type ChatSummary = z.infer<typeof ChatSummarySchema>
