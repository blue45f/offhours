import { z } from 'zod'

/**
 * 인앱 문의 폼 — TermsDesk 공개 문의 API 계약.
 * POST https://termsdesk.vercel.app/api/public/offhours/inquiries
 * (category 5종 / title 2..140 / body 10..4000 / contactEmail? / originUrl / website 허니팟)
 */
export const INQUIRY_CATEGORIES = ['contact', 'partnership', 'bug', 'qa', 'question'] as const
export type InquiryCategory = (typeof INQUIRY_CATEGORIES)[number]

export const InquiryCategoryLabel: Record<InquiryCategory, string> = {
  contact: '일반 문의',
  partnership: '제휴·비즈니스',
  bug: '오류·버그 신고',
  qa: '품질·검증',
  question: '이용 방법',
}

export const InquiryCategoryHint: Record<InquiryCategory, string> = {
  contact: '계정, 예약, 결제 등 서비스 전반',
  partnership: '공간 입점, 제휴 청소·케이터링, 광고',
  bug: '화면 깨짐, 동작 오류, 잘못된 정보',
  qa: '데이터 정확성, 검증 절차에 대한 확인',
  question: '사용법이 궁금할 때',
}

export const InquiryFormSchema = z.object({
  category: z.enum(INQUIRY_CATEGORIES),
  title: z.string().trim().min(2, '제목은 2자 이상 적어주세요').max(140, '제목은 140자 이하예요'),
  body: z
    .string()
    .trim()
    .min(10, '내용은 10자 이상 적어주세요')
    .max(4000, '내용은 4,000자 이하예요'),
  /** 회신 받을 이메일 — 비워두면 익명 접수 */
  contactEmail: z.union([z.literal(''), z.string().email('이메일 형식을 확인해주세요')]).optional(),
})
export type InquiryFormInput = z.infer<typeof InquiryFormSchema>

/** TermsDesk 가 201 로 돌려주는 접수증 */
export interface InquiryReceipt {
  id: string
  siteSlug: string
  category: string
  status: string
  createdAt: string
}
