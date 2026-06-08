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
import { REFERRAL_BONUS_KRW, type SignInInput, type SignUpInput } from '@offhours/shared'

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
        // 추천인 코드로 가입하면 신규 회원에게 가입 적립(B05)
        pointsKRW: referredBy ? REFERRAL_BONUS_KRW : 0,
      },
    })
    // 추천인에게도 동일 포인트 적립
    if (referredBy) {
      await this.prisma.user.update({
        where: { id: referredBy.id },
        data: { pointsKRW: { increment: REFERRAL_BONUS_KRW } },
      })
    }

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

  // 클라이언트가 Google 버튼 노출 여부를 판단하도록 공개 설정만 내려준다.
  publicConfig() {
    const googleClientId = this.config.get<string>('GOOGLE_CLIENT_ID')?.trim()
    return { googleClientId: googleClientId ? googleClientId : null }
  }

  // Google ID 토큰(GIS credential) 검증 → 이메일 기준 find-or-create 후 동일 세션 발급.
  // audience 를 항상 전달해 토큰 대상이 우리 클라이언트인지 확인하고, email_verified 가
  // 아니면 거부한다(토큰 자체는 로깅하지 않는다).
  async googleAuth(credential: string, meta: { ip?: string; userAgent?: string } = {}) {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID')?.trim()
    if (!clientId) throw new UnauthorizedException('Google 로그인이 설정되지 않았어요')

    const { OAuth2Client } = await import('google-auth-library')
    const client = new OAuth2Client(clientId)
    let payload: import('google-auth-library').TokenPayload | undefined
    try {
      const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId })
      payload = ticket.getPayload()
    } catch {
      throw new UnauthorizedException('Google 인증에 실패했어요')
    }
    if (!payload?.sub || !payload.email || !payload.email_verified)
      throw new UnauthorizedException('Google 인증에 실패했어요')

    const sub = payload.sub
    const email = payload.email.toLowerCase()
    const name = payload.name?.trim() || email.split('@')[0] || '게스트'

    let user = await this.prisma.user.findUnique({ where: { email } })
    if (user) {
      if (user.isSuspended)
        throw new ForbiddenException('정지된 계정이에요. 고객센터로 문의해주세요.')
      // 기존 이메일 계정에 Google 식별자를 연결(최초 1회). passwordHash 는 그대로 둔다.
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date(), googleSub: user.googleSub ?? sub },
      })
    } else {
      const referralCode = await this.uniqueReferralCode()
      user = await this.prisma.user.create({
        data: { email, name, provider: 'google', googleSub: sub, referralCode },
      })
    }

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
    if (!record) throw new UnauthorizedException('Refresh token invalid')
    // 토큰 재사용 탐지 — 이미 회전·폐기된 refresh 토큰이 다시 제시되는 정상 경로는 없다.
    // 탈취/복제 정황으로 보고 같은 family 전체를 폐기해 공격자·피해자 세션을 모두 끊는다
    // (OAuth refresh token rotation 권고: reuse detection). family 인덱스로 일괄 폐기.
    if (record.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { family: record.family, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      throw new UnauthorizedException('Refresh token invalid')
    }
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
