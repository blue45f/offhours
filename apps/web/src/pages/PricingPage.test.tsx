import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import PricingPage from './PricingPage'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/pricing']}>
      <PricingPage />
    </MemoryRouter>
  )
}

describe('PricingPage', () => {
  it('핵심 수수료 모델(호스트 12% · 게스트 무료)을 노출한다', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: /수수료는 단순하게/ })).toBeInTheDocument()

    const host = screen.getByRole('heading', { level: 3, name: '호스트' }).closest('div')!
    const guest = screen.getByRole('heading', { level: 3, name: '게스트' }).closest('div')!
    expect(host).toHaveTextContent('12%')
    expect(guest).toHaveTextContent('무료')
  })

  it('정산 예시가 12% 차감 금액과 일치한다', () => {
    renderPage()
    expect(screen.getByText('500,000원')).toBeInTheDocument()
    expect(screen.getByText('-60,000원')).toBeInTheDocument()
    expect(screen.getByText('440,000원')).toBeInTheDocument()
  })

  it('호스트 CTA 와 취소·환불 정책 링크가 올바른 경로를 가리킨다', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /호스트 시작하기/ })).toHaveAttribute('href', '/host')
    expect(screen.getByRole('link', { name: '취소·환불 정책' })).toHaveAttribute(
      'href',
      '/cancel-policy'
    )
  })

  it('페이지 메타 타이틀을 설정한다', () => {
    renderPage()
    expect(document.title).toBe('수수료 안내 · Offhours')
  })
})
