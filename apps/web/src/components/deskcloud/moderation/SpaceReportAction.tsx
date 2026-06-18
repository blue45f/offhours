/**
 * SpaceReportAction — SpaceDetailPage 용 env-게이트 신고 액션.
 * ──────────────────────────────────────────────────────────────────────────
 * VITE_MODERATIONDESK_URL 이 설정된 경우에만 ModerationDesk 신고 버튼을 렌더합니다.
 * 미설정(기본)이면 아무것도 렌더하지 않습니다 — #49 env-게이트 패턴.
 * 공개 사용자측 신고 동작이며, 어드민 신고 관리(AdminReportsPage)와는 별개입니다.
 */
import { type ReactElement } from 'react'

import { useMe } from '../../../store/auth'

import { ReportButton } from './ReportWidget'

const env = import.meta.env

const pk = (): string => env.VITE_MODERATIONDESK_PK ?? 'pk_demo'

export function SpaceReportAction({ spaceId }: { spaceId: string }): ReactElement | null {
  const me = useMe()
  if (!env.VITE_MODERATIONDESK_URL) return null
  return (
    <ReportButton
      subjectType="space"
      subjectId={spaceId}
      reporterId={me?.id}
      publishableKey={pk()}
      endpoint={env.VITE_MODERATIONDESK_URL}
      label="이 공간 신고"
    />
  )
}

export default SpaceReportAction
