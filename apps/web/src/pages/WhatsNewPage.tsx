/**
 * WhatsNewPage — ChangelogDesk(서비스 업데이트 소식)를 offhours 네이티브 페이지로 렌더.
 * ──────────────────────────────────────────────────────────────────────────
 * `@heejun/deskcloud` 의 pk_ 브라우저 클라이언트로 발행된 변경 이력을 받아 앱 자체
 * 컴포넌트·디자인 토큰으로 그린다(위젯 임베드 없음). 1st-party 등가 기능이 없는
 * 순수 제너릭 기능이라 네이티브 통합 대상이다.
 *
 * 라우트(/whats-new)는 VITE_CHANGELOGDESK_URL 이 설정된 경우에만 노출된다. 미설정 시
 * 데이터 훅이 비활성 → "준비 중" 안내. 푸터 링크도 env 게이트로 조건부 노출.
 */
import { Megaphone, Sparkles, Wrench, Bug } from 'lucide-react'
import { type ComponentType, type ReactElement } from 'react'

import { Skeleton } from '../components/ui/Skeleton'
import { useChangelog } from '../domains/deskcloud/api'
import { deskEnabled } from '../domains/deskcloud/clients'
import { usePageMeta } from '../hooks/usePageMeta'
import { formatDateKR } from '../utils/format'

import type { ChangelogEntry, ChangelogEntryTag } from '@heejun/deskcloud'

const TAG_META: Record<
  ChangelogEntryTag,
  { label: string; icon: ComponentType<{ size?: number }>; cls: string }
> = {
  new: {
    label: '새 기능',
    icon: Sparkles,
    cls: 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]',
  },
  improved: {
    label: '개선',
    icon: Wrench,
    cls: 'bg-[var(--color-accent-soft)] text-[var(--color-accent-strong)]',
  },
  fixed: {
    label: '버그 수정',
    icon: Bug,
    cls: 'bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]',
  },
  announcement: {
    label: '공지',
    icon: Megaphone,
    cls: 'bg-[var(--color-bg-subtle)] text-[var(--color-fg)]',
  },
}

export default function WhatsNewPage(): ReactElement {
  usePageMeta({
    title: '업데이트 소식',
    description: 'Offhours 의 새 기능·개선·공지를 모았습니다.',
  })
  const enabled = deskEnabled.changelog()
  const { data, isLoading, isError } = useChangelog(40)
  const items = data?.items ?? []

  return (
    <div className="container-page max-w-3xl py-12 md:py-20">
      <header>
        <h1 className="text-headline text-balance">업데이트 소식</h1>
        <p className="mt-2 measure text-sm leading-relaxed text-[var(--color-fg-muted)]">
          Offhours 가 어떻게 나아지고 있는지, 새 기능과 개선·공지를 한 곳에 모았어요.
        </p>
      </header>

      <div className="mt-10">
        {!enabled || (isError && items.length === 0) ? (
          <p className="rounded-[var(--radius-xl)] hairline bg-[var(--color-bg-elevated)] p-8 text-center text-sm text-[var(--color-fg-muted)]">
            아직 공유할 소식이 없어요. 곧 새로운 업데이트로 찾아올게요.
          </p>
        ) : isLoading ? (
          <ul className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="h-40 rounded-[var(--radius-xl)]" />
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <p className="rounded-[var(--radius-xl)] hairline bg-[var(--color-bg-elevated)] p-8 text-center text-sm text-[var(--color-fg-muted)]">
            아직 공유할 소식이 없어요. 곧 새로운 업데이트로 찾아올게요.
          </p>
        ) : (
          <ol className="space-y-6">
            {items.map((entry) => (
              <li key={entry.id}>
                <ChangelogCard entry={entry} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}

function ChangelogCard({ entry }: { entry: ChangelogEntry }): ReactElement {
  const meta = TAG_META[entry.tag] ?? TAG_META.announcement
  const Icon = meta.icon
  const date = entry.publishedAt ?? entry.createdAt
  return (
    <article className="rounded-[var(--radius-xl)] hairline bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-sm)] md:p-7">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-semibold ${meta.cls}`}
        >
          <Icon size={13} />
          {meta.label}
        </span>
        {entry.version && (
          <span className="text-xs font-medium text-[var(--color-fg-subtle)]">{entry.version}</span>
        )}
        <time className="ml-auto text-xs text-[var(--color-fg-subtle)]" dateTime={date}>
          {formatDateKR(date)}
        </time>
      </div>
      <h2 className="mt-3 text-title text-balance">{entry.title}</h2>
      {entry.bodyMarkdown.trim() && (
        <p className="mt-2 measure whitespace-pre-line text-sm leading-relaxed text-[var(--color-fg-muted)]">
          {entry.bodyMarkdown.trim()}
        </p>
      )}
    </article>
  )
}
