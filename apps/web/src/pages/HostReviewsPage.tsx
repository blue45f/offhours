import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { MessageCircleReply, Send, ShieldCheck, Star } from 'lucide-react'

import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Card, CardBody } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { StarRating } from '../components/ui/StarRating'
import { Tabs } from '../components/ui/Tabs'
import { Textarea } from '../components/ui/Input'
import {
  useHostReviews,
  useRespondReview,
  type HostReviewFilter,
  type HostReviewItem,
} from '../features/reviews/api'
import { getErrorMessage } from '../services/api'
import { formatDateKR } from '../utils/format'

const TABS: { value: HostReviewFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'unanswered', label: '미답글' },
  { value: 'answered', label: '답글 완료' },
]

export default function HostReviewsPage() {
  const [tab, setTab] = useState<HostReviewFilter>('unanswered')
  const { data, isLoading } = useHostReviews(tab)

  const stats = (() => {
    if (!data) return null
    const answered = data.items.filter((r) => r.hostResponse).length
    const total = data.items.length
    return { answered, total }
  })()

  return (
    <div className="container-page py-8 md:py-12">
      <h1 className="text-headline serif">리뷰 관리</h1>
      <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
        후기에 정중히 답하면 신뢰점수가 오르고, 검색 노출도 좋아져요.
      </p>

      {stats && data && data.total > 0 && (
        <div className="mt-5 inline-flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--color-primary-soft)] px-3.5 py-1.5 text-xs">
          <ShieldCheck size={12} className="text-[var(--color-primary)]" />
          <span>
            <span className="font-semibold">{tab === 'all' ? data.total : data.total}</span>건 표시
            중 ·{' '}
            <span className="font-semibold">
              답글률 {stats.total > 0 ? Math.round((stats.answered / stats.total) * 100) : 0}%
            </span>
          </span>
        </div>
      )}

      <div className="mt-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as HostReviewFilter)} items={TABS} />
      </div>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <p className="text-sm text-[var(--color-fg-muted)]">불러오는 중…</p>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={<Star size={20} />}
            title={tab === 'unanswered' ? '답글이 필요한 후기가 없어요' : '해당 후기가 없어요'}
            description="새 후기가 들어오면 여기서 알려드릴게요."
          />
        ) : (
          data.items.map((r) => <ReviewRow key={r.id} review={r} />)
        )}
      </div>
    </div>
  )
}

function ReviewRow({ review }: { review: HostReviewItem }) {
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(review.hostResponse ?? '')
  const respond = useRespondReview()

  async function submit() {
    if (body.trim().length < 10) {
      toast.error('답글은 10자 이상 작성해주세요')
      return
    }
    try {
      await respond.mutateAsync({ id: review.id, response: body })
      toast.success('답글을 등록했어요')
      setEditing(false)
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-start gap-3">
          <Avatar name={review.authorName} src={review.authorAvatarUrl} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{review.authorName}</span>
              <StarRating value={review.rating} size={12} />
              <span className="text-xs text-[var(--color-fg-muted)]">
                · {formatDateKR(review.createdAt)}
              </span>
            </div>
            {review.spaceTitle && (
              <Link
                to={`/spaces/${review.spaceSlug}`}
                className="text-xs text-[var(--color-fg-muted)] hover:text-[var(--color-primary)]"
              >
                #{review.spaceTitle}
              </Link>
            )}
            <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">{review.comment}</p>
          </div>
        </div>

        {review.hostResponse && !editing ? (
          <div className="ml-11 rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-[var(--color-primary)]">호스트 답변</span>
              <button
                onClick={() => setEditing(true)}
                className="text-[11px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
              >
                수정
              </button>
            </div>
            <p className="text-sm whitespace-pre-line">{review.hostResponse}</p>
          </div>
        ) : (
          <div className="ml-11 space-y-2">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="후기에 정중하게 답해주세요 (10자 이상)…"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-fg-muted)]">{body.length} / 1500</span>
              <div className="flex gap-2">
                {editing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(false)
                      setBody(review.hostResponse ?? '')
                    }}
                  >
                    취소
                  </Button>
                )}
                <Button
                  size="sm"
                  leading={editing ? <Send size={12} /> : <MessageCircleReply size={12} />}
                  loading={respond.isPending}
                  disabled={body.trim().length < 10}
                  onClick={submit}
                >
                  {editing ? '수정 저장' : '답글 등록'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
