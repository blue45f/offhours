import { Link } from 'react-router-dom'
import { Calendar, Heart, MessageCircle, Sparkles } from 'lucide-react'

import { useMe } from '../store/auth'
import { Avatar } from '../components/ui/Avatar'
import { Card, CardBody } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { RecentlyViewedRow } from '../components/space/RecentlyViewedRow'

export default function MePage() {
  const me = useMe()
  if (!me) return null

  const items = [
    { to: '/me/reservations', icon: Calendar, label: '예약 내역', desc: '이전·진행 중인 예약' },
    { to: '/favorites', icon: Heart, label: '찜한 공간', desc: '관심 공간 모아보기' },
    { to: '/chat', icon: MessageCircle, label: '채팅', desc: '호스트와 대화' },
    { to: '/notifications', icon: Sparkles, label: '알림', desc: '최근 활동' },
  ]

  return (
    <div className="container-page py-8 md:py-12">
      <div className="flex items-center gap-4 mb-8">
        <Avatar src={me.avatarUrl} name={me.name} size="xl" />
        <div>
          <h1 className="text-headline serif">{me.name}님</h1>
          <p className="text-sm text-[var(--color-fg-muted)]">{me.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone="primary">
              {me.role === 'HOST'
                ? '호스트'
                : me.role === 'ADMIN' || me.role === 'SUPERADMIN'
                  ? '관리자'
                  : '게스트'}
            </Badge>
            {me.isVerified && (
              <Badge tone="success" dot>
                인증 완료
              </Badge>
            )}
            <Badge tone="neutral">신뢰 점수 {me.trustScore}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <Link key={item.to} to={item.to}>
            <Card interactive className="h-full">
              <CardBody>
                <div className="flex items-start gap-4">
                  <span className="inline-flex size-12 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    <item.icon size={20} />
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold">{item.label}</div>
                    <div className="text-sm text-[var(--color-fg-muted)]">{item.desc}</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <RecentlyViewedRow />
      </div>

      <div className="mt-10 rounded-[var(--radius-xl)] hairline bg-[var(--color-bg-elevated)] p-6">
        <h3 className="font-semibold mb-2">추천인 코드</h3>
        <p className="text-sm text-[var(--color-fg-muted)] mb-3">
          친구를 초대하면 가입 시 포인트를 받을 수 있어요.
        </p>
        <div className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] px-4 py-2 font-mono text-lg font-semibold tracking-wider">
          {me.referralCode}
        </div>
        <div className="mt-3 text-sm text-[var(--color-fg-muted)]">
          현재 포인트:{' '}
          <span className="font-semibold text-[var(--color-fg)]">
            {me.pointsKRW.toLocaleString()}P
          </span>
        </div>
      </div>
    </div>
  )
}
