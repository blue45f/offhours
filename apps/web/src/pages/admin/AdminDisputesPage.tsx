import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { DisputeStatusLabel, type DisputeRow, type ResolveDisputeInput } from '@offhours/shared'

import { api } from '../../services/api'
import { AdminShell } from '../../components/admin/AdminShell'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardBody } from '../../components/ui/Card'
import { Dialog } from '../../components/ui/Dialog'
import { Field, Textarea } from '../../components/ui/Input'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatDateTimeKR, formatKRW } from '../../utils/format'

type ResolveStatus = ResolveDisputeInput['status']

const VERDICT_LABEL: Record<ResolveStatus, string> = {
  RESOLVED_FAVOR_HOST: '호스트 인정',
  RESOLVED_FAVOR_GUEST: '게스트 인정',
  DISMISSED: '기각',
  UNDER_REVIEW: '검토중으로 전환',
}

export default function AdminDisputesPage() {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['admin', 'disputes'],
    queryFn: () => api.get<{ items: DisputeRow[]; total: number }>('/admin/disputes'),
  })
  const resolve = useMutation({
    mutationFn: (vars: { id: string; status: ResolveStatus; resolution: string }) =>
      api.patch(`/admin/disputes/${vars.id}/resolve`, vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'disputes'] }),
  })

  // 처리 다이얼로그 — 청구 맥락을 유지한 채 사유를 입력받는다(native prompt 대체)
  const [acting, setActing] = useState<{ dispute: DisputeRow; status: ResolveStatus } | null>(null)
  const [note, setNote] = useState('')

  function start(dispute: DisputeRow, status: ResolveStatus) {
    setNote('')
    setActing({ dispute, status })
  }

  async function submit() {
    if (!acting) return
    if (note.trim().length < 2) {
      toast.error('처리 사유를 입력해주세요')
      return
    }
    try {
      await resolve.mutateAsync({ id: acting.dispute.id, status: acting.status, resolution: note })
      toast.success('처리 완료')
      setActing(null)
    } catch {
      toast.error('처리에 실패했어요')
    }
  }

  return (
    <AdminShell title="분쟁·보장 청구" description={`총 ${data?.total ?? 0}건`}>
      {!data || data.items.length === 0 ? (
        <EmptyState
          title="분쟁이 없어요"
          description="파손 보장 청구·분쟁이 접수되면 여기서 검토·해결합니다."
        />
      ) : (
        <ul className="space-y-3">
          {data.items.map((d) => {
            const open = d.status === 'OPEN' || d.status === 'UNDER_REVIEW'
            return (
              <li key={d.id}>
                <Card>
                  <CardBody className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={open ? 'warning' : 'neutral'}>
                        {DisputeStatusLabel[d.status]}
                      </Badge>
                      {d.kind === 'DAMAGE' && (
                        <Badge tone="error" soft>
                          파손 보장 청구
                        </Badge>
                      )}
                      <span className="font-mono text-xs">{d.reservationCode}</span>
                      <span className="text-sm text-[var(--color-fg-muted)]">{d.spaceTitle}</span>
                      <span className="ml-auto text-xs text-[var(--color-fg-muted)]">
                        {formatDateTimeKR(d.createdAt)}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold">{d.reason}</span>
                      {d.amountClaimedKRW != null && (
                        <span className="ml-2 text-[var(--color-fg-muted)]">
                          청구 {formatKRW(d.amountClaimedKRW)}
                          {d.coverageKRW != null && ` · 보장한도 ${formatKRW(d.coverageKRW)}`}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--color-fg-muted)] whitespace-pre-line">
                      {d.description}
                    </p>
                    <p className="text-xs text-[var(--color-fg-muted)]">청구자: {d.raisedByName}</p>
                    {d.evidencePhotoUrls.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {d.evidencePhotoUrls.slice(0, 6).map((u, i) => (
                          <img
                            key={u + i}
                            src={u}
                            alt="증빙 사진"
                            loading="lazy"
                            className="size-20 rounded-[var(--radius-md)] object-cover"
                          />
                        ))}
                      </div>
                    )}
                    {d.resolution && (
                      <p className="text-sm rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-3">
                        처리 결과: {d.resolution}
                      </p>
                    )}
                    {open && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button size="sm" onClick={() => start(d, 'RESOLVED_FAVOR_HOST')}>
                          호스트 인정
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => start(d, 'RESOLVED_FAVOR_GUEST')}
                        >
                          게스트 인정
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => start(d, 'DISMISSED')}>
                          기각
                        </Button>
                        {d.status === 'OPEN' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => start(d, 'UNDER_REVIEW')}
                          >
                            검토중으로
                          </Button>
                        )}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <Dialog
        open={!!acting}
        onOpenChange={(o) => !o && setActing(null)}
        title={acting ? `${VERDICT_LABEL[acting.status]} 처리` : ''}
        description={
          acting
            ? `${acting.dispute.reservationCode} · ${acting.dispute.spaceTitle}${acting.dispute.amountClaimedKRW != null ? ` · 청구 ${formatKRW(acting.dispute.amountClaimedKRW)}` : ''}`
            : undefined
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setActing(null)}>
              닫기
            </Button>
            <Button onClick={submit} loading={resolve.isPending}>
              {acting ? VERDICT_LABEL[acting.status] : '확정'}
            </Button>
          </>
        }
      >
        <Field label="처리 사유" helper="양측에 통지되고 감사 로그에 기록됩니다">
          <Textarea
            placeholder="판단 근거·조치 내용을 적어주세요"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
          />
        </Field>
      </Dialog>
    </AdminShell>
  )
}
