import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale/ko'
import { CheckCircle2, Inbox, LifeBuoy, RotateCcw, Send } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'

import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardBody } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Field, Input, Textarea } from '../components/ui/Input'
import { Skeleton } from '../components/ui/Skeleton'
import {
  INQUIRY_CATEGORIES,
  INQUIRY_CATEGORY_HINTS,
  INQUIRY_CATEGORY_LABELS,
  INQUIRY_STATUS_LABELS,
  listInquiries,
  submitInquiry,
  type Inquiry,
  type InquiryCategory,
  type InquiryStatus,
} from '../domains/inquiry/deskPlatformApi'
import { usePageMeta } from '../hooks/usePageMeta'
import { useMe } from '../store/auth'
import { cn } from '../utils/cn'

const TITLE_MAX = 120
const BODY_MAX = 4000
const NAME_MAX = 80
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 상태 뱃지 톤 — 진행도에 따라 Badge tone 매핑. */
const STATUS_TONE: Record<InquiryStatus, 'info' | 'warning' | 'success' | 'neutral'> = {
  new: 'info',
  in_progress: 'warning',
  resolved: 'success',
  closed: 'neutral',
}

function StatusBadge({ status }: { status: InquiryStatus }) {
  return (
    <Badge tone={STATUS_TONE[status] ?? 'neutral'} dot>
      {INQUIRY_STATUS_LABELS[status] ?? status}
    </Badge>
  )
}

/** ISO 날짜를 한국어 상대 표기로(date-fns + locale/ko). 파싱 실패 시 빈 문자열. */
function shortRelativeDate(iso: string): string {
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return ''
  return formatDistanceToNow(then, { addSuffix: true, locale: ko })
}

function InquiryCard({ inquiry }: { inquiry: Inquiry }) {
  return (
    <Card className="h-full">
      <CardBody className="flex h-full flex-col gap-2.5 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary">
            {INQUIRY_CATEGORY_LABELS[inquiry.category] ?? inquiry.category}
          </Badge>
          <StatusBadge status={inquiry.status} />
          <span className="ml-auto text-xs text-[var(--color-fg-subtle)]">
            {shortRelativeDate(inquiry.createdAt)}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-[var(--color-fg)]">{inquiry.title}</h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-[var(--color-fg-muted)]">
          {inquiry.body}
        </p>
        <p className="mt-auto pt-1 text-xs text-[var(--color-fg-subtle)]">
          {inquiry.authorName?.trim() || '익명'}
        </p>
      </CardBody>
    </Card>
  )
}

type BoardState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; items: Inquiry[] }

function InquiryBoard() {
  const [state, setState] = useState<BoardState>({ phase: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)

  // 목록 조회. set-state-in-effect 를 피하기 위해 상태 변경은 모두 비동기 콜백에서만 한다.
  useEffect(() => {
    const controller = new AbortController()
    listInquiries(20, 0)
      .then((list) => {
        if (controller.signal.aborted) return
        setState({ phase: 'ready', items: list.items })
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return
        setState({
          phase: 'error',
          message: cause instanceof Error ? cause.message : '문의 목록을 불러오지 못했어요.',
        })
      })
    return () => controller.abort()
  }, [reloadKey])

  const loading = state.phase === 'loading'
  const reload = () => {
    setState({ phase: 'loading' })
    setReloadKey((value) => value + 1)
  }

  return (
    <section className="space-y-4" aria-labelledby="support-board-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="support-board-heading" className="text-title font-semibold text-[var(--color-fg)]">
          최근 문의
        </h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={reload}
          disabled={loading}
          leading={<RotateCcw size={14} aria-hidden />}
        >
          새로고침
        </Button>
      </div>

      <div aria-live="polite" aria-busy={loading}>
        {state.phase === 'loading' ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3].map((key) => (
              <li key={key}>
                <Skeleton className="h-32 w-full rounded-[var(--radius-xl)]" />
              </li>
            ))}
          </ul>
        ) : state.phase === 'error' ? (
          <Card className="border-[var(--color-error)]">
            <CardBody className="flex flex-wrap items-center justify-between gap-3 p-5">
              <p className="text-sm font-medium text-[var(--color-error)]">{state.message}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={reload}
                leading={<RotateCcw size={14} aria-hidden />}
              >
                다시 시도
              </Button>
            </CardBody>
          </Card>
        ) : state.items.length === 0 ? (
          <EmptyState
            icon={<Inbox size={24} strokeWidth={1.5} />}
            title="아직 등록된 문의가 없어요"
            description="첫 문의를 남겨주세요. 등록된 문의는 이 게시판에 공개로 표시됩니다."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {state.items.map((inquiry) => (
              <li key={inquiry.id}>
                <InquiryCard inquiry={inquiry} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

/**
 * SupportPage — desk-platform 공개 문의 게시판(/support).
 * ──────────────────────────────────────────────────────────────────────────
 * 카테고리 선택 → 제목/내용(+선택 이름/이메일) → 허니팟 hidden `website` 로 등록(POST)하고,
 * 하단에 공개 게시판 목록(GET)을 상태 뱃지와 함께 노출한다. 전화·이메일 연락 수단은 두지 않고
 * 모든 문의를 이 내부 게시판으로 통합한다. 계약: desk-platform/docs/INQUIRY_INTEGRATION.md.
 */
export default function SupportPage() {
  usePageMeta({
    title: '문의하기',
    description: '제휴·버그·의견·이용 문의를 남겨주세요. 접수된 문의는 공개 게시판에 표시됩니다.',
  })
  const me = useMe()
  const fieldId = useId()
  const headingRef = useRef<HTMLHeadingElement>(null)

  const [category, setCategory] = useState<InquiryCategory>('usage')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [contactEmail, setContactEmail] = useState(me?.email ?? '')
  const [website, setWebsite] = useState('') // 허니팟 — 사람은 채우지 않는다.
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  // 새 문의를 등록하면 게시판을 다시 불러오기 위한 키.
  const [boardKey, setBoardKey] = useState(0)

  // 라우트 진입 시 페이지 제목으로 포커스를 옮긴다(스크린리더 컨텍스트 + 키보드 시작점).
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  const validate = (): string | null => {
    if (!title.trim()) return '제목을 입력해주세요.'
    if (title.trim().length > TITLE_MAX) return `제목은 ${TITLE_MAX}자 이하로 입력해주세요.`
    if (!body.trim()) return '내용을 입력해주세요.'
    if (body.trim().length > BODY_MAX) return `내용은 ${BODY_MAX}자 이하로 입력해주세요.`
    if (authorName.trim().length > NAME_MAX) return `이름은 ${NAME_MAX}자 이하로 입력해주세요.`
    if (contactEmail.trim() && !EMAIL_RE.test(contactEmail.trim())) {
      return '올바른 이메일 형식을 입력해주세요.'
    }
    return null
  }

  const resetForm = () => {
    setTitle('')
    setBody('')
    setAuthorName('')
    setContactEmail(me?.email ?? '')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitted(false)

    // 허니팟이 채워졌으면 봇으로 간주하고 조용히 성공 처리한다(서버 호출 없이).
    if (website.trim()) {
      setSubmitted(true)
      resetForm()
      return
    }

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    try {
      await submitInquiry({
        category,
        title: title.trim(),
        body: body.trim(),
        authorName: authorName.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
      })
      setSubmitted(true)
      resetForm()
      setBoardKey((value) => value + 1)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '문의 등록에 실패했어요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container-page max-w-3xl py-8 md:py-12">
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <LifeBuoy size={20} className="text-[var(--color-primary)]" aria-hidden />
          <h1 ref={headingRef} tabIndex={-1} className="text-headline serif outline-none">
            문의하기
          </h1>
        </div>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-fg-muted)]">
          제휴·버그·의견·이용 문의를 남겨주세요. 접수된 문의는 아래 게시판에 공개로 표시되며,
          운영자가 확인 후 상태를 업데이트합니다. 전화·이메일 대신 이 게시판으로 문의를 통합했어요.
        </p>
      </div>

      {submitted ? (
        <Card>
          <CardBody className="flex flex-col items-center py-12 text-center" role="status">
            <span className="flex size-14 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <CheckCircle2 size={26} strokeWidth={1.75} aria-hidden />
            </span>
            <h2 className="mt-5 text-title font-semibold">문의가 접수됐어요</h2>
            <p className="mt-2 max-w-[42ch] text-sm leading-relaxed text-[var(--color-fg-muted)]">
              아래 게시판에서 등록된 문의를 확인할 수 있어요. 운영자가 확인 후 상태를
              업데이트합니다.
            </p>
            <div className="mt-8">
              <Button variant="secondary" onClick={() => setSubmitted(false)}>
                추가 문의하기
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <Card>
            <CardBody className="space-y-5">
              <fieldset>
                <legend className="mb-2 block text-sm font-medium text-[var(--color-fg)]">
                  무엇을 도와드릴까요?
                </legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {INQUIRY_CATEGORIES.map((value) => {
                    const selected = value === category
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setCategory(value)}
                        className={cn(
                          'rounded-[var(--radius-lg)] border px-3.5 py-2.5 text-left transition-colors',
                          selected
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                            : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                        )}
                      >
                        <span
                          className={cn(
                            'block text-sm font-semibold',
                            selected ? 'text-[var(--color-primary)]' : 'text-[var(--color-fg)]'
                          )}
                        >
                          {INQUIRY_CATEGORY_LABELS[value]}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-[var(--color-fg-muted)]">
                          {INQUIRY_CATEGORY_HINTS[value]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <Field label="제목" required helper={`${title.length} / ${TITLE_MAX}`}>
                <Input
                  id={`${fieldId}-title`}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={TITLE_MAX}
                  placeholder="문의 내용을 한 줄로 요약해주세요"
                />
              </Field>

              <Field label="내용" required helper={`${body.length} / ${BODY_MAX}`}>
                <Textarea
                  id={`${fieldId}-body`}
                  rows={6}
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  maxLength={BODY_MAX}
                  placeholder="상황을 자세히 적어주실수록 빠르게 도와드릴 수 있어요. 버그 신고라면 재현 방법과 환경을 함께 남겨주세요."
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="이름 (선택)" helper="게시판에 표시될 이름">
                  <Input
                    id={`${fieldId}-name`}
                    value={authorName}
                    onChange={(event) => setAuthorName(event.target.value)}
                    maxLength={NAME_MAX}
                    autoComplete="name"
                    placeholder="비워두면 익명으로 표시돼요"
                  />
                </Field>
                <Field label="이메일 (선택)" helper="답변 받을 이메일 (비공개)">
                  <Input
                    id={`${fieldId}-email`}
                    type="email"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </Field>
              </div>

              {/* 허니팟 — 시각·스크린리더·포커스 어디에도 노출하지 않는다. 봇이 채우면 무음 처리. */}
              <div
                aria-hidden="true"
                className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
              >
                <label>
                  웹사이트 (비워두세요)
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                  />
                </label>
              </div>

              {/* 검증·서버 에러는 aria-live 로 announce. */}
              <p role="alert" aria-live="assertive" className="min-h-0">
                {error ? (
                  <span className="block rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--color-error)_12%,transparent)] px-3 py-2 text-xs font-medium text-[var(--color-error)]">
                    {error}
                  </span>
                ) : null}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-[var(--color-fg-subtle)]">
                  이메일은 비공개로 운영자만 확인합니다.
                </span>
                <Button type="submit" loading={submitting} leading={<Send size={14} />}>
                  문의 접수
                </Button>
              </div>
            </CardBody>
          </Card>
        </form>
      )}

      <div className="mt-12 mb-4 flex items-center gap-2 border-t border-[var(--color-border)] pt-6 text-xs font-semibold text-[var(--color-fg-subtle)]">
        <Inbox size={14} aria-hidden />
        공개 게시판
      </div>
      <InquiryBoard key={boardKey} />
    </div>
  )
}
