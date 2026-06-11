import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowUpRight, CheckCircle2, LifeBuoy, Send } from 'lucide-react'
import {
  INQUIRY_CATEGORIES,
  InquiryCategoryHint,
  InquiryCategoryLabel,
  InquiryFormSchema,
  type InquiryCategory,
  type InquiryReceipt,
} from '@offhours/shared'

import { SUPPORT_FALLBACK_URL, useSubmitInquiry } from '../features/inquiry/api'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMe } from '../store/auth'
import { Button } from '../components/ui/Button'
import { Card, CardBody } from '../components/ui/Card'
import { Field, Input, Textarea } from '../components/ui/Input'
import { cn } from '../utils/cn'

type FieldErrors = Partial<Record<'category' | 'title' | 'body' | 'contactEmail', string>>

/**
 * 인앱 문의 폼 — 외부 지원 센터 리다이렉트를 대체한다. TermsDesk 공개 문의 API 로 접수하고,
 * 실패 시에만 외부 지원 센터를 폴백 링크로 안내한다.
 */
export default function ContactPage() {
  useDocumentTitle('문의하기')
  const me = useMe()
  const submit = useSubmitInquiry()
  const [category, setCategory] = useState<InquiryCategory>('contact')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [contactEmail, setContactEmail] = useState(me?.email ?? '')
  // 허니팟 — 사람 눈에 보이지 않는 입력. 봇이 채우면 서버가 조용히 버린다
  const [website, setWebsite] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [receipt, setReceipt] = useState<InquiryReceipt | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = InquiryFormSchema.safeParse({ category, title, body, contactEmail })
    if (!parsed.success) {
      const next: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors
        if (!next[key]) next[key] = issue.message
      }
      setErrors(next)
      return
    }
    setErrors({})
    try {
      const result = await submit.mutateAsync({ ...parsed.data, website })
      setReceipt(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '문의 접수에 실패했어요')
    }
  }

  if (receipt) {
    return (
      <div className="container-page max-w-xl py-12 md:py-20">
        <Card>
          <CardBody className="flex flex-col items-center py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <CheckCircle2 size={26} strokeWidth={1.75} />
            </span>
            <h1 className="mt-5 text-title font-semibold">문의가 접수됐어요</h1>
            <p className="mt-2 max-w-[40ch] text-sm leading-relaxed text-[var(--color-fg-muted)]">
              {InquiryCategoryLabel[category]} 문의로 등록됐어요.
              {contactEmail ? ' 답변은 남겨주신 이메일로 보내드릴게요.' : ''}
            </p>
            <dl className="mt-6 w-full max-w-xs space-y-1.5 rounded-[var(--radius-lg)] bg-[var(--color-bg-subtle)] p-4 text-left text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-fg-muted)]">접수 번호</dt>
                <dd className="font-mono">{receipt.id.slice(0, 8)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--color-fg-muted)]">상태</dt>
                <dd className="font-semibold text-[var(--color-primary)]">접수 완료</dd>
              </div>
            </dl>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setReceipt(null)
                  setTitle('')
                  setBody('')
                }}
              >
                추가 문의하기
              </Button>
              <Link to="/spaces">
                <Button>공간 둘러보기</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="container-page max-w-2xl py-8 md:py-12">
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <LifeBuoy size={20} className="text-[var(--color-primary)]" />
          <h1 className="text-headline serif">문의하기</h1>
        </div>
        <p className="text-sm leading-relaxed text-[var(--color-fg-muted)]">
          예약·결제·입점·오류 무엇이든 남겨주세요. 영업일 기준 1~2일 안에 답변드려요.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate>
        <Card>
          <CardBody className="space-y-5">
            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-[var(--color-fg)]">
                무엇을 도와드릴까요?
              </legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {INQUIRY_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={category === c}
                    onClick={() => setCategory(c)}
                    className={cn(
                      'rounded-[var(--radius-lg)] border px-3.5 py-2.5 text-left transition-colors',
                      category === c
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                    )}
                  >
                    <span
                      className={cn(
                        'block text-sm font-semibold',
                        category === c ? 'text-[var(--color-primary)]' : 'text-[var(--color-fg)]'
                      )}
                    >
                      {InquiryCategoryLabel[c]}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-[var(--color-fg-muted)]">
                      {InquiryCategoryHint[c]}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            <Field label="제목" required error={errors.title} helper={`${title.length} / 140`}>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={140}
                placeholder="문의 내용을 한 줄로 요약해주세요"
                error={!!errors.title}
              />
            </Field>

            <Field
              label="내용"
              required
              error={errors.body}
              helper={`${body.length} / 4000 · 10자 이상`}
            >
              <Textarea
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={4000}
                placeholder="상황을 자세히 적어주실수록 빠르게 도와드릴 수 있어요. 예약 코드가 있다면 함께 남겨주세요."
                error={!!errors.body}
              />
            </Field>

            <Field
              label="회신 받을 이메일 (선택)"
              error={errors.contactEmail}
              helper="비워두면 익명으로 접수돼요"
            >
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="you@example.com"
                error={!!errors.contactEmail}
              />
            </Field>

            {/* 허니팟 — 시각·스크린리더·포커스 어디에도 노출하지 않는다 */}
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
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <Button type="submit" loading={submit.isPending} leading={<Send size={14} />}>
                문의 보내기
              </Button>
            </div>
          </CardBody>
        </Card>
      </form>

      <p className="mt-6 text-center text-xs text-[var(--color-fg-subtle)]">
        폼이 동작하지 않나요?{' '}
        <a
          href={`${SUPPORT_FALLBACK_URL}?category=site-inquiry`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 font-medium text-[var(--color-fg-muted)] underline underline-offset-4 hover:text-[var(--color-fg)]"
        >
          외부 지원 센터에서 문의하기
          <ArrowUpRight size={11} />
        </a>
      </p>
    </div>
  )
}
