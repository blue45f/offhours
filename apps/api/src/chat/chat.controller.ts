import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { SendMessageSchema, type SendMessageInput } from '@offhours/shared'

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { ChatService } from './chat.service'

@ApiBearerAuth()
@ApiTags('chat')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  async list(@CurrentUser() user: RequestUser) {
    return this.chat.listMine(user.id)
  }

  @Get(':id/messages')
  async messages(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.chat.messages(user.id, id)
  }

  @Post(':id/messages')
  async send(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SendMessageSchema)) body: SendMessageInput
  ) {
    return this.chat.send(user.id, id, body.body)
  }

  @Post('open/:reservationId')
  async open(@CurrentUser() user: RequestUser, @Param('reservationId') reservationId: string) {
    return this.chat.openForReservation(user.id, reservationId)
  }
}
