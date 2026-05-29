import { Injectable, NotFoundException } from '@nestjs/common'
import type { CorporateProfile, UpsertCorporateProfileInput } from '@offhours/shared'

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

  private toShape(row: {
    id: string
    companyName: string
    businessNumber: string
    ceoName: string
    billingEmail: string
    taxOfficeAddress: string | null
    taxPayer: 'GENERAL' | 'TAX_FREE'
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
      createdAt: row.createdAt.toISOString(),
    }
  }
}
