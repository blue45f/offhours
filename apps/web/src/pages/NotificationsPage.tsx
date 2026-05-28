import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Notification } from '@offhours/shared'
import { Bell } from 'lucide-react'

import { api } from '../services/api'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { Card, CardBody } from '../components/ui/Card'
import { formatDateTimeKR } from '../utils/format'
import { cn } from '../utils/cn'

export default function NotificationsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<Notification[]>('/notifications'),
  })
  const markAll = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return (
    <div className="container-page py-8 md:py-12 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-headline serif">알림</h1>
        {data && data.some((n) => !n.readAt) && (
          <Button variant="ghost" size="sm" onClick={() => markAll.mutate()}>
            모두 읽음
          </Button>
        )}
      </div>
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-[var(--radius-lg)]" />
          <Skeleton className="h-20 w-full rounded-[var(--radius-lg)]" />
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<Bell size={20} />}
          title="새 알림이 없어요"
          description="예약·메시지·시스템 알림이 여기 표시돼요."
        />
      ) : (
        <ul className="space-y-3">
          {data.map((n) => (
            <Card key={n.id} className={cn(!n.readAt && 'ring-1 ring-[var(--color-primary)]')}>
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{n.title}</div>
                    <p className="mt-1 text-sm text-[var(--color-fg-muted)] leading-relaxed">
                      {n.body}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--color-fg-subtle)] whitespace-nowrap">
                    {formatDateTimeKR(n.createdAt)}
                  </span>
                </div>
              </CardBody>
            </Card>
          ))}
        </ul>
      )}
    </div>
  )
}
