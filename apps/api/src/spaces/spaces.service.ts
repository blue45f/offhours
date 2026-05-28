import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common'
import { Prisma, type Space, type SpacePhoto, type Venue } from '@prisma/client'
import {
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

    const [items, total] = await Promise.all([
      this.prisma.space.findMany({
        where,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: {
          photos: { take: 1, orderBy: { order: 'asc' } },
          venue: { select: { region: true, district: true, category: true } },
        },
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
      venue: Pick<Venue, 'region' | 'district' | 'category'>
    }
  ): SpaceCard {
    const cover = s.photos[0]
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
    }
  }
}
