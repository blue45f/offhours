import * as RDropdown from '@radix-ui/react-dropdown-menu'
import { Bell, Heart, LogIn, Menu, Moon, Search, Sun } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'

import { useUnreadNotifications } from '../../domains/notifications/useUnreadNotifications'
import { useIsAdmin, useIsAuthed, useIsHost, useMe } from '../../store/auth'
import { useThemeStore } from '../../store/theme'
import { cn } from '../../utils/cn'
import { openCommandPalette } from '../commandPaletteEvents'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'

import { MemberAuthControl } from './MemberAuthControl'

const NAV_ITEMS = [
  { to: '/spaces', label: '공간 둘러보기' },
  { to: '/host', label: '호스트 되기' },
  { to: '/about', label: '서비스 소개' },
  { to: '/support', label: '문의' },
] as const

/** 스크롤이 시작되면 헤어라인만 두던 헤더가 조용히 떠오른다(글래스 + 약한 그림자). */
function useScrolledPastTop(threshold = 4) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return scrolled
}

export function Header() {
  const me = useMe()
  const isAuthed = useIsAuthed()
  const isHost = useIsHost()
  const isAdmin = useIsAdmin()
  const navigate = useNavigate()
  const { theme, toggle } = useThemeStore()
  const { data: unread = 0 } = useUnreadNotifications()
  const scrolled = useScrolledPastTop()

  return (
    <header
      className={cn(
        'sticky top-0 z-[var(--z-sticky)] glass border-b transition-[box-shadow,border-color] duration-[var(--duration-base)] ease-[var(--easing-standard)]',
        scrolled ? 'border-[var(--color-border)] shadow-[var(--shadow-sm)]' : 'border-transparent'
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-3 lg:gap-4 md:h-18">
        <Link to="/" className="group flex shrink-0 items-center gap-2.5">
          <span
            aria-hidden
            className="inline-flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-bold serif transition-transform duration-[var(--duration-base)] ease-[var(--easing-standard)] group-hover:-rotate-6 group-hover:scale-105"
          >
            오
          </span>
          <span className="font-bold tracking-tight text-lg">Offhours</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'relative px-2 py-2 lg:px-3 rounded-[var(--radius-md)] text-sm font-medium whitespace-nowrap transition-colors duration-[var(--duration-fast)]',
                  isActive
                    ? 'text-[var(--color-fg)]'
                    : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && <NavActiveUnderline />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={openCommandPalette}
            aria-label="검색 (⌘K)"
            title="검색 (⌘K)"
            className="hidden md:inline-flex size-10 items-center justify-center rounded-full text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)] transition-[background,color,transform] duration-[var(--duration-fast)] ease-[var(--easing-standard)] active:scale-95"
          >
            <Search size={18} />
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            className="hidden md:inline-flex size-10 items-center justify-center rounded-full text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)] transition-[background,color,transform] duration-[var(--duration-fast)] ease-[var(--easing-standard)] active:scale-95"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <MemberAuthControl className="ml-0.5" />
          {isAuthed ? (
            <>
              <Link
                to="/favorites"
                aria-label="찜"
                className="hidden md:inline-flex size-10 items-center justify-center rounded-full text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)] transition-[background,color,transform] duration-[var(--duration-fast)] ease-[var(--easing-standard)] active:scale-95"
              >
                <Heart size={18} />
              </Link>
              <Link
                to="/notifications"
                aria-label="알림"
                className="relative hidden md:inline-flex size-10 items-center justify-center rounded-full text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)] transition-[background,color,transform] duration-[var(--duration-fast)] ease-[var(--easing-standard)] active:scale-95"
              >
                <Bell size={18} />
                {unread > 0 && (
                  <span className="absolute right-2 top-2 inline-flex min-w-4 h-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
              <RDropdown.Root>
                <RDropdown.Trigger
                  aria-label="내 계정 메뉴"
                  className="flex items-center gap-2 rounded-full pl-2 pr-1 py-1 hover:bg-[var(--color-bg-subtle)]"
                >
                  <Menu size={16} className="text-[var(--color-fg-muted)]" />
                  <Avatar name={me?.name} src={me?.avatarUrl} size="sm" />
                </RDropdown.Trigger>
                <RDropdown.Portal>
                  <RDropdown.Content
                    align="end"
                    sideOffset={8}
                    className="z-[var(--z-popover)] min-w-[220px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-2 shadow-[var(--shadow-popover)]"
                  >
                    <RDropdown.Label className="px-4 py-2 text-sm">
                      <div className="font-semibold">{me?.name}</div>
                      <div className="text-xs text-[var(--color-fg-muted)]">{me?.email}</div>
                    </RDropdown.Label>
                    <MenuSeparator />
                    <DropItem to="/me" label="마이페이지" />
                    <DropItem to="/me/reservations" label="예약 내역" />
                    <DropItem to="/favorites" label="찜한 공간" />
                    <DropItem to="/collections" label="내 컬렉션" />
                    <DropItem to="/chat" label="채팅" />
                    {isHost && (
                      <>
                        <MenuSeparator />
                        <DropItem to="/host" label="호스트 대시보드" />
                        <DropItem to="/host/spaces" label="내 공간" />
                        <DropItem to="/host/reviews" label="리뷰 관리" />
                        <DropItem to="/host/calendar" label="캘린더 차단" />
                      </>
                    )}
                    {isAdmin && (
                      <>
                        <MenuSeparator />
                        <DropItem to="/admin" label="관리자" />
                      </>
                    )}
                    <MenuSeparator />
                    <DropItem to="/logout" label="로그아웃" />
                  </RDropdown.Content>
                </RDropdown.Portal>
              </RDropdown.Root>
            </>
          ) : (
            <Button
              size="sm"
              variant="primary"
              leading={<LogIn size={14} />}
              onClick={() => navigate('/login')}
            >
              로그인
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

/** 활성 탭 밑줄 — 박스가 아니라 프라이머리 한 줄로 표시(DESIGN §5). 탭 간 이동은 공유 엘리먼트로 미끄러진다. */
function NavActiveUnderline() {
  const reduce = useReducedMotion()
  return (
    <motion.span
      layoutId={reduce ? undefined : 'nav-active-underline'}
      aria-hidden
      className="absolute inset-x-2 lg:inset-x-3 -bottom-px h-0.5 rounded-full bg-[var(--color-primary)]"
      transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
    />
  )
}

function MenuSeparator() {
  return <RDropdown.Separator className="my-1 h-px bg-[var(--color-border-subtle)]" />
}

function DropItem({ to, label }: { to: string; label: string }) {
  return (
    <RDropdown.Item asChild>
      <Link
        to={to}
        className="block cursor-pointer px-4 py-2 text-sm text-[var(--color-fg)] outline-none data-[highlighted]:bg-[var(--color-bg-subtle)]"
      >
        {label}
      </Link>
    </RDropdown.Item>
  )
}
