import { z } from 'zod'

export const CleaningJobStatusSchema = z.enum(['SCHEDULED', 'DONE', 'CANCELED'])
export type CleaningJobStatus = z.infer<typeof CleaningJobStatusSchema>
export const CleaningJobStatusLabel: Record<CleaningJobStatus, string> = {
  SCHEDULED: '청소 예정',
  DONE: '청소 완료',
  CANCELED: '취소됨',
}

/**
 * 청소 대행 마켓 — 청소 SLA 의 Phase 2 완성. 청소비가 있는 예약에 지역 기반으로 제휴
 * 청소업체를 자동 매칭해 "다음 영업 전 원상복구" 라는 호스트 #1 진입장벽을 운영으로 닫는다.
 */
export const CleaningJobSummarySchema = z.object({
  partnerName: z.string(),
  scheduledAt: z.string(),
  status: CleaningJobStatusSchema,
  feeKRW: z.number(),
})
export type CleaningJobSummary = z.infer<typeof CleaningJobSummarySchema>
