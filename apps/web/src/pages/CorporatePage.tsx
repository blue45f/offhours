import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Building2, ReceiptText, Trash2 } from 'lucide-react'
import {
  CorporateTaxTypeLabel,
  type CorporateTaxType,
  type UpsertCorporateProfileInput,
} from '@offhours/shared'

import { Button } from '../components/ui/Button'
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card'
import { Field, Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import {
  useCorporateProfile,
  useDeleteCorporateProfile,
  useUpsertCorporateProfile,
} from '../features/corporate/api'
import { getErrorMessage } from '../services/api'

export default function CorporatePage() {
  const { data, isLoading } = useCorporateProfile()
  const upsert = useUpsertCorporateProfile()
  const del = useDeleteCorporateProfile()
  const [form, setForm] = useState<UpsertCorporateProfileInput>({
    companyName: '',
    businessNumber: '',
    ceoName: '',
    billingEmail: '',
    taxOfficeAddress: '',
    taxPayer: 'GENERAL',
  })

  useEffect(() => {
    if (data) {
      setForm({
        companyName: data.companyName,
        businessNumber: data.businessNumber,
        ceoName: data.ceoName,
        billingEmail: data.billingEmail,
        taxOfficeAddress: data.taxOfficeAddress ?? '',
        taxPayer: data.taxPayer,
      })
    }
  }, [data])

  async function submit() {
    try {
      await upsert.mutateAsync(form)
      toast.success(data ? '법인 정보를 수정했어요' : '법인 결제 활성화 완료')
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  async function onDelete() {
    if (!confirm('법인 결제 프로필을 삭제할까요? 기존 예약은 영향 없어요.')) return
    try {
      await del.mutateAsync()
      toast.success('삭제했어요')
      setForm({
        companyName: '',
        businessNumber: '',
        ceoName: '',
        billingEmail: '',
        taxOfficeAddress: '',
        taxPayer: 'GENERAL',
      })
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
                onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                placeholder="(주)예시컴퍼니"
              />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="사업자번호" required helper="000-00-00000 형식">
                <Input
                  value={form.businessNumber}
                  onChange={(e) => setForm((p) => ({ ...p, businessNumber: e.target.value }))}
                  placeholder="123-45-67890"
                />
              </Field>
              <Field label="대표자명" required>
                <Input
                  value={form.ceoName}
                  onChange={(e) => setForm((p) => ({ ...p, ceoName: e.target.value }))}
                />
              </Field>
            </div>
            <Field label="세금계산서 수신 이메일" required>
              <Input
                type="email"
                value={form.billingEmail}
                onChange={(e) => setForm((p) => ({ ...p, billingEmail: e.target.value }))}
                placeholder="finance@company.com"
              />
            </Field>
            <Field label="과세 유형">
              <Select
                value={form.taxPayer}
                onValueChange={(v) => setForm((p) => ({ ...p, taxPayer: v as CorporateTaxType }))}
                options={(Object.keys(CorporateTaxTypeLabel) as CorporateTaxType[]).map((t) => ({
                  value: t,
                  label: CorporateTaxTypeLabel[t],
                }))}
              />
            </Field>
            <Field label="관할 세무서 주소 (선택)">
              <Input
                value={form.taxOfficeAddress ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, taxOfficeAddress: e.target.value }))}
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
    </div>
  )
}
