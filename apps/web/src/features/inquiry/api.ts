import { useMutation } from '@tanstack/react-query'
import type { InquiryFormInput, InquiryReceipt } from '@offhours/shared'

/**
 * TermsDesk 공개 문의 API — 외부 서비스라 내부 axios(api) 클라이언트를 쓰지 않고
 * fetch 로 직접 호출한다(쿠키·토큰 미전송, API 계약 감사 대상 제외).
 */
export const TERMSDESK_INQUIRY_URL = 'https://termsdesk.vercel.app/api/public/offhours/inquiries'

/** 외부 지원 센터 — 인앱 폼이 실패할 때의 폴백 동선 */
export const SUPPORT_FALLBACK_URL = 'https://termsdesk.vercel.app/support/offhours'

export interface SubmitInquiryPayload extends InquiryFormInput {
  /** 허니팟 — 사람은 비워 두고 봇만 채운다. 항상 전송한다 */
  website: string
}

export async function submitInquiry(payload: SubmitInquiryPayload): Promise<InquiryReceipt> {
  const res = await fetch(TERMSDESK_INQUIRY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: payload.category,
      title: payload.title,
      body: payload.body,
      ...(payload.contactEmail ? { contactEmail: payload.contactEmail } : {}),
      originUrl: window.location.href,
      website: payload.website,
    }),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string | string[] } | null
    const message = Array.isArray(data?.message)
      ? data.message.join(', ')
      : (data?.message ?? '문의 접수에 실패했어요. 잠시 후 다시 시도해주세요.')
    throw new Error(message)
  }
  return (await res.json()) as InquiryReceipt
}

export function useSubmitInquiry() {
  return useMutation({ mutationFn: submitInquiry })
}
