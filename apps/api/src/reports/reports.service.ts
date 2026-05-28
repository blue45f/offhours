import { Injectable } from '@nestjs/common'
import type { CreateReportInput } from '@offhours/shared'

import { PrismaService } from '../prisma/prisma.service'

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
