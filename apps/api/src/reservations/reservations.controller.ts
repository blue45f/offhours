import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { ReservationStatus } from '@prisma/client'
import {
  CancelReservationSchema,
  CheckOutSchema,
  CreateReservationSchema,
  RejectReservationSchema,
  type CancelReservationInput,
  type CheckOutInput,
  type CreateReservationInput,
  type RejectReservationInput,
} from '@offhours/shared'

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { ReservationsService } from './reservations.service'

@ApiBearerAuth()
@ApiTags('reservations')
@UseGuards(JwtAuthGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(CreateReservationSchema)) body: CreateReservationInput
  ) {
    return this.reservations.create(user.id, body)
  }

  @Get('mine')
  async listMine(
    @CurrentUser() user: RequestUser,
    @Query('role') role: 'guest' | 'host' = 'guest',
    @Query('status') status?: ReservationStatus
  ) {
    if (role === 'host') return this.reservations.listMineAsHost(user.id, status)
    return this.reservations.listMineAsGuest(user.id, status)
  }

  @Get(':id')
  async getOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.reservations.getOne(user.id, id)
  }

  @Patch(':id/approve')
  async approve(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.reservations.approve(user.id, id)
  }

  @Patch(':id/reject')
  async reject(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RejectReservationSchema)) body: RejectReservationInput
  ) {
    return this.reservations.reject(user.id, id, body.reason)
  }

  @Patch(':id/cancel')
  async cancel(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CancelReservationSchema)) body: CancelReservationInput
  ) {
    return this.reservations.cancelByGuest(user.id, id, body.reason)
  }

  @Patch(':id/check-in')
  async checkIn(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body('code') code: string
  ) {
    return this.reservations.checkIn(user.id, id, code)
  }

  @Patch(':id/check-out')
  async checkOut(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CheckOutSchema)) body: CheckOutInput
  ) {
    return this.reservations.checkOut(user.id, id, body)
  }
}
