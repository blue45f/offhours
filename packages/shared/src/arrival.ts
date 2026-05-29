import { z } from 'zod'

export const ArrivalGuideSchema = z.object({
  parkingNote: z.string().trim().max(280).optional(),
  entryCode: z.string().trim().max(120).optional(),
  wifiSsid: z.string().trim().max(40).optional(),
  wifiPassword: z.string().trim().max(40).optional(),
  sortingNote: z.string().trim().max(280).optional(),
  emergencyContact: z.string().trim().max(40).optional(),
  extraNotes: z.string().trim().max(1000).optional(),
})
export type ArrivalGuide = z.infer<typeof ArrivalGuideSchema>

export const HostVenueArrivalSchema = z.object({
  venueId: z.string(),
  venueName: z.string(),
  hasGuide: z.boolean(),
  guide: ArrivalGuideSchema.nullable(),
  spaceCount: z.number(),
})
export type HostVenueArrival = z.infer<typeof HostVenueArrivalSchema>

export const ARRIVAL_GUIDE_FIELDS: Array<{
  key: keyof ArrivalGuide
  label: string
  placeholder: string
  multiline?: boolean
}> = [
  {
    key: 'parkingNote',
    label: '주차 안내',
    placeholder: '예: 건물 지하 1층 4·5번 칸 이용, 무료',
    multiline: true,
  },
  { key: 'entryCode', label: '출입문 코드', placeholder: '예: 정문 도어락 1234*, 22시 이후 후문' },
  { key: 'wifiSsid', label: 'Wi-Fi 이름', placeholder: 'offhours-cafe' },
  { key: 'wifiPassword', label: 'Wi-Fi 비밀번호', placeholder: 'wakanda1!' },
  {
    key: 'sortingNote',
    label: '분리수거·정리',
    placeholder: '예: 캔/병/플라스틱 분리, 종량제 봉투(45L) 1층 비치',
    multiline: true,
  },
  { key: 'emergencyContact', label: '비상 연락처', placeholder: '010-0000-0000' },
  {
    key: 'extraNotes',
    label: '기타 안내',
    placeholder: '예: 음향 22시 이후 70dB 이하, 음식 반입 OK, 흡연 외부 지정 구역',
    multiline: true,
  },
]
