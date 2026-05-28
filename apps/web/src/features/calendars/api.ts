import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ConnectExternalCalendarInput,
  CreateManualBlockInput,
  HostCalendarOverview,
} from '@offhours/shared'

import { api } from '../../services/api'

export function useHostCalendars() {
  return useQuery({
    queryKey: ['host-calendars'],
    queryFn: () => api.get<HostCalendarOverview>('/host/calendars'),
    staleTime: 15_000,
  })
}

export function useCreateBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateManualBlockInput) => api.post('/host/calendars/blocks', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['host-calendars'] }),
  })
}

export function useDeleteBlock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/host/calendars/blocks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['host-calendars'] }),
  })
}

export function useConnectExternal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ConnectExternalCalendarInput) =>
      api.post('/host/calendars/external', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['host-calendars'] }),
  })
}

export function useResyncCalendar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/host/calendars/external/${id}/sync`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['host-calendars'] }),
  })
}

export function useDeleteCalendar() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/host/calendars/external/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['host-calendars'] }),
  })
}
