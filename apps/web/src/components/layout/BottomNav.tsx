import { NavLink } from 'react-router-dom'
import { Calendar, Heart, Home, MessageCircle, User } from 'lucide-react'

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
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-[var(--z-sticky)] glass border-t border-[var(--color-border)] pb-[max(0px,env(safe-area-inset-bottom))]">
      <ul className="grid grid-cols-5 h-14">
        {items.map(({ to, icon: Icon, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'h-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium',
                  isActive ? 'text-[var(--color-fg)]' : 'text-[var(--color-fg-muted)]'
                )
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
