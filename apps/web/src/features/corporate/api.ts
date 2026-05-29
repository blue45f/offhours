import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CorporateProfile, UpsertCorporateProfileInput } from '@offhours/shared'

import { api } from '../../services/api'
import { useIsAuthed } from '../../store/auth'

export function useCorporateProfile() {
  const isAuthed = useIsAuthed()
  return useQuery({
    queryKey: ['me', 'corporate'] as const,
    enabled: isAuthed,
    queryFn: () => api.get<CorporateProfile | null>('/me/corporate'),
    staleTime: 60_000,
  })
}

export function useUpsertCorporateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: UpsertCorporateProfileInput) =>
      api.put<CorporateProfile>('/me/corporate', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me', 'corporate'] }),
  })
}

export function useDeleteCorporateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.delete('/me/corporate'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me', 'corporate'] }),
  })
}
