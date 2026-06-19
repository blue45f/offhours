import { LogIn, LogOut, UserRound } from 'lucide-react'
import { useState } from 'react'

import { AuthDialog, useAuth } from '../../lib/firebaseAuth'
import { cn } from '../../utils/cn'
import { Button } from '../ui/Button'

/**
 * 헤더 회원 로그인 진입점 — Firebase Auth(통합 로그인) 기반.
 *
 * 이 컨트롤은 기존 1st-party JWT 로그인(/login → 마이페이지)과 **별개**의 추가 진입점이다.
 * 로그아웃 상태면 "로그인" 버튼으로 AuthDialog 를 열고(이메일 로그인 ⇄ 가입 + 게스트로
 * 시작하기), 로그인 상태면 이메일(또는 "게스트")과 로그아웃을 보여준다.
 */
export function MemberAuthControl({ className }: { className?: string }) {
  const { user, loading, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  if (loading) {
    // 초기 onAuthStateChanged 해석 전 — 레이아웃 점프 방지용 플레이스홀더.
    return (
      <div
        aria-hidden
        className={cn(
          'skeleton h-8 w-20 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)]',
          className
        )}
      />
    )
  }

  if (!user) {
    return (
      <div className={className}>
        <Button
          variant="secondary"
          size="sm"
          leading={<LogIn size={14} />}
          onClick={() => setOpen(true)}
        >
          <span className="hidden sm:inline">로그인</span>
        </Button>
        <AuthDialog open={open} onOpenChange={setOpen} />
      </div>
    )
  }

  const label = user.isAnonymous ? '게스트' : (user.email ?? '회원')

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <span
        title={label}
        className="hidden max-w-[12rem] items-center gap-1.5 truncate rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] px-2.5 py-1 text-[0.8125rem] text-[var(--color-fg-muted)] sm:inline-flex"
      >
        <UserRound size={14} className="shrink-0 text-[var(--color-fg-subtle)]" aria-hidden />
        <span className="truncate">{label}</span>
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => void signOut()}
        aria-label={`${label} 로그아웃`}
        title="로그아웃"
        className="size-9 px-0"
      >
        <LogOut size={16} aria-hidden />
      </Button>
    </div>
  )
}
