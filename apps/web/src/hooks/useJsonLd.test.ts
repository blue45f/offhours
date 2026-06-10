import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'

import { useJsonLd } from './useJsonLd'

function ldScripts() {
  return Array.from(
    document.head.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')
  )
}

beforeEach(() => {
  document.head.innerHTML = ''
})

afterEach(() => {
  document.head.innerHTML = ''
})

describe('useJsonLd', () => {
  it('데이터를 application/ld+json 스크립트로 <head> 에 주입', () => {
    renderHook(() =>
      useJsonLd({ '@context': 'https://schema.org', '@type': 'EventVenue', name: '서촌 한옥 마당' })
    )

    const scripts = ldScripts()
    expect(scripts).toHaveLength(1)
    expect(JSON.parse(scripts[0].textContent ?? '')).toEqual({
      '@context': 'https://schema.org',
      '@type': 'EventVenue',
      name: '서촌 한옥 마당',
    })
  })

  it('data 가 없으면(로딩 중) 아무것도 주입하지 않는다', () => {
    renderHook(() => useJsonLd(null))

    expect(ldScripts()).toHaveLength(0)
  })

  it('데이터가 바뀌면 이전 스크립트를 교체한다 (중복 누적 방지)', () => {
    const { rerender } = renderHook(({ name }) => useJsonLd({ '@type': 'EventVenue', name }), {
      initialProps: { name: '서촌 한옥 마당' },
    })
    rerender({ name: '을지로 루프탑 바' })

    const scripts = ldScripts()
    expect(scripts).toHaveLength(1)
    expect(scripts[0].textContent).toContain('을지로 루프탑 바')
  })

  it('언마운트 시 제거해 라우트 간 잔존을 막는다', () => {
    const { unmount } = renderHook(() => useJsonLd({ '@type': 'EventVenue' }))
    expect(ldScripts()).toHaveLength(1)

    unmount()
    expect(ldScripts()).toHaveLength(0)
  })

  it('재직렬화 대비 < 를 이스케이프하되 JSON 으로는 원본을 보존한다', () => {
    renderHook(() => useJsonLd({ name: '</script><img src=x>' }))

    const el = ldScripts()[0]
    expect(el.textContent).not.toContain('</script>')
    expect(JSON.parse(el.textContent ?? '').name).toBe('</script><img src=x>')
  })
})
