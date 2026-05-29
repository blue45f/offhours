import { useMutation } from '@tanstack/react-query'

import { api } from '../../services/api'

/** 예약 기준 채팅 스레드를 열거나(없으면 생성) 기존 스레드를 반환 */
export function useOpenChat() {
  return useMutation({
    mutationFn: (reservationId: string) => api.post<{ id: string }>(`/chat/open/${reservationId}`),
  })
}
