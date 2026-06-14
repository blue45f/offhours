import { describe, expect, it } from 'vitest'

import { parsePolicyBody } from './policyBody'

describe('parsePolicyBody', () => {
  it('제N조 형식의 평문을 헤딩+본문 블록으로 나눈다', () => {
    const body =
      '제1조 (목적)\n이 약관은 목적을 정합니다.\n\n제2조 (범위)\n첫 줄\n둘째 줄\n\n부칙\n이 약관은 2026년 6월 8일부터 시행합니다.'
    expect(parsePolicyBody(body)).toEqual([
      { heading: '제1조 (목적)', text: '이 약관은 목적을 정합니다.' },
      { heading: '제2조 (범위)', text: '첫 줄\n둘째 줄' },
      { heading: '부칙', text: '이 약관은 2026년 6월 8일부터 시행합니다.' },
    ])
  })

  it('마크다운 헤딩(#)을 인식하고 해시 접두를 벗긴다', () => {
    const body = '## 수집 항목\n이메일, 이름\n\n헤딩 없는 일반 문단입니다.'
    expect(parsePolicyBody(body)).toEqual([
      { heading: '수집 항목', text: '이메일, 이름' },
      { heading: null, text: '헤딩 없는 일반 문단입니다.' },
    ])
  })

  it('CRLF·여분 빈 줄·공백 블록을 정리한다', () => {
    const body = '제1조 (목적)\r\n본문\r\n\r\n\r\n\n  \n제2조 (정의)\n용어 정의'
    expect(parsePolicyBody(body)).toEqual([
      { heading: '제1조 (목적)', text: '본문' },
      { heading: '제2조 (정의)', text: '용어 정의' },
    ])
  })

  it('헤딩처럼 보이지 않는 첫 줄은 본문으로 둔다', () => {
    expect(parsePolicyBody('제3조에 따라 처리합니다.\n둘째 줄')).toEqual([
      { heading: null, text: '제3조에 따라 처리합니다.\n둘째 줄' },
    ])
  })
})
