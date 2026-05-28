import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Role } from '@prisma/client'
import * as argon2 from 'argon2'
import { randomBytes } from 'crypto'

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function randomCode(prefix: string, length = 6) {
  let s = ''
  for (let i = 0; i < length; i++) s += ALPHA[Math.floor(Math.random() * ALPHA.length)]
  return `${prefix}-${s}`
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    process.env.DATABASE_URL ??
      'postgresql://offhours:offhours@localhost:5432/offhours?schema=public'
  ),
})

const REFERRAL_ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const code = () =>
  Array.from(
    { length: 6 },
    () => REFERRAL_ALPHA[Math.floor(Math.random() * REFERRAL_ALPHA.length)]
  ).join('')

interface SeedSpaceSpec {
  title: string
  summary: string
  description: string
  category:
    | 'CAFE'
    | 'BAR'
    | 'RESTAURANT'
    | 'STUDIO'
    | 'GALLERY'
    | 'ROOFTOP'
    | 'HOUSE'
    | 'FITNESS'
    | 'DANCE'
    | 'PRACTICE'
    | 'WORKSHOP'
    | 'MEETING'
  region: string
  district: string
  addressRoad: string
  capacity: number
  basePriceKRW: number
  alcohol: 'PROHIBITED' | 'BYOB' | 'HOST_LICENSED' | 'UNRESTRICTED'
  catering: 'EXTERNAL_OK' | 'HOST_ONLY' | 'BYO_OK'
  amenities: string[]
  /** 호스트가 직접 지정한 use-case 태그. 비우면 카테고리 기반 디폴트가 채워짐 */
  useCases?: string[]
  rating: number
  photos: string[]
}

const DEFAULT_USE_CASES_BY_CATEGORY: Record<SeedSpaceSpec['category'], string[]> = {
  CAFE: ['BIRTHDAY', 'BABYSHOWER', 'GATHERING', 'CLASS'],
  BAR: ['BIRTHDAY', 'GATHERING', 'TEAM_BUILDING'],
  RESTAURANT: ['WEDDING_SMALL', 'TEAM_BUILDING', 'BIRTHDAY'],
  STUDIO: ['FILMING', 'PHOTOSHOOT', 'POPUP_EXHIBIT'],
  GALLERY: ['POPUP_EXHIBIT', 'WEDDING_SMALL', 'NETWORKING'],
  ROOFTOP: ['BIRTHDAY', 'TEAM_BUILDING', 'WEDDING_SMALL'],
  HOUSE: ['BIRTHDAY', 'WEDDING_SMALL', 'PHOTOSHOOT'],
  FITNESS: ['CLASS', 'REHEARSAL'],
  DANCE: ['CLASS', 'REHEARSAL', 'PHOTOSHOOT'],
  PRACTICE: ['REHEARSAL', 'CLASS'],
  WORKSHOP: ['CLASS', 'CORPORATE_WORKSHOP', 'BIRTHDAY'],
  MEETING: ['CORPORATE_WORKSHOP', 'NETWORKING', 'CLASS'],
}

const SPACE_SEEDS: SeedSpaceSpec[] = [
  {
    title: '망원동 햇살가득 카페 통대관',
    summary: '오후 6시 마감 후 통째로. 아이보리 톤 60평 공간.',
    description:
      '평일 18시 이후, 휴무일 종일 통대관 가능한 망원동 카페입니다. 50인 스몰웨딩·생일파티에 최적화됐고, 빔프로젝터·음향 무료 대여, 외부 케이터링 가능합니다.',
    category: 'CAFE',
    region: '서울',
    district: '마포구',
    addressRoad: '서울 마포구 망원로 12',
    capacity: 50,
    basePriceKRW: 80000,
    alcohol: 'BYOB',
    catering: 'EXTERNAL_OK',
    amenities: ['wifi', 'projector', 'speaker', 'kitchen', 'photobooth', 'parking'],
    rating: 4.9,
    photos: [
      'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1280',
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1280',
      'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=1280',
    ],
  },
  {
    title: '연남 골목 와인바 야간 통대관',
    summary: '22시 영업 종료 후 새벽까지. 45인 프라이빗 파티.',
    description:
      '월요일 휴무, 평일 22시 이후 통째로 빌릴 수 있는 와인바입니다. 호스트 라이선스로 주류 직접 판매 가능, BGM 시스템 완비. 송년·신년·생일 파티에 좋아요.',
    category: 'BAR',
    region: '서울',
    district: '마포구',
    addressRoad: '서울 마포구 동교로 24',
    capacity: 45,
    basePriceKRW: 130000,
    alcohol: 'HOST_LICENSED',
    catering: 'HOST_ONLY',
    amenities: ['wifi', 'speaker', 'mic', 'tables', 'ac'],
    rating: 4.8,
    photos: [
      'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=1280',
      'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=1280',
      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1280',
    ],
  },
  {
    title: '성수동 갤러리 통대관',
    summary: '높은 층고·자연채광. 팝업·전시·룩북 촬영.',
    description:
      '4.2m 층고, 남향 풀창, 90평 화이트 큐브. 평일 19시 이후·휴무일 종일 가능. 브랜드 팝업, 룩북 촬영, 전시·강연 행사 최적.',
    category: 'GALLERY',
    region: '서울',
    district: '성동구',
    addressRoad: '서울 성동구 성수이로 18',
    capacity: 80,
    basePriceKRW: 160000,
    alcohol: 'BYOB',
    catering: 'EXTERNAL_OK',
    amenities: ['wifi', 'projector', 'speaker', 'mic', 'parking', 'wheelchair'],
    rating: 4.95,
    photos: [
      'https://images.unsplash.com/photo-1577412647305-991150c7d163?w=1280',
      'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1280',
      'https://images.unsplash.com/photo-1582719188393-bb71ca45dbb9?w=1280',
    ],
  },
  {
    title: '한남동 다이닝 야간 단독 대관',
    summary: '미슐랭 출신 셰프 다이닝, 마감 후 단독.',
    description:
      '평일 22시 마감 후·일요일 종일 단독 대관 가능. 풀코스 케이터링(추가 결제) 또는 외부 케이터링 모두 가능. 40인 좌석.',
    category: 'RESTAURANT',
    region: '서울',
    district: '용산구',
    addressRoad: '서울 용산구 한남대로 27',
    capacity: 40,
    basePriceKRW: 200000,
    alcohol: 'HOST_LICENSED',
    catering: 'HOST_ONLY',
    amenities: ['wifi', 'speaker', 'mic', 'parking', 'kitchen'],
    rating: 4.9,
    photos: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1280',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1280',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1280',
    ],
  },
  {
    title: '서촌 한옥 마당 + 거실 통대관',
    summary: '한옥 마루+마당. 따뜻한 모임 공간.',
    description:
      '한옥 거실 25평 + 마당 15평. 휴무일 종일, 평일 야간 가능. 외부 음식 반입 자유, 주방 공유. 한복 화보·돌잔치·소규모 결혼식에 적합.',
    category: 'HOUSE',
    region: '서울',
    district: '종로구',
    addressRoad: '서울 종로구 누하동 11',
    capacity: 30,
    basePriceKRW: 110000,
    alcohol: 'BYOB',
    catering: 'BYO_OK',
    amenities: ['wifi', 'kitchen', 'tables', 'heater', 'piano'],
    rating: 4.85,
    photos: [
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1280',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1280',
      'https://images.unsplash.com/photo-1510627498534-cf7e9002facc?w=1280',
    ],
  },
  {
    title: '이태원 루프탑 바 통대관',
    summary: '시티뷰 루프탑. 100인 칵테일 파티.',
    description:
      '23시 영업 종료 후 새벽까지 통대관 가능. 호스트 라이선스로 주류 직접 판매. DJ 부스·음향 시스템·테이블 셋업 포함. 야간 야외 파티에 최적.',
    category: 'ROOFTOP',
    region: '서울',
    district: '용산구',
    addressRoad: '서울 용산구 이태원로 145',
    capacity: 100,
    basePriceKRW: 250000,
    alcohol: 'HOST_LICENSED',
    catering: 'HOST_ONLY',
    amenities: ['wifi', 'speaker', 'mic', 'tables', 'rooftop'],
    rating: 4.92,
    photos: [
      'https://images.unsplash.com/photo-1559923490-1c4b2bf38e1d?w=1280',
      'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=1280',
      'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1280',
    ],
  },
  {
    title: '연남 화이트 큐브 스튜디오',
    summary: '대형 무한 배경 + 조명. 룩북·인물 촬영 전문.',
    description:
      '8x6m 무한 배경(화이트), Profoto 4세트, 자연광 가능. 휴무일 종일, 평일 18시 이후. 룩북·프로필·인플루언서 콘텐츠 촬영에 적합.',
    category: 'STUDIO',
    region: '서울',
    district: '마포구',
    addressRoad: '서울 마포구 동교로 51',
    capacity: 15,
    basePriceKRW: 90000,
    alcohol: 'PROHIBITED',
    catering: 'EXTERNAL_OK',
    amenities: ['wifi', 'projector', 'photobooth', 'tv', 'parking'],
    rating: 4.88,
    photos: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1280',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1280',
      'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=1280',
    ],
  },
  {
    title: '연희동 비스트로 휴무일 대관',
    summary: '월요일 휴무. 35인 모임·돌잔치.',
    description:
      '매주 월요일 휴무일 종일, 평일 21시 이후 가능. 외부 케이터링·BYOB 가능. 가족 모임·돌잔치·생일에 잘 어울려요.',
    category: 'RESTAURANT',
    region: '서울',
    district: '서대문구',
    addressRoad: '서울 서대문구 연희로 28',
    capacity: 35,
    basePriceKRW: 95000,
    alcohol: 'BYOB',
    catering: 'BYO_OK',
    amenities: ['wifi', 'tables', 'kitchen', 'ac', 'heater'],
    rating: 4.82,
    photos: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1280',
      'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=1280',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1280',
    ],
  },
  {
    title: '잠실 라운지 바 야간 통대관',
    summary: '강남권 접근성, 대형 모임·송년회.',
    description:
      '평일 23시 마감 후, 일요일 종일. 송년·신년·기업 회식 60인 가능. 빔프로젝터·노래방 시스템·DJ 부스 완비.',
    category: 'BAR',
    region: '서울',
    district: '송파구',
    addressRoad: '서울 송파구 올림픽로 240',
    capacity: 60,
    basePriceKRW: 180000,
    alcohol: 'HOST_LICENSED',
    catering: 'HOST_ONLY',
    amenities: ['wifi', 'projector', 'speaker', 'mic', 'tables'],
    rating: 4.78,
    photos: [
      'https://images.unsplash.com/photo-1538488881038-e252a119ace7?w=1280',
      'https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=1280',
      'https://images.unsplash.com/photo-1543007631-283050bb3e8c?w=1280',
    ],
  },
  {
    title: '한강뷰 카페 통대관',
    summary: '서비스 종료 후 한강뷰 카페 통째로.',
    description:
      '여의도 한강뷰, 평일 21시 이후, 주말 일출 시간 통대관 가능. 45인. 결혼식 애프터파티·생일·스튜디오 촬영에 좋아요.',
    category: 'CAFE',
    region: '서울',
    district: '영등포구',
    addressRoad: '서울 영등포구 여의대로 24',
    capacity: 45,
    basePriceKRW: 140000,
    alcohol: 'BYOB',
    catering: 'EXTERNAL_OK',
    amenities: ['wifi', 'projector', 'speaker', 'photobooth', 'parking'],
    rating: 4.93,
    photos: [
      'https://images.unsplash.com/photo-1525629568013-633a8f1adfa9?w=1280',
      'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=1280',
      'https://images.unsplash.com/photo-1493857671505-72967e2e2760?w=1280',
    ],
  },
  {
    title: '강남 프리미엄 PT 스튜디오 영업외 1:1',
    summary: '22시 마감 후, 휴무일 종일. 트레이너 동반 OK.',
    description:
      '강남역 도보 5분, 프리미엄 PT 스튜디오 영업 외 시간을 1:1 또는 소그룹 운동 공간으로 대여합니다. 머신·프리웨이트 풀세트, 샤워실 1실. 외부 트레이너 동반 또는 셀프 운동 가능 (체육시설업 신고로 합법).',
    category: 'FITNESS',
    region: '서울',
    district: '강남구',
    addressRoad: '서울 강남구 테헤란로 152',
    capacity: 6,
    basePriceKRW: 45000,
    alcohol: 'PROHIBITED',
    catering: 'EXTERNAL_OK',
    amenities: ['wifi', 'speaker', 'parking', 'toilet', 'ac'],
    rating: 4.86,
    photos: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1280',
      'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1280',
      'https://images.unsplash.com/photo-1583500178690-f7fd39c00d4d?w=1280',
    ],
  },
  {
    title: '홍대 댄스 스튜디오 야간 통대관',
    summary: '거울 4면, 마룻바닥. 연습·촬영·소규모 클래스.',
    description:
      '홍대입구역 5분, 평일 22시 이후·일요일 종일 대관 가능한 댄스 스튜디오. 8x10m 마룻바닥, 4면 전면 거울, 음향 시스템, 환복실 2실. 연습·영상 촬영·소규모 강습 모두 적합.',
    category: 'DANCE',
    region: '서울',
    district: '마포구',
    addressRoad: '서울 마포구 양화로 162',
    capacity: 12,
    basePriceKRW: 35000,
    alcohol: 'PROHIBITED',
    catering: 'BYO_OK',
    amenities: ['wifi', 'speaker', 'mic', 'ac', 'tv'],
    rating: 4.91,
    photos: [
      'https://images.unsplash.com/photo-1546484959-f9a381d1330d?w=1280',
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1280',
      'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=1280',
    ],
  },
  {
    title: '합정 음악 합주실 평일 야간',
    summary: '드럼·앰프 풀세트. 22~02시, 시간당 합리적.',
    description:
      '합정역 7분, 평일 22시 이후 새벽까지 빌리는 합주실. 드럼 키트, 베이스/기타 앰프 2종, 보컬 마이크 4개, PA 시스템. 밴드 합주·녹음·콘텐츠 촬영 환영.',
    category: 'PRACTICE',
    region: '서울',
    district: '마포구',
    addressRoad: '서울 마포구 양화로 45',
    capacity: 8,
    basePriceKRW: 28000,
    alcohol: 'BYOB',
    catering: 'BYO_OK',
    amenities: ['wifi', 'speaker', 'mic', 'ac'],
    rating: 4.79,
    photos: [
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1280',
      'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=1280',
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1280',
    ],
  },
  {
    title: '연남 도예 공방 휴무일 클래스 대관',
    summary: '월요일 휴무. 물레 4대, 가마. 원데이 클래스.',
    description:
      '월요일 종일 휴무. 물레 4대, 전기가마, 점토·유약 사용료 별도. 친구·동호회 원데이 클래스, 브랜드 워크숍, 컨텐츠 촬영 가능. 음식 반입은 차·간단한 다과 정도 권장.',
    category: 'WORKSHOP',
    region: '서울',
    district: '마포구',
    addressRoad: '서울 마포구 동교로 219',
    capacity: 10,
    basePriceKRW: 60000,
    alcohol: 'PROHIBITED',
    catering: 'BYO_OK',
    amenities: ['wifi', 'tables', 'kitchen', 'ac'],
    rating: 4.94,
    photos: [
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1280',
      'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=1280',
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=1280',
    ],
  },
  {
    title: '판교 비즈니스 세미나실 야간 대관',
    summary: '20인 회의실, 빔·화이트보드·노트북 충전.',
    description:
      '판교 IT밸리 한가운데. 평일 19시 이후·주말 종일 대관 가능. 회의 테이블 20인석, 4K 빔프로젝터, 전동 스크린, 양면 화이트보드, 무선 충전 패드, 정수기, 커피머신. 부서 워크숍·세미나·교육에 안성맞춤.',
    category: 'MEETING',
    region: '경기',
    district: '성남시',
    addressRoad: '경기 성남시 분당구 판교역로 235',
    capacity: 20,
    basePriceKRW: 50000,
    alcohol: 'PROHIBITED',
    catering: 'EXTERNAL_OK',
    amenities: ['wifi', 'projector', 'mic', 'tv', 'parking', 'wheelchair'],
    rating: 4.87,
    photos: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1280',
      'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1280',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1280',
    ],
  },
]

async function main() {
  console.log('🌱 Seeding offhours…')

  const adminPwd = await argon2.hash('admin1234', { type: argon2.argon2id })
  const guestPwd = await argon2.hash('guest1234', { type: argon2.argon2id })
  const hostPwd = await argon2.hash('host1234', { type: argon2.argon2id })

  const superadmin = await prisma.user.upsert({
    where: { email: 'admin@offhours.kr' },
    update: {},
    create: {
      email: 'admin@offhours.kr',
      passwordHash: adminPwd,
      name: '운영팀',
      role: Role.SUPERADMIN,
      isVerified: true,
      referralCode: code(),
    },
  })

  const guest = await prisma.user.upsert({
    where: { email: 'guest@offhours.kr' },
    update: {},
    create: {
      email: 'guest@offhours.kr',
      passwordHash: guestPwd,
      name: '지은',
      role: Role.USER,
      isVerified: true,
      referralCode: code(),
    },
  })

  for (let i = 0; i < SPACE_SEEDS.length; i++) {
    const spec = SPACE_SEEDS[i]
    const email = `host${i + 1}@offhours.kr`
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash: hostPwd,
        name: `호스트${i + 1}`,
        role: Role.HOST,
        isVerified: true,
        referralCode: code(),
      },
    })
    const hostProfile = await prisma.hostProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        businessName: `${spec.title.split(' ')[0]} 본점`,
        businessNumber: `${100 + i}-${10 + i}-${10000 + i}`,
        taxType: 'INDIVIDUAL',
        bankName: '토스뱅크',
        bankAccount: `1000${randomBytes(2).toString('hex')}`,
        payoutCycle: 'D7',
        approvedAt: new Date(),
      },
    })

    const venue = await prisma.venue.create({
      data: {
        hostId: hostProfile.id,
        name: spec.title.split(' ')[0],
        category: spec.category,
        addressJibun: spec.addressRoad,
        addressRoad: spec.addressRoad,
        region: spec.region,
        district: spec.district,
        lat: 37.55 + Math.random() * 0.1,
        lng: 126.95 + Math.random() * 0.1,
        description: `${spec.region} ${spec.district}에 위치한 공간입니다.`,
        status: 'ACTIVE',
        approvedAt: new Date(),
        businessHours: {
          create: [
            { weekday: 1, openMinute: 600, closeMinute: 1320 },
            { weekday: 2, openMinute: 600, closeMinute: 1320 },
            { weekday: 3, openMinute: 600, closeMinute: 1320 },
            { weekday: 4, openMinute: 600, closeMinute: 1320 },
            { weekday: 5, openMinute: 600, closeMinute: 1380 },
            { weekday: 6, openMinute: 660, closeMinute: 1380 },
            { weekday: 0, openMinute: 660, closeMinute: 1260 },
          ],
        },
        holidays: {
          create: [{ date: new Date(), repeat: 'WEEKLY', reason: '정기 휴무' }],
        },
      },
    })

    const slug = `${venue.district.toLowerCase().replace(/\s+/g, '-')}-${randomBytes(3).toString('hex')}`
    await prisma.space.create({
      data: {
        venueId: venue.id,
        slug,
        title: spec.title,
        summary: spec.summary,
        description: spec.description,
        capacityMin: Math.max(1, Math.floor(spec.capacity * 0.3)),
        capacityMax: spec.capacity,
        areaM2: Math.floor(spec.capacity * 1.3),
        basePriceKRW: spec.basePriceKRW,
        cleaningFeeKRW: 30000,
        cleaningMinutes: 90,
        minHours: 3,
        instantBook: i % 3 === 0,
        alcoholPolicy: spec.alcohol,
        cateringPolicy: spec.catering,
        amenities: spec.amenities,
        useCases: spec.useCases ?? DEFAULT_USE_CASES_BY_CATEGORY[spec.category] ?? [],
        rules: '실내 흡연 금지, 23시 이후 음향 70dB 이하, 원상복구 의무.',
        status: 'ACTIVE',
        approvedAt: new Date(),
        ratingAvg: spec.rating,
        ratingCount: 12 + i,
        viewCount: 200 + Math.floor(Math.random() * 1500),
        photos: {
          create: spec.photos.map((url, order) => ({ url, order, alt: spec.title })),
        },
      },
    })
  }

  // 라이브 매칭·동선 추천 데모를 위해 향후 7일치 데모 슬롯 생성.
  // 운영에서는 SlotsScheduler 의 매일 03:00 KST 크론이 담당.
  const activeSpaces = await prisma.space.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, basePriceKRW: true, cleaningMinutes: true },
  })
  const now = new Date()
  const slotData: {
    spaceId: string
    startAt: Date
    endAt: Date
    priceKRW: number
    isOpen: boolean
  }[] = []
  for (const s of activeSpaces) {
    for (let day = 0; day < 7; day++) {
      // 영업 외 시간: 23:00 ~ 익일 06:00 (7시간 윈도우)
      const dayStart = new Date(now)
      dayStart.setHours(23, 0, 0, 0)
      dayStart.setDate(dayStart.getDate() + day)
      const nightEnd = new Date(dayStart.getTime() + 7 * 60 * 60 * 1000)
      slotData.push({
        spaceId: s.id,
        startAt: dayStart,
        endAt: nightEnd,
        priceKRW: s.basePriceKRW,
        isOpen: true,
      })
      // 휴무 가정 통대관: 매주 월요일 09:00 ~ 21:00
      const isMonday = dayStart.getDay() === 1
      if (isMonday) {
        const dayOpen = new Date(now)
        dayOpen.setHours(9, 0, 0, 0)
        dayOpen.setDate(dayOpen.getDate() + day)
        const dayClose = new Date(dayOpen.getTime() + 12 * 60 * 60 * 1000)
        slotData.push({
          spaceId: s.id,
          startAt: dayOpen,
          endAt: dayClose,
          priceKRW: s.basePriceKRW,
          isOpen: true,
        })
      }
    }
  }
  if (slotData.length > 0) {
    await prisma.slot.createMany({ data: slotData, skipDuplicates: true })
  }

  // 데모용 호스트 응답 통계 — 호스트별로 응답 속도를 시각적으로 다양화.
  // 표본 ≥10 + 응답률 ≥0.9 충족 시 카드에 "보통 N시간 안에 답해요" 뱃지.
  const hostUsers = await prisma.user.findMany({
    where: { role: 'HOST' },
    select: { id: true },
    orderBy: { email: 'asc' },
  })
  const profiles: Array<{ medianMin: number; rate: number; sample: number; trust: number }> = [
    { medianMin: 22, rate: 0.96, sample: 38, trust: 95 }, // 최고 신뢰
    { medianMin: 47, rate: 0.92, sample: 21, trust: 88 }, // 우수
    { medianMin: 95, rate: 0.91, sample: 14, trust: 78 }, // 우수
    { medianMin: 170, rate: 0.93, sample: 26, trust: 72 }, // 양호
    { medianMin: 340, rate: 0.95, sample: 18, trust: 65 }, // 양호
    { medianMin: 580, rate: 0.9, sample: 12, trust: 55 }, // 보통
    { medianMin: 80, rate: 0.85, sample: 22, trust: 50 }, // 보통 (응답률 미달)
    { medianMin: 35, rate: 0.97, sample: 5, trust: 40 }, // 주의 (표본 부족)
  ]
  for (let i = 0; i < hostUsers.length; i++) {
    const p = profiles[i % profiles.length]
    await prisma.user.update({
      where: { id: hostUsers[i].id },
      data: {
        responseMedianMin: p.medianMin,
        responseRate24h: p.rate,
        responseSampleCount: p.sample,
        responseUpdatedAt: new Date(),
        trustScore: p.trust,
      },
    })
  }

  // 데모 후기 + 호스트 답글 — 신뢰 시그널 데모. 각 공간에 2~4건 게스트 후기,
  // 호스트별로 답글률 패턴 다르게(0%, 50%, 100%) 노출돼 디테일 페이지의 "답글률" 뱃지 확인 가능.
  await prisma.review.deleteMany({
    where: { author: { email: { contains: 'guest@offhours.kr' } } },
  })
  await prisma.reservation.deleteMany({
    where: { guestId: guest.id, status: 'COMPLETED' },
  })
  const reviewCorpus = [
    {
      rating: 5,
      comment:
        '공간이 너무 예뻐서 사진이 안 잘 나올 수가 없어요. 호스트분이 음향 세팅까지 도와주셔서 마음 편하게 행사했습니다.',
      hostResponse: '소중한 후기 감사드려요! 다음에도 편하게 이용해주시면 언제든 환영입니다 :)',
    },
    {
      rating: 5,
      comment:
        '8시간 단위 통대관이라 처음엔 가격이 걱정됐는데, 청소비·간단 케이터링까지 포함이라 결과적으로 합리적이었어요.',
      hostResponse:
        '말씀해주신 패키지 구성, 게스트분들이 가장 만족해주시는 부분이라 더 신경 쓰고 있어요. 감사합니다.',
    },
    {
      rating: 4,
      comment:
        '동선·청소 가이드가 명확해서 좋았어요. 주차장이 좁아서 친구들 차량 분산해 안내했는데, 안내 메시지를 미리 받을 수 있으면 더 좋겠습니다.',
      hostResponse: null,
    },
    {
      rating: 5,
      comment:
        '저녁 시간대 통대관 후 22시 마감까지 여유 있게 정리할 수 있어 정말 좋았습니다. 다음 모임에도 다시 예약할게요.',
      hostResponse: null,
    },
    {
      rating: 4,
      comment:
        '인스타에서 봤던 무드 그대로였어요. 30명 베이비샤워 정말 잘 진행됐습니다. 빔프로젝터 화질이 조금 아쉬워서 별 하나 뺐어요.',
      hostResponse:
        '아기 사진 잘 받으셨길 바라요. 프로젝터는 4K로 교체 진행 중이고 다음 달 완료 예정입니다. 알려주셔서 감사해요!',
    },
    {
      rating: 3,
      comment:
        '청소 상태는 좋았는데 환기가 잘 안 되는 편이었습니다. 여름 행사에는 다시 고민해볼 것 같아요.',
      hostResponse:
        '환기 관련 피드백 감사합니다. 추가 환풍기 설치를 알아보고 있어요. 다음번엔 더 쾌적하게 모실게요.',
    },
  ]
  const activeSpaceList = await prisma.space.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      basePriceKRW: true,
      cleaningFeeKRW: true,
      capacityMin: true,
      venue: { select: { host: { select: { userId: true } } } },
    },
    take: 10,
  })
  let reviewIdx = 0
  for (let i = 0; i < activeSpaceList.length; i++) {
    const space = activeSpaceList[i]
    const hostUserId = space.venue.host.userId
    // host별 답글률 패턴: 0번 0%, 1번 50%, 2번 100%, 3번 100%, 4번 60%, ...
    const responsePattern = [0, 0.5, 1, 1, 0.6, 0.8, 1, 0.4, 1, 0.7][i % 10]
    const reviewsPerSpace = 2 + (i % 3)
    for (let j = 0; j < reviewsPerSpace; j++) {
      const corpus = reviewCorpus[reviewIdx % reviewCorpus.length]
      reviewIdx++
      const startAt = new Date()
      startAt.setDate(startAt.getDate() - (10 + j * 7))
      startAt.setHours(19, 0, 0, 0)
      const endAt = new Date(startAt.getTime() + 4 * 60 * 60 * 1000)
      const reservation = await prisma.reservation.create({
        data: {
          code: randomCode('RV', 6),
          spaceId: space.id,
          guestId: guest.id,
          startAt,
          endAt,
          headcount: space.capacityMin + j * 2,
          purpose: 'PARTY',
          status: 'COMPLETED',
          baseAmountKRW: space.basePriceKRW * 4,
          cleaningFeeKRW: space.cleaningFeeKRW,
          depositKRW: 0,
          totalKRW: space.basePriceKRW * 4 + space.cleaningFeeKRW,
          feeKRW: Math.round(space.basePriceKRW * 4 * 0.1),
        },
      })
      const shouldRespond = Math.random() < responsePattern && corpus.hostResponse != null
      await prisma.review.create({
        data: {
          reservationId: reservation.id,
          authorId: guest.id,
          subjectId: hostUserId,
          spaceId: space.id,
          rating: corpus.rating,
          comment: corpus.comment,
          isPublished: true,
          publishedAt: new Date(),
          hostResponse: shouldRespond ? corpus.hostResponse : null,
          hostResponseAt: shouldRespond ? new Date() : null,
        },
      })
    }
    // refresh space rating
    const agg = await prisma.review.aggregate({
      _avg: { rating: true },
      _count: true,
      where: { spaceId: space.id, isPublished: true, isHidden: false },
    })
    await prisma.space.update({
      where: { id: space.id },
      data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count },
    })
  }
  // 호스트별 답글률 캐시 재계산
  const uniqueHostIds = Array.from(new Set(activeSpaceList.map((s) => s.venue.host.userId)))
  for (const hid of uniqueHostIds) {
    const total = await prisma.review.count({
      where: { subjectId: hid, isPublished: true, isHidden: false, spaceId: { not: null } },
    })
    const answered = await prisma.review.count({
      where: {
        subjectId: hid,
        isPublished: true,
        isHidden: false,
        spaceId: { not: null },
        hostResponse: { not: null },
      },
    })
    await prisma.user.update({
      where: { id: hid },
      data: {
        reviewSampleCount: total,
        reviewResponseCount: answered,
        reviewResponseRate: total > 0 ? Number((answered / total).toFixed(3)) : null,
        reviewStatsUpdatedAt: new Date(),
      },
    })
  }

  // 데모 컬렉션(위시리스트) — 게스트가 "26살 여름 결혼식 후보" 같이 그룹 결정용 폴더로
  // 모은 공간 모음. 공유 가능한 슬러그 URL 로 친구에게 보냄.
  await prisma.favorite.deleteMany({ where: { userId: guest.id } })
  await prisma.collection.deleteMany({ where: { ownerId: guest.id } })
  const activeSpacesForCollections = await prisma.space.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, venue: { select: { category: true } } },
  })
  const collectionsSeed = [
    {
      slug: 'summer-wedding-2026',
      name: '26살 여름 결혼식 후보',
      emoji: '💒',
      description: '60~120명 스몰웨딩, 야외 가능. 친구들과 함께 골라요.',
      isPublic: true,
      categories: ['GALLERY', 'ROOFTOP', 'HOUSE', 'RESTAURANT'] as const,
    },
    {
      slug: 'team-workshop-q3',
      name: '3분기 사내 워크샵 후보',
      emoji: '💼',
      description: '20~40명, 세금계산서 가능, 프로젝터 필수.',
      isPublic: true,
      categories: ['MEETING', 'WORKSHOP', 'CAFE'] as const,
    },
    {
      slug: 'birthday-secret',
      name: '비공개 — 친구 깜짝 생일',
      emoji: '🎂',
      description: '본인만 볼 수 있는 비공개 폴더',
      isPublic: false,
      categories: ['BAR', 'ROOFTOP', 'RESTAURANT'] as const,
    },
  ]
  const demoVoters = [
    { token: 'demo-voter-jiwon', name: '지원' },
    { token: 'demo-voter-minho', name: '민호' },
    { token: 'demo-voter-seoyeon', name: '서연' },
    { token: 'demo-voter-junseok', name: '준석' },
    { token: 'demo-voter-yejin', name: '예진' },
    { token: 'demo-voter-hyeri', name: '혜리' },
  ]
  for (const c of collectionsSeed) {
    const collection = await prisma.collection.create({
      data: {
        ownerId: guest.id,
        slug: c.slug,
        name: c.name,
        emoji: c.emoji,
        description: c.description,
        isPublic: c.isPublic,
      },
    })
    const picks = activeSpacesForCollections
      .filter((s) => (c.categories as readonly string[]).includes(s.venue.category))
      .slice(0, 5)
    for (let i = 0; i < picks.length; i++) {
      const p = picks[i]
      const fav = await prisma.favorite.upsert({
        where: { userId_spaceId: { userId: guest.id, spaceId: p.id } },
        update: { collectionId: collection.id },
        create: { userId: guest.id, spaceId: p.id, collectionId: collection.id },
      })
      // 공개 컬렉션은 친구들이 미리 투표한 데모: 첫 후보일수록 더 많은 👍
      if (!c.isPublic) continue
      const upCount = Math.max(0, 5 - i)
      const downCount = Math.max(0, i - 2)
      for (let k = 0; k < upCount; k++) {
        const v = demoVoters[k]
        await prisma.collectionItemVote.upsert({
          where: { favoriteId_voterToken: { favoriteId: fav.id, voterToken: v.token } },
          create: { favoriteId: fav.id, voterToken: v.token, voterName: v.name, vote: 'UP' },
          update: { vote: 'UP' as const, voterName: v.name },
        })
      }
      for (let k = 0; k < downCount; k++) {
        const v = demoVoters[demoVoters.length - 1 - k]
        await prisma.collectionItemVote.upsert({
          where: { favoriteId_voterToken: { favoriteId: fav.id, voterToken: v.token } },
          create: { favoriteId: fav.id, voterToken: v.token, voterName: v.name, vote: 'DOWN' },
          update: { vote: 'DOWN' as const, voterName: v.name },
        })
      }
    }
  }

  // 데모 캘린더 차단 — 호스트가 "카톡으로 받은 외부 예약" 등을 등록한 시나리오.
  // 호스트 페이지에서 차단 시간이 슬롯 검색에 반영되는 걸 보여줌.
  await prisma.venueBlock.deleteMany({})
  await prisma.externalCalendar.deleteMany({})
  const venuesForBlocks = await prisma.venue.findMany({
    select: { id: true, name: true },
    take: 6,
  })
  let blockSeedCount = 0
  for (let i = 0; i < venuesForBlocks.length; i++) {
    const v = venuesForBlocks[i]
    const base = new Date()
    base.setHours(0, 0, 0, 0)
    const day1 = new Date(base.getTime() + (3 + i) * 24 * 60 * 60 * 1000)
    day1.setHours(18, 0, 0, 0)
    const day1End = new Date(day1.getTime() + 4 * 60 * 60 * 1000)
    const day2 = new Date(base.getTime() + (8 + i) * 24 * 60 * 60 * 1000)
    day2.setHours(20, 0, 0, 0)
    const day2End = new Date(day2.getTime() + 3 * 60 * 60 * 1000)
    await prisma.venueBlock.createMany({
      data: [
        {
          venueId: v.id,
          label: '카톡으로 받은 외부 예약',
          startAt: day1,
          endAt: day1End,
          source: 'MANUAL',
        },
        {
          venueId: v.id,
          label: '본인 일정 (가족 모임)',
          startAt: day2,
          endAt: day2End,
          source: 'MANUAL',
        },
      ],
    })
    blockSeedCount += 2
  }

  console.log(
    `✅ Seeded ${SPACE_SEEDS.length} spaces, ${slotData.length} demo slots, ` +
      `${hostUsers.length} host response stats, ${collectionsSeed.length} collections, ` +
      `${blockSeedCount} venue blocks.`
  )
  console.log(`👤 admin@offhours.kr / admin1234  (SUPERADMIN)`)
  console.log(`👤 guest@offhours.kr / guest1234  (USER)`)
  console.log(`👤 host1@offhours.kr ~ host${SPACE_SEEDS.length}@offhours.kr / host1234  (HOST)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
