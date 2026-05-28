import { FolderHeart, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'

import { SpaceCardGrid } from '../components/space/SpaceCardGrid'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { useFavorites } from '../features/favorites/api'

export default function FavoritesPage() {
  const { data, isLoading } = useFavorites()
  return (
    <div className="container-page py-8 md:py-12">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-headline serif">찜한 공간</h1>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            폴더로 정리하고 친구와 공유하려면 컬렉션을 사용하세요.
          </p>
        </div>
        <Link to="/collections">
          <Button variant="secondary" leading={<FolderHeart size={14} />}>
            내 컬렉션
          </Button>
        </Link>
      </div>
      <div className="mt-8">
        {!isLoading && (!data || data.length === 0) ? (
          <EmptyState
            icon={<Heart size={20} />}
            title="아직 찜한 공간이 없어요"
            description="마음에 드는 공간 카드의 하트를 눌러보세요."
            action={
              <Link
                to="/spaces"
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-lg)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-fg)]"
              >
                공간 둘러보기
              </Link>
            }
          />
        ) : (
          <SpaceCardGrid spaces={data} loading={isLoading} />
        )}
      </div>
    </div>
  )
}
