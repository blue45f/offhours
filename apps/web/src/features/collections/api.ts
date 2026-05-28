import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CollectionDetail,
  CollectionSummary,
  CreateCollectionInput,
  UpdateCollectionInput,
} from '@offhours/shared'

import { api } from '../../services/api'
import { useIsAuthed } from '../../store/auth'

export const collectionKeys = {
  mine: ['collections', 'mine'] as const,
  detail: (slug: string) => ['collections', 'slug', slug] as const,
}

export function useMyCollections() {
  const isAuthed = useIsAuthed()
  return useQuery({
    queryKey: collectionKeys.mine,
    enabled: isAuthed,
    queryFn: () => api.get<CollectionSummary[]>('/collections'),
    staleTime: 30_000,
  })
}

export function useCollectionBySlug(slug?: string) {
  return useQuery({
    queryKey: collectionKeys.detail(slug ?? ''),
    enabled: !!slug,
    queryFn: () => api.get<CollectionDetail>(`/collections/slug/${slug}`),
    staleTime: 30_000,
  })
}

export function useCreateCollection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCollectionInput) =>
      api.post<CollectionSummary>('/collections', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['collections'] }),
  })
}

export function useUpdateCollection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCollectionInput }) =>
      api.patch(`/collections/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['collections'] }),
  })
}

export function useDeleteCollection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/collections/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['collections'] }),
  })
}

export function useAddToCollection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      collectionId,
      spaceId,
      note,
    }: {
      collectionId: string
      spaceId: string
      note?: string
    }) => api.post(`/collections/${collectionId}/items`, { spaceId, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections'] })
      qc.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}

export function useRemoveFromCollection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ collectionId, spaceId }: { collectionId: string; spaceId: string }) =>
      api.delete(`/collections/${collectionId}/items/${spaceId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections'] })
      qc.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}
