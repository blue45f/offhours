import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, useWatch, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import {
  CreateHostProfileSchema,
  type CreateHostProfileInput,
  type PayoutCycle,
  type TaxType,
} from '@offhours/shared'
import { Building2, Check, CreditCard, Receipt, ShieldCheck } from 'lucide-react'

import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card'
import { Field, Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { cn } from '../utils/cn'
import { getErrorMessage } from '../services/api'
import { useHostProfile, useUpsertHostProfile } from '../features/host/api'

function formatBizNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length < 4) return digits
  if (digits.length < 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
}

const BANKS = [
  '토스뱅크',
  '카카오뱅크',
  '국민',
  '신한',
  '우리',
  '하나',
  'NH농협',
  'IBK기업',
  '케이뱅크',
  '새마을금고',
]

export default function HostProfilePage() {
  const navigate = useNavigate()
  const { data: existing, isLoading } = useHostProfile()
  const upsert = useUpsertHostProfile()

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateHostProfileInput>({
    resolver: zodResolver(
      CreateHostProfileSchema as never
    ) as unknown as Resolver<CreateHostProfileInput>,
    defaultValues: {
      businessName: '',
      businessNumber: '',
      bankName: '토스뱅크',
      bankAccount: '',
      taxType: 'INDIVIDUAL',
      payoutCycle: 'D7',
    },
  })

  useEffect(() => {
    if (existing) {
      reset({
        businessName: existing.businessName,
        businessNumber: existing.businessNumber,
        // 저장된 은행명 복원 — 토스뱅크로 덮어쓰지 않는다. 계좌번호는 민감해 미반환이라 재입력 필요.
        bankName: existing.bankName,
        bankAccount: '',
        taxType: existing.taxType as TaxType,
        payoutCycle: existing.payoutCycle as PayoutCycle,
      })
    }
  }, [existing, reset])

  const taxType = useWatch({ control, name: 'taxType' })
  const payoutCycle = useWatch({ control, name: 'payoutCycle' })
  const bankName = useWatch({ control, name: 'bankName' })
  const businessNumber = useWatch({ control, name: 'businessNumber' }) ?? ''

  async function onSubmit(values: CreateHostProfileInput) {
    try {
      await upsert.mutateAsync({
        ...values,
        businessNumber: values.businessNumber.replace(/-/g, ''),
      })
      toast.success(existing ? '프로필이 업데이트됐어요' : '호스트 등록이 완료됐어요')
      navigate('/host/dashboard')
    } catch (e) {
      toast.error(getErrorMessage(e, '저장에 실패했어요'))
    }
  }

  if (isLoading) {
    return (
      <div className="container-page py-10 max-w-3xl space-y-4">
        <Skeleton variant="text" className="h-10 w-2/3" />
        <Skeleton className="h-72 w-full rounded-[var(--radius-xl)]" />
        <Skeleton className="h-60 w-full rounded-[var(--radius-xl)]" />
      </div>
    )
  }

  return (
    <div className="container-page py-8 md:py-12 max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <Badge tone={existing ? 'success' : 'warning'} dot>
          {existing ? '등록 완료' : '미등록'}
        </Badge>
        {existing?.approvedAt && (
          <Badge tone="primary" soft>
            <ShieldCheck size={12} className="mr-1" /> 승인됨
          </Badge>
        )}
      </div>
      <h1 className="text-headline serif">{existing ? '호스트 프로필' : '호스트로 시작하기'}</h1>
      <p className="mt-2 text-sm text-[var(--color-fg-muted)]">
        사업자 정보와 정산 계좌를 등록하면 공간을 게시할 수 있어요. 입력한 정보는 정산·세금 계산서
        발행에만 사용됩니다.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <Building2 size={18} />
                사업자 정보
              </span>
            </CardTitle>
            <span className="text-xs text-[var(--color-fg-muted)]">1 / 3</span>
          </CardHeader>
          <CardBody className="space-y-4">
            <Field label="상호명" error={errors.businessName?.message} required>
              <Input
                placeholder="예: 망원동 햇살가득 카페"
                error={!!errors.businessName}
                {...register('businessName')}
              />
            </Field>
            <Field
              label="사업자등록번호"
              error={errors.businessNumber?.message}
              required
              helper="국세청 사업자 진위확인을 거칩니다 (Phase 2)"
            >
              <Input
                placeholder="000-00-00000"
                inputMode="numeric"
                value={formatBizNumber(businessNumber)}
                error={!!errors.businessNumber}
                onChange={(e) => {
                  const next = formatBizNumber(e.target.value)
                  setValue('businessNumber', next, { shouldValidate: true })
                }}
              />
            </Field>
            <Field label="사업자 유형" required>
              <div className="grid grid-cols-2 gap-2">
                {(['INDIVIDUAL', 'CORPORATE'] as TaxType[]).map((type) => (
                  <Toggle
                    key={type}
                    active={taxType === type}
                    onClick={() => setValue('taxType', type, { shouldValidate: true })}
                    title={type === 'INDIVIDUAL' ? '개인사업자' : '법인사업자'}
                    description={
                      type === 'INDIVIDUAL'
                        ? '간이·일반과세, 원천세 3.3% 자동 차감'
                        : '법인사업자, 세금계산서 자동 발행'
                    }
                  />
                ))}
              </div>
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <CreditCard size={18} />
                정산 계좌
              </span>
            </CardTitle>
            <span className="text-xs text-[var(--color-fg-muted)]">2 / 3</span>
          </CardHeader>
          <CardBody className="space-y-4">
            <Field label="은행" required>
              <div className="flex flex-wrap gap-1.5">
                {BANKS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setValue('bankName', b, { shouldValidate: true })}
                    className={cn(
                      'h-9 px-3.5 rounded-[var(--radius-pill)] text-sm font-medium border transition-colors',
                      bankName === b
                        ? 'bg-[var(--color-fg)] text-[var(--color-bg)] border-transparent'
                        : 'bg-[var(--color-bg-elevated)] text-[var(--color-fg)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                    )}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="계좌번호" error={errors.bankAccount?.message} required>
              <Input
                placeholder="숫자만 입력"
                inputMode="numeric"
                error={!!errors.bankAccount}
                {...register('bankAccount')}
              />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <Receipt size={18} />
                정산 주기
              </span>
            </CardTitle>
            <span className="text-xs text-[var(--color-fg-muted)]">3 / 3</span>
          </CardHeader>
          <CardBody className="space-y-4">
            <Field label="이용 완료 후 정산까지의 기간" required>
              <div className="grid grid-cols-2 gap-2">
                {(['D7', 'D14'] as PayoutCycle[]).map((cycle) => (
                  <Toggle
                    key={cycle}
                    active={payoutCycle === cycle}
                    onClick={() => setValue('payoutCycle', cycle, { shouldValidate: true })}
                    title={cycle === 'D7' ? '7일 정산' : '14일 정산'}
                    description={
                      cycle === 'D7'
                        ? '부업 호스트 추천. 빠른 현금 흐름'
                        : '세금계산서 발행 호스트 표준'
                    }
                  />
                ))}
              </div>
            </Field>
            <p className="text-xs text-[var(--color-fg-muted)] leading-relaxed bg-[var(--color-bg-subtle)] rounded-[var(--radius-lg)] p-3.5">
              플랫폼 수수료 12% 차감 후 입금됩니다. 분쟁 발생 시 정산이 보류될 수 있어요. 자세한
              내용은{' '}
              <Link to="/terms" target="_blank" rel="noreferrer" className="underline">
                이용약관
              </Link>
              을 참고해주세요.
            </p>
          </CardBody>
        </Card>

        <div className="flex items-center justify-between gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            취소
          </Button>
          <Button type="submit" size="lg" loading={isSubmitting || upsert.isPending}>
            {existing ? '변경 사항 저장' : '호스트 등록 완료'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function Toggle({
  active,
  onClick,
  title,
  description,
}: {
  active: boolean
  onClick: () => void
  title: string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-left rounded-[var(--radius-lg)] p-4 border transition-all',
        active
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] ring-2 ring-[var(--color-primary-soft)]'
          : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-border-strong)]'
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-sm">{title}</span>
        {active && (
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
            <Check size={12} />
          </span>
        )}
      </div>
      <p className="text-xs text-[var(--color-fg-muted)] leading-relaxed">{description}</p>
    </button>
  )
}
