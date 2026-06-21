/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest'

// ============================================================================
// Tests for auth validation Zod schemas.
//
// These test the actual schemas from src/lib/validations/auth.ts:
//   • loginSchema       — email + password
//   • registerSchema    — name + email + password + confirmPassword
//   • resetPasswordSchema — token + password + confirmPassword
// ============================================================================

import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validations/auth'

describe('loginSchema', () => {
  it('accepts valid email and password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'mypassword',
    })
    expect(result.success).toBe(true)
  })

  it('lowercases email', () => {
    const result = loginSchema.safeParse({
      email: 'User@Example.COM',
      password: 'mypassword',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('user@example.com')
    }
  })

  it('rejects invalid email format', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'mypassword',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty email', () => {
    const result = loginSchema.safeParse({
      email: '',
      password: 'mypassword',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects email that is too long', () => {
    const longLocal = 'a'.repeat(250)
    const result = loginSchema.safeParse({
      email: `${longLocal}@b.com`,
      password: 'mypassword',
    })
    expect(result.success).toBe(false)
  })
})

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      name: 'Test User',
      email: 'newuser@example.com',
      password: 'SecurePass1!',
      confirmPassword: 'SecurePass1!',
    })
    expect(result.success).toBe(true)
  })

  it('rejects when passwords do not match', () => {
    const result = registerSchema.safeParse({
      name: 'Test User',
      email: 'newuser@example.com',
      password: 'SecurePass1!',
      confirmPassword: 'DifferentPass1!',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      expect(fieldErrors.confirmPassword).toBeDefined()
      expect(fieldErrors.confirmPassword![0]).toContain('not match')
    }
  })

  it('rejects truly empty name', () => {
    const result = registerSchema.safeParse({
      name: '',
      email: 'newuser@example.com',
      password: 'SecurePass1!',
      confirmPassword: 'SecurePass1!',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short password (less than 8 chars)', () => {
    const result = registerSchema.safeParse({
      name: 'Test User',
      email: 'newuser@example.com',
      password: 'Ab1!',
      confirmPassword: 'Ab1!',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      expect(fieldErrors.password).toBeDefined()
    }
  })

  it('rejects missing confirmPassword', () => {
    const result = registerSchema.safeParse({
      name: 'Test User',
      email: 'newuser@example.com',
      password: 'SecurePass1!',
      confirmPassword: '',
    })
    expect(result.success).toBe(false)
  })

  it('trims name whitespace', () => {
    const result = registerSchema.safeParse({
      name: '  John Doe  ',
      email: 'john@example.com',
      password: 'SecurePass1!',
      confirmPassword: 'SecurePass1!',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('John Doe')
    }
  })

  it('rejects name over 80 characters', () => {
    const result = registerSchema.safeParse({
      name: 'A very long name that exceeds the maximum allowed length of eighty characters by quite a lot actually yep',
      email: 'user@example.com',
      password: 'SecurePass1!',
      confirmPassword: 'SecurePass1!',
    })
    expect(result.success).toBe(false)
  })
})

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'user@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'bad' })
    expect(result.success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('accepts valid reset data', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'abc123token',
      password: 'NewSecure1!',
      confirmPassword: 'NewSecure1!',
    })
    expect(result.success).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'abc123token',
      password: 'NewSecure1!',
      confirmPassword: 'Different1!',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors
      expect(fieldErrors.confirmPassword).toBeDefined()
    }
  })

  it('rejects empty token', () => {
    const result = resetPasswordSchema.safeParse({
      token: '',
      password: 'NewSecure1!',
      confirmPassword: 'NewSecure1!',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short password in reset', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'abc123',
      password: 'Ab1!',
      confirmPassword: 'Ab1!',
    })
    expect(result.success).toBe(false)
  })
})
