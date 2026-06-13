import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '../../services/api'
import { useIsAuthed } from '../../store/auth'

import type { SpaceCard } from '@offhours/shared'

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.get<(SpaceCard & { favoritedAt: string })[]>('/favorites'),
  })
}

export function useFavoriteIds() {
  const isAuthed = useIsAuthed()
  return useQuery({
    queryKey: ['favorites', 'ids'],
    enabled: isAuthed,
    queryFn: () => api.get<string[]>('/favorites/ids'),
  })
}

export function useToggleFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (spaceId: string) =>
      api.post<{ favorited: boolean }>(`/favorites/${spaceId}/toggle`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}
