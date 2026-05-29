import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateRsvpInput, EventSummary } from '@offhours/shared'

import { api } from '../../services/api'

export function useEvent(code?: string) {
  return useQuery({
    queryKey: ['event', code] as const,
    enabled: !!code,
    queryFn: () => api.get<EventSummary>(`/events/${code}`),
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
