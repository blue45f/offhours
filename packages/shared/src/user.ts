import { z } from 'zod'
import { RoleSchema } from './enums'

export const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, '이메일을 입력해주세요')
  .max(254)
  .email('올바른 이메일 형식이 아니에요')

export const PasswordSchema = z
  .string()
  .min(8, '비밀번호는 8자 이상이어야 해요')
  .max(128)
  .regex(/[A-Za-z]/, '영문이 포함되어야 해요')
  .regex(/[0-9]/, '숫자가 포함되어야 해요')

export const PhoneSchema = z
  .string()
  .trim()
  .regex(/^01[0-9]-?\d{3,4}-?\d{4}$/, '올바른 휴대폰 번호를 입력해주세요')

export const SignUpSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: z.string().trim().min(1, '이름을 입력해주세요').max(40),
  phone: PhoneSchema.optional(),
  referralCode: z.string().trim().toUpperCase().length(6).optional(),
  marketingOptIn: z.boolean().optional(),
})
export type SignUpInput = z.infer<typeof SignUpSchema>

export const SignInSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, '비밀번호를 입력해주세요'),
})
export type SignInInput = z.infer<typeof SignInSchema>

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
})
export type RefreshInput = z.infer<typeof RefreshSchema>

export const UpdateProfileSchema = z.object({
  name: z.string().trim().min(1).max(40).optional(),
  phone: PhoneSchema.optional().or(z.literal('')),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  marketingOptIn: z.boolean().optional(),
})
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>

export const PublicUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
  role: RoleSchema,
  trustScore: z.number(),
  createdAt: z.string(),
})
export type PublicUser = z.infer<typeof PublicUserSchema>

export const MeSchema = PublicUserSchema.extend({
  email: z.string(),
  phone: z.string().nullable(),
  isVerified: z.boolean(),
  isSuspended: z.boolean(),
  marketingOptIn: z.boolean(),
  referralCode: z.string(),
  pointsKRW: z.number(),
})
export type Me = z.infer<typeof MeSchema>

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  user: MeSchema,
})
export type AuthResponse = z.infer<typeof AuthResponseSchema>
