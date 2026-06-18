/**
 * SpaceReportButton — ModerationDesk(공개 신고 접수)를 offhours 네이티브 UI 로 렌더.
 * ──────────────────────────────────────────────────────────────────────────
 * `@heejun/deskcloud` 의 pk_ 브라우저 클라이언트로 신고를 접수한다. 위젯/외부 CSS 없이
 * 앱 자체 Dialog·Button·Field 로 그린다. env(VITE_MODERATIONDESK_URL) 미설정 시 null.
 *
 * 공개 사용자측 신고이며, 어드민 신고 관리(AdminReportsPage)와는 별개다.
 */
import { Flag } from 'lucide-react'
import { useId, useState, type ReactElement } from 'react'
import { toast } from 'sonner'

import { useSubmitReport } from '../../domains/deskcloud/api'
import { deskEnabled } from '../../domains/deskcloud/clients'
import { useMe } from '../../store/auth'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { Field, Textarea } from '../ui/Input'

const REASONS = [
  { value: 'inappropriate', label: '부적절한 내용·사진' },
  { value: 'misleading', label: '허위·과장된 정보' },
  { value: 'spam', label: '스팸·광고' },
  { value: 'safety', label: '안전·법적 우려' },
  { value: 'other', label: '기타' },
] as const

export function SpaceReportButton({ spaceId }: { spaceId: string }): ReactElement | null {
  const me = useMe()
  const submit = useSubmitReport()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string>(REASONS[0].value)
  const [detail, setDetail] = useState('')
  const [error, setError] = useState<string | undefined>()
  const formId = useId()

  if (!deskEnabled.moderation()) return null

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    const label = REASONS.find((r) => r.value === reason)?.label ?? reason
    const composed = detail.trim() ? `${label}: ${detail.trim()}` : label
    setError(undefined)
    try {
      await submit.mutateAsync({
        subjectType: 'space',
        subjectId: spaceId,
        reason: composed,
        reporterId: me?.id,
      })
      setOpen(false)
      setDetail('')
      toast.success('신고가 접수됐어요. 검토 후 조치할게요.')
    } catch (err) {
      setError(err instanceof Error ? err.message : '신고 접수에 실패했어요')
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        leading={<Flag size={14} />}
        onClick={() => setOpen(true)}
        className="text-[var(--color-fg-subtle)]"
      >
        이 공간 신고
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        size="sm"
        title="공간 신고"
        description="문제가 되는 점을 알려주시면 검토 후 조치할게요."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button type="submit" form={formId} variant="destructive" loading={submit.isPending}>
              신고하기
            </Button>
          </>
        }
      >
        <form id={formId} onSubmit={onSubmit} className="space-y-4" noValidate>
          <fieldset className="space-y-2">
            <legend className="mb-1.5 text-sm font-medium text-[var(--color-fg)]">사유</legend>
            {REASONS.map((r) => (
              <label
                key={r.value}
                className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2.5 text-sm transition-colors hover:bg-[var(--color-bg-subtle)] has-[:checked]:border-[var(--color-primary)] has-[:checked]:bg-[var(--color-primary-soft)]"
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="size-4 accent-[var(--color-primary)]"
                />
                <span className="text-[var(--color-fg)]">{r.label}</span>
              </label>
            ))}
          </fieldset>
          <Field label="상세 설명" helper="선택 사항" error={error}>
            <Textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="어떤 점이 문제인지 적어주세요 (선택)"
              maxLength={1000}
              rows={3}
            />
          </Field>
        </form>
      </Dialog>
    </>
  )
}

export default SpaceReportButton
