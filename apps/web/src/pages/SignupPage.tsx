import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { SignUpSchema, type SignUpInput } from '@offhours/shared'
import toast from 'react-hot-toast'
import { Mail, User } from 'lucide-react'

import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Input'
import { useSignUp } from '../features/auth/api'
import { useIsAuthed } from '../store/auth'
import { getErrorMessage } from '../services/api'

export default function SignupPage() {
  const isAuthed = useIsAuthed()
  const navigate = useNavigate()
  const signUp = useSignUp()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: { marketingOptIn: false },
  })

  if (isAuthed) return <Navigate to="/" replace />

  async function onSubmit(values: SignUpInput) {
    try {
      await signUp.mutateAsync(values)
      toast.success('환영해요! Offhours를 시작해보세요 ✨')
      navigate('/')
    } catch (e) {
      toast.error(getErrorMessage(e, '회원가입에 실패했어요'))
    }
  }

  return (
    <div className="container-page py-12 md:py-20">
      <div className="mx-auto max-w-md">
        <h1 className="text-headline serif">3분이면 끝나요</h1>
        <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
          이메일·이름·비밀번호만 입력하면 바로 시작할 수 있어요.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
          <Field label="이름" error={errors.name?.message} required>
            <Input
              leading={<User size={16} />}
              placeholder="홍길동"
              error={!!errors.name}
              {...register('name')}
            />
          </Field>
          <Field label="이메일" error={errors.email?.message} required>
            <Input
              type="email"
              leading={<Mail size={16} />}
              placeholder="hello@offhours.kr"
              error={!!errors.email}
              {...register('email')}
            />
          </Field>
          <Field
            label="비밀번호"
            error={errors.password?.message}
            required
            helper="8자 이상, 영문+숫자 포함"
          >
            <Input
              type="password"
              placeholder="••••••••"
              error={!!errors.password}
              {...register('password')}
            />
          </Field>
          <Field label="휴대폰" error={errors.phone?.message} helper="선택 사항">
            <Input
              type="tel"
              placeholder="010-1234-5678"
              error={!!errors.phone}
              {...register('phone')}
            />
          </Field>
          <Field
            label="추천인 코드"
            error={errors.referralCode?.message}
            helper="추천 코드가 있다면 입력해주세요 (선택)"
          >
            <Input
              placeholder="ABC123"
              error={!!errors.referralCode}
              {...register('referralCode')}
            />
          </Field>
          <label className="flex items-start gap-2 text-sm text-[var(--color-fg-muted)] mt-2">
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border-[var(--color-border-strong)] accent-[var(--color-primary)]"
              {...register('marketingOptIn')}
            />
            <span>혜택·이벤트 알림을 받을게요. 언제든 해지할 수 있어요.</span>
          </label>
          <Button type="submit" size="lg" full loading={isSubmitting}>
            가입하기
          </Button>
        </form>
        <p className="mt-4 text-xs text-[var(--color-fg-subtle)] text-center">
          가입 시{' '}
          <Link to="/terms" className="underline">
            이용약관
          </Link>{' '}
          및{' '}
          <Link to="/privacy" className="underline">
            개인정보 처리방침
          </Link>
          에 동의합니다.
        </p>
        <div className="mt-6 text-center text-sm text-[var(--color-fg-muted)]">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="font-semibold text-[var(--color-primary)] hover:underline">
            로그인
          </Link>
        </div>
      </div>
    </div>
  )
}
