import { ArgumentMetadata, BadRequestException, PipeTransform } from '@nestjs/common'
import { ZodError, ZodType } from 'zod'

export class ZodValidationPipe<T extends ZodType> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown, _meta: ArgumentMetadata) {
    try {
      return this.schema.parse(value)
    } catch (e) {
      if (e instanceof ZodError) throw e
      throw new BadRequestException('Invalid input')
    }
  }
}
