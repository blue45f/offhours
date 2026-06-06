import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'

import { usePageMeta } from './usePageMeta'

function metaContent(selector: string) {
  return document.head.querySelector<HTMLMetaElement>(selector)?.getAttribute('content')
}

beforeEach(() => {
  document.title = ''
  document.head.innerHTML = ''
})

afterEach(() => {
  document.head.innerHTML = ''
})

describe('usePageMeta', () => {
  it('title 과 description 을 og/twitter 까지 함께 설정', () => {
    renderHook(() => usePageMeta({ title: '서촌 한옥 마당', description: '60명 스몰웨딩' }))

    expect(document.title).toBe('서촌 한옥 마당 · Offhours')
    expect(metaContent('meta[name="description"]')).toBe('60명 스몰웨딩')
    expect(metaContent('meta[property="og:title"]')).toBe('서촌 한옥 마당 · Offhours')
    expect(metaContent('meta[property="og:description"]')).toBe('60명 스몰웨딩')
    expect(metaContent('meta[name="twitter:title"]')).toBe('서촌 한옥 마당 · Offhours')
    expect(metaContent('meta[name="twitter:description"]')).toBe('60명 스몰웨딩')
  })

  it('값이 없으면 기본(마케팅) 타이틀·설명으로 둔다', () => {
    renderHook(() => usePageMeta({}))

    expect(document.title).toContain('Offhours')
    expect(metaContent('meta[name="description"]')).toContain('영업 외 시간')
    expect(metaContent('meta[property="og:description"]')).toContain('영업 외 시간')
  })

  it('언마운트 시 기본값으로 복원해 라우트 간 잔존을 막는다', () => {
    const { unmount } = renderHook(() => usePageMeta({ title: '상세', description: '상세 설명' }))
    expect(document.title).toBe('상세 · Offhours')

    unmount()
    expect(document.title).not.toBe('상세 · Offhours')
    expect(document.title).toContain('Offhours')
    expect(metaContent('meta[property="og:description"]')).not.toBe('상세 설명')
  })
})
