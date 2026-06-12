import { Link, useNavigate } from 'react-router-dom'
import { Building2, Calendar, Heart, MessageCircle, Moon, Sparkles, UserX } from 'lucide-react'
import toast from 'react-hot-toast'

import { REFERRAL_BONUS_KRW } from '@offhours/shared'

import { useMe } from '../store/auth'
import { useWithdrawAccount } from '../features/auth/api'
import { useThemeStore } from '../store/theme'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { Avatar } from '../components/ui/Avatar'
import { Card, CardBody } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useConfirm } from '../components/ui/ConfirmDialog'
import { RecentlyViewedRow } from '../components/space/RecentlyViewedRow'
import { cn } from '../utils/cn'
import { getErrorMessage } from '../services/api'

export default function MePage() {
  useDocumentTitle('마이페이지')
  const me = useMe()
  const { theme, toggle } = useThemeStore()
  const confirm = useConfirm()
  const navigate = useNavigate()
  const withdraw = useWithdrawAccount()
  if (!me) return null

  const handleWithdraw = async () => {
    const ok = await confirm({
      title: '계정을 탈퇴할까요?',
      description: '프로필 정보가 익명화되고 현재 로그인된 세션이 종료돼요.',
      confirmLabel: '탈퇴',
      danger: true,
    })
    if (!ok) return
    try {
      await withdraw.mutateAsync()
      toast.success('계정이 탈퇴 처리됐어요')
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(getErrorMessage(err, '탈퇴 처리에 실패했어요'))
    }
  }

  const items = [
    { to: '/me/reservations', icon: Calendar, label: '예약 내역', desc: '이전·진행 중인 예약' },
    { to: '/favorites', icon: Heart, label: '찜한 공간', desc: '관심 공간 모아보기' },
    { to: '/chat', icon: MessageCircle, label: '채팅', desc: '호스트와 대화' },
    {
      to: '/me/corporate',
      icon: Building2,
      label: '법인 결제·세금계산서',
      desc: '사내 워크샵·팀빌딩 예약',
    },
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
        {/* Header 테마 토글이 데스크톱 전용(hidden md:)이라 모바일은 여기가 유일한 전환 동선 */}
        <button
          type="button"
          role="switch"
          aria-checked={theme === 'dark'}
          aria-label="다크 모드"
          onClick={toggle}
          className="text-left"
        >
          <Card interactive className="h-full">
            <CardBody>
              <div className="flex items-start gap-4">
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                  <Moon size={20} />
                </span>
                <div className="flex-1">
                  <div className="font-semibold">다크 모드</div>
                  <div className="text-sm text-[var(--color-fg-muted)]">
                    {theme === 'dark' ? '어두운 테마 사용 중' : '밝은 테마 사용 중'}
                  </div>
                </div>
                <span
                  aria-hidden
                  className={cn(
                    'inline-flex h-6 w-10 shrink-0 self-center rounded-full p-0.5 transition-colors',
                    theme === 'dark'
                      ? 'bg-[var(--color-primary)]'
                      : 'bg-[var(--color-border-strong)]'
                  )}
                >
                  <span
                    className={cn(
                      'block size-5 rounded-full bg-white shadow-[var(--shadow-sm)] transition-transform',
                      theme === 'dark' && 'translate-x-4'
                    )}
                  />
                </span>
              </div>
            </CardBody>
          </Card>
        </button>
      </div>

      <div className="mt-12">
        <RecentlyViewedRow />
      </div>

      <div className="mt-10 rounded-[var(--radius-xl)] hairline bg-[var(--color-bg-elevated)] p-6">
        <h3 className="font-semibold mb-2">추천인 코드</h3>
        <p className="text-sm text-[var(--color-fg-muted)] mb-3">
          친구가 이 코드로 가입하면 친구와 나 모두 {REFERRAL_BONUS_KRW.toLocaleString()}P 를 받아요.
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

      <div className="mt-4 rounded-[var(--radius-xl)] hairline bg-[var(--color-bg-elevated)] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--color-error)_14%,transparent)] text-[var(--color-error)]">
              <UserX size={18} />
            </span>
            <div>
              <h3 className="font-semibold">계정 관리</h3>
              <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                탈퇴하면 개인정보가 익명화되고 모든 로그인 세션이 종료돼요.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="destructive"
            loading={withdraw.isPending}
            onClick={handleWithdraw}
            className="sm:shrink-0"
          >
            계정 탈퇴
          </Button>
        </div>
      </div>
    </div>
  )
}
