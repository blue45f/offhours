import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { lazy, Suspense, useEffect, type ReactNode } from 'react'

import { AppLayout } from '../components/layout/AppLayout'
import { useAuthHydrated, useIsAdmin, useIsAuthed, useIsHost } from '../store/auth'
import { PageLoader } from '../components/layout/PageLoader'
import { RouteError } from '../components/layout/RouteError'

const HomePage = lazy(() => import('../pages/HomePage'))
const SpacesPage = lazy(() => import('../pages/SpacesPage'))
const SpaceDetailPage = lazy(() => import('../pages/SpaceDetailPage'))
const ComparePage = lazy(() => import('../pages/ComparePage'))
const LoginPage = lazy(() => import('../pages/LoginPage'))
const SignupPage = lazy(() => import('../pages/SignupPage'))
const LogoutPage = lazy(() => import('../pages/LogoutPage'))
const AboutPage = lazy(() => import('../pages/AboutPage'))
const PricingPage = lazy(() => import('../pages/PricingPage'))
const MePage = lazy(() => import('../pages/MePage'))
const CorporatePage = lazy(() => import('../pages/CorporatePage'))
const MyReservationsPage = lazy(() => import('../pages/MyReservationsPage'))
const ReservationDetailPage = lazy(() => import('../pages/ReservationDetailPage'))
const FavoritesPage = lazy(() => import('../pages/FavoritesPage'))
const CollectionsPage = lazy(() => import('../pages/CollectionsPage'))
const CollectionDetailPage = lazy(() => import('../pages/CollectionDetailPage'))
const PayTokenPage = lazy(() => import('../pages/PayTokenPage'))
const EventHubPage = lazy(() => import('../pages/EventHubPage'))
const NotificationsPage = lazy(() => import('../pages/NotificationsPage'))
const ChatPage = lazy(() => import('../pages/ChatPage'))
const HostLandingPage = lazy(() => import('../pages/HostLandingPage'))
const HostProfilePage = lazy(() => import('../pages/HostProfilePage'))
const HostDashboardPage = lazy(() => import('../pages/HostDashboardPage'))
const HostSpacesPage = lazy(() => import('../pages/HostSpacesPage'))
const HostNewSpacePage = lazy(() => import('../pages/HostNewSpacePage'))
const HostReservationsPage = lazy(() => import('../pages/HostReservationsPage'))
const HostReviewsPage = lazy(() => import('../pages/HostReviewsPage'))
const HostCalendarPage = lazy(() => import('../pages/HostCalendarPage'))
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'))
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage'))
const AdminSpacesPage = lazy(() => import('../pages/admin/AdminSpacesPage'))
const AdminReportsPage = lazy(() => import('../pages/admin/AdminReportsPage'))
const AdminDisputesPage = lazy(() => import('../pages/admin/AdminDisputesPage'))
const AdminAuditPage = lazy(() => import('../pages/admin/AdminAuditPage'))
const AdminBroadcastPage = lazy(() => import('../pages/admin/AdminBroadcastPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))
const ComingSoonPage = lazy(() => import('../pages/ComingSoonPage'))

const TERMSDESK_BASE = 'https://termsdesk.vercel.app'
const SUPPORT_URL = `${TERMSDESK_BASE}/support/offhours`
const TERMS_URL = `${TERMSDESK_BASE}/p/offhours/terms-of-service`
const PRIVACY_URL = `${TERMSDESK_BASE}/p/offhours/privacy-policy`
const REFUND_URL = `${TERMSDESK_BASE}/p/offhours/refund-policy`

function ExternalRedirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.replace(to)
  }, [to])

  return <PageLoader />
}

function Protected({ children }: { children: ReactNode }) {
  const hydrated = useAuthHydrated()
  const isAuthed = useIsAuthed()
  if (!hydrated) return <PageLoader />
  return isAuthed ? <>{children}</> : <Navigate to="/login" replace />
}

function HostOnly({ children }: { children: ReactNode }) {
  const hydrated = useAuthHydrated()
  const isHost = useIsHost()
  if (!hydrated) return <PageLoader />
  return isHost ? <>{children}</> : <Navigate to="/host" replace />
}

function AdminOnly({ children }: { children: ReactNode }) {
  const hydrated = useAuthHydrated()
  const isAdmin = useIsAdmin()
  if (!hydrated) return <PageLoader />
  return isAdmin ? <>{children}</> : <Navigate to="/" replace />
}

function lazyEl(node: ReactNode) {
  return <Suspense fallback={<PageLoader />}>{node}</Suspense>
}

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      // 페이지 렌더 throw(또는 lazy 청크 로드 실패)를 Outlet 안에서 잡는 per-route 바운더리.
      // 루트(layout) errorElement 가 잡으면 Header/Footer 까지 통째로 RouteError 로 대체되지만,
      // 이 중첩 pathless 라우트의 errorElement 는 셸을 유지한 채 본문만 폴백으로 바꾼다.
      {
        errorElement: <RouteError />,
        children: [
          { index: true, element: lazyEl(<HomePage />) },
          { path: 'spaces', element: lazyEl(<SpacesPage />) },
          { path: 'spaces/:slug', element: lazyEl(<SpaceDetailPage />) },
          { path: 'compare', element: lazyEl(<ComparePage />) },
          { path: 'login', element: lazyEl(<LoginPage />) },
          { path: 'signup', element: lazyEl(<SignupPage />) },
          { path: 'logout', element: lazyEl(<LogoutPage />) },
          { path: 'about', element: lazyEl(<AboutPage />) },
          { path: 'host', element: lazyEl(<HostLandingPage />) },
          { path: 'pricing', element: lazyEl(<PricingPage />) },
          // 푸터가 가리키던 미작성 페이지들 — 404 대신 "준비 중" 임시 페이지로(깨진 링크 방지)
          { path: 'help', element: lazyEl(<ComingSoonPage />) },
          { path: 'help/host', element: lazyEl(<ComingSoonPage />) },
          { path: 'help/guest', element: lazyEl(<ComingSoonPage />) },
          {
            path: 'contact',
            element: lazyEl(<ExternalRedirect to={`${SUPPORT_URL}?category=site-inquiry`} />),
          },
          { path: 'terms', element: lazyEl(<ExternalRedirect to={TERMS_URL} />) },
          { path: 'privacy', element: lazyEl(<ExternalRedirect to={PRIVACY_URL} />) },
          { path: 'cancel-policy', element: lazyEl(<ExternalRedirect to={REFUND_URL} />) },
          { path: 'safety', element: lazyEl(<ComingSoonPage />) },

          {
            path: 'me',
            element: (
              <Protected>
                <Outlet />
              </Protected>
            ),
            children: [
              { index: true, element: lazyEl(<MePage />) },
              { path: 'reservations', element: lazyEl(<MyReservationsPage />) },
              { path: 'reservations/:id', element: lazyEl(<ReservationDetailPage />) },
              { path: 'corporate', element: lazyEl(<CorporatePage />) },
            ],
          },
          {
            path: 'favorites',
            element: lazyEl(
              <Protected>
                <FavoritesPage />
              </Protected>
            ),
          },
          {
            path: 'collections',
            element: lazyEl(
              <Protected>
                <CollectionsPage />
              </Protected>
            ),
          },
          // 공개 슬러그 — 로그인 없이 접근 가능. 본인 컬렉션이 비공개여도 토큰 있으면 보임
          { path: 'c/:slug', element: lazyEl(<CollectionDetailPage />) },
          // 1/N 분담 결제 청구 링크 — 토큰으로만 접근, 로그인 불필요
          { path: 'pay/:token', element: lazyEl(<PayTokenPage />) },
          // 공개 모임 허브 — 친구가 로그인 없이 초대장을 열고 RSVP
          { path: 'event/:code', element: lazyEl(<EventHubPage />) },
          {
            path: 'notifications',
            element: lazyEl(
              <Protected>
                <NotificationsPage />
              </Protected>
            ),
          },
          {
            path: 'chat',
            element: lazyEl(
              <Protected>
                <ChatPage />
              </Protected>
            ),
          },

          {
            path: 'host',
            children: [
              {
                path: 'profile',
                element: lazyEl(
                  <Protected>
                    <HostProfilePage />
                  </Protected>
                ),
              },
              {
                path: 'dashboard',
                element: lazyEl(
                  <HostOnly>
                    <HostDashboardPage />
                  </HostOnly>
                ),
              },
              {
                path: 'spaces',
                element: lazyEl(
                  <HostOnly>
                    <HostSpacesPage />
                  </HostOnly>
                ),
              },
              {
                path: 'spaces/new',
                element: lazyEl(
                  <HostOnly>
                    <HostNewSpacePage />
                  </HostOnly>
                ),
              },
              {
                path: 'reservations',
                element: lazyEl(
                  <HostOnly>
                    <HostReservationsPage />
                  </HostOnly>
                ),
              },
              {
                path: 'reviews',
                element: lazyEl(
                  <HostOnly>
                    <HostReviewsPage />
                  </HostOnly>
                ),
              },
              {
                path: 'calendar',
                element: lazyEl(
                  <HostOnly>
                    <HostCalendarPage />
                  </HostOnly>
                ),
              },
            ],
          },

          {
            path: 'admin',
            element: (
              <AdminOnly>
                <Outlet />
              </AdminOnly>
            ),
            children: [
              { index: true, element: lazyEl(<AdminDashboardPage />) },
              { path: 'users', element: lazyEl(<AdminUsersPage />) },
              { path: 'spaces', element: lazyEl(<AdminSpacesPage />) },
              { path: 'reports', element: lazyEl(<AdminReportsPage />) },
              { path: 'disputes', element: lazyEl(<AdminDisputesPage />) },
              { path: 'audit', element: lazyEl(<AdminAuditPage />) },
              { path: 'broadcast', element: lazyEl(<AdminBroadcastPage />) },
            ],
          },

          { path: '*', element: lazyEl(<NotFoundPage />) },
        ],
      },
    ],
  },
])
