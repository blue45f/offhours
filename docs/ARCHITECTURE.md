# Offhours — Architecture

## 1. 톱-다운 다이어그램

```
                ┌──────────────────────────────────┐
                │   Browser (React 19 + Vite)      │
                │  TanStack Query · Zustand · RHF  │
                └──────────────┬───────────────────┘
                               │ HTTPS / REST
                               ▼
┌──────────────────────────────────────────────────────┐
│            NestJS 11 API (apps/api)                  │
│  Auth · Spaces · Slots · Reservations · Payments     │
│  Reviews · Chat · Notifications · Admin · Reports    │
│  Guards: JWT / Roles / Throttler                     │
│  Pipes: ZodValidationPipe (nestjs-zod)               │
│  Filters: HttpException / Prisma                     │
└─────┬──────────────┬─────────────┬───────────────────┘
      │              │             │
   Prisma         Toss          SES / Sendgrid
   PostgreSQL     Payments      (Email)
   PostGIS                      Kakao Alimtalk
   Redis (cache)
   S3 / Cloudinary
```

## 2. 모노레포 구조

```
offhours/
├── apps/
│   ├── api/                # NestJS 11
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── common/         (guards, filters, pipes, decorators)
│   │   │   ├── prisma/         (PrismaService)
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── venues/
│   │   │   ├── spaces/
│   │   │   ├── slots/          (영업외 시간 자동 슬롯)
│   │   │   ├── reservations/
│   │   │   ├── payments/       (토스페이먼츠 Webhook)
│   │   │   ├── reviews/
│   │   │   ├── chat/
│   │   │   ├── notifications/
│   │   │   ├── favorites/
│   │   │   ├── reports/
│   │   │   ├── admin/          (관리자 라우트)
│   │   │   └── seo/            (sitemap, robots)
│   │   ├── vitest.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                # React 19 + Vite 8
│       ├── public/
│       ├── src/
│       │   ├── main.tsx
│       │   ├── app/            (Providers, queryClient)
│       │   ├── router/         (createBrowserRouter)
│       │   ├── components/     (디자인 시스템·공통)
│       │   ├── features/
│       │   │   ├── auth/
│       │   │   ├── spaces/
│       │   │   ├── reservations/
│       │   │   ├── reviews/
│       │   │   ├── chat/
│       │   │   ├── host/
│       │   │   └── admin/
│       │   ├── pages/          (라우트 레벨)
│       │   ├── services/       (api client)
│       │   ├── hooks/
│       │   ├── store/          (Zustand)
│       │   ├── styles/         (Tailwind + tokens)
│       │   ├── utils/
│       │   └── types/
│       ├── vite.config.ts
│       └── tsconfig.json
│
├── packages/
│   └── shared/             # Zod 스키마·상수·타입 (api↔web 공유)
│       ├── src/
│       │   ├── index.ts
│       │   ├── enums.ts
│       │   ├── space.ts
│       │   ├── reservation.ts
│       │   ├── user.ts
│       │   ├── chat.ts
│       │   └── pagination.ts
│       └── package.json
│
├── docs/
│   ├── PRODUCT.md
│   ├── ARCHITECTURE.md
│   ├── DESIGN.md
│   └── CLAUDE.md
├── scripts/
│   └── validate-architecture.mjs
├── docker-compose.yml
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── .prettierrc
├── .editorconfig
├── .gitignore
└── package.json
```

## 3. DB 스키마(Prisma 핵심)

```prisma
// 사용자·인증
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String?
  name          String
  phone         String?  @unique
  avatarUrl     String?
  role          Role     @default(USER)        // USER · HOST · ADMIN · SUPERADMIN
  isVerified    Boolean  @default(false)       // 휴대폰/이메일 인증
  isSuspended   Boolean  @default(false)
  marketingOptIn Boolean @default(false)
  referralCode  String   @unique
  referredById  String?
  pointsKRW     Int      @default(0)
  trustScore    Int      @default(50)          // 0~100
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  hostProfile   HostProfile?
  reservations  Reservation[]   @relation("GuestReservations")
  reviews       Review[]        @relation("AuthorReviews")
  reviewsAbout  Review[]        @relation("SubjectReviews")
  favorites     Favorite[]
  notifications Notification[]
  chats         ChatMembership[]
  reportsFiled  Report[]        @relation("Reporter")
  auditLogs     AuditLog[]
}

enum Role { USER HOST ADMIN SUPERADMIN }

model HostProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  businessName    String
  businessNumber  String   @unique             // 사업자등록번호
  businessLicenseUrl String?                    // OCR 인증 이미지
  taxType         TaxType  @default(INDIVIDUAL) // INDIVIDUAL · CORPORATE
  bankName        String?
  bankAccount     String?                       // 정산 계좌
  payoutCycle     PayoutCycle @default(D7)      // D7 · D14
  isInsured       Boolean  @default(false)      // 책임 보험 가입
  insuranceCertUrl String?
  approvedAt      DateTime?
  createdAt       DateTime @default(now())

  venues  Venue[]
}

enum TaxType { INDIVIDUAL CORPORATE }
enum PayoutCycle { D7 D14 }

// 공간(매장)·룸
model Venue {
  id            String   @id @default(cuid())
  hostId        String
  host          HostProfile @relation(fields: [hostId], references: [id])
  name          String
  category      VenueCategory                   // CAFE · BAR · RESTAURANT · STUDIO · GALLERY · ETC
  addressJibun  String                          // 지번 주소
  addressRoad   String                          // 도로명
  addressDetail String?                         // 호수 (결제 후 공개)
  lat           Float
  lng           Float
  region        String                          // 시/도
  district      String                          // 구/군
  description   String   @db.Text
  status        VenueStatus @default(DRAFT)     // DRAFT · PENDING_REVIEW · ACTIVE · SUSPENDED
  createdAt     DateTime @default(now())

  spaces        Space[]
  businessHours BusinessHour[]
  holidays      Holiday[]
}

enum VenueCategory { CAFE BAR RESTAURANT STUDIO GALLERY ROOFTOP HOUSE ETC }
enum VenueStatus   { DRAFT PENDING_REVIEW ACTIVE SUSPENDED REJECTED }

model BusinessHour {
  id          String @id @default(cuid())
  venueId     String
  venue       Venue  @relation(fields: [venueId], references: [id])
  weekday     Int     // 0(Sun) ~ 6(Sat)
  openMinute  Int     // 0~1440 (e.g., 600 = 10:00)
  closeMinute Int     // 0~1440 (e.g., 1320 = 22:00)
  @@unique([venueId, weekday])
}

model Holiday {
  id      String   @id @default(cuid())
  venueId String
  venue   Venue    @relation(fields: [venueId], references: [id])
  date    DateTime               // 단일 휴무일
  repeat  RepeatRule @default(NONE) // NONE · WEEKLY · MONTHLY
  reason  String?
}

enum RepeatRule { NONE WEEKLY MONTHLY }

model Space {
  id                  String   @id @default(cuid())
  venueId             String
  venue               Venue    @relation(fields: [venueId], references: [id])
  slug                String   @unique
  title               String
  summary             String
  description         String   @db.Text
  capacityMin         Int      @default(1)
  capacityMax         Int
  areaM2              Int?
  basePriceKRW        Int                      // 시간당 기본가
  cleaningFeeKRW      Int      @default(0)
  cleaningMinutes     Int      @default(60)    // 청소 윈도우 (강제)
  minHours            Int      @default(3)     // 최소 예약
  instantBook         Boolean  @default(false)
  alcoholPolicy       AlcoholPolicy            // PROHIBITED · BYOB · HOST_LICENSED · UNRESTRICTED
  cateringPolicy      CateringPolicy           // EXTERNAL_OK · HOST_ONLY · BYO_OK
  amenities           String[]                 // ["wifi","projector","speaker","parking",...]
  rules               String   @db.Text
  status              SpaceStatus @default(DRAFT)
  viewCount           Int      @default(0)
  ratingAvg           Float    @default(0)
  ratingCount         Int      @default(0)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  photos        SpacePhoto[]
  pricingRules  PricingRule[]      // 동적 가격
  slots         Slot[]
  reservations  Reservation[]
  reviews       Review[]
  favorites     Favorite[]
}

enum AlcoholPolicy { PROHIBITED BYOB HOST_LICENSED UNRESTRICTED }
enum CateringPolicy { EXTERNAL_OK HOST_ONLY BYO_OK }
enum SpaceStatus    { DRAFT PENDING_REVIEW ACTIVE SUSPENDED REJECTED }

model SpacePhoto {
  id        String @id @default(cuid())
  spaceId   String
  space     Space  @relation(fields: [spaceId], references: [id])
  url       String
  blurhash  String?
  order     Int    @default(0)
  alt       String?
}

model PricingRule {
  id           String   @id @default(cuid())
  spaceId      String
  space        Space    @relation(fields: [spaceId], references: [id])
  label        String                           // "주말 새벽 프리미엄"
  multiplier   Float                            // 1.0 = 동일, 1.5 = +50%
  weekdayMask  Int                              // 비트마스크 0b1111111
  startMinute  Int                              // 0~1440
  endMinute    Int
  priority     Int      @default(0)
}

// 영업 외 시간 슬롯 (호스트 영업시간 + 휴무일 → 자동 생성)
model Slot {
  id          String   @id @default(cuid())
  spaceId     String
  space       Space    @relation(fields: [spaceId], references: [id])
  startAt     DateTime
  endAt       DateTime
  priceKRW    Int                              // 동적 가격 적용 결과
  isOpen      Boolean  @default(true)          // 호스트 수동 차단 가능
  reservation Reservation?
  @@index([spaceId, startAt])
}

// 예약·결제
model Reservation {
  id            String   @id @default(cuid())
  code          String   @unique               // 사람이 읽는 코드 OFH-AB12CD
  spaceId       String
  space         Space    @relation(fields: [spaceId], references: [id])
  slotId        String?  @unique
  slot          Slot?    @relation(fields: [slotId], references: [id])
  guestId       String
  guest         User     @relation("GuestReservations", fields: [guestId], references: [id])
  startAt       DateTime
  endAt         DateTime
  headcount     Int
  purpose       Purpose                        // PARTY · WEDDING · MEETING · POPUP · SHOOT · OTHER
  note          String?  @db.Text
  status        ReservationStatus @default(REQUESTED)
  baseAmountKRW Int
  cleaningFeeKRW Int     @default(0)
  depositKRW    Int      @default(0)
  totalKRW      Int
  feeKRW        Int                            // 호스트측 12%
  cancelReason  String?
  checkInCode   String?
  checkedInAt   DateTime?
  checkedOutAt  DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  payment       Payment?
  reviews       Review[]
  chat          Chat?
  dispute       Dispute?
}

enum Purpose            { PARTY WEDDING MEETING POPUP SHOOT OTHER }
enum ReservationStatus  { REQUESTED APPROVED PAID CHECKED_IN CHECKED_OUT COMPLETED CANCELED REFUNDED }

model Payment {
  id              String   @id @default(cuid())
  reservationId   String   @unique
  reservation     Reservation @relation(fields: [reservationId], references: [id])
  provider        PaymentProvider @default(TOSS)
  providerKey     String   @unique             // 토스 paymentKey
  method          String                        // CARD · KAKAO · NAVER · TOSS · APPLE · SAMSUNG
  amountKRW       Int
  status          PaymentStatus  @default(READY)
  receiptUrl      String?
  webhookEvents   Json?
  authorizedAt    DateTime?
  capturedAt      DateTime?
  refundedAt      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum PaymentProvider { TOSS }
enum PaymentStatus   { READY AUTHORIZED CAPTURED PARTIAL_REFUNDED REFUNDED FAILED }

model Settlement {
  id              String   @id @default(cuid())
  hostId          String
  amountKRW       Int
  periodStart     DateTime
  periodEnd       DateTime
  status          SettlementStatus  @default(PENDING)
  invoiceUrl      String?
  paidAt          DateTime?
  createdAt       DateTime @default(now())
}

enum SettlementStatus { PENDING SCHEDULED PAID FAILED }

// 리뷰
model Review {
  id            String   @id @default(cuid())
  reservationId String
  reservation   Reservation @relation(fields: [reservationId], references: [id])
  authorId      String
  author        User     @relation("AuthorReviews", fields: [authorId], references: [id])
  subjectId     String                           // 대상 user (호스트→게스트, 게스트→호스트)
  subject       User     @relation("SubjectReviews", fields: [subjectId], references: [id])
  spaceId       String?
  space         Space?   @relation(fields: [spaceId], references: [id])
  rating        Int                              // 1~5
  comment       String   @db.Text
  isPublished   Boolean  @default(false)        // 더블블라인드 후 공개
  publishedAt   DateTime?
  hostResponse  String?  @db.Text
  hostResponseAt DateTime?
  isHidden      Boolean  @default(false)
  createdAt     DateTime @default(now())
}

// 채팅·알림·찜
model Chat {
  id            String   @id @default(cuid())
  reservationId String?  @unique
  reservation   Reservation? @relation(fields: [reservationId], references: [id])
  createdAt     DateTime @default(now())
  members       ChatMembership[]
  messages      ChatMessage[]
}

model ChatMembership {
  id        String @id @default(cuid())
  chatId    String
  chat      Chat   @relation(fields: [chatId], references: [id])
  userId    String
  user      User   @relation(fields: [userId], references: [id])
  lastReadAt DateTime?
  @@unique([chatId, userId])
}

model ChatMessage {
  id        String   @id @default(cuid())
  chatId    String
  chat      Chat     @relation(fields: [chatId], references: [id])
  senderId  String
  body      String   @db.Text
  attachments Json?
  createdAt DateTime @default(now())
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  type      NotificationType
  title     String
  body      String
  data      Json?
  readAt    DateTime?
  createdAt DateTime @default(now())
}

enum NotificationType {
  RESERVATION_REQUESTED
  RESERVATION_APPROVED
  RESERVATION_REJECTED
  PAYMENT_COMPLETED
  REVIEW_REQUESTED
  CHAT_MESSAGE
  SYSTEM
}

model Favorite {
  id      String @id @default(cuid())
  userId  String
  user    User   @relation(fields: [userId], references: [id])
  spaceId String
  space   Space  @relation(fields: [spaceId], references: [id])
  createdAt DateTime @default(now())
  @@unique([userId, spaceId])
}

// 신고·분쟁·감사
model Report {
  id          String   @id @default(cuid())
  reporterId  String
  reporter    User     @relation("Reporter", fields: [reporterId], references: [id])
  targetType  ReportTarget
  targetId    String
  reason      ReportReason
  description String   @db.Text
  status      ReportStatus  @default(OPEN)
  resolution  String?
  createdAt   DateTime @default(now())
  resolvedAt  DateTime?
}

enum ReportTarget { USER SPACE REVIEW MESSAGE }
enum ReportReason { SCAM ABUSE INAPPROPRIATE FAKE_LISTING OTHER }
enum ReportStatus { OPEN UNDER_REVIEW RESOLVED DISMISSED }

model Dispute {
  id            String @id @default(cuid())
  reservationId String @unique
  reservation   Reservation @relation(fields: [reservationId], references: [id])
  raisedBy      String                           // userId
  reason        String
  description   String @db.Text
  evidence      Json?                            // 사진 URLs
  status        DisputeStatus  @default(OPEN)
  resolution    String?
  resolvedAt    DateTime?
  createdAt     DateTime @default(now())
}

enum DisputeStatus { OPEN UNDER_REVIEW RESOLVED_FAVOR_GUEST RESOLVED_FAVOR_HOST DISMISSED }

model AuditLog {
  id        String   @id @default(cuid())
  actorId   String                              // admin/superadmin userId
  actor     User     @relation(fields: [actorId], references: [id])
  action    String                              // "USER_SUSPEND", "SPACE_APPROVE", ...
  targetType String
  targetId  String
  before    Json?
  after     Json?
  ip        String?
  userAgent String?
  createdAt DateTime @default(now())
  @@index([actorId, createdAt])
  @@index([targetType, targetId])
}
```

## 4. 인증 & 권한

- **JWT Access Token** (15분) + **Refresh Token Rotation** (30일, httpOnly 쿠키)
- 비밀번호: **argon2id**
- 소셜 로그인(Phase 2): Google/Kakao
- 권한: `@Roles(Role.ADMIN, Role.SUPERADMIN)` 데코레이터 + `RolesGuard`
- Rate Limit: `@nestjs/throttler` (전역 60req/min, 인증 5req/min)

## 5. 영업외 시간 슬롯 엔진

```
입력:
  - venue.businessHours (요일별 open/close)
  - venue.holidays      (반복/단일)
  - space.cleaningMinutes
  - 가격 룰 (PricingRule)

출력 (7~60일 미리 생성):
  - 휴무일: 09:00~21:00 통대관 슬롯 (4시간 단위 분할 가능)
  - 영업일 마감 후: closeMinute + cleaningMinutes ~ 익일 06:00
  - 청소 윈도우: 예약 종료 후 cleaningMinutes 동안 비예약
```

알고리즘:

1. cron(매일 03:00) — 향후 60일치 slot 재생성
2. 호스트가 영업시간/휴무 변경 시 → 영향받는 미래 슬롯 invalidation
3. PricingRule 매칭 (가장 높은 priority 적용)

## 6. 결제 흐름 (토스페이먼츠)

```
[Web]                              [API]                          [Toss]
  │ ① POST /reservations             │                                │
  │ ─────────────────────────────► │ ② create REQUESTED              │
  │                                  │ ─ (instant_book ? approve)     │
  │ ◄ reservation                    │                                │
  │ ③ POST /payments/intent          │                                │
  │ ─────────────────────────────► │ ④ 토스 결제 widget params       │
  │                                  │ ─────────────────────────────► │
  │                                  │ ◄ payment_widget params       │
  │ ◄ widget params                  │                                │
  │ ⑤ 토스 결제 위젯 / 인증            │ ─────────────────────────────► │
  │ ⑥ successUrl 리다이렉트          │                                │
  │ POST /payments/confirm           │ ⑦ payment confirm API          │
  │ ─────────────────────────────► │ ─────────────────────────────► │
  │                                  │ ◄ paid                         │
  │                                  │ ⑧ Webhook (별도)               │
  │                                  │ ◄ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─     │
  │ ◄ paid                           │                                │
```

## 7. 알림 채널

- **인앱**: Notification 테이블 + SSE (`/notifications/stream`)
- **이메일**: AWS SES (Phase 2)
- **카카오 알림톡**: 카카오 비즈톡 (Phase 2)

## 8. 검색

Phase 1: PostgreSQL ILIKE + 인덱스
Phase 2: PostGIS(반경 검색) + tsvector(한국어 BM25)
Phase 3: Meilisearch (퍼지/자동완성)

## 9. 파일 스토리지

- 로컬 dev: `apps/api/uploads/`
- prod: AWS S3 + CloudFront
- 이미지 가공: Sharp (썸네일, blurhash)
- 폴백: data URL (Cloudinary 키 없을 때) — resume 패턴

## 10. 캐싱

- Redis (Phase 2): 인기 검색, 슬롯 조회, 호스트 통계
- TanStack Query: 클라이언트 캐시 (staleTime 30s ~ 5min)

## 11. 환경 변수

```bash
# Root
NODE_ENV=development
DATABASE_URL=postgresql://offhours:offhours@localhost:5432/offhours

# API
PORT=3000
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
ARGON_MEMORY=65536
APP_URL=http://localhost:5173
API_URL=http://localhost:3000

# Toss
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=
TOSS_WEBHOOK_SECRET=

# S3 / Cloudinary
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Notification
SES_FROM=no-reply@offhours.kr
KAKAO_BIZ_KEY=
```

## 12. 배포

- **Dev**: Docker Compose (postgres + api + web)
- **Prod (Phase 1)**:
  - Web → Vercel (Vite preset)
  - API → Cloud Run (Dockerfile) / Railway
  - DB → Supabase / Neon
  - Object Storage → S3 + CloudFront
