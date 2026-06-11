import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '../components/ui/Button'

/**
 * 아직 콘텐츠가 없는 푸터 링크(도움말·안전 등)의 임시 페이지. 404 대신 "준비 중"을 보여줘
 * 깨진 링크 경험을 막는다. 실제 콘텐츠가 생기면 해당 라우트를 정식 페이지로 교체.
 */
const TITLES: Record<string, string> = {
  '/help': '도움말',
  '/help/host': '호스트 가이드',
  '/help/guest': '게스트 가이드',
  '/safety': '안전·신뢰',
}

export default function ComingSoonPage() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const title = TITLES[pathname] ?? '준비 중'
  return (
    <div className="container-page py-24 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-fg-muted)]">
        Coming soon
      </p>
      <h1 className="mt-2 text-headline serif">{title}</h1>
      <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
        이 페이지는 준비 중이에요. 곧 더 알찬 내용으로 찾아뵐게요.
      </p>
      <Button className="mt-6" onClick={() => navigate('/')}>
        홈으로
      </Button>
    </div>
  )
}
