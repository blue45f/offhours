import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'

import { CommandPalette } from './CommandPalette'

function LocationProbe() {
  const loc = useLocation()
  return <output data-testid="loc">{`${loc.pathname}${loc.search}`}</output>
}

function renderPalette() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <CommandPalette />
      <LocationProbe />
    </MemoryRouter>
  )
}

function openWithShortcut() {
  fireEvent.keyDown(window, { key: 'k', metaKey: true })
}

describe('CommandPalette', () => {
  it('⌘K 전까지는 닫혀 있다', () => {
    renderPalette()
    expect(screen.queryByRole('combobox', { name: '명령 팔레트 검색' })).toBeNull()
  })

  it('⌘K 로 열리고 공개 명령을 보여준다', () => {
    renderPalette()
    openWithShortcut()
    expect(screen.getByRole('combobox', { name: '명령 팔레트 검색' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /공간 둘러보기/ })).toBeInTheDocument()
  })

  it('검색어 입력 시 스마트 검색 액션을 최상단에 노출한다', () => {
    renderPalette()
    openWithShortcut()
    const input = screen.getByRole('combobox', { name: '명령 팔레트 검색' })
    fireEvent.change(input, { target: { value: '강남' } })
    expect(screen.getByRole('option', { name: /‘강남’ 공간 검색/ })).toBeInTheDocument()
  })

  it('스마트 검색 선택 시 /spaces?q= 로 이동한다', () => {
    renderPalette()
    openWithShortcut()
    const input = screen.getByRole('combobox', { name: '명령 팔레트 검색' })
    fireEvent.change(input, { target: { value: '강남' } })
    fireEvent.click(screen.getByRole('option', { name: /‘강남’ 공간 검색/ }))
    expect(screen.getByTestId('loc').textContent).toBe('/spaces?q=%EA%B0%95%EB%82%A8')
  })
})
