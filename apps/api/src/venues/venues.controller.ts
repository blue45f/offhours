import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import {
  CreateVenueSchema,
  UpdateVenueSchema,
  type CreateVenueInput,
  type UpdateVenueInput,
} from '@offhours/shared'

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { VenuesService } from './venues.service'

@ApiBearerAuth()
@ApiTags('venues')
@UseGuards(JwtAuthGuard)
@Controller('venues')
export class VenuesController {
  constructor(private readonly venues: VenuesService) {}

  @Get('mine')
  async listMine(@CurrentUser() user: RequestUser) {
    return this.venues.listMine(user.id)
  }

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(CreateVenueSchema)) body: CreateVenueInput
  ) {
    return this.venues.createForHost(user.id, body)
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateVenueSchema)) body: UpdateVenueInput
  ) {
    return this.venues.update(user.id, id, body)
  }

  @Get(':id')
  async getOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.venues.getOne(user.id, id)
  }
}
