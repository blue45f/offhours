import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Role } from '@prisma/client'
import * as argon2 from 'argon2'
import { randomBytes } from 'crypto'

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
  rating: number
  photos: string[]
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

  console.log(`✅ Seeded ${SPACE_SEEDS.length} spaces.`)
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
