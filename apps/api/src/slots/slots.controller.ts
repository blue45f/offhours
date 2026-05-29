import { Controller, Get, Param, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { SlotsService } from './slots.service'
import { Public } from '../common/decorators/public.decorator'

@ApiTags('slots')
@Controller('spaces/:spaceId/slots')
export class SlotsController {
  constructor(private readonly slots: SlotsService) {}

  @Public()
  @Get()
  async list(
    @Param('spaceId') spaceId: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    const fromD = from ? new Date(from) : new Date()
    const toD = to ? new Date(to) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    return this.slots.list(spaceId, fromD, toD)
  }

  @Public()
  @Get('quote')
  async quote(
    @Param('spaceId') spaceId: string,
    @Query('startAt') startAt: string,
    @Query('endAt') endAt: string,
    @Query('addons') addons?: string
  ) {
    return this.slots.calcAmount(
      spaceId,
      new Date(startAt),
      new Date(endAt),
      parseAddonsParam(addons)
    )
  }
}

/** "addonId:qty,addonId:qty" 형태의 쿼리스트링을 선택 배열로 파싱한다. */
function parseAddonsParam(raw?: string): { addonId: string; qty: number }[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((token) => {
      const [addonId, qtyRaw] = token.split(':')
      const qty = Math.max(1, Math.floor(Number(qtyRaw) || 0))
      return addonId && qty > 0 ? { addonId, qty } : null
    })
    .filter((x): x is { addonId: string; qty: number } => x !== null)
    .slice(0, 20)
}
