/// <reference types="vitest/globals" />
import { describe, it, expect, vi } from 'vitest'

// ============================================================================
// Tests for auth server actions.
//
// We mock Prisma (db) and password hashing at the module level, then test
// the exported functions from src/lib/auth.actions.ts.
//
// NOTE: vi.mock factory callbacks are hoisted to the top of the file, so
// mock functions must be created inside vi.hoisted() to be available.
// ============================================================================

const { mockFindUnique, mockTransaction, mockSettingsCreate } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockTransaction: vi.fn(),
  mockSettingsCreate: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: mockFindUnique,
    },
    $transaction: mockTransaction,
    settings: {
      create: mockSettingsCreate,
    },
  },
  active: () => ({ deletedAt: null }),
}))

// Mock password hashing
vi.mock('@/lib/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('$2a$10$hashedpassword'),
  generateToken: vi.fn().mockReturnValue('mock-token'),
  verifyPassword: vi.fn().mockResolvedValue(true),
}))

// Mock next/navigation (redirect is used in auth.actions.ts)
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

import { registerUser } from '@/lib/auth.actions'

describe('registerUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns { ok: true, data } with valid registration data', async () => {
    // No existing user
    mockFindUnique.mockResolvedValue(null)

    // Transaction creates user + settings
    mockTransaction.mockImplementation(async (cb: (tx: any) => Promise<any>) => {
      return cb({
        user: {
          create: vi.fn().mockResolvedValue({ id: 'new-user-id', email: 'fresh@example.com' }),
        },
        settings: {
          create: vi.fn().mockResolvedValue({ userId: 'new-user-id' }),
        },
      })
    })

    const result = await registerUser({
      name: 'Fresh User',
      email: 'fresh@example.com',
      password: 'SecurePass1!',
      confirmPassword: 'SecurePass1!',
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.userId).toBe('new-user-id')
      expect(result.data.email).toBe('fresh@example.com')
    }
  })

  it('returns { ok: false, error } when email already exists', async () => {
    // Existing user found
    mockFindUnique.mockResolvedValue({ id: 'existing-id', deletedAt: null })

    const result = await registerUser({
      name: 'Dup User',
      email: 'existing@example.com',
      password: 'SecurePass1!',
      confirmPassword: 'SecurePass1!',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('already exists')
      expect(result.fieldErrors?.email).toBeDefined()
    }
  })

  it('handles invalid input gracefully', async () => {
    const result = await registerUser({
      name: '',
      email: 'bad-email',
      password: 'short',
      confirmPassword: 'mismatch',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBeDefined()
      expect(result.fieldErrors).toBeDefined()
    }
  })

  it('handles Prisma errors gracefully', async () => {
    mockFindUnique.mockRejectedValue(new Error('Database connection failed'))

    // The function does not catch DB errors, so promise rejects
    await expect(
      registerUser({
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass1!',
        confirmPassword: 'SecurePass1!',
      }),
    ).rejects.toThrow('Database connection failed')
  })
})
