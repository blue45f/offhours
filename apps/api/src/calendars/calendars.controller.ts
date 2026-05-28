import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import {
  ConnectExternalCalendarSchema,
  CreateManualBlockSchema,
  type ConnectExternalCalendarInput,
  type CreateManualBlockInput,
} from '@offhours/shared'

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { CalendarsService } from './calendars.service'

@ApiBearerAuth()
@ApiTags('host-calendars')
@UseGuards(JwtAuthGuard)
@Controller('host/calendars')
export class CalendarsController {
  constructor(private readonly calendars: CalendarsService) {}

  @Get()
  async overview(@CurrentUser() user: RequestUser) {
    return this.calendars.overview(user.id)
  }

  @Post('blocks')
  async createBlock(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(CreateManualBlockSchema)) body: CreateManualBlockInput
  ) {
    return this.calendars.createManualBlock(user.id, body)
  }

  @Delete('blocks/:id')
  async deleteBlock(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.calendars.deleteBlock(user.id, id)
  }

  @Post('external')
  async connect(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(ConnectExternalCalendarSchema)) body: ConnectExternalCalendarInput
  ) {
    return this.calendars.connectExternal(user.id, body)
  }

  @Post('external/:id/sync')
  async resync(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.calendars.resync(user.id, id)
  }

  @Delete('external/:id')
  async deleteCalendar(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.calendars.deleteCalendar(user.id, id)
  }
}
