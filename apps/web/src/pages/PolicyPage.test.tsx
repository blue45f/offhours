import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import PolicyPage from './PolicyPage'
import type { PolicySlug, PublicPolicy } from '../features/policies/api'

const policy: PublicPolicy = {
  orgName: 'Offhours',
  policySlug: 'terms-of-service',
  name: '이용약관',
  type: 'terms',
  locale: 'ko',
  versionLabel: 'v3',
  contentHash: '07be6b59f3404e41942095479e535fce28f28d1a4fe63552f000627e4eb853ca',
  body: '제1조 (목적)\n이 이용약관은 Offhours 서비스의 이용 조건을 정합니다.\n\n제2조 (서비스 범위)\n공간 검색과 예약을 지원합니다.',
  effectiveAt: '2026-06-08T00:00:00.000Z',
  publishedAt: '2026-06-08T00:00:00.000Z',
  changeSummary: 'TermsDesk 중앙 게시본으로 이전',
}

function stubFetch(impl: (...args: unknown[]) => Promise<unknown>) {
  const mock = vi.fn(impl)
  vi.stubGlobal('fetch', mock)
  return mock
}

function okResponse(data: unknown) {
  return { ok: true, status: 200, json: async () => data } as Response
}

function renderPage(slug: PolicySlug = 'terms-of-service') {
  const qc = new QueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/terms']}>
        <PolicyPage slug={slug} />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('PolicyPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('TermsDesk 공개 API 게시본을 조항 단위로 렌더한다', async () => {
    const fetchMock = stubFetch(async () => okResponse(policy))
    renderPage()

    expect(
      await screen.findByRole('heading', { level: 2, name: '제1조 (목적)' })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: '이용약관' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: '제2조 (서비스 범위)' })
    ).toBeInTheDocument()
    expect(screen.getByText('공간 검색과 예약을 지원합니다.')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith(
      'https://termsdesk.vercel.app/api/public/offhours/policies/terms-of-service',
      expect.objectContaining({ headers: { Accept: 'application/json' } })
    )
  })

  it('신뢰 표면(버전·해시 앞 12자·시행일)과 원문 검증 링크를 표기한다', async () => {
    stubFetch(async () => okResponse(policy))
    renderPage()

    expect(await screen.findByText('v3')).toBeInTheDocument()
    expect(screen.getByText('07be6b59f340')).toBeInTheDocument()
    expect(screen.getByText('2026년 6월 8일')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '원문에서 검증하기' })).toHaveAttribute(
      'href',
      'https://termsdesk.vercel.app/p/offhours/terms-of-service'
    )
  })

  it('로딩 중에는 스켈레톤과 정적 타이틀을 보여준다', () => {
    stubFetch(() => new Promise(() => {}))
    const { container } = renderPage()

    expect(screen.getByRole('heading', { level: 1, name: '이용약관' })).toBeInTheDocument()
    expect(container.querySelector('.skeleton')).toBeTruthy()
  })

  it('로드 실패 시 재시도 버튼과 TermsDesk 외부 링크 폴백 카드를 보여준다', async () => {
    stubFetch(async () => ({ ok: false, status: 503, json: async () => ({}) }) as Response)
    renderPage('privacy-policy')

    expect(
      await screen.findByText('문서를 불러오지 못했어요', undefined, { timeout: 4000 })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /다시 시도/ })).toBeInTheDocument()
    const external = screen.getByText(/TermsDesk에서 개인정보 처리방침 보기/).closest('a')
    expect(external).toHaveAttribute(
      'href',
      'https://termsdesk.vercel.app/p/offhours/privacy-policy'
    )
  })

  it('페이지 메타 타이틀을 설정한다', async () => {
    stubFetch(async () => okResponse({ ...policy, policySlug: 'refund-policy' }))
    renderPage('refund-policy')

    expect(await screen.findByText('v3')).toBeInTheDocument()
    expect(document.title).toBe('취소·환불 정책 · Offhours')
  })
})
