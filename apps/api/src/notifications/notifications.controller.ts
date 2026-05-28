import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { MarkReadSchema, type MarkReadInput } from '@offhours/shared'

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { NotificationsService } from './notifications.service'

@ApiBearerAuth()
@ApiTags('notifications')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  async list(@CurrentUser() user: RequestUser, @Query('unread') unread?: string) {
    return this.notifications.list(user.id, unread === 'true')
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: RequestUser) {
    const count = await this.notifications.unreadCount(user.id)
    return { count }
  }

  @Patch('read')
  async markRead(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(MarkReadSchema)) body: MarkReadInput
  ) {
    return this.notifications.markRead(user.id, body.ids)
  }

  @Patch('read-all')
  async markAllRead(@CurrentUser() user: RequestUser) {
    return this.notifications.markAllRead(user.id)
  }
}
