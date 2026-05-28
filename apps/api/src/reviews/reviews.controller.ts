import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import {
  CreateReviewSchema,
  RespondReviewSchema,
  type CreateReviewInput,
  type RespondReviewInput,
} from '@offhours/shared'

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { Public } from '../common/decorators/public.decorator'
import { ReviewsService } from './reviews.service'

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Public()
  @Get('space/:spaceId')
  async listForSpace(
    @Param('spaceId') spaceId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    return this.reviews.listForSpace(spaceId, Number(page) || 1, Number(pageSize) || 20)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(CreateReviewSchema)) body: CreateReviewInput
  ) {
    return this.reviews.create(user.id, body)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/respond')
  async respond(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RespondReviewSchema)) body: RespondReviewInput
  ) {
    return this.reviews.respond(user.id, id, body)
  }
}
