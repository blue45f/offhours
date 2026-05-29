import { useQuery } from '@tanstack/react-query'
import type { SpaceAddon } from '@offhours/shared'

import { api } from '../../services/api'

export function useSpaceAddons(spaceId?: string) {
  return useQuery({
    queryKey: ['spaces', spaceId, 'addons'] as const,
    enabled: !!spaceId,
    queryFn: () => api.get<SpaceAddon[]>(`/spaces/${spaceId}/addons`),
    staleTime: 60_000,
  })
}
