/**
 * ModerationDesk — 단일 파일 벤더링 컴포넌트 (의존성: react 만).
 * ──────────────────────────────────────────────────────────────────────────
 * npm publish 가 막힌 동안 호스트 앱에 그대로 복붙해서 쓰는 버전입니다.
 * 워크스페이스 의존(@moderationdesk/sdk·shared) 0 — 필요한 타입·클라이언트를 인라인.
 * 다른 DeskCloud 위젯(survey/review/community/notify…)과 동일한 단일 파일 컨벤션입니다.
 *
 * 역할: **공개·범용 신고/제보 진입점**. 어떤 콘텐츠(공간·후기·게시글·메시지…)든
 * "신고하기" 한 번으로 ModerationDesk 의 모더레이션 큐에 접수합니다.
 * offhours 의 어드민 신고 관리 화면(AdminReportsPage)은 그대로 둡니다 — 이 위젯은
 * 어드민 큐를 대체하지 않고, 앱 전역에 없던 *사용자측* 신고 동작을 추가합니다.
 *
 * 사용:
 *   import { ReportButton } from '@components/deskcloud/moderation/ReportWidget'
 *   <ReportButton subjectType="space" subjectId="sp_42" subjectUrl={location.href}
 *     publishableKey="pk_demo" endpoint={import.meta.env.VITE_MODERATIONDESK_URL} />
 *
 * 백엔드 계약(publishable 키 · x-pk 헤더 + Origin):
 *   POST {endpoint}/api/reports
 *     body { subjectType, subjectId, reason, details?, reporterId?, subjectUrl? }
 *     → { id, status, createdAt }
 *
 * 접근성/디자인: 포커스 트랩 · Esc · 바깥 클릭 닫기 · focus-visible · prefers-reduced-motion ·
 * 대비 ≥4.5:1 · 그라디언트 텍스트/글래스모피즘/사이드스트라이프 없음 · 외부 CSS 프레임워크 0.
 * ──────────────────────────────────────────────────────────────────────────
 */
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from 'react'

/* ============================ 공유 계약(인라인) ============================ */

const DETAILS_MAX = 1000

interface ReportReasonOption {
  value: string
  label: string
}

/** 범용 신고 사유. 서버는 자유 문자열을 허용하므로 호스트가 재정의 가능. */
const DEFAULT_REASONS: readonly ReportReasonOption[] = [
  { value: 'spam', label: '스팸·광고' },
  { value: 'inappropriate', label: '부적절한 내용' },
  { value: 'harassment', label: '괴롭힘·혐오' },
  { value: 'scam', label: '사기·허위 정보' },
  { value: 'illegal', label: '불법·위험' },
  { value: 'other', label: '기타' },
]

interface ReportReceiptDto {
  id: string
  status: string
  createdAt: string
}

interface SubmitReportInput {
  subjectType: string
  subjectId: string
  reason: string
  details?: string
  reporterId?: string
  subjectUrl?: string
  meta?: { pageUrl?: string; referrer?: string }
}

/* ============================ 클라이언트(인라인) ============================ */

class ModerationDeskError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message)
    this.name = 'ModerationDeskError'
  }
}

function parseJson(text: string): unknown {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function createClient(opts: { publishableKey: string; endpoint: string; fetch?: typeof fetch }) {
  const base = opts.endpoint.replace(/\/+$/, '')
  const doFetch = opts.fetch ?? globalThis.fetch
  return {
    async submitReport(input: SubmitReportInput, signal?: AbortSignal): Promise<ReportReceiptDto> {
      const res = await doFetch(`${base}/api/reports`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'x-pk': opts.publishableKey,
        },
        body: JSON.stringify(input),
        signal,
      })
      const text = await res.text()
      const json = parseJson(text)
      if (!res.ok) {
        const rec = (json ?? {}) as Record<string, unknown>
        const raw = rec.message ?? rec.error ?? `요청 실패 (${res.status})`
        throw new ModerationDeskError(Array.isArray(raw) ? raw.join(', ') : String(raw), res.status)
      }
      return json as ReportReceiptDto
    },
  }
}

/* ================================ 스타일 ================================ */

const STYLE_ID = 'moderationdesk-widget-styles'
const ACCENT = '#a15e40'
const ACCENT_INK = '#ffffff'

const CSS = `
.md-root, .md-root * { box-sizing: border-box; }
.md-root {
  --md-accent:${ACCENT}; --md-accent-ink:${ACCENT_INK};
  --md-ink:#1a1814; --md-ink-soft:#4d4738; --md-muted:#67604f;
  --md-surface:#fff; --md-surface-2:#f1eee7; --md-border:#e5e0d5; --md-border-strong:#c8c1b3;
  --md-danger:#b33a3a; --md-success:#2f8f5e;
  --md-radius:14px; --md-radius-sm:9px;
  --md-shadow:0 1px 2px rgba(26,24,20,.06),0 18px 48px -12px rgba(26,24,20,.28);
  --md-ease:cubic-bezier(.22,1,.36,1);
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; color:var(--md-ink); line-height:1.5;
}
.md-trigger{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--md-border);
  background:var(--md-surface);color:var(--md-muted);border-radius:999px;padding:6px 12px;
  font:inherit;font-size:13px;font-weight:600;cursor:pointer;
  transition:border-color .14s var(--md-ease),color .14s var(--md-ease),background .14s var(--md-ease);}
.md-trigger:hover{border-color:var(--md-border-strong);color:var(--md-ink-soft);background:var(--md-surface-2);}
.md-trigger svg{width:15px;height:15px;display:block;}
.md-backdrop{position:fixed;inset:0;z-index:2147482600;background:rgba(26,24,20,.48);
  display:flex;align-items:center;justify-content:center;padding:20px;animation:md-fade .16s var(--md-ease);}
.md-dialog{position:relative;z-index:2147482601;width:min(440px,calc(100vw - 32px));
  max-height:min(640px,calc(100vh - 40px));display:flex;flex-direction:column;background:var(--md-surface);
  border-radius:var(--md-radius);box-shadow:var(--md-shadow);overflow:hidden;animation:md-pop .2s var(--md-ease);}
@media (max-width:520px){.md-backdrop{padding:0;align-items:flex-end;}
  .md-dialog{width:100vw;max-height:92vh;border-radius:18px 18px 0 0;animation:md-sheet .24s var(--md-ease);}}
.md-header{display:flex;align-items:flex-start;gap:12px;padding:18px 20px 14px;border-bottom:1px solid var(--md-border);}
.md-header-text{flex:1;min-width:0;}
.md-title{margin:0;font-size:16px;font-weight:700;letter-spacing:-.01em;text-wrap:balance;}
.md-intro{margin:5px 0 0;font-size:13px;color:var(--md-ink-soft);}
.md-close{flex:none;width:32px;height:32px;display:inline-flex;align-items:center;justify-content:center;
  border:0;border-radius:8px;background:transparent;color:var(--md-muted);cursor:pointer;
  transition:background .14s var(--md-ease),color .14s var(--md-ease);}
.md-close:hover{background:var(--md-surface-2);color:var(--md-ink);} .md-close svg{width:18px;height:18px;}
.md-body{padding:16px 20px;overflow-y:auto;-webkit-overflow-scrolling:touch;}
.md-field{margin:0 0 16px;}
.md-label{display:block;font-size:13px;font-weight:600;margin-bottom:8px;color:var(--md-ink);}
.md-req{color:var(--md-danger);margin-left:2px;}
.md-reasons{display:flex;flex-direction:column;gap:8px;}
.md-reason{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--md-border);
  border-radius:var(--md-radius-sm);cursor:pointer;font-size:14px;
  transition:border-color .12s var(--md-ease),background .12s var(--md-ease);}
.md-reason:hover{border-color:var(--md-border-strong);background:var(--md-surface-2);}
.md-reason.md-on{border-color:var(--md-accent);background:color-mix(in srgb,var(--md-accent) 8%,var(--md-surface));}
.md-reason input{accent-color:var(--md-accent);width:17px;height:17px;margin:0;flex:none;}
.md-reason span{flex:1;}
.md-textarea{width:100%;border:1px solid var(--md-border);border-radius:var(--md-radius-sm);
  padding:10px 12px;font:inherit;font-size:14px;color:var(--md-ink);background:var(--md-surface);
  resize:vertical;min-height:84px;line-height:1.5;transition:border-color .12s var(--md-ease);}
.md-textarea::placeholder{color:var(--md-muted);}
.md-textarea:hover{border-color:var(--md-border-strong);}
.md-count{margin-top:4px;font-size:11px;color:var(--md-muted);text-align:right;}
.md-form-error{margin:0 0 14px;padding:10px 12px;
  border:1px solid color-mix(in srgb,var(--md-danger) 35%,var(--md-border));
  background:color-mix(in srgb,var(--md-danger) 8%,var(--md-surface));border-radius:var(--md-radius-sm);
  font-size:13px;color:var(--md-danger);}
.md-footer{padding:14px 20px;border-top:1px solid var(--md-border);display:flex;align-items:center;gap:10px;}
.md-footer-spacer{flex:1;}
.md-brand{font-size:11px;color:var(--md-muted);}
.md-btn{appearance:none;border:1px solid transparent;border-radius:var(--md-radius-sm);padding:10px 18px;
  font:inherit;font-weight:600;font-size:14px;cursor:pointer;
  transition:filter .14s var(--md-ease),background .14s var(--md-ease),border-color .14s var(--md-ease);}
.md-btn-primary{background:var(--md-accent);color:var(--md-accent-ink);}
.md-btn-primary:hover:not(:disabled){filter:brightness(1.06);}
.md-btn-ghost{background:transparent;color:var(--md-ink-soft);border-color:var(--md-border);}
.md-btn-ghost:hover:not(:disabled){background:var(--md-surface-2);}
.md-btn:disabled{opacity:.55;cursor:not-allowed;}
.md-state{padding:36px 24px;text-align:center;}
.md-state-icon{width:52px;height:52px;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;border-radius:50%;}
.md-state-icon.md-ok{background:color-mix(in srgb,var(--md-success) 12%,var(--md-surface));color:var(--md-success);}
.md-state-icon svg{width:28px;height:28px;}
.md-state-title{margin:0;font-size:16px;font-weight:700;}
.md-state-text{margin:8px 0 0;font-size:13px;color:var(--md-ink-soft);}
.md-root :focus{outline:none;}
.md-root :focus-visible{outline:2px solid var(--md-accent);outline-offset:2px;border-radius:6px;}
.md-reason:focus-within,.md-textarea:focus-visible{outline:2px solid var(--md-accent);outline-offset:1px;}
@keyframes md-fade{from{opacity:0}to{opacity:1}}
@keyframes md-pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
@keyframes md-sheet{from{transform:translateY(100%)}to{transform:none}}
@media (prefers-reduced-motion:reduce){
  .md-root *,.md-backdrop,.md-dialog{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;}
}
`

function ensureStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = CSS
  document.head.appendChild(el)
}

/* ================================ 아이콘 ================================ */

const FlagIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M5 21V4m0 0 1.2-.4a8 8 0 0 1 6 .5 8 8 0 0 0 6 .5L19 4v10l-.8.3a8 8 0 0 1-6-.5 8 8 0 0 0-6-.5L5 14"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
const CloseIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)
const CheckIcon = (): ReactElement => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="m5 13 4 4L19 7"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/* ============================== 위젯 본체 ============================== */

const FOCUSABLE =
  'a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),[tabindex]:not([tabindex="-1"])'

export interface ReportButtonProps {
  /** 신고 대상 종류(space·review·post·message…). */
  subjectType: string
  /** 신고 대상 식별자. */
  subjectId: string
  publishableKey: string
  endpoint: string
  /** 신고 대상 URL(미지정 시 현재 페이지). */
  subjectUrl?: string
  /** 로그인 사용자 식별자(선택). */
  reporterId?: string
  /** 트리거 버튼 라벨(기본 "신고"). */
  label?: string
  /** 사유 옵션 재정의(기본 범용 6종). */
  reasons?: readonly ReportReasonOption[]
  accent?: string
  accentInk?: string
  fetch?: typeof fetch
  onSubmitted?: (receipt: ReportReceiptDto) => void
}

type Phase = 'idle' | 'submitting' | 'success'

export function ReportButton(props: ReportButtonProps): ReactElement {
  const {
    subjectType,
    subjectId,
    publishableKey,
    endpoint,
    subjectUrl,
    reporterId,
    label = '신고',
    reasons = DEFAULT_REASONS,
    accent = ACCENT,
    accentInk = ACCENT_INK,
    fetch: customFetch,
    onSubmitted,
  } = props

  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string>('')
  const [details, setDetails] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [formError, setFormError] = useState<string | null>(null)

  const titleId = useId()
  const introId = useId()
  const reasonName = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    ensureStyles()
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    triggerRef.current?.focus()
    if (phase === 'success') {
      setReason('')
      setDetails('')
      setPhase('idle')
    }
  }, [phase])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
        return
      }
      if (e.key !== 'Tab') return
      const root = dialogRef.current
      if (!root) return
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null || n === document.activeElement
      )
      if (nodes.length === 0) return
      const first = nodes[0]!
      const last = nodes[nodes.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, close])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    }, 20)
    return () => window.clearTimeout(t)
  }, [open, phase])

  const submit = useCallback(() => {
    if (!reason) {
      setFormError('신고 사유를 선택해 주세요.')
      return
    }
    setPhase('submitting')
    setFormError(null)
    const client = createClient({ publishableKey, endpoint, fetch: customFetch })
    client
      .submitReport({
        subjectType,
        subjectId,
        reason,
        details: details.trim() || undefined,
        reporterId,
        subjectUrl: subjectUrl ?? (typeof location !== 'undefined' ? location.href : undefined),
        meta: {
          pageUrl: typeof location !== 'undefined' ? location.href : undefined,
          referrer:
            typeof document !== 'undefined' && document.referrer ? document.referrer : undefined,
        },
      })
      .then((receipt) => {
        setPhase('success')
        onSubmitted?.(receipt)
      })
      .catch((e: unknown) => {
        setPhase('idle')
        setFormError(
          e instanceof Error ? e.message : '접수에 실패했어요. 잠시 후 다시 시도해 주세요.'
        )
      })
  }, [
    reason,
    details,
    publishableKey,
    endpoint,
    customFetch,
    subjectType,
    subjectId,
    reporterId,
    subjectUrl,
    onSubmitted,
  ])

  const rootStyle: CSSProperties = {
    ['--md-accent' as string]: accent,
    ['--md-accent-ink' as string]: accentInk,
  }

  return (
    <span className="md-root" style={rootStyle}>
      <button
        ref={triggerRef}
        type="button"
        className="md-trigger"
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true)
          setFormError(null)
        }}
      >
        <FlagIcon />
        {label}
      </button>

      {open ? (
        // 배경 클릭으로 닫기(scrim). 키보드 동치는 document 레벨 Escape 핸들러가 제공.
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
          className="md-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close()
          }}
        >
          <div
            ref={dialogRef}
            className="md-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={phase === 'success' ? undefined : introId}
          >
            {phase === 'success' ? (
              <div className="md-state" role="status">
                <div className="md-state-icon md-ok">
                  <CheckIcon />
                </div>
                <h2 className="md-state-title" id={titleId}>
                  신고가 접수됐어요
                </h2>
                <p className="md-state-text">검토 후 조치할게요. 알려 주셔서 감사합니다.</p>
                <div style={{ marginTop: 18 }}>
                  <button type="button" className="md-btn md-btn-primary" onClick={close}>
                    닫기
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="md-header">
                  <div className="md-header-text">
                    <h2 className="md-title" id={titleId}>
                      신고하기
                    </h2>
                    <p className="md-intro" id={introId}>
                      어떤 점이 문제인지 알려 주세요. 신고는 검토 후 처리돼요.
                    </p>
                  </div>
                  <button type="button" className="md-close" aria-label="닫기" onClick={close}>
                    <CloseIcon />
                  </button>
                </div>

                <form
                  className="md-body"
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault()
                    submit()
                  }}
                >
                  {formError ? (
                    <p className="md-form-error" role="alert">
                      {formError}
                    </p>
                  ) : null}

                  <div className="md-field">
                    <span className="md-label">
                      신고 사유
                      <span className="md-req" aria-hidden="true">
                        *
                      </span>
                    </span>
                    <div className="md-reasons" role="radiogroup" aria-label="신고 사유">
                      {reasons.map((opt) => {
                        const checked = reason === opt.value
                        return (
                          <label key={opt.value} className={`md-reason${checked ? ' md-on' : ''}`}>
                            <input
                              type="radio"
                              name={reasonName}
                              value={opt.value}
                              checked={checked}
                              onChange={() => {
                                setReason(opt.value)
                                setFormError(null)
                              }}
                            />
                            <span>{opt.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  <div className="md-field">
                    <label className="md-label" htmlFor={`${reasonName}-details`}>
                      상세 내용{' '}
                      <span style={{ color: 'var(--md-muted)', fontWeight: 400 }}>(선택)</span>
                    </label>
                    <textarea
                      id={`${reasonName}-details`}
                      className="md-textarea"
                      value={details}
                      maxLength={DETAILS_MAX}
                      placeholder="상황을 구체적으로 적어 주시면 처리가 빨라져요."
                      onChange={(e) => setDetails(e.target.value)}
                    />
                    <div className="md-count" aria-hidden="true">
                      {details.length}/{DETAILS_MAX}
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{ display: 'none' }}
                    aria-hidden="true"
                    tabIndex={-1}
                  />
                </form>

                <div className="md-footer">
                  <span className="md-brand">ModerationDesk</span>
                  <span className="md-footer-spacer" />
                  <button type="button" className="md-btn md-btn-ghost" onClick={close}>
                    취소
                  </button>
                  <button
                    type="button"
                    className="md-btn md-btn-primary"
                    disabled={phase === 'submitting'}
                    onClick={submit}
                  >
                    {phase === 'submitting' ? '접수 중…' : '신고 접수'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </span>
  )
}

export default ReportButton
export type { ReportReasonOption, ReportReceiptDto }
