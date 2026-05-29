import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { BellRing, Check } from 'lucide-react'

import { useIsAuthed } from '../../store/auth'
import { useJoinWaitlist, useLeaveWaitlist, useWaitlistStatus } from '../../features/waitlist/api'
import { getErrorMessage } from '../../services/api'

/**
 * 빈자리 알림 — 원하는 시간이 꽉 찼을 때 신청. 취소 발생 시 알림이 온다.
 * "N명 대기 중" 사회적 증거가 함께 노출돼 인기 공간의 예약 압력을 만든다.
 */
export function WaitlistButton({ spaceId }: { spaceId: string }) {
  const isAuthed = useIsAuthed()
  const navigate = useNavigate()
  const { data } = useWaitlistStatus(spaceId)
  const join = useJoinWaitlist(spaceId)
  const leave = useLeaveWaitlist(spaceId)

  const count = data?.count ?? 0
  const joined = data?.joined ?? false

  async function toggle() {
    if (!isAuthed) {
      navigate('/login')
      return
    }
    try {
      if (joined) {
        await leave.mutateAsync()
        toast.success('빈자리 알림을 해제했어요')
      } else {
        await join.mutateAsync()
        toast.success('빈자리가 나면 알림으로 알려드릴게요')
      }
    } catch (e) {
      toast.error(getErrorMessage(e))
    }
  }

  return (
    <div className="rounded-[var(--radius-lg)] hairline p-3">
      <button
        type="button"
        onClick={toggle}
        disabled={join.isPending || leave.isPending}
        className={`flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-md)] py-2 text-sm font-semibold transition-colors ${
          joined
            ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
            : 'bg-[var(--color-bg-subtle)] text-[var(--color-fg)] hover:bg-[var(--color-primary-soft)]'
        }`}
      >
        {joined ? <Check size={14} /> : <BellRing size={14} />}
        {joined ? '빈자리 알림 받는 중' : '원하는 시간이 없나요? 빈자리 알림'}
      </button>
      {count > 0 && (
        <p className="mt-2 text-center text-[11px] text-[var(--color-fg-muted)]">
          지금 <span className="font-semibold text-[var(--color-fg)]">{count}명</span>이 이 공간
          빈자리를 기다리고 있어요
        </p>
      )}
    </div>
  )
}
