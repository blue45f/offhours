import { useMutation } from '@tanstack/react-query'
import type { Me, SignInInput, SignUpInput } from '@offhours/shared'

import { api } from '../../services/api'
import { useAuthStore } from '../../store/auth'

interface AuthResult {
  accessToken: string
  user: Me
}

export function useSignIn() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: (input: SignInInput) => api.post<AuthResult>('/auth/signin', input),
    onSuccess: (data) => setAuth(data.accessToken, data.user),
  })
}

export function useSignUp() {
  const setAuth = useAuthStore((s) => s.setAuth)
  return useMutation({
    mutationFn: (input: SignUpInput) => api.post<AuthResult>('/auth/signup', input),
    onSuccess: (data) => setAuth(data.accessToken, data.user),
  })
}

export function useSignOut() {
  const clear = useAuthStore((s) => s.clear)
  return useMutation({
    mutationFn: () => api.post('/auth/signout', {}),
    onSuccess: () => clear(),
    onError: () => clear(),
  })
}
