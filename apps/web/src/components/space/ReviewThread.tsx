import { useState } from 'react'
import toast from 'react-hot-toast'
import { CornerDownRight, Send } from 'lucide-react'
import type { Review } from '@offhours/shared'

import { useAddReviewReply } from '../../features/reviews/api'
import { getErrorMessage } from '../../services/api'
import { useMe } from '../../store/auth'
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Input'
import { StarRating } from '../ui/StarRating'
import { AttachmentThumbs } from '../ui/AttachmentInput'
import { formatDateKR } from '../../utils/format'

interface ReviewThreadProps {
  review: Review
  /** 공간 호스트의 user id — 답글 권한(작성자·호스트)과 호스트 뱃지 판별 */
  hostUserId: string
}

/**
 * 공간 후기 한 건 — 본문·사진·호스트 공식 답변 아래에 1단 답글 스레드가 이어진다.
 * 답글은 후기 작성자와 호스트만 달 수 있다(외부인은 읽기 전용).
 */
export function ReviewThread({ review, hostUserId }: ReviewThreadProps) {
  const me = useMe()
  const addReply = useAddReviewReply()
  const [composing, setComposing] = useState(false)
  const [body, setBody] = useState('')
  const canReply = !!me && (me.id === review.authorId || me.id === hostUserId)

  async function submit() {
    if (body.trim().length < 2) {
      toast.error('답글은 2자 이상 적어주세요')
      return
    }
    try {
      await addReply.mutateAsync({ reviewId: review.id, body: body.trim() })
      setBody('')
      setComposing(false)
      toast.success('답글을 남겼어요')
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <li className="hairline rounded-[var(--radius-xl)] p-5">
      <div className="flex items-center gap-3">
        <Avatar name={review.authorName} src={review.authorAvatarUrl} size="sm" />
        <div className="flex flex-1 items-center justify-between">
          <div>
            <div className="text-sm font-semibold">{review.authorName}</div>
            <StarRating value={review.rating} size={12} />
          </div>
          <span className="text-xs text-[var(--color-fg-muted)]">
            {formatDateKR(review.createdAt)}
          </span>
        </div>
      </div>
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{review.comment}</p>
      <AttachmentThumbs attachments={review.attachments} className="mt-3" />

      {review.hostResponse && (
        <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] p-3">
          <div className="mb-1 text-xs font-semibold text-[var(--color-primary)]">호스트 답변</div>
          <p className="whitespace-pre-line text-sm">{review.hostResponse}</p>
        </div>
      )}

      {(review.replies.length > 0 || canReply) && (
        <div className="mt-3 space-y-2.5 border-l-2 border-[var(--color-border-subtle)] pl-4">
          {review.replies.map((reply) => (
            <div key={reply.id} className="flex items-start gap-2.5">
              <Avatar name={reply.authorName} src={reply.authorAvatarUrl} size="xs" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold">{reply.authorName}</span>
                  {reply.isHost && (
                    <Badge tone="primary" soft className="px-1.5 py-0.5 text-[10px]">
                      호스트
                    </Badge>
                  )}
                  <span className="text-[11px] text-[var(--color-fg-subtle)]">
                    {formatDateKR(reply.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed">{reply.body}</p>
              </div>
            </div>
          ))}

          {canReply &&
            (composing ? (
              <div className="space-y-2 pt-1">
                <Textarea
                  rows={2}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="답글을 남겨주세요 (2자 이상)"
                  className="min-h-[64px]"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setComposing(false)
                      setBody('')
                    }}
                  >
                    취소
                  </Button>
                  <Button
                    size="sm"
                    leading={<Send size={12} />}
                    loading={addReply.isPending}
                    disabled={body.trim().length < 2}
                    onClick={submit}
                  >
                    답글 등록
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setComposing(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-fg-muted)] underline-offset-4 transition-colors hover:text-[var(--color-primary)] hover:underline"
              >
                <CornerDownRight size={12} />
                답글 달기
              </button>
            ))}
        </div>
      )}
    </li>
  )
}
