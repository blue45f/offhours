import { describe, expect, it } from 'vitest'

import { notificationLink } from './deeplink'

describe('notificationLink — 알림 data → 인앱 딥링크', () => {
  it('chatId 가 있으면 채팅 스레드로', () => {
    expect(notificationLink({ data: { chatId: 'c1' } })).toBe('/chat/c1')
  })

  it('reservationId 가 있으면 예약 상세로', () => {
    expect(notificationLink({ data: { reservationId: 'r1' } })).toBe('/me/reservations/r1')
  })

  it('spaceSlug 가 있으면 공간 상세로 (후기 답글 알림)', () => {
    expect(notificationLink({ data: { spaceSlug: 'cozy-cafe' } })).toBe('/spaces/cozy-cafe')
  })

  it('chatId 가 reservationId 보다 우선한다 (채팅 알림에 둘 다 실릴 때)', () => {
    expect(notificationLink({ data: { chatId: 'c1', reservationId: 'r1' } })).toBe('/chat/c1')
  })

  it('모르는 페이로드·빈 값은 이동 없음(null)', () => {
    expect(notificationLink({ data: null })).toBeNull()
    expect(notificationLink({ data: {} })).toBeNull()
    expect(notificationLink({ data: { chatId: '' } })).toBeNull()
    expect(notificationLink({ data: { chatId: 123 } })).toBeNull()
  })
})
