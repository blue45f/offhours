import { Link } from 'react-router-dom'

import { Button } from '../components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="text-xs font-bold tracking-widest uppercase text-[var(--color-primary)]">404</p>
      <h1 className="mt-3 text-headline serif text-balance">찾으시는 페이지가 없어요</h1>
      <p className="mt-3 max-w-[44ch] text-pretty leading-relaxed text-[var(--color-fg-muted)]">
        주소를 다시 확인해주세요. 우리가 도와드릴 수 있다면 좋겠어요.
      </p>
      <Link to="/" className="inline-block mt-7">
        <Button size="lg">홈으로 돌아가기</Button>
      </Link>
    </div>
  )
}
