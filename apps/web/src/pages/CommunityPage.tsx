/**
 * CommunityPage — CommunityDesk(커뮤니티 게시판)를 offhours 네이티브 페이지로 렌더.
 * ──────────────────────────────────────────────────────────────────────────
 * `@heejun/deskcloud` 의 pk_ 브라우저 클라이언트로 게시글 피드를 받아 앱 자체 컴포넌트
 * (Card·Dialog·Button·Field·디자인 토큰)로 그린다(위젯 임베드 없음). 1st-party 등가
 * 기능이 없는 제너릭 기능이라 네이티브 통합 대상이다.
 *
 * 작성자 식별: 로그인 사용자는 useMe id/name, 비로그인은 익명 토큰(getClientToken).
 * 라우트(/community)는 VITE_COMMUNITYDESK_URL 설정 시에만 노출(푸터 링크도 env 게이트).
 */
import { MessageSquare, PenLine, Pin, Lock, ThumbsUp } from 'lucide-react'
import { useId, useState, type ReactElement } from 'react'
import { toast } from 'sonner'

import { Button } from '../components/ui/Button'
import { Dialog } from '../components/ui/Dialog'
import { EmptyState } from '../components/ui/EmptyState'
import { Field, Input, Textarea } from '../components/ui/Input'
import { Skeleton } from '../components/ui/Skeleton'
import { useCommunityFeed, useCreateCommunityPost } from '../domains/deskcloud/api'
import { COMMUNITY_BOARD_SLUG, deskEnabled } from '../domains/deskcloud/clients'
import { getClientToken, readSavedName, saveName } from '../domains/events/clientToken'
import { usePageMeta } from '../hooks/usePageMeta'
import { useMe } from '../store/auth'
import { timeFromNow } from '../utils/format'

import type { PostSummary } from '@heejun/deskcloud'

function totalReactions(post: PostSummary): number {
  return Object.values(post.reactions).reduce<number>((sum, n) => sum + (n ?? 0), 0)
}

export default function CommunityPage(): ReactElement {
  usePageMeta({
    title: '커뮤니티',
    description: 'Offhours 호스트와 게스트가 모임 노하우와 후기를 나누는 공간이에요.',
  })
  const enabled = deskEnabled.community()
  const { data, isLoading } = useCommunityFeed(COMMUNITY_BOARD_SLUG, 30)
  const [composeOpen, setComposeOpen] = useState(false)
  const posts = data?.items ?? []

  return (
    <div className="container-page max-w-3xl py-12 md:py-20">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-headline text-balance">커뮤니티</h1>
          <p className="mt-2 measure text-sm leading-relaxed text-[var(--color-fg-muted)]">
            모임 노하우, 공간 후기, 호스트 팁을 자유롭게 나눠보세요.
          </p>
        </div>
        {enabled && (
          <Button leading={<PenLine size={16} />} onClick={() => setComposeOpen(true)}>
            글쓰기
          </Button>
        )}
      </header>

      <div className="mt-10">
        {!enabled ? (
          <EmptyState
            icon={<MessageSquare size={24} strokeWidth={1.5} />}
            title="커뮤니티 준비 중"
            description="곧 호스트와 게스트가 이야기를 나눌 수 있는 공간을 열어드릴게요."
          />
        ) : isLoading ? (
          <ul className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="h-28 rounded-[var(--radius-xl)]" />
              </li>
            ))}
          </ul>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={24} strokeWidth={1.5} />}
            title="첫 글의 주인공이 되어주세요"
            description="아직 게시글이 없어요. 모임 이야기를 먼저 남겨보세요."
            action={
              <Button leading={<PenLine size={16} />} onClick={() => setComposeOpen(true)}>
                글쓰기
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li key={post.id}>
                <PostRow post={post} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {enabled && (
        <ComposeDialog
          open={composeOpen}
          onOpenChange={setComposeOpen}
          onPosted={() => setComposeOpen(false)}
        />
      )}
    </div>
  )
}

function PostRow({ post }: { post: PostSummary }): ReactElement {
  const reactions = totalReactions(post)
  return (
    <article className="rounded-[var(--radius-xl)] hairline bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-sm)]">
      <div className="flex items-start gap-2">
        {post.pinned && (
          <Pin size={15} className="mt-1 shrink-0 text-[var(--color-accent)]" aria-label="고정됨" />
        )}
        <h2 className="text-pretty font-semibold text-[var(--color-fg)]">
          {post.title ?? '(제목 없음)'}
          {post.locked && (
            <Lock
              size={13}
              className="ml-1.5 inline align-middle text-[var(--color-fg-subtle)]"
              aria-label="잠김"
            />
          )}
        </h2>
      </div>
      {post.excerpt && (
        <p className="mt-1.5 line-clamp-2 text-pretty text-sm leading-relaxed text-[var(--color-fg-muted)]">
          {post.excerpt}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-fg-subtle)]">
        <span className="font-medium text-[var(--color-fg-muted)]">{post.authorName}</span>
        <span>{timeFromNow(post.createdAt)}</span>
        <span className="inline-flex items-center gap-1">
          <MessageSquare size={13} aria-hidden />
          {post.replyCount}
        </span>
        {reactions > 0 && (
          <span className="inline-flex items-center gap-1">
            <ThumbsUp size={13} aria-hidden />
            {reactions}
          </span>
        )}
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-[var(--radius-pill)] bg-[var(--color-bg-subtle)] px-2 py-0.5 text-[var(--color-fg-muted)]"
          >
            #{tag}
          </span>
        ))}
      </div>
    </article>
  )
}

function ComposeDialog({
  open,
  onOpenChange,
  onPosted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPosted: () => void
}): ReactElement {
  const me = useMe()
  const create = useCreateCommunityPost(COMMUNITY_BOARD_SLUG)
  const [name, setName] = useState(() => me?.name ?? readSavedName())
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [errors, setErrors] = useState<{ name?: string; body?: string }>({})
  const titleFieldId = useId()

  function reset(): void {
    setTitle('')
    setBody('')
    setErrors({})
  }

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    const next: { name?: string; body?: string } = {}
    const trimmedName = name.trim()
    const trimmedBody = body.trim()
    if (!trimmedName) next.name = '이름을 입력해주세요'
    if (!trimmedBody) next.body = '내용을 입력해주세요'
    setErrors(next)
    if (next.name || next.body) return

    const authorMemberId = me?.id ?? `anon:${getClientToken()}`
    try {
      const receipt = await create.mutateAsync({
        boardSlug: COMMUNITY_BOARD_SLUG,
        authorMemberId,
        authorName: trimmedName,
        title: title.trim() || null,
        body: trimmedBody,
      })
      if (!me) saveName(trimmedName)
      reset()
      onPosted()
      toast.success(
        receipt.status === 'pending' ? '글이 접수됐어요. 검토 후 공개됩니다.' : '글이 등록됐어요.'
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '글 등록에 실패했어요')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="커뮤니티 글쓰기"
      description="모임 후기나 노하우를 공유해보세요."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button type="submit" form={titleFieldId} loading={create.isPending}>
            등록
          </Button>
        </>
      }
    >
      <form id={titleFieldId} onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="이름" required error={errors.name}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="표시할 이름"
            maxLength={40}
            disabled={Boolean(me)}
          />
        </Field>
        <Field label="제목">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목 (선택)"
            maxLength={120}
          />
        </Field>
        <Field label="내용" required error={errors.body}>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="모임 이야기를 자유롭게 적어주세요"
            maxLength={4000}
            rows={6}
          />
        </Field>
      </form>
    </Dialog>
  )
}
