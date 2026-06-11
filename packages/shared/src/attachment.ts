import { z } from 'zod'

/**
 * 이미지 첨부 정책 — 별도 업로드 인프라(S3 presign) 없이 data-URL 로 본문 컬럼(Json)에
 * 인라인 저장한다. 클라이언트가 긴 변 1600px 로 리사이즈한 뒤 보내고, 서버는 형식·용량을
 * 한 번 더 검증한다. 채팅 메시지·후기 양쪽이 같은 정책을 공유한다.
 */
export const ATTACHMENT_MAX_COUNT = 3
export const ATTACHMENT_MAX_BYTES = 2 * 1024 * 1024
export const ATTACHMENT_MAX_EDGE_PX = 1600

/** base64 는 3바이트 → 4문자. `data:image/...;base64,` 프리픽스 여유분 64자 포함 */
const MAX_DATA_URL_CHARS = Math.ceil((ATTACHMENT_MAX_BYTES * 4) / 3) + 64

const DATA_URL_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/

export const ImageAttachmentSchema = z
  .string()
  .max(MAX_DATA_URL_CHARS, '이미지는 2MB 이하만 첨부할 수 있어요')
  .regex(DATA_URL_RE, '지원하지 않는 이미지 형식이에요 (jpeg/png/webp)')

export const AttachmentListSchema = z
  .array(ImageAttachmentSchema)
  .max(ATTACHMENT_MAX_COUNT, `사진은 최대 ${ATTACHMENT_MAX_COUNT}장까지 첨부할 수 있어요`)

/** data URL 의 디코드된 바이트 수 추정 — base64 패딩(=) 보정 포함 */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0
  return Math.max(0, Math.floor((b64.length * 3) / 4) - padding)
}
