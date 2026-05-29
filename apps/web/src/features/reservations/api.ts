import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ArrivalGuide,
  CreateReservationInput,
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
