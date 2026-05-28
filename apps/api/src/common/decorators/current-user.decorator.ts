import { ExecutionContext, createParamDecorator } from '@nestjs/common'
import { Role } from '@prisma/client'

export interface RequestUser {
  id: string
  email: string
  role: Role
}

export const CurrentUser = createParamDecorator<keyof RequestUser | undefined>(
  (key, ctx: ExecutionContext): RequestUser | RequestUser[keyof RequestUser] | undefined => {
    const req = ctx.switchToHttp().getRequest()
    const user = req.user as RequestUser | undefined
    if (!user) return undefined
    return key ? user[key] : user
  }
)
