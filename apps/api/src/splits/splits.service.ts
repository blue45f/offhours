import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import type { CreateSplitInput, PublicSplitInfo, SplitDetail } from '@offhours/shared'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SplitsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    reservationId: string,
    input: CreateSplitInput
  ): Promise<SplitDetail> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { split: { include: { members: true } } },
    })
    if (!reservation) throw new NotFoundException()
    if (reservation.guestId !== userId) throw new ForbiddenException()
    if (reservation.split) {
      throw new BadRequestException('이미 분담 결제가 생성됐어요. 기존 링크를 사용해주세요.')
    }
    if (reservation.totalKRW < input.memberCount * 100) {
      throw new BadRequestException('금액에 비해 멤버 수가 너무 많아요')
    }

    const perMember = Math.ceil(reservation.totalKRW / input.memberCount)
    const split = await this.prisma.reservationSplit.create({
      data: {
        reservationId,
        memberCount: input.memberCount,
        perMemberKRW: perMember,
        note: input.note,
        members: {
          create: Array.from({ length: input.memberCount }, (_, i) => ({
            idx: i + 1,
            label: input.labels?.[i] ?? null,
          })),
        },
      },
      include: { members: { orderBy: { idx: 'asc' } } },
    })

    return this.toDetail(split)
  }

  async get(userId: string, reservationId: string): Promise<SplitDetail | null> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { guestId: true },
    })
    if (!reservation) throw new NotFoundException()
    if (reservation.guestId !== userId) throw new ForbiddenException()
    const split = await this.prisma.reservationSplit.findUnique({
      where: { reservationId },
      include: { members: { orderBy: { idx: 'asc' } } },
    })
    return split ? this.toDetail(split) : null
  }

  async getByToken(token: string): Promise<PublicSplitInfo> {
    const member = await this.prisma.splitMember.findUnique({
      where: { token },
      include: {
        split: {
          include: {
            members: true,
            reservation: {
              include: {
                guest: { select: { name: true } },
                space: {
                  select: {
                    title: true,
                    venue: { select: { host: { include: { user: true } } } },
                  },
                },
              },
            },
          },
        },
      },
    })
    if (!member) throw new NotFoundException('청구 링크를 찾을 수 없어요')
    const split = member.split
    const r = split.reservation
    const paidCount = split.members.filter((m) => m.status === 'PAID').length
    return {
      spaceTitle: r.space.title,
      reservationCode: r.code,
      hostName: r.space.venue.host.user.name,
      startAt: r.startAt.toISOString(),
      endAt: r.endAt.toISOString(),
      headcount: r.headcount,
      totalKRW: r.totalKRW,
      memberCount: split.memberCount,
      perMemberKRW: split.perMemberKRW,
      paidCount,
      payerName: r.guest.name,
      member: {
        id: member.id,
        idx: member.idx,
        token: member.token,
        label: member.label,
        status: member.status,
        paidAt: member.paidAt?.toISOString() ?? null,
      },
    }
  }

  /**
   * 모의 토스 송금 — 실제 결제 게이트웨이 연동 없이 멤버 상태만 PAID 로 마킹.
   * 본 데모는 PaymentsModule 의 Toss flow 와 분리. 향후 실제 송금 콜백으로 교체.
   */
  async markPaid(token: string) {
    const member = await this.prisma.splitMember.findUnique({ where: { token } })
    if (!member) throw new NotFoundException()
    if (member.status === 'PAID') return { alreadyPaid: true }
    await this.prisma.splitMember.update({
      where: { id: member.id },
      data: { status: 'PAID', paidAt: new Date() },
    })
    return { alreadyPaid: false }
  }

  private toDetail(split: {
    id: string
    reservationId: string
    memberCount: number
    perMemberKRW: number
    note: string | null
    createdAt: Date
    members: {
      id: string
      idx: number
      token: string
      label: string | null
      status: 'PENDING' | 'PAID' | 'CANCELED'
      paidAt: Date | null
    }[]
  }): SplitDetail {
    const paidCount = split.members.filter((m) => m.status === 'PAID').length
    return {
      id: split.id,
      reservationId: split.reservationId,
      memberCount: split.memberCount,
      perMemberKRW: split.perMemberKRW,
      note: split.note,
      createdAt: split.createdAt.toISOString(),
      paidCount,
      members: split.members.map((m) => ({
        id: m.id,
        idx: m.idx,
        token: m.token,
        label: m.label,
        status: m.status,
        paidAt: m.paidAt?.toISOString() ?? null,
      })),
    }
  }
}
