import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { JoinWaitlistSchema, type JoinWaitlistInput } from '@offhours/shared'

import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator'
import { Public } from '../common/decorators/public.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'

import { WaitlistService } from './waitlist.service'

import type { Request } from 'express'

@ApiBearerAuth()
@ApiTags('waitlist')
@UseGuards(JwtAuthGuard)
@Controller('spaces/:spaceId/waitlist')
export class WaitlistController {
  constructor(private readonly waitlist: WaitlistService) {}

  @Public()
  @Get()
  async status(@Param('spaceId') spaceId: string, @Req() req: Request & { user?: RequestUser }) {
    return this.waitlist.status(spaceId, req.user?.id)
  }

  @Post()
  async join(
    @CurrentUser() user: RequestUser,
    @Param('spaceId') spaceId: string,
    @Body(new ZodValidationPipe(JoinWaitlistSchema)) body: JoinWaitlistInput
  ) {
    return this.waitlist.join(spaceId, user.id, body.desiredDate)
  }

  @Delete()
  async leave(@CurrentUser() user: RequestUser, @Param('spaceId') spaceId: string) {
    return this.waitlist.leave(spaceId, user.id)
  }
}
