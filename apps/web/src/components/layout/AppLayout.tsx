import { Outlet } from 'react-router-dom'

import { CommandPalette } from '../CommandPalette'
import { DeskCloudWidgets } from '../deskcloud/DeskCloudWidgets'
import { FeedbackWidget } from '../feedback/FeedbackWidget'
import { CompareBar } from '../space/CompareBar'

import { BottomNav } from './BottomNav'
import { Footer } from './Footer'
import { Header } from './Header'
import { RouteAnnouncer } from './RouteAnnouncer'

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
      <CommandPalette />
      {/* SurveyDesk 피드백 위젯: 엔드포인트 env 가 설정된 경우에만 렌더(미설정=기본, 무영향). */}
      {import.meta.env.VITE_SURVEYDESK_URL && (
        <FeedbackWidget appId="offhours" endpoint={import.meta.env.VITE_SURVEYDESK_URL} />
      )}
      {/* DeskCloud 위젯(changelog·notify·search·review·chat·media·community): 각 env URL 설정 시에만 렌더. */}
      <DeskCloudWidgets />
    </div>
  )
}
