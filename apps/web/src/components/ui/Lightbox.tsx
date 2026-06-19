import * as RDialog from '@radix-ui/react-dialog'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useCallback, useEffect } from 'react'

import { cn } from '../../utils/cn'

export interface LightboxPhoto {
  url: string
  alt?: string | null
}

interface LightboxProps {
  photos: LightboxPhoto[]
  /** 열려 있을 때 현재 인덱스. null 이면 닫힘. */
  index: number | null
  onIndexChange: (index: number | null) => void
  /** 접근성 라벨(스크린리더 전용 다이얼로그 제목). */
  label?: string
}

/**
 * 전체화면 이미지 라이트박스 — 갤러리 사진을 크게 본다.
 * 키보드: Esc 닫기 / ← → 이전·다음. 좌우 끝에서는 순환(wrap)한다.
 * Radix Dialog 로 포커스 트랩·스크롤 락·포커스 복귀를 그대로 가져온다.
 */
export function Lightbox({
  photos,
  index,
  onIndexChange,
  label = '사진 크게 보기',
}: LightboxProps) {
  const open = index != null
  const count = photos.length

  const go = useCallback(
    (delta: number) => {
      if (index == null || count === 0) return
      onIndexChange((index + delta + count) % count)
    },
    [index, count, onIndexChange]
  )

  // ← → 키로 사진 이동(Esc 닫기는 Radix 가 담당). 입력 중이 아닐 때만.
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        go(1)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        go(-1)
      }
    }
    globalThis.addEventListener('keydown', onKey)
    return () => globalThis.removeEventListener('keydown', onKey)
  }, [open, go])

  const current = index != null ? photos[index] : undefined

  return (
    <RDialog.Root open={open} onOpenChange={(o) => !o && onIndexChange(null)}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-black/85 backdrop-blur-sm data-[state=open]:animate-[fadeIn_var(--duration-base)_var(--easing-standard)]" />
        <RDialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 outline-none sm:p-8"
        >
          <RDialog.Title className="sr-only">{label}</RDialog.Title>

          {current && (
            <figure className="flex max-h-full max-w-full flex-col items-center gap-3">
              <img
                key={current.url}
                src={current.url}
                alt={current.alt ?? label}
                className="max-h-[82vh] max-w-full rounded-[var(--radius-lg)] object-contain shadow-[var(--shadow-modal)]"
              />
              {count > 1 && (
                <figcaption className="text-xs font-medium tabular-nums text-white/70">
                  {(index ?? 0) + 1} / {count}
                </figcaption>
              )}
            </figure>
          )}

          {count > 1 && (
            <>
              <LightboxNav side="prev" onClick={() => go(-1)} />
              <LightboxNav side="next" onClick={() => go(1)} />
            </>
          )}

          <RDialog.Close
            className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            aria-label="닫기"
          >
            <X size={20} />
          </RDialog.Close>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  )
}

function LightboxNav({ side, onClick }: { side: 'prev' | 'next'; onClick: () => void }) {
  const isPrev = side === 'prev'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPrev ? '이전 사진' : '다음 사진'}
      className={cn(
        'absolute top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full',
        'bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20',
        isPrev ? 'left-3 sm:left-6' : 'right-3 sm:right-6'
      )}
    >
      {isPrev ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
    </button>
  )
}
