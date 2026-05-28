import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import {
  ConfirmPaymentSchema,
  CreatePaymentIntentSchema,
  type ConfirmPaymentInput,
  type CreatePaymentIntentInput,
} from '@offhours/shared'

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { PaymentsService } from './payments.service'

@ApiBearerAuth()
@ApiTags('payments')
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('intent')
  async createIntent(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(CreatePaymentIntentSchema)) body: CreatePaymentIntentInput
  ) {
    return this.payments.createIntent(user.id, body.reservationId, body.method)
  }

  @Post('confirm')
  async confirm(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(ConfirmPaymentSchema)) body: ConfirmPaymentInput
  ) {
    return this.payments.confirm(user.id, body)
  }
}
