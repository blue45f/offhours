import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CreateSplitSchema, type CreateSplitInput } from '@offhours/shared'

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator'
import { Public } from '../common/decorators/public.decorator'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { SplitsService } from './splits.service'

@ApiTags('splits')
@Controller()
export class SplitsController {
  constructor(private readonly splits: SplitsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('reservations/:id/split')
  async get(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.splits.get(user.id, id)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('reservations/:id/split')
  async create(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreateSplitSchema)) body: CreateSplitInput
  ) {
    return this.splits.create(user.id, id, body)
  }

  @Public()
  @Get('pay/:token')
  async getByToken(@Param('token') token: string) {
    return this.splits.getByToken(token)
  }

  @Public()
  @Post('pay/:token/confirm')
  async markPaid(@Param('token') token: string) {
    return this.splits.markPaid(token)
  }
}
