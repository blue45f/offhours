import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateHostProfileInput, HostEarnings, HostProfile } from '@offhours/shared'

import { api } from '../../services/api'
import { useIsAuthed } from '../../store/auth'

export const hostKeys = {
  profile: ['host', 'profile'] as const,
  stats: ['host', 'stats'] as const,
  earnings: ['host', 'earnings'] as const,
}

export interface HostStats {
  venues: number
  spaces: number
  reservations: number
  revenueKRW: number
  ratingAvg: number
  reviewCount: number
}

export function useHostProfile() {
  const isAuthed = useIsAuthed()
  return useQuery({
    queryKey: hostKeys.profile,
    enabled: isAuthed,
    queryFn: () => api.get<HostProfile | null>('/host/profile'),
  })
}

export function useUpsertHostProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateHostProfileInput) => api.post<HostProfile>('/host/profile', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hostKeys.profile })
      qc.invalidateQueries({ queryKey: hostKeys.stats })
      qc.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

export function useHostStats() {
  return useQuery({
    queryKey: hostKeys.stats,
    queryFn: () => api.get<HostStats | null>('/host/stats'),
  })
}

export function useHostEarnings() {
  const isAuthed = useIsAuthed()
  return useQuery({
    queryKey: hostKeys.earnings,
    enabled: isAuthed,
    queryFn: () => api.get<HostEarnings>('/host/earnings'),
  })
}
