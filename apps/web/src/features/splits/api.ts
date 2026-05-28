import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateSplitInput, PublicSplitInfo, SplitDetail } from '@offhours/shared'

import { api } from '../../services/api'

export function useReservationSplit(reservationId?: string) {
  return useQuery({
    queryKey: ['split', reservationId] as const,
    enabled: !!reservationId,
    queryFn: () => api.get<SplitDetail | null>(`/reservations/${reservationId}/split`),
    staleTime: 15_000,
  })
}

export function useCreateSplit(reservationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSplitInput) =>
      api.post<SplitDetail>(`/reservations/${reservationId}/split`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['split', reservationId] }),
  })
}

export function usePublicSplit(token?: string) {
  return useQuery({
    queryKey: ['pay', token] as const,
    enabled: !!token,
    queryFn: () => api.get<PublicSplitInfo>(`/pay/${token}`),
    staleTime: 5_000,
  })
}

export function useConfirmSplitPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (token: string) => api.post<{ alreadyPaid: boolean }>(`/pay/${token}/confirm`),
    onSuccess: (_, token) => {
      qc.invalidateQueries({ queryKey: ['pay', token] })
      qc.invalidateQueries({ queryKey: ['split'] })
    },
  })
}
