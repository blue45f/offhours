import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { api } from '../../services/api'
import { AdminShell } from '../../components/admin/AdminShell'
import { Card, CardBody } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { usePrompt } from '../../components/ui/PromptDialog'
import { formatKRW } from '../../utils/format'

interface PendingSpace {
  id: string
  title: string
  summary: string
  basePriceKRW: number
  capacityMax: number
  photos: { url: string }[]
  venue: {
    name: string
    region: string
    district: string
    host: { user: { name: string; email: string } }
  }
}

export default function AdminSpacesPage() {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['admin', 'spaces', 'pending'],
    queryFn: () => api.get<PendingSpace[]>('/admin/spaces/pending'),
  })
  const approve = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/spaces/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'spaces'] }),
  })
  const reject = useMutation({
    mutationFn: (vars: { id: string; reason: string }) =>
      api.patch(`/admin/spaces/${vars.id}/reject`, { reason: vars.reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'spaces'] }),
  })
  const prompt = usePrompt()

  async function onApprove(id: string) {
    try {
      await approve.mutateAsync(id)
      toast.success('승인 완료')
    } catch {
      toast.error('실패')
    }
  }
  async function onReject(id: string) {
    const reason = (await prompt({ title: '공간 등록을 거절할까요?', label: '거절 사유' })) ?? ''
    if (!reason) return
    try {
      await reject.mutateAsync({ id, reason })
      toast.success('거절 완료')
    } catch {
      toast.error('실패')
    }
  }

  return (
    <AdminShell title="공간 모더레이션" description={`검토 대기 ${data?.length ?? 0}개`}>
      {!data || data.length === 0 ? (
        <EmptyState
          title="검토할 공간이 없어요"
          description="새 호스트가 등록하면 여기에 표시됩니다."
        />
      ) : (
        <ul className="space-y-3">
          {data.map((s) => (
            <li key={s.id}>
              <Card>
                <CardBody className="flex gap-4">
                  {s.photos[0] && (
                    <img
                      src={s.photos[0].url}
                      alt={s.title}
                      className="size-32 rounded-[var(--radius-lg)] object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{s.title}</h3>
                    <p className="text-sm text-[var(--color-fg-muted)] mt-1">{s.summary}</p>
                    <p className="mt-2 text-xs text-[var(--color-fg-muted)]">
                      {s.venue.region} {s.venue.district} · {s.venue.name} · 호스트{' '}
                      {s.venue.host.user.name} ({s.venue.host.user.email}) · 최대 {s.capacityMax}인
                      · {formatKRW(s.basePriceKRW)}/h
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 self-center">
                    <Button onClick={() => onApprove(s.id)}>승인</Button>
                    <Button
                      variant="ghost"
                      onClick={() => onReject(s.id)}
                      className="text-[var(--color-error)]"
                    >
                      거절
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  )
}
