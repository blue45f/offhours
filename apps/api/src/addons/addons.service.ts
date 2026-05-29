import { Injectable } from '@nestjs/common'
import type { SpaceAddon } from '@offhours/shared'

import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AddonsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForSpace(spaceId: string): Promise<SpaceAddon[]> {
    const rows = await this.prisma.spaceAddon.findMany({
      where: { spaceId, isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    })
    return rows.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      priceKRW: a.priceKRW,
      unit: a.unit,
      category: a.category,
    }))
  }
}
