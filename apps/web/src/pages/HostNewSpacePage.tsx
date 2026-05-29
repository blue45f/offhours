import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  AlcoholPolicyLabel,
  AMENITY_OPTIONS,
  CateringPolicyLabel,
  PROTECTION_PLANS,
  USE_CASE_META,
  type AlcoholPolicy,
  type CateringPolicy,
  type ProtectionTier,
  type UseCase,
} from '@offhours/shared'

import { Button } from '../components/ui/Button'
import { Field, Input, Textarea } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Chip } from '../components/ui/Chip'
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card'
import { useCreateSpace } from '../features/spaces/api'
import { getErrorMessage } from '../services/api'
import { PriceSuggestionCard } from '../components/host/PriceSuggestionCard'

export default function HostNewSpacePage() {
  const navigate = useNavigate()
  const createMutation = useCreateSpace()

  const [venueId, setVenueId] = useState('')
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [description, setDescription] = useState('')
  const [basePriceKRW, setBasePriceKRW] = useState(80000)
  const [capacityMin, setCapacityMin] = useState(10)
  const [capacityMax, setCapacityMax] = useState(40)
  const [cleaningFeeKRW, setCleaningFeeKRW] = useState(30000)
  const [cleaningMinutes, setCleaningMinutes] = useState(90)
  const [minHours, setMinHours] = useState(3)
  const [instantBook, setInstantBook] = useState(false)
  const [alcoholPolicy, setAlcoholPolicy] = useState<AlcoholPolicy>('BYOB')
  const [cateringPolicy, setCateringPolicy] = useState<CateringPolicy>('EXTERNAL_OK')
  const [protectionTier, setProtectionTier] = useState<ProtectionTier>('STANDARD')
  const [amenities, setAmenities] = useState<string[]>(['wifi', 'speaker'])
  const [useCases, setUseCases] = useState<UseCase[]>(['BIRTHDAY', 'GATHERING'])
  const [rules, setRules] = useState('실내 흡연 금지, 23시 이후 음향 70dB 이하, 원상복구 의무.')
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [photoInput, setPhotoInput] = useState('')

  function toggleAmenity(a: string) {
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]))
  }

  function toggleUseCase(c: UseCase) {
    setUseCases((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  function addPhoto() {
    if (!photoInput) return
    setPhotoUrls((prev) => [...prev, photoInput])
    setPhotoInput('')
  }

  async function submit() {
    try {
      await createMutation.mutateAsync({
        venueId,
        title,
        summary,
        description,
        basePriceKRW,
        capacityMin,
        capacityMax,
        cleaningFeeKRW,
        cleaningMinutes,
        minHours,
        instantBook,
        alcoholPolicy,
        cateringPolicy,
        protectionTier,
        amenities,
        useCases,
        rules,
        photoUrls,
      })
      toast.success('공간이 등록됐어요! 검토 후 게시됩니다.')
      navigate('/host/spaces')
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <div className="container-page py-8 md:py-12 max-w-3xl">
      <h1 className="text-headline serif">공간 등록</h1>
      <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
        단계별로 입력해주세요. 임시 저장은 자동으로 됩니다.
      </p>

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
            <span className="text-xs text-[var(--color-fg-muted)]">1 / 4</span>
          </CardHeader>
          <CardBody className="space-y-4">
            <Field label="Venue ID (임시)" helper="실제 서비스에서는 자동 매핑">
              <Input
                value={venueId}
                onChange={(e) => setVenueId(e.target.value)}
                placeholder="venue cuid"
              />
            </Field>
            <Field label="공간 이름" required>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="망원동 햇살가득 카페 통대관"
              />
            </Field>
            <Field label="한 줄 요약" required>
              <Input
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="오후 6시 마감 후 통째로, 아이보리 톤 60평 공간."
              />
            </Field>
            <Field label="상세 설명" required helper="40~4,000자">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>가격·인원·룰</CardTitle>
            <span className="text-xs text-[var(--color-fg-muted)]">2 / 4</span>
          </CardHeader>
          <CardBody className="space-y-4">
            <PriceSuggestionCard
              basePriceKRW={basePriceKRW}
              defaultCapacityMax={capacityMax}
              onApply={(p) => setBasePriceKRW(p)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label="시간당 기본가 (원)">
                <Input
                  type="number"
                  value={basePriceKRW}
                  onChange={(e) => setBasePriceKRW(Number(e.target.value))}
                />
              </Field>
              <Field label="청소비 (원)">
                <Input
                  type="number"
                  value={cleaningFeeKRW}
                  onChange={(e) => setCleaningFeeKRW(Number(e.target.value))}
                />
              </Field>
              <Field label="청소 시간 (분)" helper="강제 윈도우">
                <Input
                  type="number"
                  value={cleaningMinutes}
                  onChange={(e) => setCleaningMinutes(Number(e.target.value))}
                />
              </Field>
              <Field label="최소 예약 시간">
                <Input
                  type="number"
                  value={minHours}
                  onChange={(e) => setMinHours(Number(e.target.value))}
                />
              </Field>
              <Field label="최소 인원">
                <Input
                  type="number"
                  value={capacityMin}
                  onChange={(e) => setCapacityMin(Number(e.target.value))}
                />
              </Field>
              <Field label="최대 인원">
                <Input
                  type="number"
                  value={capacityMax}
                  onChange={(e) => setCapacityMax(Number(e.target.value))}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={instantBook}
                onChange={(e) => setInstantBook(e.target.checked)}
                className="size-4 accent-[var(--color-primary)]"
              />
              즉시 예약 허용 (호스트 검토 없이 결제 시 확정)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Field label="주류 정책">
                <Select
                  value={alcoholPolicy}
                  onValueChange={(v) => setAlcoholPolicy(v as AlcoholPolicy)}
                  options={(Object.keys(AlcoholPolicyLabel) as AlcoholPolicy[]).map((p) => ({
                    value: p,
                    label: AlcoholPolicyLabel[p],
                  }))}
                />
              </Field>
              <Field label="식음료 정책">
                <Select
                  value={cateringPolicy}
                  onValueChange={(v) => setCateringPolicy(v as CateringPolicy)}
                  options={(Object.keys(CateringPolicyLabel) as CateringPolicy[]).map((p) => ({
                    value: p,
                    label: CateringPolicyLabel[p],
                  }))}
                />
              </Field>
            </div>
            <Field
              label="안심 보장"
              helper="게스트가 보장료를 부담하고, 호스트는 기물 파손·도난을 보장 한도까지 보호받아요. 영업 외 통대관의 가장 큰 진입장벽을 해소합니다."
            >
              <Select
                value={protectionTier}
                onValueChange={(v) => setProtectionTier(v as ProtectionTier)}
                options={(Object.keys(PROTECTION_PLANS) as ProtectionTier[]).map((t) => ({
                  value: t,
                  label: PROTECTION_PLANS[t].blurb,
                }))}
              />
            </Field>
            <Field label="이용 규칙">
              <Textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={3} />
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>모임 유형 · 편의시설</CardTitle>
            <span className="text-xs text-[var(--color-fg-muted)]">3 / 4</span>
          </CardHeader>
          <CardBody className="space-y-5">
            <Field
              label="이런 모임에 좋아요"
              helper="게스트는 카테고리가 아니라 '친구 생일 30명' 같은 시나리오로 검색해요. 어울리는 모임을 모두 선택해주세요."
            >
              <div className="flex flex-wrap gap-2">
                {(Object.keys(USE_CASE_META) as UseCase[]).map((c) => {
                  const meta = USE_CASE_META[c]
                  return (
                    <Chip key={c} selected={useCases.includes(c)} onClick={() => toggleUseCase(c)}>
                      <span className="mr-1.5">{meta.emoji}</span>
                      {meta.label}
                    </Chip>
                  )
                })}
              </div>
            </Field>
            <Field label="편의시설">
              <div className="flex flex-wrap gap-2">
                {AMENITY_OPTIONS.map((a) => (
                  <Chip
                    key={a.value}
                    selected={amenities.includes(a.value)}
                    onClick={() => toggleAmenity(a.value)}
                  >
                    {a.label}
                  </Chip>
                ))}
              </div>
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>사진</CardTitle>
            <span className="text-xs text-[var(--color-fg-muted)]">4 / 4</span>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="사진 URL을 붙여넣어주세요 (S3 업로드는 추후 연동)"
                value={photoInput}
                onChange={(e) => setPhotoInput(e.target.value)}
              />
              <Button type="button" onClick={addPhoto} variant="secondary">
                추가
              </Button>
            </div>
            {photoUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {photoUrls.map((u, i) => (
                  <div key={u} className="relative group">
                    <img
                      src={u}
                      alt=""
                      className="aspect-[4/3] w-full rounded-[var(--radius-md)] object-cover"
                    />
                    <button
                      onClick={() => setPhotoUrls((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 size-7 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            취소
          </Button>
          <Button onClick={submit} loading={createMutation.isPending}>
            등록 요청
          </Button>
        </div>
      </div>
    </div>
  )
}
