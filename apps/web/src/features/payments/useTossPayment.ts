import { useQueryClient } from '@tanstack/react-query'

import { api } from '../../services/api'

export interface PayParams {
  reservationId: string
  amount: number
  orderName: string
}

/**
 * 데모 결제 플로우 — intent 생성 후 곧바로 confirm.
 * 백엔드 TossProvider 는 TOSS_SECRET_KEY 미설정 시 mock 승인을 반환하므로
 * 실제 토스 키 없이도 결제 완료 상태까지 검증할 수 있다.
 * 운영 전환 시 @tosspayments/payment-widget-sdk 의 loadPaymentWidget 으로 교체한다.
 */
export function useTossPayment() {
  const qc = useQueryClient()
  return async (params: PayParams) => {
    const intent = await api.post<{ orderId: string; amount: number; clientKey: string }>(
      '/payments/intent',
      { reservationId: params.reservationId, method: 'CARD' }
    )
    const paymentKey = `demo_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    await api.post('/payments/confirm', {
      paymentKey,
      orderId: intent.orderId,
      amount: intent.amount,
    })
    await qc.invalidateQueries({ queryKey: ['reservations'] })
  }
}
