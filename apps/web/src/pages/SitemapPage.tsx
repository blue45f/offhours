import { Link } from 'react-router-dom'

const routes = [
  '/',
  '/spaces',
  '/spaces/:slug',
  '/compare',
  '/login',
  '/signup',
  '/logout',
  '/about',
  '/host',
  '/pricing',
  '/help',
  '/help/host',
  '/help/guest',
  '/support',
  '/contact',
  '/terms',
  '/privacy',
  '/cancel-policy',
  '/safety',
  '/design',
  '/whats-new',
  '/community',
  '/me',
  '/me/reservations',
  '/me/reservations/:id',
  '/me/corporate',
  '/favorites',
  '/collections',
  '/c/:slug',
  '/pay/:token',
  '/event/:code',
  '/notifications',
  '/chat',
  '/chat/:id',
  '/host/profile',
  '/host/dashboard',
  '/host/spaces',
  '/host/spaces/new',
  '/host/reservations',
  '/host/reviews',
  '/host/calendar',
  '/admin',
  '/admin/users',
  '/admin/spaces',
  '/admin/reports',
  '/admin/disputes',
  '/admin/audit',
  '/admin/broadcast',
] as const

function labelFor(route: string) {
  if (route === '/') return '홈'
  if (route === '/design') return '디자인 시스템'
  return route.replace(/^\//, '').replaceAll('/', ' / ').replaceAll(':', '').replaceAll('-', ' ')
}

export default function SitemapPage() {
  return (
    <main className="container-page py-10 md:py-14">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 md:p-8">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--color-primary)]">
          BETA Sitemap
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Offhours 사이트맵</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-fg-muted)]">
          공간 탐색, 예약, 호스트 콘솔, 정책, 디자인 시스템까지 주요 경로를 한 화면에 정리했습니다.
        </p>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {routes.map((route) => (
          <Link
            key={route}
            to={route}
            className="grid min-h-28 gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 transition hover:border-[var(--color-primary)]"
          >
            <strong>{labelFor(route)}</strong>
            <code className="text-xs text-[var(--color-fg-muted)] [overflow-wrap:anywhere]">
              {route}
            </code>
          </Link>
        ))}
      </section>
    </main>
  )
}
