import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Res,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { UpdateProfileSchema, type UpdateProfileInput } from '@offhours/shared'
import type { Response } from 'express'

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { UsersService } from './users.service'

const REFRESH_COOKIE = 'offh_rt'

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' })
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async update(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) body: UpdateProfileInput
  ) {
    return this.users.update(user.id, body)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @Delete('me')
  async withdraw(@CurrentUser() user: RequestUser, @Res({ passthrough: true }) res: Response) {
    await this.users.withdraw(user.id)
    clearRefreshCookie(res)
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.users.getPublic(id)
  }
}
