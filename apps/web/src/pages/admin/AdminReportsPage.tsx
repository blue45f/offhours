import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

import { api } from '../../services/api'
import { AdminShell } from '../../components/admin/AdminShell'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardBody } from '../../components/ui/Card'
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

export default function AdminReportsPage() {
  const qc = useQueryClient()
  const { data } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => api.get<{ items: Report[]; total: number }>('/admin/reports'),
  })
  const resolve = useMutation({
    mutationFn: (vars: { id: string; status: 'RESOLVED' | 'DISMISSED'; resolution: string }) =>
      api.patch(`/admin/reports/${vars.id}/resolve`, vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  })

  async function onResolve(id: string, status: 'RESOLVED' | 'DISMISSED') {
    const resolution = prompt(status === 'RESOLVED' ? '처리 내용' : '기각 사유') ?? ''
    if (!resolution) return
    try {
      await resolve.mutateAsync({ id, status, resolution })
      toast.success('처리 완료')
    } catch {
      toast.error('실패')
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
                      <Button size="sm" onClick={() => onResolve(r.id, 'RESOLVED')}>
                        해결
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onResolve(r.id, 'DISMISSED')}
                      >
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
    </AdminShell>
  )
}
