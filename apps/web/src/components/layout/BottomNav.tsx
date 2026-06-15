import { Calendar, Heart, Home, MessageCircle, User } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { cn } from '../../utils/cn'

const items = [
  { to: '/', icon: Home, label: '홈' },
  { to: '/spaces', icon: Calendar, label: '둘러보기' },
  { to: '/favorites', icon: Heart, label: '찜' },
  { to: '/chat', icon: MessageCircle, label: '채팅' },
  { to: '/me', icon: User, label: '마이' },
]

export function BottomNav() {
  return (
    <nav
      aria-label="주요 메뉴"
      className="md:hidden fixed bottom-0 inset-x-0 z-[var(--z-sticky)] glass border-t border-[var(--color-border)] pb-[max(0px,env(safe-area-inset-bottom))]"
    >
      <ul className="grid grid-cols-5 h-14">
        {items.map(({ to, icon: Icon, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              // 활성 항목을 색 차이뿐 아니라 상단 인디케이터 바 + aria-current 로 명확히 알린다.
              className={({ isActive }) =>
                cn(
                  'relative h-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                  isActive
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-[var(--color-primary)]"
                    />
                  )}
                  <Icon size={20} aria-hidden />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
