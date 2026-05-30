import { createElement, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('../../services/api', () => ({
  api: { post: vi.fn().mockResolvedValue({}) },
}))

import { useSignOut } from './api'

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: qc }, children)
}

describe('useSignOut', () => {
  it('로그아웃 시 React Query 캐시를 비운다 — 교차 사용자 잔여 데이터 노출 방지', async () => {
    const qc = new QueryClient()
    // 이전 사용자의 민감 데이터를 캐시에 심어둠
    qc.setQueryData(['favorites'], ['space-1'])
    qc.setQueryData(['reservations', 'mine'], [{ id: 'r1' }])
    qc.setQueryData(['me', 'corporate'], { creditBalanceKRW: 5_000_000 })

    const { result } = renderHook(() => useSignOut(), { wrapper: wrapper(qc) })
    await result.current.mutateAsync()

    expect(qc.getQueryData(['favorites'])).toBeUndefined()
    expect(qc.getQueryData(['reservations', 'mine'])).toBeUndefined()
    expect(qc.getQueryData(['me', 'corporate'])).toBeUndefined()
  })
})
