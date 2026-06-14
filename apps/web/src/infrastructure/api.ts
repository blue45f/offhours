import ky, { type Options } from 'ky'

import { useAuthStore } from '../store/auth'

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api'
const PREFIX = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`

// 토큰 갱신 전용 클라이언트 — 재시도/인터셉터 없이 단발 호출(재귀 방지).
const refreshClient = ky.create({
  prefix: PREFIX,
  credentials: 'include',
  timeout: 15_000,
  retry: 0,
})

let refreshing: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshing) return refreshing
  refreshing = (async () => {
    try {
      const data = await refreshClient
        .post('/auth/refresh', { json: {} })
        .json<{ accessToken: string | null; user: import('@offhours/shared').Me | null }>()
      useAuthStore.getState().setAuth(data.accessToken, data.user)
      return data.accessToken
    } catch {
      useAuthStore.getState().clear()
      return null
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

const client = ky.create({
  prefix: PREFIX,
  credentials: 'include',
  timeout: 15_000,
  // 자동 status 재시도는 끄고(빈 statusCodes), 401만 afterResponse 에서 토큰 갱신 후 1회 재요청.
  retry: { limit: 1, methods: ['get', 'post', 'put', 'patch', 'delete'], statusCodes: [] },
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const token = useAuthStore.getState().accessToken
        if (token) request.headers.set('Authorization', `Bearer ${token}`)
      },
    ],
    afterResponse: [
      async ({ request, response, retryCount }) => {
        if (response.status === 401 && retryCount === 0 && !request.url.includes('/auth/')) {
          const token = await refreshAccessToken()
          if (token) {
            const headers = new Headers(request.headers)
            headers.set('Authorization', `Bearer ${token}`)
            return ky.retry({ request: new Request(request, { headers }), code: 'TOKEN_REFRESHED' })
          }
        }
      },
    ],
  },
})

/** axios 시절 `{ params }` 호출부 호환 — ky 의 searchParams 로 변환한다. */
type ApiOptions = Omit<Options, 'method' | 'json' | 'searchParams'> & {
  params?: Record<string, string | number | boolean | null | undefined>
}

function toOptions(opts?: ApiOptions): Options {
  if (!opts) return {}
  const { params, ...rest } = opts
  if (!params) return rest
  const searchParams = Object.fromEntries(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, String(v)])
  )
  return { ...rest, searchParams }
}

async function toJson<T>(promise: ReturnType<typeof client.get>): Promise<T> {
  const res = await promise
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return text ? (JSON.parse(text) as T) : (undefined as T)
}

export const api = {
  get: <T>(url: string, options?: ApiOptions) => toJson<T>(client.get(url, toOptions(options))),
  post: <T>(url: string, body?: unknown, options?: ApiOptions) =>
    toJson<T>(client.post(url, { json: body, ...toOptions(options) })),
  patch: <T>(url: string, body?: unknown, options?: ApiOptions) =>
    toJson<T>(client.patch(url, { json: body, ...toOptions(options) })),
  put: <T>(url: string, body?: unknown, options?: ApiOptions) =>
    toJson<T>(client.put(url, { json: body, ...toOptions(options) })),
  delete: <T>(url: string, options?: ApiOptions) =>
    toJson<T>(client.delete(url, toOptions(options))),
}

export function getErrorMessage(err: unknown, fallback = '문제가 발생했어요'): string {
  // ky HTTPError 는 파싱된 응답 본문을 `data` 로 보관한다(NestJS message: string | string[]).
  const data = (err as { data?: { message?: string | string[] } } | null)?.data
  const msg = data?.message
  if (Array.isArray(msg)) return msg.join(', ')
  if (typeof msg === 'string') return msg
  if (err instanceof Error) return err.message || fallback
  return fallback
}
