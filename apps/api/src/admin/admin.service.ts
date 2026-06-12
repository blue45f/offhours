import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, type Role } from '@prisma/client'
import type {
  BroadcastNotificationInput,
  ModerateContentInput,
  ReportTargetSummary,
  ResolveDisputeInput,
  ResolveReportInput,
  SetSuspendedInput,
} from '@offhours/shared'

import { PrismaService } from '../prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'
import { ReviewsService } from '../reviews/reviews.service'

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly reviews: ReviewsService
  ) {}

  async kpi() {
    const now = new Date()
    const startOfToday = new Date(now)
    startOfToday.setUTCHours(0, 0, 0, 0)
    const startOfYesterday = new Date(startOfToday)
    startOfYesterday.setUTCDate(startOfYesterday.getUTCDate() - 1)

    const [
      gmvToday,
      gmvYesterday,
      resvToday,
      activeRes,
      openDisputes,
      newGuests,
      newHosts,
      openReports,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        _sum: { amountKRW: true },
        where: { status: 'CAPTURED', capturedAt: { gte: startOfToday } },
      }),
      this.prisma.payment.aggregate({
        _sum: { amountKRW: true },
        where: {
          status: 'CAPTURED',
          capturedAt: { gte: startOfYesterday, lt: startOfToday },
        },
      }),
      this.prisma.reservation.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.reservation.count({
        where: { status: { in: ['APPROVED', 'PAID', 'CHECKED_IN'] } },
      }),
      this.prisma.dispute.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
      this.prisma.user.count({
        where: { createdAt: { gte: startOfToday }, role: 'USER' },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: startOfToday }, role: 'HOST' },
      }),
      this.prisma.report.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
    ])

    const totalSpaces = await this.prisma.space.count({ where: { status: 'ACTIVE' } })
    const totalViews = await this.prisma.space.aggregate({ _sum: { viewCount: true } })
    const cr =
      totalViews._sum.viewCount && totalViews._sum.viewCount > 0
        ? Math.min(1, resvToday / Math.max(1, totalViews._sum.viewCount / 30))
        : 0

    return {
      gmvTodayKRW: gmvToday._sum.amountKRW ?? 0,
      gmvYesterdayKRW: gmvYesterday._sum.amountKRW ?? 0,
      reservationsToday: resvToday,
      reservationsActive: activeRes,
      disputesOpen: openDisputes,
      newGuestsToday: newGuests,
      newHostsToday: newHosts,
      conversionRate: cr,
      avgApprovalMin: 0,
      openReports,
      activeSpaces: totalSpaces,
    }
  }

  async gmvTimeseries(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const rows = await this.prisma.$queryRaw<{ day: Date; total: bigint }[]>`
      SELECT date_trunc('day', "capturedAt") AS day, COALESCE(SUM("amountKRW"), 0) AS total
      FROM "Payment"
      WHERE "status" = 'CAPTURED' AND "capturedAt" >= ${since}
      GROUP BY day ORDER BY day ASC
    `
    return rows.map((r) => ({ date: r.day.toISOString().slice(0, 10), value: Number(r.total) }))
  }

  async categoryShare() {
    const rows = await this.prisma.$queryRaw<{ category: string; total: bigint }[]>`
      SELECT v."category" AS category, COALESCE(SUM(p."amountKRW"), 0) AS total
      FROM "Payment" p
      JOIN "Reservation" r ON r."id" = p."reservationId"
      JOIN "Space" s ON s."id" = r."spaceId"
      JOIN "Venue" v ON v."id" = s."venueId"
      WHERE p."status" = 'CAPTURED'
      GROUP BY v."category" ORDER BY total DESC
    `
    return rows.map((r) => ({ category: r.category, value: Number(r.total) }))
  }

  async listUsers(search?: string, role?: Role, page = 1, pageSize = 20) {
    const where: Prisma.UserWhereInput = {
      ...(role ? { role } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    }
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { reservations: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ])
    return {
      items: items.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isSuspended: u.isSuspended,
        withdrawnAt: u.withdrawnAt?.toISOString() ?? null,
        isVerified: u.isVerified,
        trustScore: u.trustScore,
        createdAt: u.createdAt.toISOString(),
        reservationCount: u._count.reservations,
      })),
      total,
      page,
      pageSize,
    }
  }

  async setSuspended(actorId: string, userId: string, input: SetSuspendedInput) {
    const before = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!before) throw new NotFoundException()
    const after = await this.prisma.user.update({
      where: { id: userId },
      data: { isSuspended: input.suspended, suspendReason: input.reason ?? null },
    })
    await this.audit(actorId, 'USER_SUSPEND', 'USER', userId, before, after)
    if (input.suspended) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      })
    }
    return after
  }

  async setRole(actorId: string, userId: string, role: Role) {
    const before = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!before) throw new NotFoundException()
    const after = await this.prisma.user.update({ where: { id: userId }, data: { role } })
    await this.audit(actorId, 'USER_SET_ROLE', 'USER', userId, before, after)
    return after
  }

  async pendingSpaces() {
    return this.prisma.space.findMany({
      where: { status: 'PENDING_REVIEW' },
      include: {
        photos: true,
        venue: { include: { host: { include: { user: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    })
  }

  async approveSpace(actorId: string, spaceId: string) {
    const before = await this.prisma.space.findUnique({ where: { id: spaceId } })
    if (!before) throw new NotFoundException()
    const after = await this.prisma.space.update({
      where: { id: spaceId },
      data: { status: 'ACTIVE', approvedAt: new Date() },
    })
    await this.audit(actorId, 'SPACE_APPROVE', 'SPACE', spaceId, before, after)
    return after
  }

  async rejectSpace(actorId: string, spaceId: string, reason: string) {
    const before = await this.prisma.space.findUnique({ where: { id: spaceId } })
    if (!before) throw new NotFoundException()
    const after = await this.prisma.space.update({
      where: { id: spaceId },
      data: { status: 'REJECTED' },
    })
    await this.audit(actorId, 'SPACE_REJECT', 'SPACE', spaceId, before, { ...after, reason })
    return after
  }

  async listReports(page = 1, pageSize = 20) {
    const [items, total] = await Promise.all([
      this.prisma.report.findMany({
        include: { reporter: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.report.count(),
    ])
    // 신고 큐에서 대상 내용을 바로 보고 처리하도록 타깃 미리보기를 배치로 붙인다 (N+1 방지)
    const reviewIds = items.filter((r) => r.targetType === 'REVIEW').map((r) => r.targetId)
    const messageIds = items.filter((r) => r.targetType === 'MESSAGE').map((r) => r.targetId)
    const [reviews, messages] = await Promise.all([
      reviewIds.length
        ? this.prisma.review.findMany({
            where: { id: { in: reviewIds } },
            include: { author: { select: { name: true } } },
          })
        : [],
      messageIds.length
        ? this.prisma.chatMessage.findMany({
            where: { id: { in: messageIds } },
            include: { sender: { select: { name: true } } },
          })
        : [],
    ])
    const reviewMap = new Map(reviews.map((r) => [r.id, r]))
    const messageMap = new Map(messages.map((m) => [m.id, m]))
    const withTargets = items.map((report) => {
      let target: ReportTargetSummary | null = null
      if (report.targetType === 'REVIEW') {
        const rv = reviewMap.get(report.targetId)
        if (rv) {
          target = {
            excerpt: rv.comment.slice(0, 140),
            authorName: rv.author.name,
            isHidden: rv.isHidden,
            attachmentCount: ((rv.attachments as string[] | null) ?? []).length,
          }
        }
      } else if (report.targetType === 'MESSAGE') {
        const msg = messageMap.get(report.targetId)
        if (msg) {
          target = {
            excerpt: msg.body.slice(0, 140),
            authorName: msg.sender.name,
            isHidden: msg.isHidden,
            attachmentCount: ((msg.attachments as string[] | null) ?? []).length,
          }
        }
      }
      return { ...report, target }
    })
    return { items: withTargets, total, page, pageSize }
  }

  /**
   * 신고된 후기 모더레이션 — 삭제 대신 숨김(평점 재집계 포함) + 첨부 제거.
   * 숨김 토글 시 공간 평점·호스트 답글률 캐시가 stale 해지므로 함께 재계산한다.
   */
  async moderateReview(actorId: string, reviewId: string, input: ModerateContentInput) {
    const before = await this.prisma.review.findUnique({ where: { id: reviewId } })
    if (!before) throw new NotFoundException()
    const after = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(input.hidden !== undefined ? { isHidden: input.hidden } : {}),
        ...(input.stripAttachments ? { attachments: Prisma.DbNull } : {}),
      },
    })
    if (input.hidden !== undefined && before.spaceId) {
      await this.reviews.refreshSpaceRating(before.spaceId)
      const host = await this.prisma.user.findUnique({
        where: { id: before.subjectId },
        select: { reviewStatsUpdatedAt: true },
      })
      if (host?.reviewStatsUpdatedAt) {
        await this.reviews.recomputeHostResponseStats(before.subjectId)
      }
    }
    await this.audit(actorId, 'REVIEW_MODERATE', 'REVIEW', reviewId, before, {
      isHidden: after.isHidden,
      strippedAttachments: !!input.stripAttachments,
    })
    return { id: after.id, isHidden: after.isHidden }
  }

  /** 신고된 채팅 메시지 모더레이션 — 스레드 흐름 보존을 위해 삭제 대신 숨김 + 첨부 제거 */
  async moderateMessage(actorId: string, messageId: string, input: ModerateContentInput) {
    const before = await this.prisma.chatMessage.findUnique({ where: { id: messageId } })
    if (!before) throw new NotFoundException()
    const after = await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        ...(input.hidden !== undefined ? { isHidden: input.hidden } : {}),
        ...(input.stripAttachments ? { attachments: Prisma.DbNull } : {}),
      },
    })
    await this.audit(actorId, 'MESSAGE_MODERATE', 'MESSAGE', messageId, before, {
      isHidden: after.isHidden,
      strippedAttachments: !!input.stripAttachments,
    })
    return { id: after.id, isHidden: after.isHidden }
  }

  async resolveReport(actorId: string, reportId: string, input: ResolveReportInput) {
    const before = await this.prisma.report.findUnique({ where: { id: reportId } })
    if (!before) throw new NotFoundException()
    const after = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: input.status,
        resolution: input.resolution,
        resolvedAt: ['RESOLVED', 'DISMISSED'].includes(input.status) ? new Date() : null,
      },
    })
    await this.audit(actorId, 'REPORT_RESOLVE', 'REPORT', reportId, before, after)
    return after
  }

  async listDisputes(page = 1, pageSize = 20) {
    const [items, total] = await Promise.all([
      this.prisma.dispute.findMany({
        include: {
          raisedBy: { select: { name: true } },
          reservation: { select: { code: true, space: { select: { title: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.dispute.count(),
    ])
    return {
      items: items.map((d) => ({
        id: d.id,
        reservationId: d.reservationId,
        reservationCode: d.reservation.code,
        spaceTitle: d.reservation.space.title,
        kind: d.kind,
        reason: d.reason,
        description: d.description,
        amountClaimedKRW: d.amountClaimedKRW,
        coverageKRW: d.coverageKRW,
        status: d.status,
        resolution: d.resolution,
        raisedByName: d.raisedBy.name,
        evidencePhotoUrls: (d.evidence as { photoUrls?: string[] } | null)?.photoUrls ?? [],
        createdAt: d.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    }
  }

  async resolveDispute(actorId: string, disputeId: string, input: ResolveDisputeInput) {
    const before = await this.prisma.dispute.findUnique({ where: { id: disputeId } })
    if (!before) throw new NotFoundException()
    const closed = ['RESOLVED_FAVOR_GUEST', 'RESOLVED_FAVOR_HOST', 'DISMISSED'].includes(
      input.status
    )
    const after = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: input.status,
        resolution: input.resolution ?? null,
        resolvedAt: closed ? new Date() : null,
      },
    })
    // 분쟁 종결 시 양측에 결과 알림
    if (closed) {
      const r = await this.prisma.reservation.findUnique({
        where: { id: before.reservationId },
        include: { space: { include: { venue: { include: { host: true } } } } },
      })
      if (r) {
        const verdict =
          input.status === 'RESOLVED_FAVOR_HOST'
            ? '호스트 인정'
            : input.status === 'RESOLVED_FAVOR_GUEST'
              ? '게스트 인정'
              : '기각'
        for (const uid of [r.guestId, r.space.venue.host.userId]) {
          await this.notifications.create(uid, {
            type: 'SYSTEM',
            title: '분쟁이 종결됐어요',
            body: `${r.space.title} — ${verdict}`,
            data: { reservationId: r.id },
          })
        }
      }
    }
    await this.audit(actorId, 'DISPUTE_RESOLVE', 'DISPUTE', disputeId, before, after)
    return after
  }

  async auditLogs(page = 1, pageSize = 50) {
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        include: { actor: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count(),
    ])
    return {
      items: items.map((a) => ({
        id: a.id,
        actorId: a.actorId,
        actorName: a.actor.name,
        action: a.action,
        targetType: a.targetType,
        targetId: a.targetId,
        ip: a.ip,
        createdAt: a.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    }
  }

  async broadcast(actorId: string, input: BroadcastNotificationInput) {
    const where: Prisma.UserWhereInput =
      input.audience === 'ALL'
        ? {}
        : input.audience === 'GUESTS'
          ? { role: 'USER' }
          : input.audience === 'HOSTS'
            ? { role: 'HOST' }
            : { isSuspended: true }
    const users = await this.prisma.user.findMany({ where, select: { id: true } })
    for (const u of users) {
      await this.notifications.create(u.id, {
        type: 'SYSTEM',
        title: input.title,
        body: input.body,
      })
    }
    await this.audit(actorId, 'BROADCAST', 'NOTIFICATION', input.audience, null, {
      count: users.length,
    })
    return { count: users.length }
  }

  private async audit(
    actorId: string,
    action: string,
    targetType: string,
    targetId: string,
    before: unknown,
    after: unknown
  ) {
    await this.prisma.auditLog.create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
        before: (before as object) ?? undefined,
        after: (after as object) ?? undefined,
      },
    })
  }
}
