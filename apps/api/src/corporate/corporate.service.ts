import { Injectable, NotFoundException } from '@nestjs/common'
import {
  creditBonus,
  type CorporateProfile,
  type UpsertCorporateProfileInput,
} from '@offhours/shared'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CorporateService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string): Promise<CorporateProfile | null> {
    const row = await this.prisma.corporateProfile.findUnique({ where: { userId } })
    if (!row) return null
    return this.toShape(row)
  }

  async upsert(userId: string, input: UpsertCorporateProfileInput): Promise<CorporateProfile> {
    const row = await this.prisma.corporateProfile.upsert({
      where: { userId },
      create: { userId, ...input },
      update: input,
    })
    return this.toShape(row)
  }

  async remove(userId: string) {
    const existing = await this.prisma.corporateProfile.findUnique({ where: { userId } })
    if (!existing) throw new NotFoundException()
    await this.prisma.corporateProfile.delete({ where: { userId } })
    return { deleted: true }
  }

  /** 영업 외 크레딧 충전 — 충전액에 따라 보너스 크레딧 적립(mock 결제) */
  async topup(userId: string, amountKRW: number) {
    const profile = await this.prisma.corporateProfile.findUnique({ where: { userId } })
    if (!profile) throw new NotFoundException('법인 프로필이 없어요. 먼저 등록해주세요')
    const bonus = creditBonus(amountKRW)
    const updated = await this.prisma.corporateProfile.update({
      where: { userId },
      data: { creditBalanceKRW: { increment: amountKRW + bonus } },
    })
    return { creditBalanceKRW: updated.creditBalanceKRW, added: amountKRW, bonus }
  }

  private toShape(row: {
    id: string
    companyName: string
    businessNumber: string
    ceoName: string
    billingEmail: string
    taxOfficeAddress: string | null
    taxPayer: 'GENERAL' | 'TAX_FREE'
    creditBalanceKRW: number
    createdAt: Date
  }): CorporateProfile {
    return {
      id: row.id,
      companyName: row.companyName,
      businessNumber: row.businessNumber,
      ceoName: row.ceoName,
      billingEmail: row.billingEmail,
      taxOfficeAddress: row.taxOfficeAddress ?? undefined,
      taxPayer: row.taxPayer,
      creditBalanceKRW: row.creditBalanceKRW,
      createdAt: row.createdAt.toISOString(),
    }
  }
}
