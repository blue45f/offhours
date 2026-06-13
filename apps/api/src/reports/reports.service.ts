import { Injectable } from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'

import type { CreateReportInput } from '@offhours/shared'

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  create(reporterId: string, input: CreateReportInput) {
    return this.prisma.report.create({
      data: {
        reporterId,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason,
        description: input.description,
      },
    })
  }
}
