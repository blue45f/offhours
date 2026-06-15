import * as RCheckbox from '@radix-ui/react-checkbox'
import * as RSwitch from '@radix-ui/react-switch'
import * as RTooltip from '@radix-ui/react-tooltip'
import { ArrowRight, Check, Heart, Info, Mail, Moon, Search, Sparkles, Sun } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Accordion, AccordionItem } from '../components/ui/Accordion'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Button, type ButtonSize, type ButtonVariant } from '../components/ui/Button'
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { Dialog } from '../components/ui/Dialog'
import { EmptyState } from '../components/ui/EmptyState'
import { Field, Input, Textarea } from '../components/ui/Input'
import { RatingInput } from '../components/ui/RatingInput'
import { Select } from '../components/ui/Select'
import { Skeleton } from '../components/ui/Skeleton'
import { Tabs } from '../components/ui/Tabs'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useThemeStore } from '../store/theme'
import { cn } from '../utils/cn'

import type { ReactNode } from 'react'

/**
 * Living style guide — 이 프로젝트의 실제 토큰(tokens.css)과 실제 컴포넌트(components/ui)를
 * import 해 한 페이지에서 보여준다. 색·간격 값은 런타임 getComputedStyle 로 읽어 라이트/다크
 * 테마를 그대로 반영한다. 별도 팔레트를 만들지 않고 기존 OKLCH 시스템을 전시한다.
 */

const SECTIONS = [
  { id: 'colors', label: '색상' },
  { id: 'typography', label: '타이포그래피' },
  { id: 'spacing', label: '간격' },
  { id: 'radii', label: '모서리' },
  { id: 'elevation', label: '그림자' },
  { id: 'motion', label: '모션' },
  { id: 'components', label: '컴포넌트' },
] as const

export default function DesignSystemPage() {
  useDocumentTitle('디자인 시스템')
  const { theme, toggle } = useThemeStore()

  return (
    <div className="container-page py-10 md:py-14">
      <DesignHeader theme={theme} onToggleTheme={toggle} />

      <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-14">
        <SectionNav />

        <div className="min-w-0 space-y-20 md:space-y-24">
          <ColorSection />
          <TypographySection />
          <SpacingSection />
          <RadiiSection />
          <ElevationSection />
          <MotionSection />
          <ComponentsSection />
        </div>
      </div>
    </div>
  )
}

/* ───────────────────────── Header + nav ───────────────────────── */

function DesignHeader({ theme, onToggleTheme }: { theme: string; onToggleTheme: () => void }) {
  return (
    <header className="flex flex-col gap-6 border-b border-[var(--color-border)] pb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-[60ch]">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="serif inline-flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] font-bold text-[var(--color-primary-fg)]"
          >
            오
          </span>
          <span className="text-lg font-bold tracking-tight">offhours</span>
        </div>
        <h1 className="text-display serif mt-5 text-balance">디자인 시스템</h1>
        <p className="mt-3 text-pretty leading-relaxed text-[var(--color-fg-muted)]">
          Quiet Luxury + Korean Restraint. 올리브·시에나·웜 크림 OKLCH 토큰과 실제 UI 컴포넌트를 한
          곳에서 살펴보는 살아있는 가이드입니다.
        </p>
      </div>
      <Button
        variant="secondary"
        size="md"
        leading={theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        onClick={onToggleTheme}
        className="shrink-0"
      >
        {theme === 'dark' ? '라이트 모드' : '다크 모드'}
      </Button>
    </header>
  )
}

function SectionNav() {
  return (
    <nav aria-label="섹션 바로가기" className="lg:sticky lg:top-24 lg:self-start">
      <ul className="-mx-2 flex gap-1 overflow-x-auto scrollbar-hide lg:mx-0 lg:flex-col lg:gap-0.5 lg:overflow-visible">
        {SECTIONS.map((s) => (
          <li key={s.id} className="shrink-0">
            <a
              href={`#${s.id}`}
              className="block whitespace-nowrap rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-[var(--color-fg-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-24">
      <div className="max-w-[65ch]">
        <h2 id={`${id}-h`} className="text-headline serif text-balance">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-pretty leading-relaxed text-[var(--color-fg-muted)]">
            {description}
          </p>
        )}
      </div>
      <div className="mt-8">{children}</div>
    </section>
  )
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-4 text-sm font-semibold tracking-tight text-[var(--color-fg)]">{children}</h3>
  )
}

/* ───────────────────────── runtime token resolution ───────────────────────── */

/**
 * theme(dep) 가 바뀔 때마다 getComputedStyle 로 토큰의 실제 계산값을 다시 읽는다.
 * varNames 는 모듈 상수라 안정적이므로 deps 에 함께 넣어도 재계산을 유발하지 않는다.
 */
function useResolvedTokens(varNames: string[], dep: unknown): Record<string, string> {
  return useMemo(() => {
    void dep // 테마(dep)가 바뀔 때 계산값을 다시 읽기 위한 의존성
    if (typeof document === 'undefined') return {}
    const cs = getComputedStyle(document.documentElement)
    const out: Record<string, string> = {}
    for (const name of varNames) out[name] = cs.getPropertyValue(name).trim()
    return out
  }, [varNames, dep])
}

/* ───────────────────────── colors ───────────────────────── */

const COLOR_GROUPS: { label: string; tokens: string[] }[] = [
  {
    label: 'Olive — Primary',
    tokens: [
      '--color-primary-soft',
      '--color-primary',
      '--color-primary-hover',
      '--color-primary-active',
    ],
  },
  {
    label: 'Sienna — Accent',
    tokens: ['--color-accent-soft', '--color-accent'],
  },
  {
    label: 'Semantic — Status',
    tokens: ['--color-success', '--color-warning', '--color-error', '--color-info'],
  },
  {
    label: 'Neutral — Surface',
    tokens: [
      '--color-bg',
      '--color-bg-subtle',
      '--color-bg-elevated',
      '--color-border',
      '--color-border-strong',
    ],
  },
  {
    label: 'Neutral — Text',
    tokens: ['--color-fg', '--color-fg-muted', '--color-fg-subtle'],
  },
]

const ALL_COLOR_TOKENS = COLOR_GROUPS.flatMap((g) => g.tokens)

function ColorSection() {
  const theme = useThemeStore((s) => s.theme)
  const resolved = useResolvedTokens(ALL_COLOR_TOKENS, theme)

  return (
    <Section
      id="colors"
      title="색상"
      description="역할별 시맨틱 토큰. 각 스와치는 토큰명과 현재 테마에서 계산된 실제 값을 함께 보여줍니다. 다크 모드로 전환하면 값이 즉시 반영됩니다."
    >
      <div className="space-y-10">
        {COLOR_GROUPS.map((group) => (
          <div key={group.label}>
            <GroupLabel>{group.label}</GroupLabel>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
              {group.tokens.map((token) => (
                <Swatch key={token} token={token} value={resolved[token] ?? ''} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function Swatch({ token, value }: { token: string; value: string }) {
  const name = token.replace('--color-', '')
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
      <div
        className="h-16 w-full border-b border-[var(--color-border-subtle)]"
        style={{ background: `var(${token})` }}
      />
      <div className="px-3 py-2.5">
        <code className="block truncate text-xs font-medium text-[var(--color-fg)]">{name}</code>
        <code className="mt-0.5 block truncate text-[11px] text-[var(--color-fg-subtle)]">
          {value || '—'}
        </code>
      </div>
    </div>
  )
}

/* ───────────────────────── typography ───────────────────────── */

const TYPE_SCALE: { cls: string; label: string; sample: string; meta: string }[] = [
  {
    cls: 'text-display serif',
    label: 'Display',
    sample: '비어 있던 그 시간',
    meta: 'serif · clamp 2.25→3.75rem · 700',
  },
  {
    cls: 'text-headline serif',
    label: 'Headline',
    sample: '가장 멋진 공간이 됩니다',
    meta: 'serif · clamp 1.75→2.5rem · 700',
  },
  {
    cls: 'text-title font-semibold',
    label: 'Title',
    sample: '영업 외 시간 전문 매칭',
    meta: 'clamp 1.375→1.625rem · 600',
  },
  {
    cls: 'text-body',
    label: 'Body',
    sample: '필요한 시간만큼 공간을 통째로 빌립니다.',
    meta: 'clamp 1→1.0625rem · 1.55',
  },
  {
    cls: 'text-meta',
    label: 'Meta',
    sample: '서울 성수 · 4.9 (128) · 즉시 예약',
    meta: 'clamp 0.75→0.8125rem · muted',
  },
]

function TypographySection() {
  return (
    <Section
      id="typography"
      title="타이포그래피"
      description="본문은 Pretendard, 강조 헤딩은 Noto Serif KR 을 대비 축으로 짝지어 씁니다. 코드는 JetBrains Mono."
    >
      <div className="space-y-10">
        <div>
          <GroupLabel>글꼴</GroupLabel>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            <FontCard label="Sans · Pretendard" className="font-sans" />
            <FontCard label="Serif · Noto Serif KR" className="serif" />
            <FontCard label="Mono · JetBrains Mono" className="font-mono" sample="Aa 가 1234 ()" />
          </div>
        </div>

        <div>
          <GroupLabel>타입 스케일</GroupLabel>
          <div className="divide-y divide-[var(--color-border-subtle)] rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
            {TYPE_SCALE.map((t) => (
              <div
                key={t.label}
                className="flex flex-col gap-2 p-5 md:flex-row md:items-baseline md:justify-between md:gap-6"
              >
                <span className={cn('min-w-0 break-keep', t.cls)}>{t.sample}</span>
                <span className="shrink-0 text-xs text-[var(--color-fg-subtle)]">
                  <span className="font-semibold text-[var(--color-fg-muted)]">{t.label}</span>
                  {' · '}
                  {t.meta}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <GroupLabel>본문 가독 폭 (65–75ch)</GroupLabel>
          <p className="text-body max-w-[68ch] text-pretty leading-relaxed text-[var(--color-fg)]">
            Offhours는 카페·바·레스토랑·갤러리가 영업하지 않는 시간을 파티·스몰웨딩·모임·팝업·촬영
            같은 모임 공간으로 매칭하는 양면시장 플랫폼입니다. 호스트는 부가 수익과 본업 노출을
            얻고, 게스트는 평소엔 만날 수 없던 감성 공간을 합리적으로 통대관할 수 있어요. 한 줄의
            길이를 65–75자 사이로 유지해 눈의 이동 거리를 줄이고 긴 글의 가독성을 지킵니다.
          </p>
        </div>
      </div>
    </Section>
  )
}

function FontCard({
  label,
  className,
  sample = '비어 있던 그 시간 Aa',
}: {
  label: string
  className: string
  sample?: string
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5">
      <span className="text-xs font-medium text-[var(--color-fg-subtle)]">{label}</span>
      <p className={cn('mt-2 text-2xl text-[var(--color-fg)]', className)}>{sample}</p>
    </div>
  )
}

/* ───────────────────────── spacing ───────────────────────── */

// tokens.css 에 간격 토큰이 별도로 없으므로(Tailwind 4 기본 스케일 사용) 실사용 4px 베이스 램프를 전시.
const SPACING = [
  { label: '1', px: 4 },
  { label: '2', px: 8 },
  { label: '3', px: 12 },
  { label: '4', px: 16 },
  { label: '6', px: 24 },
  { label: '8', px: 32 },
  { label: '12', px: 48 },
  { label: '16', px: 64 },
]

function SpacingSection() {
  return (
    <Section
      id="spacing"
      title="간격"
      description="4px 베이스의 Tailwind 스케일을 일관되게 사용합니다. 리듬을 위해 섹션 간격은 더 크게 둡니다."
    >
      <div className="space-y-2.5">
        {SPACING.map((s) => (
          <div key={s.label} className="flex items-center gap-4">
            <code className="w-16 shrink-0 text-xs text-[var(--color-fg-muted)]">
              {s.label} · {s.px}px
            </code>
            <div
              className="h-6 rounded-[var(--radius-sm)] bg-[var(--color-primary-soft)]"
              style={{ width: s.px }}
            />
          </div>
        ))}
      </div>
    </Section>
  )
}

/* ───────────────────────── radii ───────────────────────── */

const RADII = [
  '--radius-xs',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-xl',
  '--radius-2xl',
  '--radius-pill',
]

function RadiiSection() {
  const theme = useThemeStore((s) => s.theme)
  const resolved = useResolvedTokens(RADII, theme)
  return (
    <Section
      id="radii"
      title="모서리"
      description="컴포넌트 크기에 맞춰 둥글기를 단계적으로 적용합니다."
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
        {RADII.map((token) => (
          <div key={token} className="flex flex-col items-center gap-2.5">
            <div
              className="h-20 w-full border border-[var(--color-border-strong)] bg-[var(--color-primary-soft)]"
              style={{ borderRadius: `var(${token})` }}
            />
            <div className="text-center">
              <code className="block text-xs font-medium text-[var(--color-fg)]">
                {token.replace('--radius-', '')}
              </code>
              <code className="block text-[11px] text-[var(--color-fg-subtle)]">
                {resolved[token] || '—'}
              </code>
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

/* ───────────────────────── elevation ───────────────────────── */

const SHADOWS = ['--shadow-sm', '--shadow-md', '--shadow-lg', '--shadow-xl']

function ElevationSection() {
  return (
    <Section
      id="elevation"
      title="그림자"
      description="표면의 높낮이를 나타내는 4단계 그림자. 카드는 sm, 팝오버는 md, 모달은 xl 을 씁니다."
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-5">
        {SHADOWS.map((token) => (
          <div
            key={token}
            className="rounded-[var(--radius-xl)] bg-[var(--color-bg-elevated)] p-6"
            style={{ boxShadow: `var(${token})` }}
          >
            <code className="text-sm font-medium text-[var(--color-fg)]">
              {token.replace('--shadow-', 'shadow-')}
            </code>
          </div>
        ))}
      </div>
    </Section>
  )
}

/* ───────────────────────── motion ───────────────────────── */

const DURATIONS = ['--duration-fast', '--duration-base', '--duration-slow']
const EASINGS = ['--easing-standard', '--easing-emphasized', '--easing-spring']

function MotionSection() {
  const theme = useThemeStore((s) => s.theme)
  const resolved = useResolvedTokens([...DURATIONS, ...EASINGS], theme)
  const [demo, setDemo] = useState('--easing-standard')
  const [tick, setTick] = useState(0)

  return (
    <Section
      id="motion"
      title="모션"
      description="의도적이고 짧은 전환만 사용합니다. 모든 모션은 prefers-reduced-motion 을 존중합니다."
    >
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <GroupLabel>지속 시간</GroupLabel>
          <ul className="space-y-1.5">
            {DURATIONS.map((token) => (
              <li key={token} className="flex items-center justify-between gap-4 text-sm">
                <code className="text-[var(--color-fg)]">{token.replace('--duration-', '')}</code>
                <code className="text-[var(--color-fg-subtle)]">{resolved[token] || '—'}</code>
              </li>
            ))}
          </ul>
          <GroupLabel>
            <span className="mt-6 block">이징</span>
          </GroupLabel>
          <ul className="space-y-1.5">
            {EASINGS.map((token) => (
              <li key={token} className="flex items-center justify-between gap-4 text-sm">
                <code className="text-[var(--color-fg)]">{token.replace('--easing-', '')}</code>
                <code className="truncate text-[var(--color-fg-subtle)]">
                  {resolved[token] || '—'}
                </code>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6">
          <GroupLabel>인터랙티브 데모</GroupLabel>
          <div className="flex flex-wrap gap-2">
            {EASINGS.map((token) => (
              <Chip
                key={token}
                selected={demo === token}
                onClick={() => {
                  setDemo(token)
                  setTick((t) => t + 1)
                }}
              >
                {token.replace('--easing-', '')}
              </Chip>
            ))}
          </div>
          <div className="mt-6 h-12 rounded-[var(--radius-pill)] bg-[var(--color-bg-subtle)] p-1.5">
            <div
              key={tick}
              className="motion-demo size-9 rounded-full bg-[var(--color-primary)]"
              style={{
                animationTimingFunction: `var(${demo})`,
                animationDuration: 'var(--duration-slow)',
              }}
            />
          </div>
          <p className="mt-3 text-xs text-[var(--color-fg-subtle)]">
            이징을 선택하면 다시 재생됩니다. reduced-motion 환경에서는 이동이 즉시 처리됩니다.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes ds-slide { from { transform: translateX(0) } to { transform: translateX(calc(100% + 100px)) } }
        .motion-demo { animation-name: ds-slide; animation-fill-mode: both; }
        @media (prefers-reduced-motion: reduce) { .motion-demo { animation-duration: 0.01ms !important; } }
      `}</style>
    </Section>
  )
}

/* ───────────────────────── components ───────────────────────── */

const BTN_VARIANTS: ButtonVariant[] = [
  'primary',
  'secondary',
  'accent',
  'outline',
  'ghost',
  'destructive',
]
const BTN_SIZES: ButtonSize[] = ['sm', 'md', 'lg', 'xl']

function ComponentsSection() {
  const [tab, setTab] = useState('all')
  const [select, setSelect] = useState('seoul')
  const [checked, setChecked] = useState(true)
  const [on, setOn] = useState(true)
  const [rating, setRating] = useState(4)
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Section
      id="components"
      title="컴포넌트"
      description="레포에서 그대로 가져온 실제 컴포넌트입니다. 각 그룹은 변형·상태를 함께 보여줍니다."
    >
      <div className="space-y-12">
        {/* Buttons */}
        <Subsection label="버튼" caption="variant × size, 상태(hover/active/disabled/loading) 포함">
          <div className="space-y-4">
            {BTN_VARIANTS.map((v) => (
              <div key={v} className="flex flex-wrap items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-[var(--color-fg-subtle)]">{v}</span>
                {BTN_SIZES.map((s) => (
                  <Button key={s} variant={v} size={s}>
                    버튼
                  </Button>
                ))}
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="w-20 shrink-0 text-xs text-[var(--color-fg-subtle)]">상태</span>
              <Button leading={<Sparkles size={15} />}>아이콘</Button>
              <Button trailing={<ArrowRight size={15} />}>다음</Button>
              <Button loading>로딩</Button>
              <Button disabled>비활성</Button>
            </div>
          </div>
        </Subsection>

        {/* Inputs */}
        <Subsection label="입력 · 필드" caption="default / focus / error / disabled + helper">
          <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
            <Field label="이메일" helper="예약 확인 메일을 보내드려요">
              <Input type="email" placeholder="you@offhours.kr" leading={<Mail size={16} />} />
            </Field>
            <Field label="검색">
              <Input placeholder="공간 이름, 지역" leading={<Search size={16} />} />
            </Field>
            <Field label="인원" error="최소 1명 이상 입력해주세요">
              <Input type="number" defaultValue={0} error />
            </Field>
            <Field label="비활성">
              <Input placeholder="수정할 수 없어요" disabled />
            </Field>
            <Field label="요청 사항" className="sm:col-span-2">
              <Textarea placeholder="호스트에게 전할 메시지를 남겨주세요" />
            </Field>
          </div>
        </Subsection>

        {/* Select / Checkbox / Switch */}
        <Subsection label="선택 컨트롤" caption="Select(포털) / Checkbox / Switch / RatingInput">
          <div className="flex flex-wrap items-end gap-8">
            <div>
              <span className="mb-1.5 block text-sm font-medium">지역</span>
              <Select
                value={select}
                onValueChange={setSelect}
                options={[
                  { value: 'seoul', label: '서울' },
                  { value: 'busan', label: '부산' },
                  { value: 'jeju', label: '제주' },
                ]}
              />
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <DsCheckbox id="ds-byob" checked={checked} onCheckedChange={setChecked} />
              <label htmlFor="ds-byob" className="cursor-pointer">
                BYOB 허용
              </label>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <DsSwitch id="ds-instant" checked={on} onCheckedChange={setOn} />
              <label htmlFor="ds-instant" className="cursor-pointer">
                즉시 예약
              </label>
            </div>
            <div>
              <span className="mb-1.5 block text-sm font-medium">별점</span>
              <RatingInput value={rating} onChange={setRating} size={22} />
            </div>
          </div>
        </Subsection>

        {/* Tabs */}
        <Subsection label="탭" caption="underline · pill 두 가지 변형">
          <div className="space-y-5">
            <Tabs
              value={tab}
              onValueChange={setTab}
              items={[
                { value: 'all', label: '전체' },
                { value: 'party', label: '파티' },
                { value: 'wedding', label: '스몰웨딩' },
              ]}
            />
            <Tabs
              variant="pill"
              value={tab}
              onValueChange={setTab}
              items={[
                { value: 'all', label: '전체' },
                { value: 'party', label: '파티' },
                { value: 'wedding', label: '스몰웨딩' },
              ]}
            />
          </div>
        </Subsection>

        {/* Badge / Chip / Avatar */}
        <Subsection label="배지 · 칩 · 아바타" caption="soft / solid 톤 · 선택 칩 · 아바타 폴백">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {(
                ['neutral', 'primary', 'accent', 'success', 'warning', 'error', 'info'] as const
              ).map((t) => (
                <Badge key={t} tone={t} dot>
                  {t}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {(['primary', 'accent', 'success', 'error'] as const).map((t) => (
                <Badge key={t} tone={t} soft={false}>
                  {t}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip leading={<Heart size={14} />}>찜</Chip>
              <Chip selected>선택됨</Chip>
              <Chip>워크샵</Chip>
              <Chip>촬영</Chip>
            </div>
            <div className="flex items-center gap-3">
              <Avatar name="김희준" size="sm" />
              <Avatar name="오프 아워" size="md" />
              <Avatar name="Studio Lumen" size="lg" />
            </div>
          </div>
        </Subsection>

        {/* Card */}
        <Subsection label="카드" caption="compound (Header / Body / Footer) · interactive">
          <div className="grid gap-5 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>성수 루프탑 바</CardTitle>
                <Badge tone="success" dot>
                  예약 가능
                </Badge>
              </CardHeader>
              <CardBody>
                <p className="text-sm leading-relaxed text-[var(--color-fg-muted)]">
                  마감 후 4시간, 노을이 지는 루프탑을 통째로. 청소 윈도우와 BYOB 정책이 포함됩니다.
                </p>
              </CardBody>
              <CardFooter>
                <Button size="sm">예약하기</Button>
                <Button size="sm" variant="ghost">
                  자세히
                </Button>
              </CardFooter>
            </Card>
            <Card interactive elevated className="p-6">
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <Sparkles size={18} />
              </span>
              <h4 className="text-title mt-4 font-semibold">interactive 카드</h4>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-fg-muted)]">
                hover 시 살짝 떠오르고 그림자가 강해집니다. reduced-motion 에서는 정적입니다.
              </p>
            </Card>
          </div>
        </Subsection>

        {/* Overlays */}
        <Subsection label="오버레이" caption="Dialog(모달) / Tooltip — 트리거 동작 확인">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => setDialogOpen(true)}>
              다이얼로그 열기
            </Button>
            <RTooltip.Provider delayDuration={150}>
              <RTooltip.Root>
                <RTooltip.Trigger asChild>
                  <Button variant="outline" leading={<Info size={15} />}>
                    툴팁 위로
                  </Button>
                </RTooltip.Trigger>
                <RTooltip.Portal>
                  <RTooltip.Content
                    sideOffset={8}
                    className="z-[var(--z-popover)] max-w-[240px] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-inverse)] px-3 py-2 text-xs text-[var(--color-fg-inverse)] shadow-[var(--shadow-popover)]"
                  >
                    포털로 렌더되어 부모 overflow 를 벗어납니다.
                    <RTooltip.Arrow className="fill-[var(--color-bg-inverse)]" />
                  </RTooltip.Content>
                </RTooltip.Portal>
              </RTooltip.Root>
            </RTooltip.Provider>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            title="예약을 확정할까요?"
            description="확정 후에는 취소 정책이 적용됩니다."
            footer={
              <>
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={() => setDialogOpen(false)}>확정</Button>
              </>
            }
          >
            <p className="text-sm leading-relaxed text-[var(--color-fg-muted)]">
              성수 루프탑 바 · 6월 20일 19:00–23:00 · 4시간 통대관.
            </p>
          </Dialog>
        </Subsection>

        {/* Accordion */}
        <Subsection label="아코디언" caption="grid-rows 트랜지션 · reduced-motion 존중">
          <Accordion type="single" collapsible defaultValue="a" className="max-w-2xl">
            <AccordionItem value="a" question="영업 외 시간이 정확히 뭔가요?">
              휴무일이나 마감 후처럼 매장이 영업하지 않는 시간대를 말합니다. 영업시간만 입력하면
              비는 시간이 자동으로 예약 슬롯이 됩니다.
            </AccordionItem>
            <AccordionItem value="b" question="청소는 어떻게 처리되나요?">
              예약 종료 후 청소 윈도우가 강제로 포함되어 다음 영업 준비까지 자연스럽게 이어집니다.
            </AccordionItem>
          </Accordion>
        </Subsection>

        {/* Feedback states */}
        <Subsection label="피드백 상태" caption="EmptyState / Skeleton">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
              <EmptyState
                title="아직 찜한 공간이 없어요"
                description="마음에 드는 공간을 찜해두면 여기서 모아볼 수 있어요."
                action={<Button size="sm">공간 둘러보기</Button>}
              />
            </div>
            <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6">
              <span className="text-xs font-medium text-[var(--color-fg-subtle)]">
                로딩 스켈레톤
              </span>
              <div className="mt-4 space-y-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton variant="text" className="w-3/4" />
                <Skeleton variant="text" className="w-1/2" />
                <div className="flex items-center gap-3 pt-1">
                  <Skeleton variant="circle" className="size-10" />
                  <Skeleton variant="text" className="w-24" />
                </div>
              </div>
            </div>
          </div>
        </Subsection>
      </div>
    </Section>
  )
}

function Subsection({
  label,
  caption,
  children,
}: {
  label: string
  caption?: string
  children: ReactNode
}) {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--color-border-subtle)] pb-2.5">
        <h3 className="text-title font-semibold">{label}</h3>
        {caption && <span className="text-xs text-[var(--color-fg-subtle)]">{caption}</span>}
      </div>
      {children}
    </div>
  )
}

/* ── Radix Checkbox / Switch wrappers (토큰 기반, Select/Tabs 와 동일한 래핑 방식) ── */

function DsCheckbox({
  id,
  checked,
  onCheckedChange,
}: {
  id?: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <RCheckbox.Root
      id={id}
      checked={checked}
      onCheckedChange={(v) => onCheckedChange(v === true)}
      className={cn(
        'inline-flex size-5 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] outline-none',
        'transition-colors duration-[var(--duration-fast)]',
        'data-[state=checked]:border-[var(--color-primary)] data-[state=checked]:bg-[var(--color-primary)]',
        'focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)]'
      )}
    >
      <RCheckbox.Indicator>
        <Check size={14} className="text-[var(--color-primary-fg)]" />
      </RCheckbox.Indicator>
    </RCheckbox.Root>
  )
}

function DsSwitch({
  id,
  checked,
  onCheckedChange,
}: {
  id?: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
}) {
  return (
    <RSwitch.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-[var(--radius-pill)] outline-none',
        'border border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)]',
        'transition-colors duration-[var(--duration-fast)]',
        'data-[state=checked]:border-[var(--color-primary)] data-[state=checked]:bg-[var(--color-primary)]',
        'focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)]'
      )}
    >
      <RSwitch.Thumb className="block size-4 translate-x-1 rounded-full bg-[var(--color-bg-elevated)] shadow-[var(--shadow-sm)] transition-transform duration-[var(--duration-fast)] ease-[var(--easing-standard)] data-[state=checked]:translate-x-6" />
    </RSwitch.Root>
  )
}
