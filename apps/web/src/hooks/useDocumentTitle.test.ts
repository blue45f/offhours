import { afterEach, describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'

import { useDocumentTitle } from './useDocumentTitle'

afterEach(() => {
  document.title = ''
})

describe('useDocumentTitle', () => {
  it('제목을 "<title> · Offhours" 로 설정', () => {
    renderHook(() => useDocumentTitle('서촌 한옥 마당'))
    expect(document.title).toBe('서촌 한옥 마당 · Offhours')
  })

  it('제목이 없으면 기본(마케팅) 타이틀', () => {
    renderHook(() => useDocumentTitle(undefined))
    expect(document.title).toContain('Offhours')
  })

  it('언마운트 시 기본 타이틀로 복원', () => {
    const { unmount } = renderHook(() => useDocumentTitle('상세'))
    expect(document.title).toBe('상세 · Offhours')
    unmount()
    expect(document.title).toContain('Offhours')
    expect(document.title).not.toBe('상세 · Offhours')
  })
})
