import { useState } from 'react'
import toast from 'react-hot-toast'
import { Lock, MessageCircleReply, Star } from 'lucide-react'
import type { MyReservationReview } from '@offhours/shared'

import { useCreateReview } from '../../features/reviews/api'
import { getErrorMessage } from '../../services/api'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card, CardBody, CardHeader, CardTitle } from '../ui/Card'
import { Field, Textarea } from '../ui/Input'
import { RatingInput } from '../ui/RatingInput'
import { StarRating } from '../ui/StarRating'
import { AttachmentInput, AttachmentThumbs } from '../ui/AttachmentInput'
import { formatDateKR } from '../../utils/format'

interface ReservationReviewCardProps {
  reservationId: string
  myReview: MyReservationReview | null
  counterpartReviewed: boolean
  /** 호스트가 보면 게스트 후기, 게스트가 보면 공간(호스트) 후기 */
  isHost: boolean
}

/**
 * 이용 완료(COMPLETED) 예약의 후기 영역 — 미작성이면 작성 폼, 작성했으면 내 후기와
 * 공개 상태(더블 블라인드)·호스트 답변을 보여준다.
 */
export function ReservationReviewCard({
  reservationId,
  myReview,
  counterpartReviewed,
  isHost,
}: ReservationReviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="inline-flex items-center gap-1.5">
            <Star size={14} className="text-[var(--color-primary)]" />
            {isHost ? '게스트 후기' : '이용 후기'}
          </span>
        </CardTitle>
        {myReview &&
          (myReview.isPublished ? (
            <Badge tone="success" soft>
              공개됨
            </Badge>
          ) : (
            <Badge tone="warning" soft>
              공개 대기
            </Badge>
          ))}
      </CardHeader>
      <CardBody>
        {myReview ? (
          <MyReviewView
            review={myReview}
            counterpartReviewed={counterpartReviewed}
            isHost={isHost}
          />
        ) : (
          <ReviewForm
            reservationId={reservationId}
            counterpartReviewed={counterpartReviewed}
            isHost={isHost}
          />
        )}
      </CardBody>
    </Card>
  )
}

function MyReviewView({
  review,
  counterpartReviewed,
  isHost,
}: {
  review: MyReservationReview
  counterpartReviewed: boolean
  isHost: boolean
}) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <StarRating value={review.rating} size={16} showValue />
        <span className="text-xs text-[var(--color-fg-subtle)]">
          {formatDateKR(review.createdAt)} 작성
        </span>
      </div>
      <p className="whitespace-pre-line leading-relaxed">{review.comment}</p>
      <AttachmentThumbs attachments={review.attachments} />
      {!review.isPublished && (
        <p className="flex items-start gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-3 text-xs leading-relaxed text-[var(--color-fg-muted)]">
          <Lock size={12} className="mt-0.5 shrink-0" />
          {counterpartReviewed
            ? '곧 공개돼요.'
            : `${isHost ? '게스트' : '호스트'}도 후기를 작성하면 서로의 후기가 동시에 공개돼요. 먼저 쓴 후기가 상대에게 미리 보이지 않아요.`}
        </p>
      )}
      {review.hostResponse && (
        <div className="rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] p-3">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)]">
            <MessageCircleReply size={12} />
            호스트 답변
          </div>
          <p className="whitespace-pre-line text-sm">{review.hostResponse}</p>
        </div>
      )}
    </div>
  )
}

function ReviewForm({
  reservationId,
  counterpartReviewed,
  isHost,
}: {
  reservationId: string
  counterpartReviewed: boolean
  isHost: boolean
}) {
  const create = useCreateReview()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])

  async function submit() {
    if (rating < 1) {
      toast.error('별점을 선택해주세요')
      return
    }
    if (comment.trim().length < 10) {
      toast.error('후기는 10자 이상 작성해주세요')
      return
    }
    try {
      await create.mutateAsync({ reservationId, rating, comment: comment.trim(), attachments })
      toast.success('후기를 등록했어요')
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-[var(--color-fg-muted)]">
        {counterpartReviewed
          ? `${isHost ? '게스트' : '호스트'}가 이미 후기를 남겼어요. 지금 작성하면 서로의 후기가 바로 공개돼요.`
          : '양측이 모두 작성하면 후기가 동시에 공개돼요. 먼저 써도 상대에게 미리 보이지 않아요.'}
      </p>
      <Field label={isHost ? '게스트는 어땠나요?' : '공간과 호스트는 어땠나요?'} required>
        <RatingInput value={rating} onChange={setRating} />
      </Field>
      <Field label="후기" required helper={`${comment.trim().length} / 2000 · 10자 이상`}>
        <Textarea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={
            isHost
              ? '시간 약속, 공간 사용 매너, 정리 상태는 어땠나요?'
              : '공간 상태, 호스트 응대, 다음 게스트에게 알려줄 팁을 적어주세요'
          }
        />
      </Field>
      <Field label="사진 (선택)" helper="최대 3장 · 장당 2MB">
        <AttachmentInput value={attachments} onChange={setAttachments} size="md" />
      </Field>
      <div className="flex justify-end">
        <Button
          onClick={submit}
          loading={create.isPending}
          disabled={rating < 1 || comment.trim().length < 10}
        >
          후기 등록
        </Button>
      </div>
    </div>
  )
}
