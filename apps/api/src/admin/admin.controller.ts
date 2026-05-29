import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Role } from '@prisma/client'
import {
  BroadcastNotificationSchema,
  ResolveDisputeSchema,
  ResolveReportSchema,
  SetRoleSchema,
  SetSuspendedSchema,
  type BroadcastNotificationInput,
  type ResolveDisputeInput,
  type ResolveReportInput,
  type SetRoleInput,
  type SetSuspendedInput,
} from '@offhours/shared'

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { AdminService } from './admin.service'

@ApiBearerAuth()
@ApiTags('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('kpi')
  async kpi() {
    return this.admin.kpi()
  }

  @Get('charts/gmv')
  async gmvSeries(@Query('days') days?: string) {
    return this.admin.gmvTimeseries(Number(days) || 30)
  }

  @Get('charts/category')
  async categoryShare() {
    return this.admin.categoryShare()
  }

  @Get('users')
  async users(
    @Query('q') q?: string,
    @Query('role') role?: Role,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    return this.admin.listUsers(q, role, Number(page) || 1, Number(pageSize) || 20)
  }

  @Patch('users/:id/suspend')
  async setSuspended(
    @CurrentUser() actor: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SetSuspendedSchema)) body: SetSuspendedInput
  ) {
    return this.admin.setSuspended(actor.id, id, body)
  }

  @Roles(Role.SUPERADMIN)
  @Patch('users/:id/role')
  async setRole(
    @CurrentUser() actor: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SetRoleSchema)) body: SetRoleInput
  ) {
    return this.admin.setRole(actor.id, id, body.role)
  }

  @Get('spaces/pending')
  async pendingSpaces() {
    return this.admin.pendingSpaces()
  }

  @Patch('spaces/:id/approve')
  async approveSpace(@CurrentUser() actor: RequestUser, @Param('id') id: string) {
    return this.admin.approveSpace(actor.id, id)
  }

  @Patch('spaces/:id/reject')
  async rejectSpace(
    @CurrentUser() actor: RequestUser,
    @Param('id') id: string,
    @Body('reason') reason: string
  ) {
    return this.admin.rejectSpace(actor.id, id, reason)
  }

  @Get('reports')
  async reports(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.admin.listReports(Number(page) || 1, Number(pageSize) || 20)
  }

  @Patch('reports/:id/resolve')
  async resolveReport(
    @CurrentUser() actor: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ResolveReportSchema)) body: ResolveReportInput
  ) {
    return this.admin.resolveReport(actor.id, id, body)
  }

  @Get('disputes')
  async disputes(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.admin.listDisputes(Number(page) || 1, Number(pageSize) || 20)
  }

  @Patch('disputes/:id/resolve')
  async resolveDispute(
    @CurrentUser() actor: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ResolveDisputeSchema)) body: ResolveDisputeInput
  ) {
    return this.admin.resolveDispute(actor.id, id, body)
  }

  @Get('audit')
  async audit(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.admin.auditLogs(Number(page) || 1, Number(pageSize) || 50)
  }

  @Post('broadcast')
  async broadcast(
    @CurrentUser() actor: RequestUser,
    @Body(new ZodValidationPipe(BroadcastNotificationSchema)) body: BroadcastNotificationInput
  ) {
    return this.admin.broadcast(actor.id, body)
  }
}
