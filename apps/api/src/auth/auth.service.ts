import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as argon2 from 'argon2'
import { randomBytes, createHash } from 'crypto'
import type { Role, User } from '@prisma/client'
import { type SignInInput, type SignUpInput } from '@offhours/shared'

import { PrismaService } from '../prisma/prisma.service'
import { randomReferralCode } from '../common/util/code'
import { getAccessTokenExpiresIn } from './jwt-options'

const REFRESH_TTL_DAYS = 30

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  async signUp(input: SignUpInput, meta: { ip?: string; userAgent?: string } = {}) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } })
    if (existing) throw new ConflictException('이미 가입된 이메일이에요')

    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id })
    const referralCode = await this.uniqueReferralCode()
    const referredBy = input.referralCode
      ? await this.prisma.user.findUnique({ where: { referralCode: input.referralCode } })
      : null

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        phone: input.phone ?? null,
        marketingOptIn: input.marketingOptIn ?? false,
        referralCode,
        referredById: referredBy?.id ?? null,
      },
    })

    return this.issueTokens(user, meta)
  }

  async signIn(input: SignInInput, meta: { ip?: string; userAgent?: string } = {}) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } })
    if (!user || !user.passwordHash)
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않아요')
    const ok = await argon2.verify(user.passwordHash, input.password)
    if (!ok) throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않아요')
    if (user.isSuspended)
      throw new ForbiddenException('정지된 계정이에요. 고객센터로 문의해주세요.')

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return this.issueTokens(user, meta)
  }

  async signOut(refreshToken: string | undefined) {
    if (!refreshToken) return
    const tokenHash = this.hashToken(refreshToken)
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  async refresh(refreshToken: string, meta: { ip?: string; userAgent?: string } = {}) {
    const tokenHash = this.hashToken(refreshToken)
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    })
    if (!record || record.revokedAt) throw new UnauthorizedException('Refresh token invalid')
    if (record.expiresAt.getTime() < Date.now())
      throw new UnauthorizedException('Refresh token expired')

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    })
    return this.issueTokens(record.user, meta, record.family)
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } })
  }

  serialize(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isVerified: user.isVerified,
      isSuspended: user.isSuspended,
      marketingOptIn: user.marketingOptIn,
      referralCode: user.referralCode,
      pointsKRW: user.pointsKRW,
      trustScore: user.trustScore,
      createdAt: user.createdAt.toISOString(),
    }
  }

  private async issueTokens(
    user: User,
    meta: { ip?: string; userAgent?: string },
    family?: string
  ) {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role as Role },
      {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: getAccessTokenExpiresIn(this.config),
      }
    )

    const rawRefresh = randomBytes(48).toString('base64url')
    const tokenHash = this.hashToken(rawRefresh)
    const fam = family ?? randomBytes(16).toString('hex')
    const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000)

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        family: fam,
        userAgent: meta.userAgent ?? null,
        ip: meta.ip ?? null,
        expiresAt,
      },
    })

    return {
      accessToken,
      refreshToken: rawRefresh,
      refreshExpiresAt: expiresAt,
      user: this.serialize(user),
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  private async uniqueReferralCode(): Promise<string> {
    while (true) {
      const code = randomReferralCode()
      const exists = await this.prisma.user.findUnique({ where: { referralCode: code } })
      if (!exists) return code
    }
  }
}
