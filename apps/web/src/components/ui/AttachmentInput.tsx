import { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { ATTACHMENT_MAX_COUNT } from '@offhours/shared'

import { fileToAttachment } from '../../features/chat/attachments'
import { Dialog } from './Dialog'
import { cn } from '../../utils/cn'

interface AttachmentInputProps {
  value: string[]
  onChange: (next: string[]) => void
  /** 미리보기 썸네일 크기 — 채팅 컴포저는 sm, 후기 폼은 md */
  size?: 'sm' | 'md'
  className?: string
}

/**
 * 이미지 첨부 입력 — 파일 선택 → 1600px 리사이즈 → data-URL(≤2MB) 변환까지 책임진다.
 * 채팅 컴포저와 후기 작성 폼이 같은 정책(최대 3장)을 공유한다.
 */
export function AttachmentInput({ value, onChange, size = 'sm', className }: AttachmentInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const full = value.length >= ATTACHMENT_MAX_COUNT

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setBusy(true)
    try {
      const room = ATTACHMENT_MAX_COUNT - value.length
      const picked = Array.from(files).slice(0, room)
      if (files.length > room) {
        toast.error(`사진은 최대 ${ATTACHMENT_MAX_COUNT}장까지 첨부할 수 있어요`)
      }
      const converted: string[] = []
      for (const file of picked) {
        converted.push(await fileToAttachment(file))
      }
      if (converted.length > 0) onChange([...value, ...converted])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '이미지 처리에 실패했어요')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const thumbSize = size === 'sm' ? 'size-14' : 'size-20'

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {value.map((src, i) => (
        <span key={i} className={cn('relative shrink-0', thumbSize)}>
          <img
            src={src}
            alt={`첨부 ${i + 1}`}
            className="size-full rounded-[var(--radius-md)] object-cover hairline"
          />
          <button
            type="button"
            aria-label={`첨부 ${i + 1} 제거`}
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}
            className="absolute -right-1.5 -top-1.5 inline-flex size-5 items-center justify-center rounded-full bg-[var(--color-fg)] text-[var(--color-bg)] shadow-[var(--shadow-sm)]"
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={full || busy}
        aria-label="사진 첨부"
        title={full ? `최대 ${ATTACHMENT_MAX_COUNT}장` : '사진 첨부'}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] text-[var(--color-fg-muted)] transition-colors',
          'hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40',
          thumbSize
        )}
      >
        {busy ? (
          <span
            aria-hidden
            className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        ) : (
          <ImagePlus size={size === 'sm' ? 16 : 20} />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
    </div>
  )
}

interface AttachmentThumbsProps {
  attachments: string[]
  /** 썸네일 한 변 크기 클래스 (기본 size-20) */
  thumbClassName?: string
  className?: string
}

/** 첨부 이미지 표시 — 썸네일 그리드 + 클릭 시 라이트박스 확대 */
export function AttachmentThumbs({
  attachments,
  thumbClassName = 'size-20',
  className,
}: AttachmentThumbsProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  if (attachments.length === 0) return null
  return (
    <>
      <div className={cn('flex flex-wrap gap-1.5', className)}>
        {attachments.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpenIdx(i)}
            aria-label={`첨부 사진 ${i + 1} 크게 보기`}
            className={cn(
              'overflow-hidden rounded-[var(--radius-md)] hairline transition-opacity hover:opacity-90',
              thumbClassName
            )}
          >
            <img src={src} alt={`첨부 사진 ${i + 1}`} className="size-full object-cover" />
          </button>
        ))}
      </div>
      <Dialog
        open={openIdx !== null}
        onOpenChange={(o) => !o && setOpenIdx(null)}
        size="lg"
        title="첨부 사진"
      >
        {openIdx !== null && (
          <img
            src={attachments[openIdx]}
            alt={`첨부 사진 ${openIdx + 1} 원본`}
            className="max-h-[70vh] w-full rounded-[var(--radius-lg)] object-contain"
          />
        )}
      </Dialog>
    </>
  )
}
