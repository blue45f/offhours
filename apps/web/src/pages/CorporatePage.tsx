import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Building2, ReceiptText, Trash2, Wallet } from 'lucide-react'
import {
  CorporateTaxTypeLabel,
  creditBonus,
  type CorporateProfile,
  type CorporateTaxType,
  type UpsertCorporateProfileInput,
} from '@offhours/shared'

import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card'
import { useConfirm } from '../components/ui/ConfirmDialog'
import { Field, Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import {
  useCorporateProfile,
  useDeleteCorporateProfile,
  useTopupCredit,
  useUpsertCorporateProfile,
} from '../features/corporate/api'
import { getErrorMessage } from '../services/api'
import { formatKRW } from '../utils/format'
import { cn } from '../utils/cn'

const EMPTY_CORPORATE_FORM: UpsertCorporateProfileInput = {
  companyName: '',
  businessNumber: '',
  ceoName: '',
  billingEmail: '',
  taxOfficeAddress: '',
  taxPayer: 'GENERAL',
}

function toCorporateForm(data?: CorporateProfile | null): UpsertCorporateProfileInput {
  if (!data) return EMPTY_CORPORATE_FORM
  return {
    companyName: data.companyName,
    businessNumber: data.businessNumber,
    ceoName: data.ceoName,
    billingEmail: data.billingEmail,
    taxOfficeAddress: data.taxOfficeAddress ?? '',
    taxPayer: data.taxPayer,
  }
}

export default function CorporatePage() {
  const { data, isLoading } = useCorporateProfile()
  const upsert = useUpsertCorporateProfile()
  const del = useDeleteCorporateProfile()
  const topup = useTopupCredit()
  const confirm = useConfirm()
  const [topupAmount, setTopupAmount] = useState(1_000_000)
  const serverForm = useMemo(() => toCorporateForm(data), [data])
  const [draftForm, setDraftForm] = useState<UpsertCorporateProfileInput | null>(null)
  const form = draftForm ?? serverForm
  const updateForm = (patch: Partial<UpsertCorporateProfileInput>) => {
    setDraftForm((current) => ({ ...(current ?? serverForm), ...patch }))
  }

  async function submit() {
    try {
      await upsert.mutateAsync(form)
      toast.success(data ? '법인 정보를 수정했어요' : '법인 결제 활성화 완료')
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  async function onTopup() {
    try {
      const res = await topup.mutateAsync(topupAmount)
      toast.success(
        `${formatKRW(res.added + res.bonus)} 적립 완료 (잔액 ${formatKRW(res.creditBalanceKRW)})`
      )
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  async function onDelete() {
    const ok = await confirm({
      title: '법인 결제 프로필을 삭제할까요?',
      description: '기존 예약은 영향 없어요.',
      confirmLabel: '삭제',
      danger: true,
    })
    if (!ok) return
    try {
      await del.mutateAsync()
      toast.success('삭제했어요')
      setDraftForm(EMPTY_CORPORATE_FORM)
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <div className="container-page py-8 md:py-12 max-w-2xl">
      <div className="flex items-center gap-2 mb-1">
        <Building2 size={20} className="text-[var(--color-primary)]" />
        <h1 className="text-headline serif">법인 결제·세금계산서</h1>
      </div>
      <p className="text-sm text-[var(--color-fg-muted)]">
        한 번 등록해두면 예약 시 토글 한 번으로 법인 결제 + 자동 세금계산서 발행 워크플로우에
        넘어가요. 사내 워크샵·팀빌딩 예약에 특히 유용해요.
      </p>

      {isLoading ? (
        <p className="mt-8 text-sm text-[var(--color-fg-muted)]">불러오는 중…</p>
      ) : (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>법인 정보</CardTitle>
            {data && (
              <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-primary)] inline-flex items-center gap-1">
                <ReceiptText size={12} /> 활성화됨
              </span>
            )}
          </CardHeader>
          <CardBody className="space-y-4">
            <Field label="회사명" required>
              <Input
                value={form.companyName}
                onChange={(e) => updateForm({ companyName: e.target.value })}
                placeholder="(주)예시컴퍼니"
              />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="사업자번호" required helper="000-00-00000 형식">
                <Input
                  value={form.businessNumber}
                  onChange={(e) => updateForm({ businessNumber: e.target.value })}
                  placeholder="123-45-67890"
                />
              </Field>
              <Field label="대표자명" required>
                <Input
                  value={form.ceoName}
                  onChange={(e) => updateForm({ ceoName: e.target.value })}
                />
              </Field>
            </div>
            <Field label="세금계산서 수신 이메일" required>
              <Input
                type="email"
                value={form.billingEmail}
                onChange={(e) => updateForm({ billingEmail: e.target.value })}
                placeholder="finance@company.com"
              />
            </Field>
            <Field label="과세 유형">
              <Select
                value={form.taxPayer}
                onValueChange={(v) => updateForm({ taxPayer: v as CorporateTaxType })}
                options={(Object.keys(CorporateTaxTypeLabel) as CorporateTaxType[]).map((t) => ({
                  value: t,
                  label: CorporateTaxTypeLabel[t],
                }))}
              />
            </Field>
            <Field label="관할 세무서 주소 (선택)">
              <Input
                value={form.taxOfficeAddress ?? ''}
                onChange={(e) => updateForm({ taxOfficeAddress: e.target.value })}
                placeholder="서울 강남구 ..."
              />
            </Field>
            <div className="flex items-center justify-end gap-2 pt-2">
              {data && (
                <Button
                  variant="ghost"
                  leading={<Trash2 size={14} />}
                  onClick={onDelete}
                  className="!text-[var(--color-error)] mr-auto"
                >
                  삭제
                </Button>
              )}
              <Button
                onClick={submit}
                loading={upsert.isPending}
                disabled={
                  !form.companyName || !form.businessNumber || !form.ceoName || !form.billingEmail
                }
              >
                {data ? '수정 저장' : '등록'}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {data && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-1.5">
                <Wallet size={16} className="text-[var(--color-primary)]" />
                영업 외 크레딧
              </span>
            </CardTitle>
            <span className="font-mono font-semibold text-[var(--color-primary)]">
              잔액 {formatKRW(data.creditBalanceKRW)}
            </span>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-sm text-[var(--color-fg-muted)] leading-relaxed">
              워크샵·팀빌딩 예약용 크레딧을 미리 충전하면 충전액에 따라 보너스 크레딧을 드려요. 예약
              시 결제액에서 자동 차감됩니다.
            </p>
            <div className="flex flex-wrap gap-2">
              {[1_000_000, 3_000_000, 5_000_000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTopupAmount(amt)}
                  className={cn(
                    'rounded-[var(--radius-pill)] border px-3 py-1.5 text-sm font-medium transition-colors',
                    topupAmount === amt
                      ? 'border-transparent bg-[var(--color-primary)] text-[var(--color-primary-fg)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                  )}
                >
                  {formatKRW(amt)}
                  {creditBonus(amt) > 0 && (
                    <span className="ml-1 text-[11px] opacity-80">
                      +{formatKRW(creditBonus(amt))}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-3 text-sm">
              <span className="text-[var(--color-fg-muted)]">
                충전 {formatKRW(topupAmount)} + 보너스 {formatKRW(creditBonus(topupAmount))}
              </span>
              <span className="font-semibold">
                = {formatKRW(topupAmount + creditBonus(topupAmount))} 적립
              </span>
            </div>
            <div className="flex justify-end">
              <Button onClick={onTopup} loading={topup.isPending}>
                크레딧 충전
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
