import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Request, Response } from 'express'
import { SignInSchema, SignUpSchema } from '@offhours/shared'

import { AuthService } from './auth.service'
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, RequestUser } from '../common/decorators/current-user.decorator'

const REFRESH_COOKIE = 'offh_rt'

function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/api/auth',
  })
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' })
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  async signUp(
    @Body(new ZodValidationPipe(SignUpSchema)) body: import('@offhours/shared').SignUpInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] }
    const result = await this.auth.signUp(body, meta)
    setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt)
    return { accessToken: result.accessToken, user: result.user }
  }

  @HttpCode(200)
  @Post('signin')
  async signIn(
    @Body(new ZodValidationPipe(SignInSchema)) body: import('@offhours/shared').SignInInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] }
    const result = await this.auth.signIn(body, meta)
    setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt)
    return { accessToken: result.accessToken, user: result.user }
  }

  @HttpCode(200)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = (req.cookies?.[REFRESH_COOKIE] as string | undefined) ?? undefined
    if (!token) {
      clearRefreshCookie(res)
      return { accessToken: null, user: null }
    }
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] }
    const result = await this.auth.refresh(token, meta)
    setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt)
    return { accessToken: result.accessToken, user: result.user }
  }

  @HttpCode(204)
  @Post('signout')
  async signOut(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = (req.cookies?.[REFRESH_COOKIE] as string | undefined) ?? undefined
    await this.auth.signOut(token)
    clearRefreshCookie(res)
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: RequestUser) {
    const me = await this.auth.me(user.id)
    if (!me) return null
    return this.auth.serialize(me)
  }
}
