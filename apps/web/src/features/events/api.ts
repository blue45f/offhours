import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateRsvpInput, EventSummary } from '@offhours/shared'

import { api } from '../../services/api'
import { getClientToken } from './clientToken'

export function useEvent(code?: string) {
  return useQuery({
    queryKey: ['event', code] as const,
    enabled: !!code,
    // 본인 응답 식별(mine)을 위해 viewer 의 clientToken 전달 — 이름이 아닌 토큰으로 매칭
    queryFn: () =>
      api.get<EventSummary>(`/events/${code}`, { params: { token: getClientToken() } }),
    staleTime: 30_000,
    retry: false,
  })
}

export function useRsvp(code: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateRsvpInput) => api.post<EventSummary>(`/events/${code}/rsvp`, body),
    onSuccess: (data) => qc.setQueryData(['event', code], data),
  })
}
