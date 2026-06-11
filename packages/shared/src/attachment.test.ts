import { describe, expect, it } from 'vitest'

import {
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MAX_COUNT,
  AttachmentListSchema,
  ImageAttachmentSchema,
  dataUrlBytes,
} from './attachment'
import { SendMessageSchema } from './chat'
import { InquiryFormSchema } from './inquiry'

const tinyJpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
const tinyPng = 'data:image/png;base64,iVBORw0KGgo='

describe('ImageAttachmentSchema — data-URL 첨부 정책', () => {
  it('jpeg/png/webp data-URL 을 허용한다', () => {
    expect(ImageAttachmentSchema.safeParse(tinyJpeg).success).toBe(true)
    expect(ImageAttachmentSchema.safeParse(tinyPng).success).toBe(true)
    expect(ImageAttachmentSchema.safeParse('data:image/webp;base64,UklGRg==').success).toBe(true)
  })

  it('http URL·svg·생 base64 는 거절한다', () => {
    expect(ImageAttachmentSchema.safeParse('https://evil.example/x.jpg').success).toBe(false)
    expect(ImageAttachmentSchema.safeParse('data:image/svg+xml;base64,PHN2Zz4=').success).toBe(
      false
    )
    expect(ImageAttachmentSchema.safeParse('/9j/4AAQSkZJRg==').success).toBe(false)
  })

  it('2MB(base64 환산) 초과는 거절한다', () => {
    const over =
      'data:image/jpeg;base64,' + 'A'.repeat(Math.ceil((ATTACHMENT_MAX_BYTES * 4) / 3) + 80)
    expect(ImageAttachmentSchema.safeParse(over).success).toBe(false)
  })

  it(`첨부는 최대 ${ATTACHMENT_MAX_COUNT}장`, () => {
    const four = Array.from({ length: ATTACHMENT_MAX_COUNT + 1 }, () => tinyJpeg)
    expect(AttachmentListSchema.safeParse(four).success).toBe(false)
    expect(AttachmentListSchema.safeParse(four.slice(1)).success).toBe(true)
  })
})

describe('dataUrlBytes — base64 패딩 보정', () => {
  it('패딩 0/1/2 모두 디코드 바이트를 정확히 추정한다', () => {
    // 'AAAA' = 3 bytes, 'AAA=' = 2 bytes, 'AA==' = 1 byte
    expect(dataUrlBytes('data:image/jpeg;base64,AAAA')).toBe(3)
    expect(dataUrlBytes('data:image/jpeg;base64,AAA=')).toBe(2)
    expect(dataUrlBytes('data:image/jpeg;base64,AA==')).toBe(1)
  })
})

describe('SendMessageSchema — 본문/첨부 중 하나는 필수', () => {
  it('본문 없이 첨부만 있어도 유효하다', () => {
    expect(SendMessageSchema.safeParse({ attachments: [tinyJpeg] }).success).toBe(true)
  })

  it('본문·첨부 모두 비면 거절한다', () => {
    expect(SendMessageSchema.safeParse({ body: '   ', attachments: [] }).success).toBe(false)
  })

  it('본문만 있어도 유효하다 (기존 동작 보존)', () => {
    const parsed = SendMessageSchema.parse({ body: '안녕하세요' })
    expect(parsed.attachments).toEqual([])
  })
})

describe('InquiryFormSchema — TermsDesk 공개 문의 계약', () => {
  const valid = {
    category: 'qa' as const,
    title: '검증 문의',
    body: '크롤링 데이터 출처가 궁금합니다.',
  }

  it('정상 입력을 통과시킨다 (contactEmail 은 선택)', () => {
    expect(InquiryFormSchema.safeParse(valid).success).toBe(true)
    expect(InquiryFormSchema.safeParse({ ...valid, contactEmail: '' }).success).toBe(true)
    expect(InquiryFormSchema.safeParse({ ...valid, contactEmail: 'a@b.co' }).success).toBe(true)
  })

  it('title 2..140 / body 10..4000 경계를 지킨다', () => {
    expect(InquiryFormSchema.safeParse({ ...valid, title: 'a' }).success).toBe(false)
    expect(InquiryFormSchema.safeParse({ ...valid, title: 'a'.repeat(141) }).success).toBe(false)
    expect(InquiryFormSchema.safeParse({ ...valid, body: '짧음' }).success).toBe(false)
    expect(InquiryFormSchema.safeParse({ ...valid, body: 'b'.repeat(4001) }).success).toBe(false)
  })

  it('카테고리는 5종 외 거절 + 잘못된 이메일 거절', () => {
    expect(InquiryFormSchema.safeParse({ ...valid, category: 'spam' }).success).toBe(false)
    expect(InquiryFormSchema.safeParse({ ...valid, contactEmail: 'not-an-email' }).success).toBe(
      false
    )
  })
})
