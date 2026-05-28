import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Globe2, Lock, MapPin, Share2 } from 'lucide-react'

import { SpaceCard } from '../components/space/SpaceCard'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/layout/PageLoader'
import { useCollectionBySlug } from '../features/collections/api'
import { formatDateKR } from '../utils/format'

export default function CollectionDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading, error } = useCollectionBySlug(slug)

  if (isLoading) return <PageLoader />
  if (error || !data) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={<MapPin size={20} />}
          title="컬렉션을 찾을 수 없어요"
          description="비공개 컬렉션이거나 삭제됐을 수 있어요."
        />
      </div>
    )
  }

  async function share() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ url, title: data?.name ?? '오프아워스 컬렉션' })
        return
      } catch {
        /* user-cancelled */
      }
    }
    await navigator.clipboard?.writeText(url)
    toast.success('공유 링크를 복사했어요')
  }

  return (
    <div className="container-page py-8 md:py-12">
      <div className="rounded-[var(--radius-2xl)] bg-gradient-to-br from-[var(--color-primary-soft)] to-[var(--color-accent-soft)]/40 p-7 md:p-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="min-w-0">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest ${
                data.isPublic
                  ? 'bg-[var(--color-bg-elevated)] text-[var(--color-accent)]'
                  : 'bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]'
              }`}
            >
              {data.isPublic ? (
                <>
                  <Globe2 size={10} />
                  공개 컬렉션
                </>
              ) : (
                <>
                  <Lock size={10} />
                  비공개 컬렉션
                </>
              )}
            </span>
            <h1 className="mt-3 text-display serif">
              <span className="mr-2">{data.emoji ?? '✨'}</span>
              {data.name}
            </h1>
            {data.description && (
              <p className="mt-3 max-w-2xl text-[var(--color-fg-muted)]">{data.description}</p>
            )}
            <div className="mt-5 flex items-center gap-2 text-sm text-[var(--color-fg-muted)]">
              <Avatar src={data.ownerAvatarUrl} name={data.ownerName} size="sm" />
              <span>
                <span className="font-semibold text-[var(--color-fg)]">{data.ownerName}</span>의
                컬렉션 · {data.itemCount}개 공간 · {formatDateKR(data.updatedAt)} 업데이트
              </span>
            </div>
          </div>
          <Button variant="secondary" leading={<Share2 size={14} />} onClick={share}>
            공유
          </Button>
        </div>
      </div>

      <div className="mt-8">
        {data.items.length === 0 ? (
          <EmptyState
            title="아직 담긴 공간이 없어요"
            description="둘러보기에서 마음에 드는 공간의 하트를 눌러 추가해보세요."
          />
        ) : (
          <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {data.items.map((s) => (
              <div key={s.id} className="space-y-2">
                <SpaceCard space={s} />
                {s.note && (
                  <p className="rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] px-3 py-2 text-xs text-[var(--color-fg-muted)] leading-relaxed">
                    💬 {s.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
