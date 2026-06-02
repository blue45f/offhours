import { Controller, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { randomBytes } from 'crypto'

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'

@ApiBearerAuth()
@ApiTags('uploads')
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  @Post('sign')
  async sign() {
    const key = randomBytes(16).toString('hex')
    return {
      uploadUrl: `https://placeholder.upload/${key}`,
      publicUrl: `https://images.offhours.kr/${key}`,
      key,
      expiresIn: 3600,
    }
  }
}
