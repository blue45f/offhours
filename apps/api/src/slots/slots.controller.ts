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
    @Query('endAt') endAt: string
  ) {
    return this.slots.calcAmount(spaceId, new Date(startAt), new Date(endAt))
  }
}
