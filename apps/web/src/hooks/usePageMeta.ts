import { useEffect } from 'react'

const BASE = 'Offhours'
const DEFAULT_TITLE = `${BASE} · 비어 있던 그 시간, 가장 멋진 공간이 됩니다`
const DEFAULT_DESCRIPTION =
  '카페·바·레스토랑의 영업 외 시간을 파티·스몰웨딩·모임·팝업 공간으로. 호스트는 부가 수익, 게스트는 감성 통대관.'

interface PageMeta {
  /** "<title> · Offhours" 로 합쳐진다. 비우면 기본(마케팅) 타이틀. */
  title?: string
  /** meta description + og/twitter description 에 함께 반영. 비우면 기본 설명. */
  description?: string
}

/**
 * 라우트별 메타 태그(title · description · og/twitter description · og:title)를 설정한다.
 * SPA 는 정적 index.html 의 메타가 모든 라우트에 그대로 남으므로, 공간/컬렉션 상세 같은
 * 페이지가 자기 내용을 탭·북마크·공유 미리보기에 반영하도록 런타임에 덮어쓴다.
 * 언마운트 시 index.html 의 기본값으로 복원해(타이틀 미설정 페이지의 잔존 방지) 누수를 막는다.
 *
 * 의존성은 원시값(title/description)이라 React Compiler 가 안전하게 메모이즈한다.
 */
export function usePageMeta({ title, description }: PageMeta) {
  useEffect(() => {
    const fullTitle = title ? `${title} · ${BASE}` : DEFAULT_TITLE
    const desc = description?.trim() ? description.trim() : DEFAULT_DESCRIPTION

    document.title = fullTitle
    setMeta('name', 'description', desc)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', desc)
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', desc)

    return () => {
      document.title = DEFAULT_TITLE
      setMeta('name', 'description', DEFAULT_DESCRIPTION)
      setMeta('property', 'og:title', DEFAULT_TITLE)
      setMeta('property', 'og:description', DEFAULT_DESCRIPTION)
      setMeta('name', 'twitter:title', DEFAULT_TITLE)
      setMeta('name', 'twitter:description', DEFAULT_DESCRIPTION)
    }
  }, [title, description])
}

/** 해당 메타 태그를 찾아 content 를 갱신한다. 없으면 <head> 에 새로 만들어 SSR/정적 누락도 보강. */
function setMeta(attr: 'name' | 'property', key: string, content: string) {
  if (typeof document === 'undefined') return
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}
