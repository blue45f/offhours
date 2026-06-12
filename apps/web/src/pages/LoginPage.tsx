import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SignInSchema, type SignInInput } from '@offhours/shared'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { Eye, EyeOff, Mail } from 'lucide-react'

import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { useAuthConfig, useGoogleSignIn, useSignIn } from '../features/auth/api'
import { GoogleSignInButton } from '../features/auth/GoogleSignInButton'
import { useIsAuthed } from '../store/auth'
import { getErrorMessage } from '../services/api'

// seed.ts 가 만드는 공개 데모 계정 — 역할별 둘러보기용
const DEMO_ACCOUNTS = [
  { role: '게스트', hint: '공간 탐색·예약', email: 'guest@offhours.kr', password: 'guest1234' },
  { role: '호스트', hint: '공간 등록·운영', email: 'host1@offhours.kr', password: 'host1234' },
  { role: '관리자', hint: '운영 콘솔', email: 'admin@offhours.kr', password: 'admin1234' },
] as const

export default function LoginPage() {
  const isAuthed = useIsAuthed()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPwd, setShowPwd] = useState(false)
  const [demoRole, setDemoRole] = useState<string | null>(null)
  const signIn = useSignIn()
  const authConfig = useAuthConfig()
  const googleSignIn = useGoogleSignIn()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  async function onGoogleCredential(credential: string) {
    try {
      await googleSignIn.mutateAsync(credential)
      toast.success('환영합니다 ✨')
      navigate(from)
    } catch (e) {
      toast.error(getErrorMessage(e, 'Google 로그인에 실패했어요'))
    }
  }

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({ resolver: zodResolver(SignInSchema as never) })

  if (isAuthed) return <Navigate to={from} replace />

  async function onSubmit(values: SignInInput) {
    try {
      await signIn.mutateAsync(values)
      toast.success('환영합니다 ✨')
      navigate(from)
    } catch (e) {
      toast.error(getErrorMessage(e, '로그인에 실패했어요'))
    }
  }

  // 데모 버튼 = 자동 입력 + 제출. 폼을 거쳐가므로 검증·로딩 상태를 그대로 공유한다.
  function signInAsDemo(account: (typeof DEMO_ACCOUNTS)[number]) {
    setValue('email', account.email, { shouldValidate: true })
    setValue('password', account.password, { shouldValidate: true })
    setDemoRole(account.role)
    void handleSubmit(onSubmit)().finally(() => setDemoRole(null))
  }

  return (
    <div className="container-page py-12 md:py-20">
      <div className="mx-auto max-w-md">
        <h1 className="text-headline serif">다시 만나서 반가워요</h1>
        <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
          이메일과 비밀번호로 로그인하세요.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <Field label="이메일" error={errors.email?.message} required>
            <Input
              type="email"
              autoComplete="email"
              leading={<Mail size={16} />}
              placeholder="hello@offhours.kr"
              error={!!errors.email}
              {...register('email')}
            />
          </Field>
          <Field label="비밀번호" error={errors.password?.message} required>
            <Input
              type={showPwd ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="8자 이상"
              error={!!errors.password}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="text-[var(--color-fg-muted)]"
                  aria-label={showPwd ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              {...register('password')}
            />
          </Field>
          <Button type="submit" size="lg" full loading={isSubmitting}>
            로그인
          </Button>
        </form>
        {authConfig.data?.googleClientId && (
          <div className="mt-6">
            <div className="flex items-center gap-3 text-xs text-[var(--color-fg-muted)]">
              <span className="h-px flex-1 bg-[var(--color-border)]" />
              또는
              <span className="h-px flex-1 bg-[var(--color-border)]" />
            </div>
            <div className="mt-4">
              <GoogleSignInButton
                clientId={authConfig.data.googleClientId}
                onCredential={onGoogleCredential}
              />
            </div>
          </div>
        )}
        <div className="mt-6 text-center text-sm text-[var(--color-fg-muted)]">
          아직 계정이 없으신가요?{' '}
          <Link to="/signup" className="font-semibold text-[var(--color-primary)] hover:underline">
            가입하기
          </Link>
        </div>
        <section
          aria-label="데모 계정으로 바로 로그인"
          className="mt-8 rounded-[var(--radius-lg)] bg-[var(--color-bg-subtle)] p-4"
        >
          <p className="text-xs leading-relaxed text-[var(--color-fg-muted)]">
            <strong className="text-[var(--color-fg)]">데모 계정으로 바로 둘러보기</strong> · 클릭
            한 번이면 자동 입력 후 로그인됩니다.
          </p>
          <div className="mt-3 grid gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <Button
                key={account.role}
                type="button"
                variant="secondary"
                size="sm"
                full
                loading={demoRole === account.role}
                disabled={isSubmitting && demoRole !== account.role}
                onClick={() => signInAsDemo(account)}
                className="justify-between"
              >
                <span className="font-semibold">
                  {account.role}
                  <span className="ml-1.5 font-normal text-[var(--color-fg-muted)]">
                    {account.hint}
                  </span>
                </span>
                <span className="font-normal text-xs text-[var(--color-fg-muted)]">
                  {account.email}
                </span>
              </Button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
