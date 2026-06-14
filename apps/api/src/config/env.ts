import { z } from 'zod'

/**
 * Backend environment schema (NON-FATAL validation).
 *
 * This intentionally does NOT throw or exit on validation failure — the goal is
 * to surface misconfiguration as warnings during boot without ever breaking a
 * live deploy. Existing `process.env` reads elsewhere are left untouched; this
 * module only *adds* a best-effort sanity check.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().optional(),
  DATABASE_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(1).optional(),
  JWT_REFRESH_SECRET: z.string().min(1).optional(),
  JWT_ACCESS_TTL: z.string().min(1).optional(),
  JWT_REFRESH_TTL: z.string().min(1).optional(),
  APP_URL: z.string().url().optional(),
  API_URL: z.string().url().optional(),
  TOSS_CLIENT_KEY: z.string().optional(),
  TOSS_SECRET_KEY: z.string().optional(),
  TOSS_WEBHOOK_SECRET: z.string().optional(),
})

/**
 * Secrets that ship as obvious dev placeholders. If any of these survives into a
 * production boot, that is almost certainly a deploy misconfiguration and we want
 * a loud warning (but still non-fatal).
 */
const UNSAFE_DEFAULTS = new Set([
  'dev-only-change-me-please',
  'dev-secret-change-me',
  'mypassword',
  'change-me-in-production',
  'change-me-to-a-long-random-string-32-bytes-min',
  'change-me-too-long-random-string-32-bytes-min',
])

const SECRET_KEYS = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'TOSS_SECRET_KEY',
  'TOSS_WEBHOOK_SECRET',
] as const

/**
 * Validate `process.env` against {@link envSchema}. Never throws. Returns the
 * parsed env on success, or `null` if validation reported issues (after logging
 * a warning). Callers should not depend on the return value for control flow.
 */
export function validateEnv(
  env: NodeJS.ProcessEnv = process.env
): z.infer<typeof envSchema> | null {
  const result = envSchema.safeParse(env)

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
    console.warn(`[env] Environment validation reported issues (non-fatal):\n${issues}`)
  }

  if (env.NODE_ENV === 'production') {
    const offenders = SECRET_KEYS.filter((key) => {
      const value = env[key]
      return value !== undefined && UNSAFE_DEFAULTS.has(value)
    })
    if (offenders.length > 0) {
      console.warn(
        '\n' +
          '════════════════════════════════════════════════════════════════\n' +
          '  ⚠️  SECURITY WARNING: insecure default secrets in PRODUCTION\n' +
          `  ⚠️  Affected: ${offenders.join(', ')}\n` +
          '  ⚠️  Replace these with strong, unique values before serving traffic.\n' +
          '════════════════════════════════════════════════════════════════\n'
      )
    }
  }

  return result.success ? result.data : null
}
