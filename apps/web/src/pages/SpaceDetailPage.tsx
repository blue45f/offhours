import { useParams } from 'react-router-dom'
import {
  AlcoholPolicyLabel,
  CateringPolicyLabel,
  USE_CASE_META,
  VenueCategoryLabel,
  formatResponseTimeBadge,
  formatTrustTier,
  type UseCase,
} from '@offhours/shared'
import { Heart, MapPin, MessageCircle, ShieldCheck, Share2, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'

import { useNearbyBundle, useSpaceDetail, useSpaceReviews } from '../features/spaces/api'
import { SpaceCard } from '../components/space/SpaceCard'
import { useToggleFavorite, useFavoriteIds } from '../features/favorites/api'
import { StarRating } from '../components/ui/StarRating'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { ReservationPanel } from '../components/reservation/ReservationPanel'
import { Skeleton } from '../components/ui/Skeleton'
import { formatDateKR } from '../utils/format'

export default function SpaceDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading } = useSpaceDetail(slug)
  const { data: reviews } = useSpaceReviews(data?.id)
  const { data: favoriteIds = [] } = useFavoriteIds()
  const toggle = useToggleFavorite()
  const isFavorited = data ? favoriteIds.includes(data.id) : false

  if (isLoading || !data) return <DetailSkeleton />

  return (
    <div className="container-page py-8 md:py-12">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 text-meta">
            <MapPin size={12} />
            {data.region} {data.district} · {VenueCategoryLabel[data.category]}
          </div>
          <h1 className="mt-2 text-headline serif">{data.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            {data.ratingCount > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <StarRating value={data.ratingAvg} showValue size={14} />
                <span className="text-[var(--color-fg-muted)]">({data.ratingCount}개)</span>
              </span>
            )}
            <span className="text-[var(--color-fg-muted)]">최대 {data.capacityMax}명</span>
            {data.instantBook && <Badge tone="accent">즉시 예약</Badge>}
          </div>
          {data.useCases && data.useCases.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-fg-muted)] mr-1">
                이런 모임에 좋아요
              </span>
              {data.useCases.slice(0, 5).map((c) => {
                const meta = USE_CASE_META[c as UseCase]
                if (!meta) return null
                return (
                  <Link
                    key={c}
                    to={`/spaces?useCases=${c}`}
                    className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] px-2.5 py-1 text-xs font-medium hover:bg-[var(--color-primary)] hover:text-[var(--color-primary-fg)] transition-colors"
                  >
                    <span aria-hidden>{meta.emoji}</span>
                    {meta.label}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
        <div className="hidden md:flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            leading={<Share2 size={14} />}
            onClick={() => {
              navigator.share?.({ url: window.location.href, title: data.title }).catch(() => null)
            }}
          >
            공유
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leading={
              <Heart
                size={14}
                className={
                  isFavorited ? 'fill-[var(--color-accent)] text-[var(--color-accent)]' : ''
                }
              />
            }
            onClick={() => toggle.mutate(data.id)}
          >
            {isFavorited ? '찜 해제' : '찜하기'}
          </Button>
        </div>
      </div>

      <Gallery photos={data.photos} title={data.title} />

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10">
        <div className="space-y-10">
          <section>
            <div className="flex items-center gap-3">
              <Avatar src={data.venue.host.avatarUrl} name={data.venue.host.name} size="lg" />
              <div className="flex-1">
                <h2 className="font-semibold">
                  {data.venue.host.name} 호스트의 {data.venue.name}
                </h2>
                <p className="text-sm text-[var(--color-fg-muted)]">
                  운영 {data.venue.host.hostedCount}회
                </p>
                {(() => {
                  const badge = formatResponseTimeBadge({
                    medianMin: data.avgApprovalMin ?? null,
                    rate24h: data.responseRate24h ?? null,
                    sampleCount: data.responseSampleCount ?? null,
                  })
                  return badge ? (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--color-fg-muted)]">
                      <MessageCircle size={12} />
                      {badge}
                    </p>
                  ) : null
                })()}
                {data.venue.host.reviewResponseRate != null &&
                  data.venue.host.reviewSampleCount >= 2 && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--color-fg-muted)]">
                      <ShieldCheck size={12} />
                      후기 답글률{' '}
                      <span className="font-semibold text-[var(--color-primary)]">
                        {Math.round(data.venue.host.reviewResponseRate * 100)}%
                      </span>{' '}
                      ({data.venue.host.reviewSampleCount}건)
                    </p>
                  )}
              </div>
            </div>
            <TrustGauge score={data.venue.host.trustScore} />
          </section>

          <Divider />

          <section>
            <h3 className="text-title font-semibold mb-3">이 공간에 대해</h3>
            <p className="whitespace-pre-line text-[var(--color-fg)] leading-relaxed">
              {data.description}
            </p>
          </section>

          <Divider />

          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Spec label="수용 인원" value={`${data.capacityMin}~${data.capacityMax}명`} />
            {data.areaM2 && <Spec label="면적" value={`${data.areaM2}㎡`} />}
            <Spec label="최소 예약" value={`${data.minHours}시간`} />
            <Spec label="청소 시간" value={`${data.cleaningMinutes}분`} />
          </section>

          <Divider />

          <section>
            <h3 className="text-title font-semibold mb-3">이용 규칙</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Rule label="주류" value={AlcoholPolicyLabel[data.alcoholPolicy]} />
              <Rule label="식음료" value={CateringPolicyLabel[data.cateringPolicy]} />
            </div>
            {data.rules && (
              <p className="mt-4 whitespace-pre-line rounded-[var(--radius-lg)] bg-[var(--color-bg-subtle)] p-4 text-sm text-[var(--color-fg-muted)] leading-relaxed">
                {data.rules}
              </p>
            )}
          </section>

          <Divider />

          <section>
            <h3 className="text-title font-semibold mb-3">편의시설</h3>
            <div className="flex flex-wrap gap-2">
              {data.amenities.length === 0 ? (
                <span className="text-sm text-[var(--color-fg-muted)]">등록된 항목 없음</span>
              ) : (
                data.amenities.map((a) => (
                  <Badge key={a} tone="neutral" soft>
                    {a}
                  </Badge>
                ))
              )}
            </div>
          </section>

          <Divider />

          <section>
            <h3 className="text-title font-semibold mb-3">위치</h3>
            <div className="rounded-[var(--radius-xl)] hairline bg-[var(--color-bg-subtle)] aspect-video flex items-center justify-center text-[var(--color-fg-muted)]">
              <MapPin size={20} className="mr-2" /> {data.venue.addressRoad}
            </div>
            <p className="mt-3 text-xs text-[var(--color-fg-subtle)]">
              정확한 주소는 결제 완료 후 공개됩니다.
            </p>
          </section>

          <Divider />

          <NearbyBundleSection slug={slug} />

          <Divider />

          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-title font-semibold">리뷰</h3>
              {data.ratingCount > 0 && (
                <span className="text-sm text-[var(--color-fg-muted)]">
                  평점 {data.ratingAvg.toFixed(1)} · {data.ratingCount}개
                </span>
              )}
            </div>
            {reviews?.items.length === 0 ? (
              <p className="text-sm text-[var(--color-fg-muted)]">
                아직 리뷰가 없어요. 첫 리뷰의 주인공이 되어주세요.
              </p>
            ) : (
              <ul className="space-y-6">
                {reviews?.items.map((r) => (
                  <li key={r.id} className="hairline rounded-[var(--radius-xl)] p-5">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.authorName} src={r.authorAvatarUrl} size="sm" />
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold">{r.authorName}</div>
                          <StarRating value={r.rating} size={12} />
                        </div>
                        <span className="text-xs text-[var(--color-fg-muted)]">
                          {formatDateKR(r.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed whitespace-pre-line">{r.comment}</p>
                    {r.hostResponse && (
                      <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] p-3">
                        <div className="text-xs font-semibold text-[var(--color-primary)] mb-1">
                          호스트 답변
                        </div>
                        <p className="text-sm whitespace-pre-line">{r.hostResponse}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 self-start">
          <ReservationPanel space={data} />
        </aside>
      </div>
    </div>
  )
}

function TrustGauge({ score }: { score: number }) {
  const tier = formatTrustTier(score)
  const toneClass =
    tier.key === 'top'
      ? 'bg-[var(--color-primary)]'
      : tier.key === 'excellent'
        ? 'bg-[var(--color-primary)]/85'
        : tier.key === 'good'
          ? 'bg-[var(--color-primary)]/65'
          : tier.key === 'normal'
            ? 'bg-[var(--color-fg-muted)]/50'
            : 'bg-[var(--color-warning)]'
  const labelTone =
    tier.key === 'caution' ? 'text-[var(--color-warning)]' : 'text-[var(--color-primary)]'
  return (
    <div className="mt-4 hairline rounded-[var(--radius-lg)] bg-[var(--color-bg-elevated)] p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <ShieldCheck size={14} className={labelTone} />
          호스트 신뢰 <span className={labelTone}>{tier.label}</span>
        </span>
        <span className="font-mono text-xs text-[var(--color-fg-muted)]">{score} / 100</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-subtle)]">
        <div
          className={`h-full rounded-full ${toneClass} transition-[width]`}
          style={{ width: `${Math.round(tier.progress * 100)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-[var(--color-fg-muted)]">
        {tier.hint} · 평점·취소·응답률에 따라 실시간으로 갱신돼요
      </p>
    </div>
  )
}

function NearbyBundleSection({ slug }: { slug?: string }) {
  const { data, isLoading } = useNearbyBundle(slug, 1, 4)
  if (!isLoading && (!data || data.length === 0)) return null
  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h3 className="text-title font-semibold">이 동네 동선 후보</h3>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            걸어서 갈 수 있는 1km 안의 다른 공간. 1차 다이닝 → 2차 통대관처럼 묶어서 예약하기
            좋아요.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-[var(--radius-xl)]" />
                <Skeleton variant="text" className="w-3/4" />
              </div>
            ))
          : data?.map((s) => <SpaceCard key={s.id} space={s} />)}
      </div>
    </section>
  )
}

function Gallery({
  photos,
  title,
}: {
  photos: { url: string; alt: string | null }[]
  title: string
}) {
  if (photos.length === 0) {
    return (
      <div className="aspect-[16/9] w-full rounded-[var(--radius-2xl)] bg-[var(--color-bg-subtle)]" />
    )
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-2 rounded-[var(--radius-2xl)] overflow-hidden">
      <img
        src={photos[0].url}
        alt={photos[0].alt ?? title}
        className="col-span-2 row-span-2 size-full object-cover aspect-[4/3]"
      />
      {photos.slice(1, 5).map((p) => (
        <img
          key={p.url}
          src={p.url}
          alt={p.alt ?? title}
          className="size-full object-cover aspect-[4/3] hidden md:block"
        />
      ))}
    </div>
  )
}

function Divider() {
  return <hr className="border-[var(--color-border-subtle)]" />
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] hairline bg-[var(--color-bg-elevated)] p-4">
      <div className="text-xs text-[var(--color-fg-muted)] font-medium">{label}</div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  )
}

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] hairline bg-[var(--color-bg-elevated)] p-4">
      <div className="text-xs text-[var(--color-fg-muted)] font-medium flex items-center gap-1.5">
        <Sparkles size={12} /> {label}
      </div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="container-page py-12 space-y-8">
      <Skeleton variant="text" className="h-8 w-1/2" />
      <Skeleton className="aspect-[16/9] w-full rounded-[var(--radius-2xl)]" />
      <Skeleton variant="text" className="w-1/3" />
      <Skeleton variant="text" className="w-4/5" />
    </div>
  )
}
