import { NavLink } from 'react-router-dom'
import { AlertTriangle, Building2, Megaphone, ScrollText, Settings, Users } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '../../utils/cn'

const items = [
  { to: '/admin', icon: Settings, label: '대시보드', end: true },
  { to: '/admin/users', icon: Users, label: '사용자' },
  { to: '/admin/spaces', icon: Building2, label: '공간' },
  { to: '/admin/reports', icon: AlertTriangle, label: '신고' },
  { to: '/admin/audit', icon: ScrollText, label: '감사 로그' },
  { to: '/admin/broadcast', icon: Megaphone, label: '공지 발송' },
]

interface Props {
  title: string
  description?: string
  children: ReactNode
  actions?: ReactNode
}

export function AdminShell({ title, description, children, actions }: Props) {
  return (
    <div className="container-page py-6 md:py-10">
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
        <aside className="md:sticky md:top-24 md:self-start">
          <h2 className="px-3 mb-2 text-xs font-bold uppercase tracking-widest text-[var(--color-fg-muted)]">
            Admin
          </h2>
          <nav className="space-y-1">
            {items.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                      : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]'
                  )
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <section>
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-headline serif">{title}</h1>
              {description && (
                <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{description}</p>
              )}
            </div>
            {actions}
          </div>
          {children}
        </section>
      </div>
    </div>
  )
}
