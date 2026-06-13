import { type ComponentPropsWithoutRef, type ReactNode } from 'react'
import * as RAccordion from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'

import { cn } from '../../utils/cn'

/**
 * Radix 기반 FAQ 아코디언. 디자인 시스템 토큰만 사용하며 페이지 단위 추가 컴포넌트로,
 * 기존 ui/ 프리미티브를 건드리지 않는다. 펼침 애니메이션은 전역 keyframes 없이
 * grid-template-rows 트랜지션(0fr→1fr)으로 처리해 reduced-motion 토큰 분기를 그대로 존중한다.
 */

type AccordionRootProps = ComponentPropsWithoutRef<typeof RAccordion.Root>

export function Accordion({ className, ...props }: AccordionRootProps) {
  return (
    <RAccordion.Root
      className={cn(
        'divide-y divide-[var(--color-border)] overflow-hidden rounded-[var(--radius-xl)] hairline bg-[var(--color-bg-elevated)]',
        className
      )}
      {...props}
    />
  )
}

interface AccordionItemProps {
  value: string
  question: ReactNode
  children: ReactNode
}

export function AccordionItem({ value, question, children }: AccordionItemProps) {
  return (
    <RAccordion.Item value={value} className="group">
      <RAccordion.Header className="m-0">
        <RAccordion.Trigger
          className={cn(
            'flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-6',
            'text-[0.9375rem] font-semibold text-[var(--color-fg)]',
            'transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-bg-subtle)]'
          )}
        >
          {question}
          <ChevronDown
            size={18}
            aria-hidden
            className="shrink-0 text-[var(--color-fg-subtle)] transition-transform duration-[var(--duration-base)] ease-[var(--easing-standard)] group-data-[state=open]:rotate-180"
          />
        </RAccordion.Trigger>
      </RAccordion.Header>
      <RAccordion.Content
        className={cn(
          'grid grid-rows-[0fr] transition-[grid-template-rows] duration-[var(--duration-base)] ease-[var(--easing-standard)]',
          'data-[state=open]:grid-rows-[1fr]'
        )}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 text-sm leading-relaxed text-[var(--color-fg-muted)] md:px-6">
            {children}
          </div>
        </div>
      </RAccordion.Content>
    </RAccordion.Item>
  )
}
