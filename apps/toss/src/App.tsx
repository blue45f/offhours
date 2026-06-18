import { SpaceDetailPage } from './pages/SpaceDetailPage.tsx'
import { SpaceListPage } from './pages/SpaceListPage.tsx'
import { useHashPath } from './router'

export function App() {
  const path = useHashPath()
  const m = path.match(/^\/space\/(.+)$/)
  if (m) return <SpaceDetailPage id={decodeURIComponent(m[1])} />
  return <SpaceListPage />
}
