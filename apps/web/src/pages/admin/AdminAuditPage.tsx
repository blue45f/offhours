import { useQuery } from '@tanstack/react-query'
import type { AuditLogRow } from '@offhours/shared'

import { api } from '../../services/api'
import { AdminShell } from '../../components/admin/AdminShell'
import { Badge } from '../../components/ui/Badge'
import { formatDateTimeKR } from '../../utils/format'

export default function AdminAuditPage() {
  const { data } = useQuery({
    queryKey: ['admin', 'audit'],
    queryFn: () => api.get<{ items: AuditLogRow[]; total: number }>('/admin/audit'),
  })
  return (
    <AdminShell title="감사 로그" description="관리자의 모든 액션이 여기에 기록됩니다.">
      <div className="rounded-[var(--radius-xl)] hairline bg-[var(--color-bg-elevated)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-bg-subtle)] text-xs text-[var(--color-fg-muted)] uppercase">
            <tr>
              <th className="text-left px-3 py-2.5 font-medium">시각</th>
              <th className="text-left px-3 py-2.5 font-medium">관리자</th>
              <th className="text-left px-3 py-2.5 font-medium">액션</th>
              <th className="text-left px-3 py-2.5 font-medium">대상</th>
              <th className="text-left px-3 py-2.5 font-medium">IP</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((a) => (
              <tr key={a.id} className="border-t border-[var(--color-border-subtle)]">
                <td className="px-3 py-2.5">{formatDateTimeKR(a.createdAt)}</td>
                <td className="px-3 py-2.5">{a.actorName}</td>
                <td className="px-3 py-2.5">
                  <Badge tone="neutral">{a.action}</Badge>
                </td>
                <td className="px-3 py-2.5 text-[var(--color-fg-muted)] font-mono text-xs">
                  {a.targetType}:{a.targetId.slice(0, 8)}…
                </td>
                <td className="px-3 py-2.5 text-[var(--color-fg-muted)] text-xs">{a.ip ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  )
}
