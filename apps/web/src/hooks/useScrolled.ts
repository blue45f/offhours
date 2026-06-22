import { useEffect, useState } from 'react'

/**
 * 페이지가 임계값(기본 8px)을 넘어 스크롤됐는지 여부.
 * passive 리스너 + rAF 스로틀로 스크롤 핸들러 비용을 최소화한다.
 * 스티키 헤더가 콘텐츠 위로 올라탈 때 그림자/높이를 바꾸는 데 쓴다.
 */
export function useScrolled(threshold = 8): boolean {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let frame = 0
    const read = () => {
      frame = 0
      setScrolled(window.scrollY > threshold)
    }
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [threshold])

  return scrolled
}
