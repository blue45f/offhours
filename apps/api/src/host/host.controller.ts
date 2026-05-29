import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import {
  ArrivalGuideSchema,
  CreateHostProfileSchema,
  UpdateHostProfileSchema,
  type ArrivalGuide,
  type CreateHostProfileInput,
  type UpdateHostProfileInput,
} from '@offhours/shared'

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { HostService } from './host.service'

@ApiBearerAuth()
@ApiTags('host')
@UseGuards(JwtAuthGuard)
@Controller('host')
export class HostController {
  constructor(private readonly host: HostService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: RequestUser) {
    return this.host.getProfile(user.id)
  }

  @Post('profile')
  async create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(CreateHostProfileSchema)) body: CreateHostProfileInput
  ) {
    return this.host.upsertProfile(user.id, body)
  }

  @Patch('profile')
  async update(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(UpdateHostProfileSchema)) body: UpdateHostProfileInput
  ) {
    return this.host.updateProfile(user.id, body)
  }

  @Get('earnings')
  async earnings(@CurrentUser() user: RequestUser) {
    return this.host.earnings(user.id)
  }

  @Get('stats')
  async stats(@CurrentUser() user: RequestUser) {
    return this.host.getStats(user.id)
  }

  @Get('demand-heatmap')
  async demandHeatmap(@CurrentUser() user: RequestUser) {
    return this.host.getDemandHeatmap(user.id)
  }

  @Get('arrival-guides')
  async listArrivalGuides(@CurrentUser() user: RequestUser) {
    return this.host.listVenueArrivalGuides(user.id)
  }

  @Patch('venues/:venueId/arrival-guide')
  async upsertArrivalGuide(
    @CurrentUser() user: RequestUser,
    @Param('venueId') venueId: string,
    @Body(new ZodValidationPipe(ArrivalGuideSchema)) body: ArrivalGuide
  ) {
    return this.host.upsertArrivalGuide(user.id, venueId, body)
  }
}
