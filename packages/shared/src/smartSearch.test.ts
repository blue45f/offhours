import { describe, expect, it } from 'vitest'

import { describeParse, parseSmartQuery, toSearchParams } from './smartSearch'

/**
 * 한국어 자연어 검색 파서(LLM 없는 사전 기반) 회귀 방지 — 차별화 기능이라 매핑을 잠근다.
 * 지역·카테고리·인원·useCase·amenity 추출과 잔여 키워드 q 폴백, 직렬화·칩 표현까지 검증.
 */
describe('parseSmartQuery', () => {
  it('복합 질의 — 지역·카테고리·인원·useCase 추출 + 잔여는 q 폴백', () => {
    const r = parseSmartQuery('서울 카페 20명 생일파티')
    expect(r.region).toBe('서울')
    expect(r.category).toBe('CAFE')
    expect(r.capacity).toBe(20)
    expect(r.useCases).toEqual(['BIRTHDAY'])
    expect(r.q).toBe('파티') // 매칭 안 된 잔여 키워드
  })

  it.each([
    ['8인', 8],
    ['20 people', 20],
    ['15ppl', 15],
    ['최대 100명', 100],
  ])('인원 표기 "%s" → %i', (text, expected) => {
    expect(parseSmartQuery(text).capacity).toBe(expected)
  })

  it('서울 별칭(홍대) → region 서울, 별칭은 q 로 남는다', () => {
    const r = parseSmartQuery('홍대 술집')
    expect(r.region).toBe('서울')
    expect(r.category).toBe('BAR')
    expect(r.q).toBe('홍대')
  })

  it('판교 → 경기로 매핑', () => {
    const r = parseSmartQuery('판교 모임')
    expect(r.region).toBe('경기')
    expect(r.useCases).toEqual(['GATHERING'])
  })

  it('useCase 다중 매칭 (등장 순서 보존)', () => {
    expect(parseSmartQuery('팝업 네트워킹').useCases).toEqual(['POPUP_EXHIBIT', 'NETWORKING'])
  })

  it('편의시설 다중 매칭', () => {
    const r = parseSmartQuery('카페 주차 와이파이')
    expect(r.category).toBe('CAFE')
    expect(r.amenities).toEqual(['wifi', 'parking'])
    expect(r.q).toBeUndefined() // 전부 매칭돼 잔여 없음
  })

  it('빈 입력·공백은 빈 결과', () => {
    expect(parseSmartQuery('')).toEqual({})
    expect(parseSmartQuery('   ')).toEqual({})
  })

  it('잔여 키워드가 2자 미만이면 q 로 만들지 않는다', () => {
    expect(parseSmartQuery('a').q).toBeUndefined()
  })
})

describe('toSearchParams', () => {
  it('파싱 결과를 SpacesPage query 스키마로 직렬화', () => {
    const sp = toSearchParams({
      region: '서울',
      category: 'CAFE',
      capacity: 20,
      useCases: ['BIRTHDAY', 'NETWORKING'],
      amenities: ['wifi', 'parking'],
      q: '파티',
    })
    expect(sp.get('region')).toBe('서울')
    expect(sp.get('category')).toBe('CAFE')
    expect(sp.get('capacity')).toBe('20')
    expect(sp.get('useCases')).toBe('BIRTHDAY,NETWORKING')
    expect(sp.get('amenities')).toBe('wifi,parking')
    expect(sp.get('q')).toBe('파티')
  })

  it('빈 결과는 빈 쿼리스트링', () => {
    expect(toSearchParams({}).toString()).toBe('')
  })
})

describe('describeParse', () => {
  it('파싱 결과를 사람이 읽는 칩으로 변환', () => {
    const chips = describeParse(parseSmartQuery('서울 카페 20명 생일파티'))
    expect(chips.find((c) => c.key === 'region')?.label).toBe('서울')
    expect(chips.find((c) => c.key === 'capacity')?.label).toBe('20명')
    expect(chips.some((c) => c.key === 'useCase:BIRTHDAY')).toBe(true)
    expect(chips.find((c) => c.key === 'q')?.label).toBe('"파티"')
  })
})
