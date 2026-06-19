import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import { type ReactNode } from 'react'

const EASE_STANDARD = [0.2, 0, 0, 1] as const

interface RevealProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  /** 진입 시 위로 올라오는 거리(px). 0 이면 페이드만. */
  y?: number
  /** 스태거용 지연(초). 한 리스트 안에서만 누적, 섹션 전반엔 쓰지 않는다. */
  delay?: number
  duration?: number
}

/**
 * 스크롤 진입 시 한 번 호흡하듯 떠오르는 절제된 리빌.
 * - 콘텐츠는 항상 DOM 에 존재하고 visibility 를 막지 않는다(JS 없거나 헤드리스에서도 보임).
 * - reduced-motion: transform 없이 즉시 표시(전정기관 자극 없음).
 * - 시스템 표준 240ms · cubic-bezier(0.2,0,0,1), 바운스 없음.
 */
export function Reveal({ children, y = 14, delay = 0, duration = 0.5, ...rest }: RevealProps) {
  const reduce = useReducedMotion()
  if (reduce) {
    // reduced-motion: transform 없이 즉시 표시(콘텐츠는 그대로 보임)
    return <motion.div {...rest}>{children}</motion.div>
  }
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration, delay, ease: EASE_STANDARD }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
