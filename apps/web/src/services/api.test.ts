import { describe, expect, it } from 'vitest'
import { AxiosError } from 'axios'

import { getErrorMessage } from './api'

/**
 * getErrorMessage 회귀 방지 — 모든 사용자 대상 에러 토스트가 거치는 추출 로직.
 * 서버(NestJS) 에러는 message 가 문자열 또는 문자열 배열(Zod 다중 오류)로 온다.
 */
function axiosErrWith(message: string | string[] | undefined): AxiosError {
  const e = new AxiosError('Request failed')
  e.response = {
    data: message === undefined ? {} : { message },
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config: {} as any,
  }
  return e
}

describe('getErrorMessage', () => {
  it('서버 문자열 message 를 그대로 반환', () => {
    expect(getErrorMessage(axiosErrWith('이미 예약된 시간이에요'))).toBe('이미 예약된 시간이에요')
  })

  it('서버 배열 message 는 콤마로 합침 (Zod 다중 검증 오류)', () => {
    expect(getErrorMessage(axiosErrWith(['이름은 필수', '이메일 형식 오류']))).toBe(
      '이름은 필수, 이메일 형식 오류'
    )
  })

  it('서버 message 가 없으면 axios err.message 폴백', () => {
    expect(getErrorMessage(axiosErrWith(undefined))).toBe('Request failed')
  })

  it('일반 Error 는 해당 메시지', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom')
  })

  it('알 수 없는 값은 fallback (기본·커스텀)', () => {
    expect(getErrorMessage(null)).toBe('문제가 발생했어요')
    expect(getErrorMessage(123, '커스텀 메시지')).toBe('커스텀 메시지')
  })
})
