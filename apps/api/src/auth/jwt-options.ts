import type { ConfigService } from '@nestjs/config'
import type { JwtSignOptions } from '@nestjs/jwt'

export function getAccessTokenExpiresIn(config: ConfigService): JwtSignOptions['expiresIn'] {
  return config.get<string>('JWT_ACCESS_TTL', '15m') as JwtSignOptions['expiresIn']
}
