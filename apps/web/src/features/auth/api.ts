import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Me, SignInInput, SignUpInput } from '@offhours/shared'

import { api } from '../../services/api'
import { useAuthStore } from '../../store/auth'

interface AuthResult {
  accessToken: string
  user: Me
}

export function useSignIn() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SignInInput) => api.post<AuthResult>('/auth/signin', input),
    // 신원 전환 시 이전 사용자 캐시(찜·예약·법인 등)를 제거해 교차 사용자 노출 방지
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user)
      qc.clear()
    },
  })
}

export function useSignUp() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SignUpInput) => api.post<AuthResult>('/auth/signup', input),
    onSuccess: (data) => {
      setAuth(data.accessToken, data.user)
      qc.clear()
    },
  })
}

export function useSignOut() {
  const clear = useAuthStore((s) => s.clear)
  const qc = useQueryClient()
  // 로그아웃 시 인증 상태 + React Query 캐시를 함께 비워 다음 로그인 사용자에게 잔여 데이터 노출 방지
  const reset = () => {
    clear()
    qc.clear()
  }
  return useMutation({
    mutationFn: () => api.post('/auth/signout', {}),
    onSuccess: reset,
    onError: reset,
  })
}
