import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Role } from '@prisma/client'

import { ROLES_KEY } from '../decorators/roles.decorator'

const PRIORITY: Record<Role, number> = {
  USER: 1,
  HOST: 2,
  ADMIN: 3,
  SUPERADMIN: 4,
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required || required.length === 0) return true

    const req = context.switchToHttp().getRequest()
    const role = req.user?.role as Role | undefined
    if (!role) throw new ForbiddenException()

    const minRequired = Math.min(...required.map((r) => PRIORITY[r]))
    if (PRIORITY[role] < minRequired) throw new ForbiddenException('권한이 부족해요')
    return true
  }
}
