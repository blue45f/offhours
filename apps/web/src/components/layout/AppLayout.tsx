import { Outlet } from 'react-router-dom'

import { Header } from './Header'
import { Footer } from './Footer'
import { BottomNav } from './BottomNav'

export function AppLayout() {
  return (
    <div className="min-h-full flex flex-col bg-[var(--color-bg)]">
      <Header />
      <main className="flex-1 pb-14 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
