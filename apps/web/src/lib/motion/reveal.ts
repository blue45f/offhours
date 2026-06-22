import { useReducedMotion, type Transition, type Variants } from 'motion/react'

/**
 * Offhours 모션 프리셋 — Quiet Luxury 한 곳에서 관리한다.
 * DESIGN.md §6: ~240ms, `cubic-bezier(0.2,0,0,1)`, 바운스/일래스틱 금지.
 * 진입은 "느린 날숨" — 한 점에서 시작해 차분히 자리를 잡는다(과장된 거리/스케일 없음).
 */

/** 시스템 표준 감속 커브(토큰 --easing-standard 와 동일). */
export const STANDARD_EASE = [0.2, 0, 0, 1] as const

const ENTER: Transition = { duration: 0.55, ease: STANDARD_EASE }

/**
 * 페이지 진입 시 한 번 재생되는 스태거 컨테이너.
 * 자식은 `riseChild` 를 쓰며, 리스트가 아니라 "히어로 한 호흡"을 위한 것이다.
 */
export const heroStagger: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.04 },
  },
}

/** 아래에서 차분히 올라오며 또렷해지는 진입(8px — 시스템 slideUp 과 동일 폭). */
export const riseChild: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: ENTER },
}

/**
 * 스크롤 진입 reveal — 한 번만, 뷰포트에 조금 걸쳐도 발화.
 * 콘텐츠는 reveal 과 무관하게 항상 보이는 게 기본값이어야 한다(헤드리스/숨김 탭에서도 빈 화면 금지):
 * 이 변형은 "이미 보이는 것"을 부드럽게 강조할 뿐, 가시성을 게이트하지 않는다.
 */
export const revealRise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: ENTER },
}

/** 리스트(그리드 카드·칩)용 스태거 — 총 시간 상한을 위해 per-item 지연은 짧게. */
export function listStagger(perItem = 0.05, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: perItem, delayChildren } },
  }
}

/** 스크롤 reveal 의 공통 viewport 설정(한 번, 살짝 일찍). */
export const revealViewport = { once: true, margin: '0px 0px -12% 0px' } as const

/**
 * reduced-motion 을 존중하는 reveal props 헬퍼.
 * reduce=true 면 진입 변형을 건너뛰고 처음부터 최종 상태로 렌더 → 깜빡임·이동 없음.
 */
export function useRevealProps(variants: Variants = revealRise) {
  const reduce = useReducedMotion()
  if (reduce) {
    return { initial: false as const, animate: 'show' as const, variants }
  }
  return {
    initial: 'hidden' as const,
    whileInView: 'show' as const,
    viewport: revealViewport,
    variants,
  }
}
