import { z } from 'zod'

// ============================================================================
// Auth validation schemas — single source of truth shared by client forms
// and server actions. Inferred TS types keep the two in sync.
// ============================================================================

const emailField = z
  .string()
  .min(1, { message: 'Email is required' })
  .email({ message: 'Enter a valid email address' })
  .max(254, { message: 'Email is too long' })
  .trim()
  .toLowerCase()

const passwordField = z
  .string()
  .min(1, { message: 'Password is required' })
  .min(8, { message: 'Use at least 8 characters' })
  .max(72, { message: 'Password is too long (max 72)' })

/** Login: email + password. Password rules are lenient (legacy users). */
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, { message: 'Password is required' }),
})
export type LoginInput = z.infer<typeof loginSchema>

/** Register: name + email + password, with a live-checkable strength policy. */
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: 'Tell us your name' })
      .max(80, { message: 'Name is too long' })
      .trim(),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, { message: 'Confirm your password' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
export type RegisterInput = z.infer<typeof registerSchema>

/** Forgot password: just email. */
export const forgotPasswordSchema = z.object({
  email: emailField,
})
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

/** Reset password: token + new password + confirmation. */
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordField,
    confirmPassword: z.string().min(1, { message: 'Confirm your password' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

// ---------------------------------------------------------------------------
// Password strength meter — used by the register form for live feedback.
// Returns a 0..4 score plus a qualitative label. Pure, client-safe.
// ---------------------------------------------------------------------------
export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4
  label: 'Too weak' | 'Weak' | 'Fair' | 'Good' | 'Strong'
  checks: {
    length: boolean
    lowercase: boolean
    uppercase: boolean
    number: boolean
    symbol: boolean
  }
}

export function scorePassword(pw: string): PasswordStrength {
  const checks = {
    length: pw.length >= 8,
    lowercase: /[a-z]/.test(pw),
    uppercase: /[A-Z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^a-zA-Z0-9]/.test(pw),
  }
  const passed = Object.values(checks).filter(Boolean).length
  // length is mandatory; without it the score caps low
  let score: PasswordStrength['score'] = 0
  if (pw.length === 0) score = 0
  else if (!checks.length) score = 1
  else if (passed <= 2) score = 1
  else if (passed === 3) score = 2
  else if (passed === 4) score = 3
  else score = 4
  const labels: PasswordStrength['label'][] = [
    'Too weak',
    'Weak',
    'Fair',
    'Good',
    'Strong',
  ]
  return { score, label: labels[score], checks }
}
