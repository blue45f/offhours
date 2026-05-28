import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common'
import { Prisma, type Space, type SpacePhoto, type Venue } from '@prisma/client'
import {
  haversineKm,
  lastMinuteDiscountRate,
  paginated,
  type CreateSpaceInput,
  type SpaceCard,
  type SpaceDetail,
  type SpaceSearch,
  type UpdateSpaceInput,
} from '@offhours/shared'

import { PrismaService } from '../prisma/prisma.service'
import { slugify } from '../common/util/code'
import { SlotsService } from '../slots/slots.service'

@Injectable()
export class SpacesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => SlotsService))
    private readonly slots: SlotsService
  ) {}

  async search(query: SpaceSearch) {
    const where: Prisma.SpaceWhereInput = { status: 'ACTIVE' }
    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { summary: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ]
    }
    if (query.region || query.district || query.category) {
      where.venue = {
        ...(query.region ? { region: query.region } : {}),
        ...(query.district ? { district: query.district } : {}),
        ...(query.category ? { category: query.category } : {}),
      }
    }
    if (query.capacity) where.capacityMax = { gte: query.capacity }
    if (query.priceMin !== undefined || query.priceMax !== undefined) {
      where.basePriceKRW = {
        ...(query.priceMin !== undefined ? { gte: query.priceMin } : {}),
        ...(query.priceMax !== undefined ? { lte: query.priceMax } : {}),
      }
    }
    if (query.amenities && query.amenities.length > 0) {
      where.amenities = { hasEvery: query.amenities }
    }
    if (query.instantBook !== undefined) where.instantBook = query.instantBook

    const hasGeo = query.lat != null && query.lng != null
    const isLive = query.sort === 'live' || query.liveWithinHours != null
    const isDistance = query.sort === 'distance' || (hasGeo && query.radiusKm != null)

    // 라이브/거리 정렬이면 인메모리 처리(슬롯 매칭+거리 계산)가 필요 → 우선 충분히 많이 가져와
    // 후처리 후 페이지네이션. 운영 규모 커지면 PostGIS + Materialized View 로 이관.
    const usePostProcess = hasGeo || isLive

    const orderBy: Prisma.SpaceOrderByWithRelationInput =
      query.sort === 'newest'
        ? { createdAt: 'desc' }
        : query.sort === 'price-asc'
          ? { basePriceKRW: 'asc' }
          : query.sort === 'price-desc'
            ? { basePriceKRW: 'desc' }
            : query.sort === 'rating'
              ? { ratingAvg: 'desc' }
              : { viewCount: 'desc' }

    const baseInclude = {
      photos: { take: 1, orderBy: { order: 'asc' } as const },
      venue: {
        select: {
          region: true,
          district: true,
          category: true,
          lat: true,
          lng: true,
          host: {
            select: {
              user: {
                select: {
                  responseMedianMin: true,
                  responseRate24h: true,
                  responseSampleCount: true,
                },
              },
            },
          },
        },
      },
    }

    if (!usePostProcess) {
      const [items, total] = await Promise.all([
        this.prisma.space.findMany({
          where,
          orderBy,
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
          include: baseInclude,
        }),
        this.prisma.space.count({ where }),
      ])
      return paginated<SpaceCard>(
        items.map((s) => this.toCard(s)),
        total,
        query.page,
        query.pageSize
      )
    }

    const candidates = await this.prisma.space.findMany({
      where,
      orderBy,
      take: 240,
      include: baseInclude,
    })

    // 거리 필터·정렬
    let scored = candidates.map((s) => {
      const distanceKm = hasGeo
        ? haversineKm({ lat: query.lat!, lng: query.lng! }, { lat: s.venue.lat, lng: s.venue.lng })
        : null
      return { space: s, distanceKm, nextAvailableAt: null as Date | null, discount: 0 }
    })

    if (hasGeo && query.radiusKm) {
      scored = scored.filter((x) => x.distanceKm != null && x.distanceKm <= query.radiusKm!)
    }

    // 라이브 슬롯 매칭
    if (isLive) {
      const hoursWindow = query.liveWithinHours ?? 24
      const now = new Date()
      const upper = new Date(now.getTime() + hoursWindow * 60 * 60 * 1000)
      const spaceIds = scored.map((x) => x.space.id)
      const liveSlots = await this.prisma.slot.findMany({
        where: {
          spaceId: { in: spaceIds },
          isOpen: true,
          startAt: { gte: now, lte: upper },
          reservation: null,
        },
        orderBy: { startAt: 'asc' },
        select: { spaceId: true, startAt: true, priceKRW: true },
      })
      const earliestBySpace = new Map<string, Date>()
      for (const s of liveSlots) {
        if (!earliestBySpace.has(s.spaceId)) earliestBySpace.set(s.spaceId, s.startAt)
      }
      scored = scored
        .filter((x) => earliestBySpace.has(x.space.id))
        .map((x) => {
          const startAt = earliestBySpace.get(x.space.id)!
          return {
            ...x,
            nextAvailableAt: startAt,
            discount: lastMinuteDiscountRate(startAt, now),
          }
        })
    }

    if (query.sort === 'distance' && hasGeo) {
      scored.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
    } else if (query.sort === 'live' || isLive) {
      scored.sort((a, b) => {
        const at = a.nextAvailableAt?.getTime() ?? Infinity
        const bt = b.nextAvailableAt?.getTime() ?? Infinity
        return at - bt
      })
    }

    const total = scored.length
    const page = query.page
    const pageSize = query.pageSize
    const slice = scored.slice((page - 1) * pageSize, page * pageSize)

    return paginated<SpaceCard>(
      slice.map((x) =>
        this.toCard(x.space, {
          distanceKm: x.distanceKm,
          nextAvailableAt: x.nextAvailableAt,
          lastMinuteDiscount: x.discount > 0 ? x.discount : null,
        })
      ),
      total,
      page,
      pageSize
    )
  }

  async getBySlug(slug: string): Promise<SpaceDetail> {
    const space = await this.prisma.space.findUnique({
      where: { slug },
      include: {
        photos: { orderBy: { order: 'asc' } },
        venue: { include: { host: { include: { user: true } } } },
      },
    })
    if (!space) throw new NotFoundException('Space not found')
    if (space.status !== 'ACTIVE') {
      throw new NotFoundException('Space not available')
    }
    void this.prisma.space.update({
      where: { id: space.id },
      data: { viewCount: { increment: 1 } },
    })

    return {
      ...this.toCard(space),
      description: space.description,
      areaM2: space.areaM2,
      cleaningFeeKRW: space.cleaningFeeKRW,
      cleaningMinutes: space.cleaningMinutes,
      minHours: space.minHours,
      alcoholPolicy: space.alcoholPolicy,
      cateringPolicy: space.cateringPolicy,
      amenities: space.amenities,
      rules: space.rules,
      status: space.status,
      photos: space.photos.map((p) => ({
        id: p.id,
        url: p.url,
        blurhash: p.blurhash,
        order: p.order,
        alt: p.alt,
      })),
      venue: {
        id: space.venue.id,
        name: space.venue.name,
        addressRoad: space.venue.addressRoad,
        lat: space.venue.lat,
        lng: space.venue.lng,
        host: {
          id: space.venue.host.user.id,
          name: space.venue.host.user.name,
          avatarUrl: space.venue.host.user.avatarUrl,
          trustScore: space.venue.host.user.trustScore,
          hostedCount: space.venue.host.user.hostedCount,
        },
      },
    }
  }

  async getMine(userId: string) {
    const host = await this.prisma.hostProfile.findUnique({ where: { userId } })
    if (!host) return []
    return this.prisma.space.findMany({
      where: { venue: { hostId: host.id } },
      include: { photos: { take: 1, orderBy: { order: 'asc' } }, venue: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(userId: string, input: CreateSpaceInput) {
    const venue = await this.prisma.venue.findUnique({
      where: { id: input.venueId },
      include: { host: true },
    })
    if (!venue) throw new NotFoundException('Venue not found')
    if (venue.host.userId !== userId) throw new ForbiddenException()

    const slug = slugify(input.title)
    const space = await this.prisma.space.create({
      data: {
        venueId: input.venueId,
        slug,
        title: input.title,
        summary: input.summary,
        description: input.description,
        capacityMin: input.capacityMin,
        capacityMax: input.capacityMax,
        areaM2: input.areaM2 ?? null,
        basePriceKRW: input.basePriceKRW,
        cleaningFeeKRW: input.cleaningFeeKRW,
        cleaningMinutes: input.cleaningMinutes,
        minHours: input.minHours,
        instantBook: input.instantBook,
        alcoholPolicy: input.alcoholPolicy,
        cateringPolicy: input.cateringPolicy,
        amenities: input.amenities,
        rules: input.rules,
        status: 'PENDING_REVIEW',
        photos: {
          create: input.photoUrls.map((url, i) => ({ url, order: i })),
        },
      },
      include: { photos: true },
    })

    void this.slots.regenerate(space.id, 60).catch(() => null)
    return space
  }

  async update(userId: string, spaceId: string, input: UpdateSpaceInput) {
    const space = await this.ensureOwner(userId, spaceId)
    const data: Prisma.SpaceUpdateInput = {
      title: input.title ?? undefined,
      summary: input.summary ?? undefined,
      description: input.description ?? undefined,
      capacityMin: input.capacityMin ?? undefined,
      capacityMax: input.capacityMax ?? undefined,
      areaM2: input.areaM2 ?? undefined,
      basePriceKRW: input.basePriceKRW ?? undefined,
      cleaningFeeKRW: input.cleaningFeeKRW ?? undefined,
      cleaningMinutes: input.cleaningMinutes ?? undefined,
      minHours: input.minHours ?? undefined,
      instantBook: input.instantBook ?? undefined,
      alcoholPolicy: input.alcoholPolicy ?? undefined,
      cateringPolicy: input.cateringPolicy ?? undefined,
      amenities: input.amenities ?? undefined,
      rules: input.rules ?? undefined,
    }
    if (input.photoUrls) {
      await this.prisma.spacePhoto.deleteMany({ where: { spaceId: space.id } })
      data.photos = { create: input.photoUrls.map((url, i) => ({ url, order: i })) }
    }
    const updated = await this.prisma.space.update({
      where: { id: spaceId },
      data,
      include: { photos: true },
    })
    void this.slots.regenerate(spaceId, 60).catch(() => null)
    return updated
  }

  /**
   * 동선 추천(번들) — 이 공간 1km 내 다른 venue 공간을
   * "다른 카테고리 우선"으로 정렬해 최대 max개 반환한다.
   * "1차 다이닝 → 2차 통대관" 같은 회식·송년 시나리오의 핵심 차별점.
   */
  async nearbyBundle(slug: string, radiusKm = 1, max = 4): Promise<SpaceCard[]> {
    const origin = await this.prisma.space.findUnique({
      where: { slug },
      select: {
        id: true,
        venueId: true,
        venue: { select: { lat: true, lng: true, category: true } },
      },
    })
    if (!origin) throw new NotFoundException('Space not found')

    const candidates = await this.prisma.space.findMany({
      where: {
        status: 'ACTIVE',
        id: { not: origin.id },
        venueId: { not: origin.venueId },
      },
      include: {
        photos: { take: 1, orderBy: { order: 'asc' } },
        venue: {
          select: {
            region: true,
            district: true,
            category: true,
            lat: true,
            lng: true,
            host: {
              select: {
                user: {
                  select: {
                    responseMedianMin: true,
                    responseRate24h: true,
                    responseSampleCount: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 200,
    })

    const here = { lat: origin.venue.lat, lng: origin.venue.lng }
    return candidates
      .map((c) => ({
        space: c,
        distanceKm: haversineKm(here, { lat: c.venue.lat, lng: c.venue.lng }),
        sameCategory: c.venue.category === origin.venue.category,
      }))
      .filter((x) => x.distanceKm <= radiusKm)
      .sort((a, b) => {
        // 다른 카테고리 우선, 그 안에서 가까운 순
        if (a.sameCategory !== b.sameCategory) return a.sameCategory ? 1 : -1
        return a.distanceKm - b.distanceKm
      })
      .slice(0, max)
      .map((x) => this.toCard(x.space, { distanceKm: x.distanceKm }))
  }

  private async ensureOwner(userId: string, spaceId: string) {
    const space = await this.prisma.space.findUnique({
      where: { id: spaceId },
      include: { venue: { include: { host: true } } },
    })
    if (!space) throw new NotFoundException('Space not found')
    if (space.venue.host.userId !== userId) throw new ForbiddenException()
    return space
  }

  private toCard(
    s: Space & {
      photos: SpacePhoto[]
      venue: Pick<Venue, 'region' | 'district' | 'category'> & {
        host?: {
          user?: {
            responseMedianMin: number | null
            responseRate24h: number | null
            responseSampleCount: number | null
          }
        }
      }
    },
    extras?: {
      distanceKm?: number | null
      nextAvailableAt?: Date | null
      lastMinuteDiscount?: number | null
    }
  ): SpaceCard {
    const cover = s.photos[0]
    const hostUser = s.venue.host?.user
    return {
      id: s.id,
      slug: s.slug,
      title: s.title,
      summary: s.summary,
      capacityMin: s.capacityMin,
      capacityMax: s.capacityMax,
      basePriceKRW: s.basePriceKRW,
      ratingAvg: s.ratingAvg,
      ratingCount: s.ratingCount,
      thumbnailUrl: cover?.url ?? null,
      blurhash: cover?.blurhash ?? null,
      region: s.venue.region,
      district: s.venue.district,
      category: s.venue.category,
      instantBook: s.instantBook,
      distanceKm: extras?.distanceKm ?? null,
      nextAvailableAt: extras?.nextAvailableAt ? extras.nextAvailableAt.toISOString() : null,
      lastMinuteDiscount: extras?.lastMinuteDiscount ?? null,
      avgApprovalMin: hostUser?.responseMedianMin ?? null,
      responseRate24h: hostUser?.responseRate24h ?? null,
      responseSampleCount: hostUser?.responseSampleCount ?? null,
    }
  }
}
