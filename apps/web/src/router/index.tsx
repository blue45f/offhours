import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { lazy, Suspense, type ReactNode } from 'react'

import { AppLayout } from '../components/layout/AppLayout'
import { useAuthHydrated, useIsAdmin, useIsAuthed, useIsHost } from '../store/auth'
import { PageLoader } from '../components/layout/PageLoader'

const HomePage = lazy(() => import('../pages/HomePage'))
const SpacesPage = lazy(() => import('../pages/SpacesPage'))
const SpaceDetailPage = lazy(() => import('../pages/SpaceDetailPage'))
const ComparePage = lazy(() => import('../pages/ComparePage'))
const LoginPage = lazy(() => import('../pages/LoginPage'))
const SignupPage = lazy(() => import('../pages/SignupPage'))
const LogoutPage = lazy(() => import('../pages/LogoutPage'))
const AboutPage = lazy(() => import('../pages/AboutPage'))
const MePage = lazy(() => import('../pages/MePage'))
const MyReservationsPage = lazy(() => import('../pages/MyReservationsPage'))
const ReservationDetailPage = lazy(() => import('../pages/ReservationDetailPage'))
const FavoritesPage = lazy(() => import('../pages/FavoritesPage'))
const CollectionsPage = lazy(() => import('../pages/CollectionsPage'))
const CollectionDetailPage = lazy(() => import('../pages/CollectionDetailPage'))
const PayTokenPage = lazy(() => import('../pages/PayTokenPage'))
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
const AdminAuditPage = lazy(() => import('../pages/admin/AdminAuditPage'))
const AdminBroadcastPage = lazy(() => import('../pages/admin/AdminBroadcastPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

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
          { path: 'audit', element: lazyEl(<AdminAuditPage />) },
          { path: 'broadcast', element: lazyEl(<AdminBroadcastPage />) },
        ],
      },

      { path: '*', element: lazyEl(<NotFoundPage />) },
    ],
  },
])
