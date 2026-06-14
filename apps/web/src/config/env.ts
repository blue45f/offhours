import { z } from 'zod'

/**
 * Frontend environment schema (NON-FATAL validation).
 *
 * Validates the `VITE_*` values exposed to the client at startup. Like the
 * backend counterpart, this never throws — it only logs a console warning so a
 * misconfigured build is visible without breaking the app shell.
 */
const envSchema = z.object({
  VITE_API_URL: z.string().url().optional(),
  VITE_USE_MSW: z.enum(['true', 'false']).optional(),
  VITE_TOSS_CLIENT_KEY: z.string().optional(),
})

/**
 * Run the schema against `import.meta.env`. Never throws; logs a warning on
 * failure. Safe to call once during bootstrap.
 */
export function validateClientEnv(): void {
  const result = envSchema.safeParse(import.meta.env)
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
    console.warn(`[env] Client environment validation reported issues (non-fatal):\n${issues}`)
  }
}
