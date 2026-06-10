import { useEffect } from 'react'

/**
 * 라우트별 JSON-LD 구조화 데이터(schema.org)를 <head> 에 주입한다.
 * 정적 index.html 의 WebSite·Organization 블록은 사이트 전역 정보만 담으므로, 공간 상세 같은
 * 페이지는 데이터 로드 후 자기 엔티티(EventVenue 등)를 런타임에 알린다 — SPA 여도 Google 은
 * JS 를 실행하므로 색인에 유효하다. 언마운트·데이터 변경 시 이전 스크립트를 제거해 잔존을 막는다.
 *
 * data 가 없으면(로딩 중) 아무것도 주입하지 않는다.
 * 의존성은 직렬화된 문자열(원시값)이라 React Compiler 가 안전하게 메모이즈한다.
 */
export function useJsonLd(data: Record<string, unknown> | null | undefined) {
  const json = data ? serialize(data) : null

  useEffect(() => {
    if (!json || typeof document === 'undefined') return
    const el = document.createElement('script')
    el.type = 'application/ld+json'
    el.textContent = json
    document.head.appendChild(el)
    return () => {
      el.remove()
    }
  }, [json])
}

/**
 * DOM 주입(textContent)이라 파싱 위험은 없지만, 문서가 HTML 로 재직렬화될 때(스냅샷·프리렌더)
 * 데이터 속 </script> 가 스크립트를 조기 종료시키지 않도록 < 를 유니코드 이스케이프로 치환한다.
 */
function serialize(data: Record<string, unknown>) {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
