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

  /** 딥링크(/chat/:id)로 바로 진입할 때 목록 없이 스레드 맥락을 가져온다 */
  @Get(':id')
  async thread(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.chat.thread(user.id, id)
  }

  @Post(':id/messages')
  async send(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SendMessageSchema)) body: SendMessageInput
  ) {
    return this.chat.send(user.id, id, body)
  }

  /** 예약 전 문의 쪽지 — 공간 상세에서 호스트와 스레드 생성(있으면 재사용) */
  @Post('open/space/:spaceId')
  async openSpace(@CurrentUser() user: RequestUser, @Param('spaceId') spaceId: string) {
    return this.chat.openForSpace(user.id, spaceId)
  }

  @Post('open/:reservationId')
  async open(@CurrentUser() user: RequestUser, @Param('reservationId') reservationId: string) {
    return this.chat.openForReservation(user.id, reservationId)
  }
}
