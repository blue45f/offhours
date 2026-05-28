import axios, { AxiosError, type AxiosRequestConfig } from 'axios'

import { useAuthStore } from '../store/auth'

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api'

const axiosClient = axios.create({
  baseURL: BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`,
  withCredentials: true,
  timeout: 15_000,
})

axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshing: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing
  refreshing = (async () => {
    try {
      const res = await axiosClient.post<{ accessToken: string | null; user: unknown }>(
        '/auth/refresh',
        {}
      )
      const token = (res.data as { accessToken: string | null }).accessToken
      const user = (res.data as { user: import('@offhours/shared').Me | null }).user
      useAuthStore.getState().setAuth(token, user)
      return token
    } catch {
      useAuthStore.getState().clear()
      return null
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

axiosClient.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const original = err.config as AxiosRequestConfig & { _retry?: boolean }
    if (err.response?.status === 401 && !original?._retry && !original?.url?.includes('/auth/')) {
      original._retry = true
      const newToken = await refreshAccessToken()
      if (newToken) {
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${newToken}`
        return axiosClient.request(original)
      }
    }
    return Promise.reject(err)
  }
)

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    axiosClient.get<T>(url, config).then((r) => r.data),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    axiosClient.post<T>(url, body, config).then((r) => r.data),
  patch: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    axiosClient.patch<T>(url, body, config).then((r) => r.data),
  put: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    axiosClient.put<T>(url, body, config).then((r) => r.data),
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    axiosClient.delete<T>(url, config).then((r) => r.data),
}

export function getErrorMessage(err: unknown, fallback = '문제가 발생했어요'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] } | undefined
    const msg = data?.message
    if (Array.isArray(msg)) return msg.join(', ')
    if (typeof msg === 'string') return msg
    return err.message || fallback
  }
  if (err instanceof Error) return err.message
  return fallback
}
