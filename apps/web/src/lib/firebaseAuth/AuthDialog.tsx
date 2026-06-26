import { LogIn, UserPlus } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'

import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { Field, Input } from '../../components/ui/Input'
import { cn } from '../../utils/cn'

import { useAuth } from './useAuth'

type Mode = 'signin' | 'signup'

const COPY: Record<Mode, { title: string; desc: string; submit: string; toggle: string }> = {
  signin: {
    title: '회원 로그인',
    desc: '이메일과 비밀번호로 로그인하세요. 계정이 없다면 가입하거나 게스트로 시작할 수 있습니다.',
    submit: '로그인',
    toggle: '계정이 없나요? 가입하기',
  },
  signup: {
    title: '회원가입',
    desc: '이메일과 비밀번호로 새 계정을 만드세요. 비밀번호는 6자 이상이어야 합니다.',
    submit: '가입하기',
    toggle: '이미 계정이 있나요? 로그인',
  },
}

/**
 * Firebase 이메일/비밀번호 + 게스트 로그인 다이얼로그 — 접근성 우선.
 * - 로그인 ⇄ 가입 토글, "게스트로 시작하기"(익명 인증)
 * - 로딩/비활성 상태, aria-live 에러(Field 의 role="alert")
 * - 포커스: Radix Dialog 가 트랩, 열릴 때 이메일 입력에 초기 포커스
 *
 * Offhours 디자인 시스템 프리미티브(Dialog·Button·Field/Input·토큰)에 맞춰 벤더링됨.
 * useAuth API 와 한국어 에러 매핑은 정본 모듈과 동일하게 유지한다.
 */
export function AuthDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { signIn, signUp, signInAsGuest, error, clearError, user } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState<'form' | 'guest' | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  const emailId = useId()
  const passwordId = useId()
  const errorId = useId()

  // 로그인 성공 시 자동으로 닫힌다(prop 콜백 호출 — setState 아님).
  useEffect(() => {
    if (open && user) onOpenChange(false)
  }, [open, user, onOpenChange])

  // 열릴 때 이메일 입력에 초기 포커스(Offhours Dialog 는 onOpenAutoFocus 를 노출하지
  // 않으므로, 마운트 후 명시 포커스. Radix 는 포커스 트랩만 담당).
  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => emailRef.current?.focus(), 0)
      return () => window.clearTimeout(id)
    }
  }, [open])

  /**
   * 닫힘 전이를 가로채 폼/에러를 초기화한다 — 다음 열림이 항상 깨끗한 상태로 시작.
   */
  function handleOpenChange(next: boolean) {
    if (!next) {
      setMode('signin')
      setBusy(null)
      setEmail('')
      setPassword('')
      clearError()
    }
    onOpenChange(next)
  }

  function switchMode() {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
    clearError()
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy('form')
    try {
      if (mode === 'signup') await signUp(email, password)
      else await signIn(email, password)
    } catch {
      // 에러는 컨텍스트 state(error)로 노출 — 여기선 무시.
    } finally {
      setBusy(null)
    }
  }

  async function onGuest() {
    if (busy) return
    setBusy('guest')
    try {
      await signInAsGuest()
    } catch {
      // 위와 동일.
    } finally {
      setBusy(null)
    }
  }

  const copy = COPY[mode]
  const formBusy = busy === 'form'
  const guestBusy = busy === 'guest'
  const anyBusy = busy !== null

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      size="sm"
      title={
        <span className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]"
          >
            {mode === 'signup' ? <UserPlus size={16} /> : <LogIn size={16} />}
          </span>
          {copy.title}
        </span>
      }
      description={copy.desc}
    >
      <form onSubmit={onSubmit} className="space-y-3.5">
        <Field label="이메일" required>
          <Input
            ref={emailRef}
            id={emailId}
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            error={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            required
            disabled={anyBusy}
          />
        </Field>

        <Field label="비밀번호" required>
          <Input
            id={passwordId}
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            minLength={6}
            error={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            required
            disabled={anyBusy}
          />
        </Field>

        {/* 에러는 항상 같은 노드에 두어 aria-live 가 안정적으로 announce 한다. */}
        <div aria-live="assertive">
          {error ? (
            <p
              id={errorId}
              role="alert"
              className={cn(
                'rounded-[var(--radius-md)] px-3 py-2 text-[0.8125rem]',
                'border border-[color-mix(in_srgb,var(--color-error)_40%,transparent)]',
                'bg-[color-mix(in_srgb,var(--color-error)_10%,var(--color-bg-elevated))] text-[var(--color-error)]'
              )}
            >
              {error}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          variant="primary"
          full
          loading={formBusy}
          disabled={anyBusy || !email || !password}
        >
          {copy.submit}
        </Button>
      </form>

      <button
        type="button"
        onClick={switchMode}
        disabled={anyBusy}
        className="mt-2 w-full text-center text-[0.8125rem] font-medium text-[var(--color-accent)] transition-colors hover:underline disabled:pointer-events-none disabled:opacity-50"
      >
        {copy.toggle}
      </button>

      <div className="my-3 flex items-center gap-3 text-[var(--color-fg-subtle)]">
        <span className="h-px flex-1 bg-[var(--color-border)]" aria-hidden />
        <span className="text-xs">또는</span>
        <span className="h-px flex-1 bg-[var(--color-border)]" aria-hidden />
      </div>

      <Button
        type="button"
        variant="secondary"
        full
        loading={guestBusy}
        disabled={anyBusy}
        onClick={onGuest}
      >
        게스트로 시작하기
      </Button>
    </Dialog>
  )
}
