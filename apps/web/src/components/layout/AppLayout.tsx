import { Outlet } from 'react-router-dom'

import { Header } from './Header'
import { Footer } from './Footer'
import { BottomNav } from './BottomNav'
import { RouteAnnouncer } from './RouteAnnouncer'
import { CompareBar } from '../space/CompareBar'

export function AppLayout() {
  return (
    <div className="min-h-full flex flex-col bg-[var(--color-bg)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[var(--color-accent)] focus:px-4 focus:py-2 focus:font-semibold focus:text-white"
      >
        본문으로 건너뛰기
      </a>
      <RouteAnnouncer />
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 pb-14 outline-none md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
      <CompareBar />
    </div>
  )
}
