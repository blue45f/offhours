import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Bell, Heart, LogIn, Menu, Moon, Search, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useIsAdmin, useIsAuthed, useIsHost, useMe } from '../../store/auth'
import { useThemeStore } from '../../store/theme'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { cn } from '../../utils/cn'
import { useUnreadNotifications } from '../../features/notifications/useUnreadNotifications'
import { openCommandPalette } from '../commandPaletteEvents'

export function Header() {
  const me = useMe()
  const isAuthed = useIsAuthed()
  const isHost = useIsHost()
  const isAdmin = useIsAdmin()
  const navigate = useNavigate()
  const { theme, toggle } = useThemeStore()
  const [open, setOpen] = useState(false)
  const { data: unread = 0 } = useUnreadNotifications()

  // 계정 메뉴 열렸을 때 Esc 로 닫기(키보드 접근성)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] glass border-b border-[var(--color-border)]">
      <div className="container-page flex h-16 items-center justify-between gap-4 md:h-18">
        <Link to="/" className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="inline-flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-bold serif"
          >
            오
          </span>
          <span className="font-bold tracking-tight text-lg">Offhours</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {[
            { to: '/spaces', label: '공간 둘러보기' },
            { to: '/host', label: '호스트 되기' },
            { to: '/about', label: '서비스 소개' },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors',
                  isActive
                    ? 'text-[var(--color-fg)]'
                    : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={openCommandPalette}
            aria-label="검색 (⌘K)"
            title="검색 (⌘K)"
            className="hidden md:inline-flex size-10 items-center justify-center rounded-full text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]"
          >
            <Search size={18} />
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label="테마 전환"
            className="hidden md:inline-flex size-10 items-center justify-center rounded-full text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {isAuthed ? (
            <>
              <Link
                to="/favorites"
                aria-label="찜"
                className="hidden md:inline-flex size-10 items-center justify-center rounded-full text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]"
              >
                <Heart size={18} />
              </Link>
              <Link
                to="/notifications"
                aria-label="알림"
                className="relative hidden md:inline-flex size-10 items-center justify-center rounded-full text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]"
              >
                <Bell size={18} />
                {unread > 0 && (
                  <span className="absolute right-2 top-2 inline-flex min-w-4 h-4 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpen((o) => !o)}
                  aria-label="내 계정 메뉴"
                  aria-haspopup="menu"
                  aria-expanded={open}
                  className="flex items-center gap-2 rounded-full pl-2 pr-1 py-1 hover:bg-[var(--color-bg-subtle)]"
                >
                  <Menu size={16} className="text-[var(--color-fg-muted)]" />
                  <Avatar name={me?.name} src={me?.avatarUrl} size="sm" />
                </button>
                {open && (
                  <>
                    <button
                      type="button"
                      aria-label="메뉴 닫기"
                      tabIndex={-1}
                      onClick={() => setOpen(false)}
                      className="fixed inset-0 z-[var(--z-overlay)] cursor-default"
                    />
                    <div className="absolute right-0 mt-2 z-[var(--z-popover)] min-w-[220px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-2 shadow-[var(--shadow-popover)]">
                      <div className="px-4 py-2 text-sm">
                        <div className="font-semibold">{me?.name}</div>
                        <div className="text-xs text-[var(--color-fg-muted)]">{me?.email}</div>
                      </div>
                      <div className="my-1 h-px bg-[var(--color-border-subtle)]" />
                      <DropItem to="/me" label="마이페이지" onSelect={() => setOpen(false)} />
                      <DropItem
                        to="/me/reservations"
                        label="예약 내역"
                        onSelect={() => setOpen(false)}
                      />
                      <DropItem to="/favorites" label="찜한 공간" onSelect={() => setOpen(false)} />
                      <DropItem
                        to="/collections"
                        label="내 컬렉션"
                        onSelect={() => setOpen(false)}
                      />
                      <DropItem to="/chat" label="채팅" onSelect={() => setOpen(false)} />
                      {isHost && (
                        <>
                          <div className="my-1 h-px bg-[var(--color-border-subtle)]" />
                          <DropItem
                            to="/host"
                            label="호스트 대시보드"
                            onSelect={() => setOpen(false)}
                          />
                          <DropItem
                            to="/host/spaces"
                            label="내 공간"
                            onSelect={() => setOpen(false)}
                          />
                          <DropItem
                            to="/host/reviews"
                            label="리뷰 관리"
                            onSelect={() => setOpen(false)}
                          />
                          <DropItem
                            to="/host/calendar"
                            label="캘린더 차단"
                            onSelect={() => setOpen(false)}
                          />
                        </>
                      )}
                      {isAdmin && (
                        <>
                          <div className="my-1 h-px bg-[var(--color-border-subtle)]" />
                          <DropItem to="/admin" label="관리자" onSelect={() => setOpen(false)} />
                        </>
                      )}
                      <div className="my-1 h-px bg-[var(--color-border-subtle)]" />
                      <DropItem to="/logout" label="로그아웃" onSelect={() => setOpen(false)} />
                    </div>
                  </>
                )}
              </div>
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

function DropItem({ to, label, onSelect }: { to: string; label: string; onSelect: () => void }) {
  return (
    <Link
      to={to}
      onClick={onSelect}
      className="block px-4 py-2 text-sm text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]"
    >
      {label}
    </Link>
  )
}
