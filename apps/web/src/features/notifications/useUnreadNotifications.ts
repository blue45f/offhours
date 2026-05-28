import { useQuery } from '@tanstack/react-query'

import { api } from '../../services/api'
import { useIsAuthed } from '../../store/auth'

export function useUnreadNotifications() {
  const isAuthed = useIsAuthed()
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    enabled: isAuthed,
    refetchInterval: 60_000,
    queryFn: async () => {
      const res = await api.get<{ count: number }>('/notifications/unread-count')
      return res.count
    },
  })
}
