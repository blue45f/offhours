import { Body, Controller, Delete, Get, Post, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import {
  TopupCreditSchema,
  UpsertCorporateProfileSchema,
  type TopupCreditInput,
  type UpsertCorporateProfileInput,
} from '@offhours/shared'

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { CorporateService } from './corporate.service'

@ApiBearerAuth()
@ApiTags('corporate')
@UseGuards(JwtAuthGuard)
@Controller('me/corporate')
export class CorporateController {
  constructor(private readonly corporate: CorporateService) {}

  @Get()
  async get(@CurrentUser() user: RequestUser) {
    return this.corporate.get(user.id)
  }

  @Put()
  async upsert(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(UpsertCorporateProfileSchema)) body: UpsertCorporateProfileInput
  ) {
    return this.corporate.upsert(user.id, body)
  }

  @Delete()
  async remove(@CurrentUser() user: RequestUser) {
    return this.corporate.remove(user.id)
  }

  @Post('credits/topup')
  async topup(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(TopupCreditSchema)) body: TopupCreditInput
  ) {
    return this.corporate.topup(user.id, body.amountKRW)
  }
}
