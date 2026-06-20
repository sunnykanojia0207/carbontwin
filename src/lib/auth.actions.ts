'use server'

import { redirect } from 'next/navigation'

import { db, active } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/password'
import {
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from '@/lib/validations/auth'

// ============================================================================
// Auth server actions — progressive-enhancement mutations.
//
// Result contract (discriminated union) so client forms can branch cleanly:
//   { ok: true, data }        → success
//   { ok: false, error }      → known/handled error (shown inline)
// The rare thrown error surfaces as a form-level message via try/catch.
// ============================================================================

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }

/**
 * Register a new user with email + password.
 * - Validates input with Zod.
 * - Prevents duplicate emails (active OR soft-deleted).
 * - Hashes password, creates the User + a default Settings row.
 * - Returns the new user id so the client can call signIn('credentials').
 */
export async function registerUser(
  raw: RegisterInput,
): Promise<ActionResult<{ userId: string; email: string }>> {
  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Please fix the highlighted fields.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    }
  }

  const { name, email, password } = parsed.data

  // Block re-registration on any existing email (including soft-deleted).
  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true, deletedAt: true },
  })
  if (existing) {
    return {
      ok: false,
      error:
        'An account with this email already exists. Try logging in instead.',
      fieldErrors: { email: ['This email is already registered'] },
    }
  }

  const hashedPassword = await hashPassword(password)

  // Create user + default settings in one transaction.
  const user = await db.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { name, email, hashedPassword },
      select: { id: true, email: true },
    })
    await tx.settings.create({ data: { userId: created.id } })
    return created
  })

  return { ok: true, data: { userId: user.id, email: user.email } }
}

/**
 * Forgot password — initiate a reset flow.
 * - Always returns success (never reveals whether the email exists) to
 *   prevent account enumeration.
 * - When the email exists & user has a password, creates a verification token
 *   (15-min expiry) and (in production) emails a reset link.
 * - In this sandbox we log the token to the server console so it can be
 *   surfaced for testing; production swaps in a real email provider.
 */
export async function requestPasswordReset(
  raw: ForgotPasswordInput,
): Promise<ActionResult<{ sent: true }>> {
  const parsed = forgotPasswordSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Enter a valid email address.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    }
  }

  const { email } = parsed.data

  // Look up active user with a password (OAuth-only users can't reset).
  const user = await db.user.findFirst({
    where: { email, ...active() },
    select: { id: true, name: true, hashedPassword: true },
  })

  if (user?.hashedPassword) {
    const token = generateToken()
    const expires = new Date(Date.now() + 1000 * 60 * 15) // 15 min

    // Clean prior tokens for this identifier, then insert the new one.
    await db.verificationToken.deleteMany({
      where: { identifier: email },
    })
    await db.verificationToken.create({
      data: { identifier: email, token, expires },
    })

    // SANDBOX ONLY: surface the reset link in server logs for testing.
    // Production: replace with `await sendEmail(email, resetLink)`.
    if (process.env.NODE_ENV !== 'production') {
      const resetUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/reset-password?token=${token}`
      console.log(`[forgot-password] Reset link for ${email}: ${resetUrl}`)
    }
  }

  // Always return success to prevent enumeration.
  return { ok: true, data: { sent: true } }
}

/**
 * Reset password — consume a one-time token and set a new password.
 * - Validates token existence + expiry.
 * - Updates the user's password (hashes it).
 * - Deletes the token (single-use).
 * - Returns success so the client can route to /login.
 */
export async function resetPassword(
  raw: ResetPasswordInput,
): Promise<ActionResult<{ done: true }>> {
  const parsed = resetPasswordSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Please fix the highlighted fields.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    }
  }

  const { token, password } = parsed.data

  const record = await db.verificationToken.findUnique({
    where: { token },
    select: { identifier: true, expires: true },
  })

  if (!record || record.expires < new Date()) {
    // Clean up expired token if present.
    if (record) {
      await db.verificationToken.delete({ where: { token } }).catch(() => {})
    }
    return {
      ok: false,
      error:
        'This reset link is invalid or has expired. Please request a new one.',
    }
  }

  const user = await db.user.findFirst({
    where: { email: record.identifier, ...active() },
    select: { id: true },
  })

  if (!user) {
    return {
      ok: false,
      error: 'No account found for this reset link.',
    }
  }

  const hashed = await hashPassword(password)

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: { hashedPassword: hashed },
    }),
    db.verificationToken.delete({ where: { token } }),
  ])

  return { ok: true, data: { done: true } }
}

/**
 * Convenience: server-side sign-in redirect target after registration.
 * Kept as an action so the client can `await` it before redirecting.
 */
export async function redirectToLogin(): Promise<never> {
  redirect('/login?registered=1')
}
