import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import {
  CreateReviewReplySchema,
  CreateReviewSchema,
  RespondReviewSchema,
  type CreateReviewInput,
  type CreateReviewReplyInput,
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
  @Get('host/me')
  async listForHost(
    @CurrentUser() user: RequestUser,
    @Query('filter') filter?: 'all' | 'unanswered' | 'answered',
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    return this.reviews.listForHost(
      user.id,
      filter ?? 'all',
      Number(page) || 1,
      Number(pageSize) || 20
    )
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

  /** 후기 1단 답글 — 후기 작성자·호스트가 이어가는 평면 스레드 */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/replies')
  async reply(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateReviewReplySchema)) body: CreateReviewReplyInput
  ) {
    return this.reviews.addReply(user.id, id, body)
  }
}
