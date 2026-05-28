import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Reflector } from '@nestjs/core'

import { IS_PUBLIC_KEY } from '../decorators/public.decorator'
import { RequestUser } from '../decorators/current-user.decorator'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    const header = req.headers['authorization']
    if (!header || !header.startsWith('Bearer ')) {
      if (isPublic) return true
      throw new UnauthorizedException('Missing bearer token')
    }
    const token = header.slice('Bearer '.length).trim()
    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      })
      req.user = { id: payload.sub, email: payload.email, role: payload.role } satisfies RequestUser
      return true
    } catch {
      if (isPublic) return true
      throw new UnauthorizedException('Invalid token')
    }
  }
}
