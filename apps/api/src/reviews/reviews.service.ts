import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  TRUST_SCORE,
  clampTrust,
  type CreateReviewInput,
  type RespondReviewInput,
} from '@offhours/shared'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(authorId: string, input: CreateReviewInput) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: input.reservationId },
      include: { space: { include: { venue: { include: { host: true } } } } },
    })
    if (!reservation) throw new NotFoundException()
    if (reservation.status !== 'COMPLETED') {
      throw new BadRequestException('이용 완료 후 작성할 수 있어요')
    }

    const isGuest = reservation.guestId === authorId
    const isHost = reservation.space.venue.host.userId === authorId
    if (!isGuest && !isHost) throw new ForbiddenException()
    const subjectId = isGuest ? reservation.space.venue.host.userId : reservation.guestId

    const existing = await this.prisma.review.findUnique({
      where: { reservationId_authorId: { reservationId: reservation.id, authorId } },
    })
    if (existing) throw new BadRequestException('이미 리뷰를 작성했어요')

    const review = await this.prisma.review.create({
      data: {
        reservationId: reservation.id,
        authorId,
        subjectId,
        spaceId: isGuest ? reservation.spaceId : null,
        rating: input.rating,
        comment: input.comment,
      },
    })

    const counterpart = await this.prisma.review.findFirst({
      where: { reservationId: reservation.id, authorId: subjectId },
    })
    if (counterpart) {
      const publishAt = new Date()
      await this.prisma.review.updateMany({
        where: { reservationId: reservation.id, isPublished: false },
        data: { isPublished: true, publishedAt: publishAt },
      })
      await this.refreshSpaceRating(reservation.spaceId)
    }

    // 평점별 trustScore 양방향 갱신 (5점 +3 … 1점 -5). 0~100 클램프 보장.
    const delta = TRUST_SCORE.REVIEW_DELTA[input.rating] ?? 0
    if (delta !== 0) {
      await this.bumpTrust(subjectId, delta)
    }

    return review
  }

  private async bumpTrust(userId: string, delta: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { trustScore: true },
    })
    if (!user) return
    await this.prisma.user.update({
      where: { id: userId },
      data: { trustScore: clampTrust(user.trustScore + delta) },
    })
  }

  async respond(hostUserId: string, reviewId: string, input: RespondReviewInput) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        reservation: { include: { space: { include: { venue: { include: { host: true } } } } } },
      },
    })
    if (!review) throw new NotFoundException()
    if (review.reservation.space.venue.host.userId !== hostUserId) throw new ForbiddenException()
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { hostResponse: input.response, hostResponseAt: new Date() },
    })
  }

  async listForSpace(spaceId: string, page = 1, pageSize = 20) {
    const where = { spaceId, isPublished: true, isHidden: false }
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.review.count({ where }),
    ])
    return {
      items: items.map((r) => ({
        id: r.id,
        reservationId: r.reservationId,
        authorId: r.authorId,
        authorName: r.author.name,
        authorAvatarUrl: r.author.avatarUrl,
        subjectId: r.subjectId,
        spaceId: r.spaceId,
        rating: r.rating,
        comment: r.comment,
        hostResponse: r.hostResponse,
        hostResponseAt: r.hostResponseAt?.toISOString() ?? null,
        publishedAt: r.publishedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    }
  }

  private async refreshSpaceRating(spaceId: string) {
    const agg = await this.prisma.review.aggregate({
      _avg: { rating: true },
      _count: true,
      where: { spaceId, isPublished: true, isHidden: false },
    })
    await this.prisma.space.update({
      where: { id: spaceId },
      data: {
        ratingAvg: agg._avg.rating ?? 0,
        ratingCount: agg._count,
      },
    })
  }
}
