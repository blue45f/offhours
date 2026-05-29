import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import {
  CreateSpaceSchema,
  PriceSuggestionQuerySchema,
  SpaceSearchSchema,
  UpdateSpaceSchema,
  type CreateSpaceInput,
  type PriceSuggestionQuery,
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

  @Public()
  @Get('by-slugs')
  async getBySlugs(@Query('slugs') slugs: string | undefined) {
    if (!slugs) return []
    const list = slugs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 24)
    return this.spaces.getBySlugs(list)
  }

  @Public()
  @Get('for-you')
  async forYou(@Query('seedSlugs') seedSlugs: string | undefined, @Query('limit') limit?: string) {
    const seeds = seedSlugs
      ? seedSlugs
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 8)
      : []
    return this.spaces.forYou(seeds, Number(limit) || 8)
  }

  @Public()
  @Public()
  @Get('price-suggestion')
  async priceSuggestion(
    @Query(new ZodValidationPipe(PriceSuggestionQuerySchema)) q: PriceSuggestionQuery
  ) {
    return this.spaces.priceSuggestion(q)
  }

  @Public()
  @Get('slug/:slug/gallery')
  async gallery(@Param('slug') slug: string) {
    return this.spaces.eventGallery(slug)
  }

  @Public()
  @Get('slug/:slug/nearby-bundle')
  async nearbyBundle(
    @Param('slug') slug: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('max') max?: string
  ) {
    return this.spaces.nearbyBundle(slug, Number(radiusKm) || 1, Number(max) || 4)
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
