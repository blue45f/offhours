/**
 * 인원 기본값 — 10명을 기준으로 공간 수용 범위 [capacityMin, capacityMax]로 클램프한다.
 * 작은 공간(capacityMax < 10)에서 기본값이 정원을 초과해 서버가 예약을 거부하던 문제 방지.
 */
export function defaultHeadcount(capacityMin: number, capacityMax: number): number {
  return Math.min(capacityMax, Math.max(capacityMin, 10))
}
