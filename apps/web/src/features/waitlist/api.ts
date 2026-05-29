import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { WaitlistStatus } from '@offhours/shared'

import { api } from '../../services/api'

export function useWaitlistStatus(spaceId?: string) {
  return useQuery({
    queryKey: ['waitlist', spaceId] as const,
    enabled: !!spaceId,
    queryFn: () => api.get<WaitlistStatus>(`/spaces/${spaceId}/waitlist`),
    staleTime: 30_000,
  })
}

export function useJoinWaitlist(spaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<WaitlistStatus>(`/spaces/${spaceId}/waitlist`, {}),
    onSuccess: (data) => qc.setQueryData(['waitlist', spaceId], data),
  })
}

export function useLeaveWaitlist(spaceId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete<WaitlistStatus>(`/spaces/${spaceId}/waitlist`),
    onSuccess: (data) => qc.setQueryData(['waitlist', spaceId], data),
  })
}
