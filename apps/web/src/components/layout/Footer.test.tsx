import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { Footer } from './Footer'

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  )
}

describe('Footer 구조/접근성', () => {
  it('contentinfo 랜드마크로 노출되고 3개 링크 칼럼 제목이 있다', () => {
    renderFooter()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    for (const heading of ['서비스', '고객 지원', '정책']) {
      expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument()
    }
  })

  it('주요 링크가 모두 노출된다', () => {
    renderFooter()
    for (const label of [
      '공간 둘러보기',
      '호스트 되기',
      '서비스 소개',
      '수수료 안내',
      '도움말',
      '호스트 가이드',
      '게스트 가이드',
      '문의하기',
      '이용약관',
      '개인정보 처리방침',
      '취소·환불 정책',
      '안전·신뢰',
    ]) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    }
  })
})

describe('Footer 중간 브레이크포인트(640~1023) 레이아웃 가드', () => {
  it('링크 칼럼 그리드는 sm 3열 → md 4열 티어를 가진다 (640~767px 정책 칼럼 고아 방지)', () => {
    const { container } = renderFooter()
    const grid = container.querySelector('footer .grid')
    expect(grid).toHaveClass('grid-cols-2', 'sm:grid-cols-3', 'md:grid-cols-4')
    // 브랜드 셀은 sm 까지 전체 행 차지, md 부터 1칸
    expect(grid?.firstElementChild).toHaveClass('col-span-2', 'sm:col-span-3', 'md:col-span-1')
  })

  it('한국어 라벨/법적 고지는 단어 중간에서 줄바꿈되지 않는다 (break-keep)', () => {
    const { container } = renderFooter()
    expect(container.querySelector('footer .container-page')).toHaveClass('break-keep')
  })
})
