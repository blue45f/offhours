import { SpaceDetailPage } from './pages/SpaceDetailPage.tsx'
import { SpaceListPage } from './pages/SpaceListPage.tsx'
import { useHashPath } from './router'
import IntroSplashScreen from './components/IntroSplashScreen.tsx'

export function App() {
  const path = useHashPath()
  const m = path.match(/^\/space\/(.+)$/)
  const content = m ? (
    <SpaceDetailPage id={decodeURIComponent(m[1])} />
  ) : (
    <SpaceListPage />
  )

  return (
    <>
      <IntroSplashScreen />
      {content}
    </>
  )
}
