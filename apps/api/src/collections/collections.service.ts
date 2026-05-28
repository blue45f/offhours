import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import type {
  CollectionDetail,
  CollectionSummary,
  CreateCollectionInput,
  UpdateCollectionInput,
} from '@offhours/shared'

import { PrismaService } from '../prisma/prisma.service'
import { slugify } from '../common/util/code'

@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<CollectionSummary[]> {
    const rows = await this.prisma.collection.findMany({
      where: { ownerId: userId },
      include: {
        owner: { select: { name: true, avatarUrl: true } },
        favorites: {
          take: 4,
          orderBy: { createdAt: 'desc' },
          include: {
            space: {
              select: { photos: { take: 1, orderBy: { order: 'asc' as const } } },
            },
          },
        },
        _count: { select: { favorites: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
    return rows.map((r) => this.toSummary(r))
  }

  async create(userId: string, input: CreateCollectionInput): Promise<CollectionSummary> {
    const slug = slugify(input.name)
    const row = await this.prisma.collection.create({
      data: {
        ownerId: userId,
        slug,
        name: input.name,
        description: input.description,
        emoji: input.emoji,
        isPublic: input.isPublic,
      },
      include: {
        owner: { select: { name: true, avatarUrl: true } },
        favorites: {
          take: 4,
          include: {
            space: { select: { photos: { take: 1, orderBy: { order: 'asc' as const } } } },
          },
        },
        _count: { select: { favorites: true } },
      },
    })
    return this.toSummary(row)
  }

  async update(userId: string, id: string, input: UpdateCollectionInput) {
    const existing = await this.prisma.collection.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('Collection not found')
    if (existing.ownerId !== userId) throw new ForbiddenException()
    return this.prisma.collection.update({
      where: { id },
      data: {
        name: input.name ?? undefined,
        description: input.description ?? undefined,
        emoji: input.emoji ?? undefined,
        isPublic: input.isPublic ?? undefined,
      },
    })
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.collection.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('Collection not found')
    if (existing.ownerId !== userId) throw new ForbiddenException()
    await this.prisma.collection.delete({ where: { id } })
    return { deleted: true }
  }

  /**
   * 슬러그로 조회. 공개 컬렉션이면 누구나, 비공개면 본인만.
   * viewerId 가 없으면(인증 안 됨) 공개 컬렉션만 노출.
   * voterToken 이 주어지면 각 item 에 본인의 투표(myVote) 포함.
   */
  async getBySlug(slug: string, viewerId?: string, voterToken?: string): Promise<CollectionDetail> {
    const row = await this.prisma.collection.findUnique({
      where: { slug },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        favorites: {
          orderBy: { createdAt: 'desc' },
          include: {
            space: {
              include: {
                photos: { take: 1, orderBy: { order: 'asc' } },
                venue: {
                  select: {
                    region: true,
                    district: true,
                    category: true,
                  },
                },
              },
            },
            votes: {
              select: { vote: true, voterName: true, voterToken: true },
            },
          },
        },
        _count: { select: { favorites: true } },
      },
    })
    if (!row) throw new NotFoundException('Collection not found')
    if (!row.isPublic && row.ownerId !== viewerId) {
      throw new NotFoundException('Collection not found')
    }
    const summary = this.toSummary(row)
    return {
      ...summary,
      items: row.favorites.map((f) => {
        const up = f.votes.filter((v) => v.vote === 'UP').length
        const down = f.votes.filter((v) => v.vote === 'DOWN').length
        const voterNames = Array.from(new Set(f.votes.map((v) => v.voterName))).slice(0, 8)
        const myVote = voterToken
          ? (f.votes.find((v) => v.voterToken === voterToken)?.vote ?? null)
          : null
        return {
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
          useCases: f.space.useCases as CollectionDetail['items'][number]['useCases'],
          favoriteId: f.id,
          note: f.note,
          addedAt: f.createdAt.toISOString(),
          votes: { up, down, voters: voterNames, myVote },
        }
      }),
    }
  }

  /**
   * 공개 컬렉션의 후보(favorite)에 투표. 1인 1표 (voterToken 기준).
   * vote=null 이면 기존 투표를 취소. 1인 1닉네임 유지(같은 토큰 다른 이름은 마지막 이름 적용).
   */
  async castVote(
    slug: string,
    favoriteId: string,
    voterToken: string,
    voterName: string,
    vote: 'UP' | 'DOWN' | null
  ) {
    const collection = await this.prisma.collection.findUnique({
      where: { slug },
      select: { id: true, isPublic: true },
    })
    if (!collection || !collection.isPublic) throw new NotFoundException()
    const fav = await this.prisma.favorite.findUnique({
      where: { id: favoriteId },
      select: { collectionId: true },
    })
    if (!fav || fav.collectionId !== collection.id) throw new NotFoundException()

    if (vote === null) {
      await this.prisma.collectionItemVote.deleteMany({
        where: { favoriteId, voterToken },
      })
      return { cleared: true }
    }
    await this.prisma.collectionItemVote.upsert({
      where: { favoriteId_voterToken: { favoriteId, voterToken } },
      create: { favoriteId, voterToken, voterName, vote },
      update: { vote, voterName },
    })
    return { cast: vote }
  }

  /**
   * 카드의 하트 클릭 → 특정 컬렉션에 추가. 컬렉션 없으면 기본 즐겨찾기로 들어감
   * (favorite.collectionId = null).
   * 이미 favorite 가 있으면 컬렉션만 이동시킴.
   */
  async addToCollection(
    userId: string,
    collectionId: string | null,
    spaceId: string,
    note?: string
  ) {
    if (collectionId) {
      const col = await this.prisma.collection.findUnique({ where: { id: collectionId } })
      if (!col || col.ownerId !== userId) throw new ForbiddenException()
    }
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_spaceId: { userId, spaceId } },
    })
    if (existing) {
      const updated = await this.prisma.favorite.update({
        where: { id: existing.id },
        data: { collectionId, note: note ?? existing.note },
      })
      if (collectionId) {
        await this.prisma.collection.update({
          where: { id: collectionId },
          data: { updatedAt: new Date() },
        })
      }
      return { added: false, moved: true, favoriteId: updated.id }
    }
    const created = await this.prisma.favorite.create({
      data: { userId, spaceId, collectionId, note },
    })
    if (collectionId) {
      await this.prisma.collection.update({
        where: { id: collectionId },
        data: { updatedAt: new Date() },
      })
    }
    return { added: true, moved: false, favoriteId: created.id }
  }

  async removeFromCollection(userId: string, collectionId: string, spaceId: string) {
    const col = await this.prisma.collection.findUnique({ where: { id: collectionId } })
    if (!col || col.ownerId !== userId) throw new ForbiddenException()
    const fav = await this.prisma.favorite.findFirst({
      where: { userId, spaceId, collectionId },
    })
    if (!fav) throw new NotFoundException()
    // 컬렉션에서만 빼는 것 — 기본 즐겨찾기에는 남김
    await this.prisma.favorite.update({
      where: { id: fav.id },
      data: { collectionId: null },
    })
    return { removed: true }
  }

  private toSummary(r: {
    id: string
    slug: string
    name: string
    emoji: string | null
    description: string | null
    isPublic: boolean
    updatedAt: Date
    owner: { name: string; avatarUrl: string | null }
    favorites: Array<{ space: { photos: { url: string }[] } }>
    _count: { favorites: number }
  }): CollectionSummary {
    const covers = r.favorites
      .map((f) => f.space.photos[0]?.url)
      .filter((u): u is string => !!u)
      .slice(0, 4)
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      emoji: r.emoji,
      description: r.description,
      isPublic: r.isPublic,
      itemCount: r._count.favorites,
      coverPhotoUrls: covers,
      ownerName: r.owner.name,
      ownerAvatarUrl: r.owner.avatarUrl,
      updatedAt: r.updatedAt.toISOString(),
    }
  }
}
