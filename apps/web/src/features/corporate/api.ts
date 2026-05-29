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

/** 영업 외 크레딧 충전 — 충전액에 따라 보너스 크레딧 적립 */
export function useTopupCredit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (amountKRW: number) =>
      api.post<{ creditBalanceKRW: number; added: number; bonus: number }>(
        '/me/corporate/credits/topup',
        { amountKRW }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me', 'corporate'] }),
  })
}
