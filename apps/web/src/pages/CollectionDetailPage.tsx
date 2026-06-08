import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Globe2, Lock, MapPin, Share2, ThumbsDown, ThumbsUp } from 'lucide-react'
import type { CollectionDetail, VoteValue } from '@offhours/shared'

import { SpaceCard } from '../components/space/SpaceCard'
import { Button } from '../components/ui/Button'
import { Avatar } from '../components/ui/Avatar'
import { EmptyState } from '../components/ui/EmptyState'
import { usePrompt } from '../components/ui/PromptDialog'
import { Skeleton } from '../components/ui/Skeleton'
import { useCastCollectionVote, useCollectionBySlug } from '../features/collections/api'
import { getErrorMessage } from '../services/api'
import { formatDateKR } from '../utils/format'
import { usePageMeta } from '../hooks/usePageMeta'
import { cn } from '../utils/cn'

const VOTER_TOKEN_KEY = 'offhours.voter.token'
const VOTER_NAME_KEY = 'offhours.voter.name'

function getOrCreateVoterToken() {
  let t = localStorage.getItem(VOTER_TOKEN_KEY)
  if (!t) {
    t = `v_${crypto.randomUUID()}`
    localStorage.setItem(VOTER_TOKEN_KEY, t)
  }
  return t
}

export default function CollectionDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [voterToken] = useState(() => getOrCreateVoterToken())
  const [voterName, setVoterName] = useState<string | null>(() =>
    localStorage.getItem(VOTER_NAME_KEY)
  )
  const { data, isLoading, error } = useCollectionBySlug(slug, voterToken)
  const cast = useCastCollectionVote(slug ?? '')
  const prompt = usePrompt()

  useEffect(() => {
    if (voterName) localStorage.setItem(VOTER_NAME_KEY, voterName)
  }, [voterName])

  const tally = useMemo(() => summarizeVotes(data?.items ?? []), [data])

  usePageMeta({
    title: data?.name,
    description: data
      ? (data.description ?? `${data.ownerName}님의 공간 컬렉션 · ${data.itemCount}개 공간`)
      : undefined,
  })

  if (isLoading) return <CollectionDetailSkeleton />
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

  async function vote(favoriteId: string, value: VoteValue | null) {
    let name = voterName
    if (!name) {
      const input = (
        await prompt({
          title: '닉네임을 알려주세요',
          description: '투표 시 친구에게 보일 이름이에요.',
          label: '닉네임',
          placeholder: '예: 햇살',
        })
      )?.trim()
      if (!input) return
      name = input.slice(0, 20)
      setVoterName(name)
    }
    try {
      await cast.mutateAsync({ favoriteId, voterToken, voterName: name, vote: value })
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
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
            {data.isPublic && tally && (
              <div className="mt-5 inline-flex items-center gap-3 rounded-[var(--radius-pill)] bg-[var(--color-bg-elevated)] px-4 py-2 text-xs">
                <span className="inline-flex items-center gap-1 text-[var(--color-primary)]">
                  <ThumbsUp size={12} />
                  <span className="font-bold">{tally.totalUp}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[var(--color-fg-muted)]">
                  <ThumbsDown size={12} />
                  <span className="font-bold">{tally.totalDown}</span>
                </span>
                {tally.leader && (
                  <span className="text-[var(--color-fg-muted)] truncate max-w-[260px]">
                    · 1위{' '}
                    <span className="font-semibold text-[var(--color-fg)]">{tally.leader}</span>
                  </span>
                )}
              </div>
            )}
            {data.isPublic && (
              <p className="mt-2 text-[11px] text-[var(--color-fg-muted)]">
                {voterName ? (
                  <>
                    <span className="font-semibold text-[var(--color-fg)]">{voterName}</span> 님으로
                    투표 중 ·{' '}
                    <button
                      onClick={() => {
                        localStorage.removeItem(VOTER_NAME_KEY)
                        setVoterName(null)
                      }}
                      className="underline"
                    >
                      이름 변경
                    </button>
                  </>
                ) : (
                  '👍/👎 누르면 친구에게 보일 닉네임을 한 번만 정해주세요'
                )}
              </p>
            )}
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
                {data.isPublic && (
                  <VoteBar item={s} busy={cast.isPending} onVote={(v) => vote(s.favoriteId, v)} />
                )}
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

function VoteBar({
  item,
  busy,
  onVote,
}: {
  item: CollectionDetail['items'][number]
  busy: boolean
  onVote: (v: VoteValue | null) => void
}) {
  const my = item.votes.myVote
  return (
    <div className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] hairline px-3 py-2">
      <div className="flex gap-1.5">
        <button
          disabled={busy}
          onClick={() => onVote(my === 'UP' ? null : 'UP')}
          className={cn(
            'inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-semibold border transition-colors',
            my === 'UP'
              ? 'bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-transparent'
              : 'bg-[var(--color-bg-elevated)] border-[var(--color-border)] hover:border-[var(--color-primary)]'
          )}
        >
          <ThumbsUp size={11} />
          {item.votes.up}
        </button>
        <button
          disabled={busy}
          onClick={() => onVote(my === 'DOWN' ? null : 'DOWN')}
          className={cn(
            'inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-semibold border transition-colors',
            my === 'DOWN'
              ? 'bg-[var(--color-error)]/20 text-[var(--color-error)] border-transparent'
              : 'bg-[var(--color-bg-elevated)] border-[var(--color-border)] hover:border-[var(--color-error)]'
          )}
        >
          <ThumbsDown size={11} />
          {item.votes.down}
        </button>
      </div>
      {item.votes.voters.length > 0 && (
        <span className="text-[11px] text-[var(--color-fg-muted)] truncate min-w-0">
          {item.votes.voters.slice(0, 3).join(', ')}
          {item.votes.voters.length > 3 ? ` 외 ${item.votes.voters.length - 3}명` : ''}
        </span>
      )}
    </div>
  )
}

function summarizeVotes(items: CollectionDetail['items']) {
  if (items.length === 0) return null
  let totalUp = 0
  let totalDown = 0
  let leader = items[0]
  let leaderScore = -Infinity
  for (const it of items) {
    totalUp += it.votes.up
    totalDown += it.votes.down
    const score = it.votes.up - it.votes.down
    if (score > leaderScore) {
      leaderScore = score
      leader = it
    }
  }
  return {
    totalUp,
    totalDown,
    leader: leaderScore > 0 ? leader.title : null,
  }
}

function CollectionDetailSkeleton() {
  return (
    <div className="container-page py-8 md:py-12">
      <Skeleton className="h-44 w-full rounded-[var(--radius-2xl)] md:h-56" />
      <div className="mt-8 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[4/3] w-full rounded-[var(--radius-xl)]" />
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}
