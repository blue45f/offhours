import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ArrivalGuide,
  CreateRecurringInput,
  CreateReservationInput,
  FileClaimInput,
  RecurringResult,
  Reservation,
  ReservationStatus,
} from '@offhours/shared'

export type ReservationDetail = Reservation & {
  venueAddressRoad: string | null
  arrivalGuide: ArrivalGuide | null
}

import { api } from '../../services/api'

export const reservationKeys = {
  mine: (role: 'guest' | 'host', status?: ReservationStatus) =>
    ['reservations', 'mine', role, status] as const,
  detail: (id: string) => ['reservations', 'detail', id] as const,
}

export function useMyReservations(role: 'guest' | 'host' = 'guest', status?: ReservationStatus) {
  return useQuery({
    queryKey: reservationKeys.mine(role, status),
    queryFn: () =>
      api.get<Reservation[]>('/reservations/mine', {
        params: { role, status },
      }),
  })
}

export function useReservationDetail(id?: string) {
  return useQuery({
    queryKey: reservationKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: () => api.get<ReservationDetail>(`/reservations/${id}`),
  })
}

export function useCreateReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateReservationInput) => api.post<Reservation>('/reservations', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reservations'] }),
  })
}

export function useCreateRecurring() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateRecurringInput) =>
      api.post<RecurringResult>('/reservations/recurring', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reservations'] }),
  })
}

export function useApproveReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.patch(`/reservations/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reservations'] }),
  })
}

export function useRejectReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; reason: string }) =>
      api.patch(`/reservations/${vars.id}/reject`, { reason: vars.reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reservations'] }),
  })
}

export function useCancelReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; reason: string }) =>
      api.patch(`/reservations/${vars.id}/cancel`, { reason: vars.reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reservations'] }),
  })
}

/** 안심 보장 파손 청구 — 호스트가 보장 적용·이용 완료 예약에 기물 파손·도난을 청구 */
export function useFileClaim() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; input: FileClaimInput }) =>
      api.post(`/reservations/${vars.id}/claim`, vars.input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reservations'] }),
  })
}

/** 이용 시간 연장 — 영업 외 안전 경계(다음 영업 준비) 안에서 N시간 추가 */
export function useExtendReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (vars: { id: string; hours: number }) =>
      api.post<{ additionalKRW: number }>(`/reservations/${vars.id}/extend`, {
        hours: vars.hours,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reservations'] }),
  })
}
