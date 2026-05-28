import { useState } from 'react'
import toast from 'react-hot-toast'
import { useMutation } from '@tanstack/react-query'

import { api } from '../../services/api'
import { AdminShell } from '../../components/admin/AdminShell'
import { Card, CardBody } from '../../components/ui/Card'
import { Field, Input, Textarea } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'

export default function AdminBroadcastPage() {
  const [audience, setAudience] = useState<'ALL' | 'GUESTS' | 'HOSTS' | 'SUSPENDED'>('ALL')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const send = useMutation({
    mutationFn: () => api.post<{ count: number }>('/admin/broadcast', { audience, title, body }),
    onSuccess: (r) => toast.success(`${r.count}명에게 발송했어요`),
    onError: () => toast.error('실패'),
  })

  return (
    <AdminShell title="공지 발송" description="대상 그룹에 인앱 알림을 보냅니다.">
      <Card>
        <CardBody className="space-y-4 max-w-xl">
          <Field label="대상" required>
            <Select
              value={audience}
              onValueChange={(v) => setAudience(v as typeof audience)}
              options={[
                { value: 'ALL', label: '전체' },
                { value: 'GUESTS', label: '게스트만' },
                { value: 'HOSTS', label: '호스트만' },
                { value: 'SUSPENDED', label: '정지된 사용자' },
              ]}
            />
          </Field>
          <Field label="제목" required>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="안내 제목"
            />
          </Field>
          <Field label="본문" required>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="내용"
            />
          </Field>
          <div className="flex justify-end">
            <Button
              onClick={() => send.mutate()}
              loading={send.isPending}
              disabled={!title || !body}
            >
              발송
            </Button>
          </div>
        </CardBody>
      </Card>
    </AdminShell>
  )
}
