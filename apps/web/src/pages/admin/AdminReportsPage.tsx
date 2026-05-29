import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { api } from '../../services/api'
import { AdminShell } from '../../components/admin/AdminShell'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardBody } from '../../components/ui/Card'
import { Dialog } from '../../components/ui/Dialog'
import { Field, Textarea } from '../../components/ui/Input'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatDateTimeKR } from '../../utils/format'

interface Report {
  id: string
  targetType: string
  targetId: string
  reason: string
  description: string
  status: string
  createdAt: string
  reporter: { id: string; name: string }
}

type ResolveStatus = 'RESOLVED' | 'DISMISSED'
const ACTION_LABEL: Record<ResolveStatus, string> = { RESOLVED: '해결', DISMISSED: '기각' }

export default function AdminReportsPage() {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => api.get<{ items: Report[]; total: number }>('/admin/reports'),
  })
  const resolve = useMutation({
    mutationFn: (vars: { id: string; status: ResolveStatus; resolution: string }) =>
      api.patch(`/admin/reports/${vars.id}/resolve`, vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  })

  // 처리 다이얼로그 — 신고 맥락을 유지한 채 사유를 입력받는다(native prompt 대체)
  const [acting, setActing] = useState<{ report: Report; status: ResolveStatus } | null>(null)
  const [note, setNote] = useState('')

  function start(report: Report, status: ResolveStatus) {
    setNote('')
    setActing({ report, status })
  }

  async function submit() {
    if (!acting) return
    if (note.trim().length < 2) {
      toast.error('처리 사유를 입력해주세요')
      return
    }
    try {
      await resolve.mutateAsync({ id: acting.report.id, status: acting.status, resolution: note })
      toast.success('처리 완료')
      setActing(null)
    } catch {
      toast.error('처리에 실패했어요')
    }
  }

  return (
    <AdminShell title="신고 관리" description={`총 ${data?.total ?? 0}건`}>
      {!data || data.items.length === 0 ? (
        <EmptyState
          title="신고가 없어요"
          description="사용자의 신고가 들어오면 여기에 표시됩니다."
        />
      ) : (
        <ul className="space-y-3">
          {data.items.map((r) => (
            <li key={r.id}>
              <Card>
                <CardBody className="flex gap-4 items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge tone={r.status === 'OPEN' ? 'warning' : 'neutral'}>{r.status}</Badge>
                      <Badge tone="neutral" soft>
                        {r.targetType}
                      </Badge>
                      <Badge tone="error" soft>
                        {r.reason}
                      </Badge>
                      <span className="ml-auto text-xs text-[var(--color-fg-muted)]">
                        {formatDateTimeKR(r.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{r.description}</p>
                    <p className="mt-2 text-xs text-[var(--color-fg-muted)]">
                      신고자: {r.reporter.name} · 대상 ID: {r.targetId}
                    </p>
                  </div>
                  {r.status !== 'RESOLVED' && r.status !== 'DISMISSED' && (
                    <div className="flex flex-col gap-2">
                      <Button size="sm" onClick={() => start(r, 'RESOLVED')}>
                        해결
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => start(r, 'DISMISSED')}>
                        기각
                      </Button>
                    </div>
                  )}
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={!!acting}
        onOpenChange={(o) => !o && setActing(null)}
        title={acting ? `${ACTION_LABEL[acting.status]} 처리` : ''}
        description={acting ? `${acting.report.targetType} · ${acting.report.reason}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setActing(null)}>
              닫기
            </Button>
            <Button onClick={submit} loading={resolve.isPending}>
              {acting ? ACTION_LABEL[acting.status] : '확정'}
            </Button>
          </>
        }
      >
        <Field label="처리 사유" helper="감사 로그에 기록됩니다">
          <Textarea
            placeholder="처리 내용 또는 기각 사유를 적어주세요"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
          />
        </Field>
      </Dialog>
    </AdminShell>
  )
}
