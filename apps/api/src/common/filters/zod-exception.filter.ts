import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common'
import { Response } from 'express'
import { ZodError } from 'zod'

@Catch(ZodError)
export class ZodValidationFilter implements ExceptionFilter {
  catch(exception: ZodError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse<Response>()
    const issues = exception.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }))
    const firstMessage = issues[0]?.message ?? '입력값이 올바르지 않아요'
    const exc = new BadRequestException({ message: firstMessage, issues })
    res.status(HttpStatus.BAD_REQUEST).json(exc.getResponse())
  }
}
