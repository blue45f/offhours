import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import {
  CreateSpaceSchema,
  SpaceSearchSchema,
  UpdateSpaceSchema,
  type CreateSpaceInput,
  type SpaceSearch,
  type UpdateSpaceInput,
} from '@offhours/shared'

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { Public } from '../common/decorators/public.decorator'
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { SpacesService } from './spaces.service'

@ApiTags('spaces')
@Controller('spaces')
export class SpacesController {
  constructor(private readonly spaces: SpacesService) {}

  @Public()
  @Get()
  async search(@Query(new ZodValidationPipe(SpaceSearchSchema)) q: SpaceSearch) {
    return this.spaces.search(q)
  }

  @Public()
  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.spaces.getBySlug(slug)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('mine')
  async getMine(@CurrentUser() user: RequestUser) {
    return this.spaces.getMine(user.id)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(CreateSpaceSchema)) body: CreateSpaceInput
  ) {
    return this.spaces.create(user.id, body)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateSpaceSchema)) body: UpdateSpaceInput
  ) {
    return this.spaces.update(user.id, id, body)
  }
}
