import { Controller, Get, Param } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { AddonsService } from './addons.service'
import { Public } from '../common/decorators/public.decorator'

@ApiTags('addons')
@Controller('spaces/:spaceId/addons')
export class AddonsController {
  constructor(private readonly addons: AddonsService) {}

  @Public()
  @Get()
  async list(@Param('spaceId') spaceId: string) {
    return this.addons.listForSpace(spaceId)
  }
}
