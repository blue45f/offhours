import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { HeroSearch } from './HeroSearch'

function renderHeroSearch() {
  return render(
    <MemoryRouter>
      <HeroSearch />
    </MemoryRouter>
  )
}

describe('HeroSearch 접근성', () => {
  it('search 랜드마크로 노출된다', () => {
    renderHeroSearch()
    expect(screen.getByRole('search', { name: '공간 검색' })).toBeInTheDocument()
  })

  it('자유 검색 입력에 접근 가능한 이름이 있다', () => {
    renderHeroSearch()
    // label htmlFor 연결 → accessible name "자유 검색"
    expect(screen.getByRole('textbox', { name: '자유 검색' })).toBeInTheDocument()
  })

  it('모드 토글이 aria-pressed 로 선택 상태를 노출한다', () => {
    renderHeroSearch()

    const smart = screen.getByRole('button', { name: /자유롭게 검색/ })
    const detail = screen.getByRole('button', { name: /상세 검색/ })

    // 기본은 smart 모드
    expect(smart).toHaveAttribute('aria-pressed', 'true')
    expect(detail).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(detail)
    expect(detail).toHaveAttribute('aria-pressed', 'true')
    expect(smart).toHaveAttribute('aria-pressed', 'false')
  })

  it('상세 검색 모드의 지역/용도/인원 필드에 접근 가능한 이름이 있다', () => {
    renderHeroSearch()

    fireEvent.click(screen.getByRole('button', { name: /상세 검색/ }))

    expect(screen.getByRole('combobox', { name: '지역' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: '용도' })).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: '인원' })).toBeInTheDocument()
  })

  it('파싱된 조건을 live region 으로 스크린리더에 알린다', () => {
    renderHeroSearch()

    const input = screen.getByRole('textbox', { name: '자유 검색' })
    fireEvent.change(input, { target: { value: '강남 카페 20명' } })

    // input 은 aria-describedby 로 live region 을 참조
    const describedBy = input.getAttribute('aria-describedby')
    expect(describedBy).toBeTruthy()

    const liveRegion = document.getElementById(describedBy!)
    expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    expect(liveRegion?.textContent).toContain('인식된 조건')
  })

  it('파싱 칩(시각적 표현)은 스크린리더에서 중복으로 읽히지 않는다', () => {
    const { container } = renderHeroSearch()

    fireEvent.change(screen.getByRole('textbox', { name: '자유 검색' }), {
      target: { value: '마포 야간' },
    })

    // 시각용 칩 묶음은 aria-hidden 으로 숨겨 live region 과 중복 낭독을 방지
    const hiddenChipGroup = container.querySelector('[aria-hidden="true"].flex.flex-wrap')
    expect(hiddenChipGroup).toBeTruthy()
    // 그 안에 칩이 실제로 렌더됐는지 확인
    expect(within(hiddenChipGroup as HTMLElement).queryAllByText(/.+/).length).toBeGreaterThan(0)
  })
})
