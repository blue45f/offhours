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
  type CreateReviewReplyInput,
  type RespondReviewInput,
  type ReviewReply,
} from '@offhours/shared'

import { PrismaService } from '../prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'

/** 후기에 항상 따라붙는 1단 답글 스레드 — 숨김 답글 제외, 시간순 */
const REPLIES_INCLUDE = {
  where: { isHidden: false },
  orderBy: { createdAt: 'asc' as const },
  include: { author: { select: { id: true, name: true, avatarUrl: true } } },
} as const

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService
  ) {}

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
        attachments:
          input.attachments && input.attachments.length > 0 ? input.attachments : undefined,
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
      // 후기가 공개되면 호스트 답글률 분모(표본)가 늘어나 캐시가 stale 해진다. 이미 통계가
      // 잡힌(= 한 번이라도 답글한) 호스트만 재계산해, 미응답 호스트에게 "0% 답글률"을
      // 새로 노출하지 않으면서 분모 정합성을 유지한다.
      const hostUserId = reservation.space.venue.host.userId
      const host = await this.prisma.user.findUnique({
        where: { id: hostUserId },
        select: { reviewStatsUpdatedAt: true },
      })
      if (host?.reviewStatsUpdatedAt) {
        await this.recomputeHostResponseStats(hostUserId)
      }
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
    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { hostResponse: input.response, hostResponseAt: new Date() },
    })
    await this.recomputeHostResponseStats(hostUserId)
    return updated
  }

  /**
   * 호스트별 후기 답글률을 다시 계산해 캐시.
   * answered / total — 게스트가 호스트의 venue에 남긴 published 후기에 한정.
   */
  async recomputeHostResponseStats(hostUserId: string) {
    const total = await this.prisma.review.count({
      where: {
        subjectId: hostUserId,
        isPublished: true,
        isHidden: false,
        spaceId: { not: null },
      },
    })
    const answered = await this.prisma.review.count({
      where: {
        subjectId: hostUserId,
        isPublished: true,
        isHidden: false,
        spaceId: { not: null },
        hostResponse: { not: null },
      },
    })
    const rate = total > 0 ? Number((answered / total).toFixed(3)) : null
    await this.prisma.user.update({
      where: { id: hostUserId },
      data: {
        reviewResponseRate: rate,
        reviewResponseCount: answered,
        reviewSampleCount: total,
        reviewStatsUpdatedAt: new Date(),
      },
    })
    return { rate, answered, total }
  }

  /**
   * 호스트의 모든 공간 후기를 페이지네이션해서 반환. 답글 없는 것 먼저(필요 시 클라이언트가
   * 답글 작성하도록 유도).
   */
  async listForHost(
    hostUserId: string,
    filter: 'all' | 'unanswered' | 'answered' = 'all',
    page = 1,
    pageSize = 20
  ) {
    const where: import('@prisma/client').Prisma.ReviewWhereInput = {
      subjectId: hostUserId,
      isPublished: true,
      isHidden: false,
      spaceId: { not: null },
      ...(filter === 'unanswered' ? { hostResponse: null } : {}),
      ...(filter === 'answered' ? { hostResponse: { not: null } } : {}),
    }
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          space: { select: { id: true, slug: true, title: true } },
          replies: REPLIES_INCLUDE,
        },
        orderBy: [{ hostResponse: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.review.count({ where }),
    ])
    return {
      items: items.map((r) => ({
        ...this.toReviewShape(r),
        spaceSlug: r.space?.slug ?? null,
        spaceTitle: r.space?.title ?? null,
      })),
      total,
      page,
      pageSize,
    }
  }

  async listForSpace(spaceId: string, page = 1, pageSize = 20) {
    const where = { spaceId, isPublished: true, isHidden: false }
    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          replies: REPLIES_INCLUDE,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.review.count({ where }),
    ])
    return {
      items: items.map((r) => this.toReviewShape(r)),
      total,
      page,
      pageSize,
    }
  }

  /**
   * 후기 1단 답글 — 후기 작성자와 공간 호스트만 이어갈 수 있다. 공개(published)된
   * 후기에만 허용하고, 상대에게 알림을 보낸다.
   */
  async addReply(userId: string, reviewId: string, input: CreateReviewReplyInput) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        reservation: {
          include: { space: { include: { venue: { include: { host: true } } } } },
        },
      },
    })
    if (!review || review.isHidden) throw new NotFoundException()
    if (!review.isPublished) {
      throw new BadRequestException('공개된 후기에만 답글을 달 수 있어요')
    }
    const hostUserId = review.reservation.space.venue.host.userId
    if (userId !== review.authorId && userId !== hostUserId) throw new ForbiddenException()

    const reply = await this.prisma.reviewReply.create({
      data: { reviewId, authorId: userId, body: input.body },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    })

    const otherId = userId === review.authorId ? hostUserId : review.authorId
    await this.notifications.create(otherId, {
      type: 'SYSTEM',
      title: '후기에 새 답글이 달렸어요',
      body: input.body.slice(0, 80),
      data: { spaceSlug: review.reservation.space.slug, reviewId },
    })

    return this.toReplyShape(reply, hostUserId)
  }

  private toReviewShape(r: {
    id: string
    reservationId: string
    authorId: string
    author: { name: string; avatarUrl: string | null }
    subjectId: string
    spaceId: string | null
    rating: number
    comment: string
    attachments: unknown
    hostResponse: string | null
    hostResponseAt: Date | null
    publishedAt: Date | null
    createdAt: Date
    replies: Array<{
      id: string
      reviewId: string
      authorId: string
      body: string
      createdAt: Date
      author: { id: string; name: string; avatarUrl: string | null }
    }>
  }) {
    return {
      id: r.id,
      reservationId: r.reservationId,
      authorId: r.authorId,
      authorName: r.author.name,
      authorAvatarUrl: r.author.avatarUrl,
      subjectId: r.subjectId,
      spaceId: r.spaceId,
      rating: r.rating,
      comment: r.comment,
      attachments: (r.attachments as string[] | null) ?? [],
      hostResponse: r.hostResponse,
      hostResponseAt: r.hostResponseAt?.toISOString() ?? null,
      // 공간 후기의 subject 는 항상 호스트 유저 — 답글 작성자의 호스트 여부 판별 기준
      replies: r.replies.map((reply) => this.toReplyShape(reply, r.subjectId)),
      publishedAt: r.publishedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }
  }

  private toReplyShape(
    reply: {
      id: string
      reviewId: string
      authorId: string
      body: string
      createdAt: Date
      author: { id: string; name: string; avatarUrl: string | null }
    },
    hostUserId: string
  ): ReviewReply {
    return {
      id: reply.id,
      reviewId: reply.reviewId,
      authorId: reply.authorId,
      authorName: reply.author.name,
      authorAvatarUrl: reply.author.avatarUrl,
      isHost: reply.authorId === hostUserId,
      body: reply.body,
      createdAt: reply.createdAt.toISOString(),
    }
  }

  async refreshSpaceRating(spaceId: string) {
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
