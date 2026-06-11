import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ChatMessage, ChatSummary, SendMessageInput } from '@offhours/shared'

import { api } from '../../services/api'

export const chatKeys = {
  list: ['chats'] as const,
  thread: (id: string) => ['chats', 'thread', id] as const,
  messages: (id: string) => ['chats', id, 'messages'] as const,
}

export function useChats() {
  return useQuery({
    queryKey: chatKeys.list,
    queryFn: () => api.get<ChatSummary[]>('/chat'),
    refetchInterval: 30_000,
  })
}

/** 딥링크(/chat/:id) 진입 시 목록 없이도 스레드 맥락(상대·공간·예약)을 가져온다 */
export function useChatThread(id?: string) {
  return useQuery({
    queryKey: chatKeys.thread(id ?? ''),
    enabled: !!id,
    queryFn: () => api.get<ChatSummary>(`/chat/${id}`),
    refetchInterval: 30_000,
  })
}

export function useChatMessages(id?: string) {
  return useQuery({
    queryKey: chatKeys.messages(id ?? ''),
    enabled: !!id,
    queryFn: () => api.get<ChatMessage[]>(`/chat/${id}/messages`),
    refetchInterval: id ? 8_000 : false,
  })
}

export function useSendMessage(id?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SendMessageInput) => api.post(`/chat/${id}/messages`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chatKeys.messages(id ?? '') })
      qc.invalidateQueries({ queryKey: chatKeys.list, exact: true })
    },
  })
}

/** 예약 기준 채팅 스레드를 열거나(없으면 생성) 기존 스레드를 반환 */
export function useOpenChat() {
  return useMutation({
    mutationFn: (reservationId: string) => api.post<{ id: string }>(`/chat/open/${reservationId}`),
  })
}

/** 예약 전 문의 쪽지 — 공간 상세의 "문의하기". 기존 스레드가 있으면 재사용 */
export function useOpenSpaceInquiry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (spaceId: string) => api.post<{ id: string }>(`/chat/open/space/${spaceId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: chatKeys.list, exact: true }),
  })
}
