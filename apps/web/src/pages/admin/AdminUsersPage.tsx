import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import type { AdminUserRow, Paginated, Role } from '@offhours/shared'

import { api, getErrorMessage } from '../../services/api'
import { AdminShell } from '../../components/admin/AdminShell'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { formatDateKR } from '../../utils/format'
import { useMe } from '../../store/auth'

export default function AdminUsersPage() {
  const [q, setQ] = useState('')
  // Radix Select 는 빈 문자열 value 를 던지므로 'ALL' 센티넬 사용(빈 옵션 = 앱 전체 크래시 방지)
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL')
  const me = useMe()
  const qc = useQueryClient()
  const canManageRoles = me?.role === 'SUPERADMIN'

  const { data } = useQuery({
    queryKey: ['admin', 'users', q, roleFilter],
    queryFn: () =>
      api.get<Paginated<AdminUserRow>>('/admin/users', {
        params: {
          q: q || undefined,
          role: roleFilter === 'ALL' ? undefined : roleFilter,
          pageSize: 40,
        },
      }),
  })

  const suspend = useMutation({
    mutationFn: (vars: { id: string; suspended: boolean }) =>
      api.patch(`/admin/users/${vars.id}/suspend`, { suspended: vars.suspended }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  const changeRole = useMutation({
    mutationFn: (vars: { id: string; role: Role }) =>
      api.patch(`/admin/users/${vars.id}/role`, { role: vars.role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  return (
    <AdminShell
      title="사용자 관리"
      description={data ? `총 ${data.total.toLocaleString()}명` : '...'}
    >
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="이름 또는 이메일"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1"
        />
        <Select
          value={roleFilter}
          onValueChange={(v) => setRoleFilter(v as Role | 'ALL')}
          options={[
            { value: 'ALL', label: '전체 역할' },
            { value: 'USER', label: 'USER' },
            { value: 'HOST', label: 'HOST' },
            { value: 'ADMIN', label: 'ADMIN' },
            { value: 'SUPERADMIN', label: 'SUPERADMIN' },
          ]}
          className="min-w-[160px]"
        />
      </div>
      <div className="rounded-[var(--radius-xl)] hairline bg-[var(--color-bg-elevated)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-bg-subtle)] text-xs text-[var(--color-fg-muted)] uppercase">
            <tr>
              <Th>이름</Th>
              <Th>이메일</Th>
              <Th>역할</Th>
              <Th>상태</Th>
              <Th>가입일</Th>
              <Th>예약</Th>
              <Th>액션</Th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((u) => (
              <tr
                key={u.id}
                className="border-t border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-subtle)]"
              >
                <Td>{u.name}</Td>
                <Td className="text-[var(--color-fg-muted)]">{u.email}</Td>
                <Td>
                  {canManageRoles && u.id !== me?.id && !u.withdrawnAt ? (
                    <Select
                      value={u.role}
                      onValueChange={async (next) => {
                        if (next === u.role) return
                        try {
                          await changeRole.mutateAsync({ id: u.id, role: next as Role })
                          toast.success('역할을 변경했어요')
                        } catch (err) {
                          toast.error(getErrorMessage(err, '역할 변경에 실패했어요'))
                        }
                      }}
                      options={[
                        { value: 'USER', label: 'USER' },
                        { value: 'HOST', label: 'HOST' },
                        { value: 'ADMIN', label: 'ADMIN' },
                        { value: 'SUPERADMIN', label: 'SUPERADMIN' },
                      ]}
                      className="h-9 min-w-[136px]"
                    />
                  ) : (
                    <Badge tone="neutral">{u.role}</Badge>
                  )}
                </Td>
                <Td>
                  {u.withdrawnAt ? (
                    <Badge tone="neutral">탈퇴</Badge>
                  ) : u.isSuspended ? (
                    <Badge tone="error">정지</Badge>
                  ) : u.isVerified ? (
                    <Badge tone="success" dot>
                      활성
                    </Badge>
                  ) : (
                    <Badge tone="warning">미인증</Badge>
                  )}
                </Td>
                <Td>{formatDateKR(u.createdAt)}</Td>
                <Td>{u.reservationCount}</Td>
                <Td>
                  {u.withdrawnAt ? (
                    <span className="text-xs text-[var(--color-fg-muted)]">-</span>
                  ) : (
                    <Button
                      size="sm"
                      variant={u.isSuspended ? 'secondary' : 'ghost'}
                      loading={suspend.isPending}
                      onClick={async () => {
                        try {
                          await suspend.mutateAsync({ id: u.id, suspended: !u.isSuspended })
                          toast.success(u.isSuspended ? '정지 해제' : '정지')
                        } catch (err) {
                          toast.error(getErrorMessage(err, '실패'))
                        }
                      }}
                      className={!u.isSuspended ? 'text-[var(--color-error)]' : ''}
                    >
                      {u.isSuspended ? '해제' : '정지'}
                    </Button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-3 py-2.5 font-medium">{children}</th>
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 ${className ?? ''}`}>{children}</td>
}
