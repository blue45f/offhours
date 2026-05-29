import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Camera,
  Clock,
  Coffee,
  Dumbbell,
  Hammer,
  Home,
  Image,
  Music,
  Music2,
  Navigation,
  Sun,
  Users,
  UtensilsCrossed,
  Wine,
} from 'lucide-react'
import {
  VenueCategoryLabel,
  type SpaceCard as SpaceCardType,
  type VenueCategory,
} from '@offhours/shared'

import { HeroSearch } from '../components/space/HeroSearch'
import { SpaceCard } from '../components/space/SpaceCard'
import { SpaceCardGrid } from '../components/space/SpaceCardGrid'
import { UseCaseDiscovery } from '../components/space/UseCaseDiscovery'
import { ForYouSection } from '../components/space/ForYouSection'
import { useSpacesSearch } from '../features/spaces/api'
import { Button } from '../components/ui/Button'
import { Skeleton } from '../components/ui/Skeleton'
import { SEOUL_FALLBACK, useGeolocation } from '../hooks/useGeolocation'

const categories: { value: VenueCategory; icon: typeof Coffee; hue: number }[] = [
  { value: 'CAFE', icon: Coffee, hue: 40 },
  { value: 'BAR', icon: Wine, hue: 350 },
  { value: 'RESTAURANT', icon: UtensilsCrossed, hue: 25 },
  { value: 'FITNESS', icon: Dumbbell, hue: 150 },
  { value: 'DANCE', icon: Music, hue: 320 },
  { value: 'PRACTICE', icon: Music2, hue: 280 },
  { value: 'WORKSHOP', icon: Hammer, hue: 60 },
  { value: 'MEETING', icon: Users, hue: 230 },
  { value: 'STUDIO', icon: Camera, hue: 200 },
  { value: 'GALLERY', icon: Image, hue: 10 },
  { value: 'ROOFTOP', icon: Sun, hue: 90 },
  { value: 'HOUSE', icon: Home, hue: 130 },
]

export default function HomePage() {
  const geo = useGeolocation()
  const popular = useSpacesSearch({ sort: 'popular', pageSize: 8 })
  const newest = useSpacesSearch({ sort: 'newest', pageSize: 4 })
  const liveCoords = geo.coords ?? SEOUL_FALLBACK
  const live = useSpacesSearch({
    lat: liveCoords.lat,
    lng: liveCoords.lng,
    radiusKm: 10,
    liveWithinHours: 24,
    sort: 'live',
    pageSize: 4,
  })

  return (
    <>
      <Hero />

      <UseCaseDiscovery />

      <ForYouSection />

      <NowNearbySection
        usingMyLocation={geo.status === 'granted'}
        loading={live.isLoading}
        items={live.data?.items}
        onRequestLocation={() => geo.request()}
        canRequest={geo.status === 'idle' || geo.status === 'denied'}
      />

      <section className="container-page py-12 md:py-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-headline">지금 가장 사랑받는 공간</h2>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
              영업이 끝난 시간, 가장 매력적인 모임 장소가 됩니다.
            </p>
          </div>
          <Link
            to="/spaces"
            className="hidden md:inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)]"
          >
            전체 보기 <ArrowRight size={14} />
          </Link>
        </div>
        <SpaceCardGrid spaces={popular.data?.items} loading={popular.isLoading} />
      </section>

      <CategoryRow />

      <DifferentiationSection />

      <section className="container-page py-12 md:py-16">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-headline">새로 합류한 공간</h2>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
              방금 등록된 따끈한 공간들을 가장 먼저 만나보세요.
            </p>
          </div>
        </div>
        <SpaceCardGrid spaces={newest.data?.items} loading={newest.isLoading} />
      </section>

      <HostCta />
    </>
  )
}

const HERO_ROTATING_NOUNS = [
  '파티장',
  '스몰웨딩',
  '워크샵',
  '촬영장',
  '북클럽',
  '돌잔치',
  '팝업',
  '연습실',
]

function RotatingNoun() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % HERO_ROTATING_NOUNS.length), 2200)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="relative inline-flex h-[1.1em] overflow-hidden align-bottom">
      <motion.span
        key={idx}
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '-100%', opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
        className="inline-block bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-accent)] to-[#d97757] bg-clip-text text-transparent"
      >
        {HERO_ROTATING_NOUNS[idx]}
      </motion.span>
    </span>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* 화사한 그라데이션 메쉬 — 모던 라이브 느낌 */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-primary-soft)]/50 via-transparent to-transparent" />
        <div
          className="absolute -top-32 -right-32 size-[500px] rounded-full opacity-60 blur-3xl"
          style={{
            background:
              'radial-gradient(circle at center, oklch(0.78 0.14 35 / 0.55), transparent 60%)',
          }}
        />
        <div
          className="absolute top-20 -left-40 size-[420px] rounded-full opacity-55 blur-3xl"
          style={{
            background:
              'radial-gradient(circle at center, oklch(0.75 0.12 280 / 0.4), transparent 70%)',
          }}
        />
        <div
          className="absolute top-1/2 left-1/3 size-[360px] rounded-full opacity-40 blur-3xl"
          style={{
            background:
              'radial-gradient(circle at center, oklch(0.82 0.13 150 / 0.45), transparent 70%)',
          }}
        />
      </div>
      <div className="container-page pt-16 pb-12 md:pt-24 md:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
          className="max-w-3xl"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-bg-elevated)]/80 backdrop-blur-sm hairline px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
            <Clock size={12} /> 영업 외 시간 전문 공간 대여
          </span>
          <h1 className="mt-5 text-display serif leading-[1.1]">
            비어 있던 그 시간,
            <br />
            가장 멋진 <RotatingNoun />이 됩니다.
          </h1>
          <p className="mt-5 text-lg text-[var(--color-fg-muted)] max-w-2xl leading-relaxed">
            카페·바·레스토랑·갤러리의 휴무일과 영업 종료 후. 평소엔 만날 수 없던 감성 공간을
            파티·스몰웨딩·모임·팝업으로 시간 단위 통대관 하세요.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.2, 0, 0, 1] }}
          className="mt-10"
        >
          <HeroSearch />
        </motion.div>
      </div>
    </section>
  )
}

function CategoryRow() {
  return (
    <section className="container-page py-8 md:py-12">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {categories.map(({ value, icon: Icon, hue }) => (
          <Link
            key={value}
            to={`/spaces?category=${value}`}
            className="group shrink-0 flex flex-col items-center gap-2 rounded-[var(--radius-xl)] hairline bg-[var(--color-bg-elevated)] px-6 py-4 min-w-[120px] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
          >
            <span
              className="inline-flex size-10 items-center justify-center rounded-full group-hover:scale-110 transition-transform"
              style={{
                background: `oklch(0.93 0.07 ${hue})`,
                color: `oklch(0.45 0.12 ${hue})`,
              }}
            >
              <Icon size={18} />
            </span>
            <span className="text-sm font-medium">{VenueCategoryLabel[value]}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

function DifferentiationSection() {
  const items = [
    {
      title: '영업 외 시간 자동 슬롯',
      body: '호스트가 영업시간만 입력하면 휴무일·마감 후 시간이 자동으로 노출돼요.',
    },
    {
      title: '청소 시간 자동 확보',
      body: '예약 종료 후 청소 윈도우가 강제 포함, 다음 영업 준비도 안심.',
    },
    {
      title: '주류·식자재 정책 가이드',
      body: 'BYOB·외부 케이터링 룰을 토글로 선택, 게스트는 사전에 명확히 확인해요.',
    },
    {
      title: '동적 가격, 합리적인 단가',
      body: '평일 휴무, 주말 새벽, 야간 — 시간대별로 알맞은 가격이 자동 적용됩니다.',
    },
  ]
  return (
    <section className="bg-[var(--color-bg-subtle)] py-16 md:py-24">
      <div className="container-page">
        <div className="max-w-2xl">
          <span className="text-xs font-bold tracking-widest uppercase text-[var(--color-primary)]">
            Why Offhours
          </span>
          <h2 className="mt-3 text-headline">호프집 사장도, 신부도 편안하게</h2>
          <p className="mt-3 text-[var(--color-fg-muted)]">
            영업 외 시간만을 위한 도구. 부업형 호스트는 가볍게 등록하고, 게스트는 감성 공간을
            합리적으로 통대관 하세요.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="hairline rounded-[var(--radius-xl)] bg-[var(--color-bg-elevated)] p-7"
            >
              <div className="text-sm font-bold text-[var(--color-primary)] mb-2">0{i + 1}</div>
              <h3 className="text-title font-semibold">{it.title}</h3>
              <p className="mt-2 text-sm text-[var(--color-fg-muted)] leading-relaxed">{it.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function NowNearbySection({
  usingMyLocation,
  loading,
  items,
  onRequestLocation,
  canRequest,
}: {
  usingMyLocation: boolean
  loading: boolean
  items?: SpaceCardType[]
  onRequestLocation: () => void
  canRequest: boolean
}) {
  if (!loading && (!items || items.length === 0)) return null
  return (
    <section className="bg-[var(--color-bg-elevated)] border-y border-[var(--color-border)]">
      <div className="container-page py-10 md:py-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent-soft)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-[var(--color-accent)]">
              <Clock size={12} /> 라이브
            </span>
            <h2 className="mt-2 text-headline serif">지금 인근에서 비어있는 공간</h2>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)] flex items-center gap-1.5">
              {usingMyLocation ? (
                <>
                  <Navigation size={12} className="text-[var(--color-primary)]" />내 위치 기준 10km,
                  24시간 안에 시작 가능
                </>
              ) : (
                <>서울 시청 기준 10km · 위치 권한을 켜면 더 정확해져요</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canRequest && (
              <Button
                variant="secondary"
                leading={<Navigation size={14} />}
                onClick={onRequestLocation}
              >
                내 위치 사용
              </Button>
            )}
            <Link
              to="/spaces?liveWithinHours=24&sort=live"
              className="hidden md:inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)]"
            >
              전체 라이브 보기 <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[4/3] w-full rounded-[var(--radius-xl)]" />
                  <Skeleton variant="text" className="w-3/4" />
                </div>
              ))
            : items?.slice(0, 4).map((s) => <SpaceCard key={s.id} space={s} />)}
        </div>
      </div>
    </section>
  )
}

function HostCta() {
  return (
    <section className="container-page my-16 md:my-24">
      <div className="relative overflow-hidden rounded-[var(--radius-2xl)] bg-[var(--color-fg)] text-[var(--color-bg)] p-10 md:p-16">
        <div className="absolute -right-12 -top-12 size-60 rounded-full bg-[var(--color-primary)] opacity-30 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="text-xs font-bold tracking-widest uppercase opacity-60">For Hosts</span>
          <h2 className="mt-3 text-headline serif">
            우리 가게의 비어 있는 시간,
            <br />
            수익으로 바꿔보세요.
          </h2>
          <p className="mt-4 opacity-80">
            영업시간 등록 5분, 첫 예약까지 평균 48시간. 청소 SLA·정산까지 알아서 도와드려요.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/host">
              <Button variant="accent" size="lg" trailing={<ArrowRight size={16} />}>
                호스트 시작하기
              </Button>
            </Link>
            <Link to="/about">
              <Button
                variant="ghost"
                size="lg"
                className="!text-[var(--color-bg)] hover:!bg-white/10"
              >
                서비스 자세히 보기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
