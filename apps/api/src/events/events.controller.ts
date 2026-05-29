import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { CreateRsvpSchema, type CreateRsvpInput } from '@offhours/shared'

import { Public } from '../common/decorators/public.decorator'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { EventsService } from './events.service'

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Public()
  @Get(':code')
  async getByCode(@Param('code') code: string) {
    return this.events.getByCode(code)
  }

  @Public()
  @Post(':code/rsvp')
  async rsvp(
    @Param('code') code: string,
    @Body(new ZodValidationPipe(CreateRsvpSchema)) body: CreateRsvpInput
  ) {
    return this.events.rsvp(code, body)
  }
}
