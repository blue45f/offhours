import { Injectable } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async toggle(userId: string, spaceId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_spaceId: { userId, spaceId } },
    })
    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } })
      return { favorited: false }
    }
    await this.prisma.favorite.create({ data: { userId, spaceId } })
    return { favorited: true }
  }

  async list(userId: string) {
    const favs = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        space: {
          include: {
            photos: { take: 1, orderBy: { order: 'asc' } },
            venue: { select: { region: true, district: true, category: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return favs.map((f) => ({
      id: f.space.id,
      slug: f.space.slug,
      title: f.space.title,
      summary: f.space.summary,
      capacityMin: f.space.capacityMin,
      capacityMax: f.space.capacityMax,
      basePriceKRW: f.space.basePriceKRW,
      ratingAvg: f.space.ratingAvg,
      ratingCount: f.space.ratingCount,
      thumbnailUrl: f.space.photos[0]?.url ?? null,
      blurhash: f.space.photos[0]?.blurhash ?? null,
      region: f.space.venue.region,
      district: f.space.venue.district,
      category: f.space.venue.category,
      instantBook: f.space.instantBook,
      favoritedAt: f.createdAt.toISOString(),
    }))
  }

  async ids(userId: string) {
    const items = await this.prisma.favorite.findMany({
      where: { userId },
      select: { spaceId: true },
    })
    return items.map((i) => i.spaceId)
  }
}
