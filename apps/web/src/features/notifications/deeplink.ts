import type { Notification } from '@offhours/shared'

/**
 * 알림 data 페이로드 → 인앱 딥링크. 서버가 넣는 키(chatId/reservationId/spaceSlug)만 신뢰하고
 * 모르는 페이로드는 null(이동 없음)로 떨어진다.
 */
export function notificationLink(n: Pick<Notification, 'data'>): string | null {
  const data = n.data ?? {}
  const chatId = data['chatId']
  if (typeof chatId === 'string' && chatId) return `/chat/${chatId}`
  const reservationId = data['reservationId']
  if (typeof reservationId === 'string' && reservationId) return `/me/reservations/${reservationId}`
  const spaceSlug = data['spaceSlug']
  if (typeof spaceSlug === 'string' && spaceSlug) return `/spaces/${spaceSlug}`
  return null
}
