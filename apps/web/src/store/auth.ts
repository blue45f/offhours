import { create } from 'zustand'
import type { Me } from '@offhours/shared'

import { api } from '../services/api'

interface AuthState {
  accessToken: string | null
  user: Me | null
  hydrated: boolean
  setAuth: (accessToken: string | null, user: Me | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  hydrated: false,
  setAuth: (accessToken, user) => set({ accessToken, user, hydrated: true }),
  clear: () => set({ accessToken: null, user: null, hydrated: true }),
}))

export async function bootstrapAuth() {
  try {
    const res = await api.post<{ accessToken: string | null; user: Me | null }>('/auth/refresh', {})
    if (res.accessToken && res.user) {
      useAuthStore.getState().setAuth(res.accessToken, res.user)
    } else {
      useAuthStore.getState().clear()
    }
  } catch {
    useAuthStore.getState().clear()
  }
}

export const useIsAuthed = () => useAuthStore((s) => !!s.user)
export const useMe = () => useAuthStore((s) => s.user)
export const useAuthHydrated = () => useAuthStore((s) => s.hydrated)
export const useIsAdmin = () =>
  useAuthStore((s) => s.user?.role === 'ADMIN' || s.user?.role === 'SUPERADMIN')
export const useIsHost = () =>
  useAuthStore(
    (s) => s.user?.role === 'HOST' || s.user?.role === 'ADMIN' || s.user?.role === 'SUPERADMIN'
  )
