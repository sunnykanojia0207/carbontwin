/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================================================
// Tests for auth.config.ts, auth.ts, and remaining auth.actions.ts paths.
//
// Mocks:
//   - @/lib/db (Prisma) — all db methods used by auth.ts + auth.actions.ts
//   - @/lib/password — hashPassword, verifyPassword, generateToken
//   - next-auth providers — credentials + google
//   - @next-auth/prisma-adapter
//   - next/navigation — redirect
// ============================================================================

const {
  mockDbFindFirst,
  mockDbUserUpdate,
  mockVerifyTokenDelete,
  mockVerifyTokenDeleteMany,
  mockVerifyTokenCreate,
  mockVerifyTokenFindUnique,
  mockTransaction,
  mockVerifyPassword,
  mockHashPassword,
  mockGenerateToken,
} = vi.hoisted(() => ({
  mockDbFindFirst: vi.fn(),
  mockDbUserUpdate: vi.fn(),
  mockVerifyTokenDelete: vi.fn(),
  mockVerifyTokenDeleteMany: vi.fn(),
  mockVerifyTokenCreate: vi.fn(),
  mockVerifyTokenFindUnique: vi.fn(),
  mockTransaction: vi.fn(),
  mockVerifyPassword: vi.fn().mockResolvedValue(true),
  mockHashPassword: vi.fn().mockResolvedValue('$2a$10$mockedhashedpassword'),
  mockGenerateToken: vi.fn().mockReturnValue('mocked-reset-token-abc123'),
}))

// Store the authorize function from CredentialsProvider (in hoisted so it's available to vi.mock factory)
const capturedAuthorize = vi.hoisted(() => ({ current: null as ((args: { email?: string; password?: string }) => Promise<unknown>) | null }))

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findFirst: mockDbFindFirst,
      update: mockDbUserUpdate,
    },
    verificationToken: {
      findUnique: mockVerifyTokenFindUnique,
      delete: mockVerifyTokenDelete,
      deleteMany: mockVerifyTokenDeleteMany,
      create: mockVerifyTokenCreate,
    },
    $transaction: mockTransaction,
  },
  active: () => ({ deletedAt: null }),
}))

vi.mock('@/lib/password', () => ({
  hashPassword: mockHashPassword,
  verifyPassword: mockVerifyPassword,
  generateToken: mockGenerateToken,
}))

// Mock next-auth CredentialsProvider — capture authorize for direct testing
vi.mock('next-auth/providers/credentials', () => ({
  default: vi.fn((options: { authorize: (args: { email?: string; password?: string }) => Promise<unknown> }) => {
    capturedAuthorize.current = options.authorize
    return {
      id: 'credentials',
      name: 'credentials',
      type: 'credentials',
      options,
    }
  }),
}))

// Mock Google provider (returns a stub)
vi.mock('next-auth/providers/google', () => ({
  default: vi.fn(() => ({
    id: 'google',
    name: 'google',
    type: 'oauth',
  })),
}))

// Mock PrismaAdapter
vi.mock('@next-auth/prisma-adapter', () => ({
  PrismaAdapter: vi.fn(() => ({})),
}))

// Mock next/navigation redirect
vi.mock('next/navigation', () => ({
  redirect: vi.fn(() => {
    throw new Error('NEXT_REDIRECT')
  }),
}))

// ---------------------------------------------------------------------------
// Imports — done after mocks are set up
// ---------------------------------------------------------------------------
import { redirect } from 'next/navigation'
import { authConfig } from '@/lib/auth.config'
import { authOptions } from '@/lib/auth'
import { requestPasswordReset, resetPassword, redirectToLogin } from '@/lib/auth.actions'

// ============================================================================
// auth.config.ts
// ============================================================================
describe('authConfig', () => {
  describe('structure', () => {
    it('has JWT session strategy', () => {
      expect(authConfig.session?.strategy).toBe('jwt')
    })

    it('has empty providers array', () => {
      expect(authConfig.providers).toEqual([])
    })

    it('has custom pages', () => {
      expect(authConfig.pages?.signIn).toBe('/login')
      expect(authConfig.pages?.error).toBe('/login')
      expect(authConfig.pages?.verifyRequest).toBe('/verify-request')
      expect(authConfig.pages?.newUser).toBe('/onboarding')
    })
  })

  describe('jwt callback', () => {
    it('enriches token with user data on initial sign-in', async () => {
      const cb = authConfig.callbacks!.jwt!
      const result = await cb({
        token: { sub: 'sub-1' },
        user: { id: 'user-1', plan: 'PREMIUM', onboardingDone: true },
        trigger: undefined as any,
        session: undefined as any,
        account: undefined as any,
        profile: undefined as any,
        isNewUser: undefined as any,
      })

      expect(result).toMatchObject({
        id: 'user-1',
        plan: 'PREMIUM',
        onboardingDone: true,
      })
    })

    it('uses defaults when user has no plan/onboarding', async () => {
      const cb = authConfig.callbacks!.jwt!
      const result = await cb({
        token: {},
        user: { id: 'user-2' },
        trigger: undefined as any,
        session: undefined as any,
        account: undefined as any,
        profile: undefined as any,
        isNewUser: undefined as any,
      })

      expect(result).toMatchObject({
        id: 'user-2',
        plan: 'FREE',
        onboardingDone: false,
      })
    })

    it('returns token unchanged when no user', async () => {
      const cb = authConfig.callbacks!.jwt!
      const token = { sub: 'existing', id: 'user-1', plan: 'FREE' }
      const result = await cb({
        token,
        user: undefined,
        trigger: undefined as any,
        session: undefined as any,
        account: undefined as any,
        profile: undefined as any,
        isNewUser: undefined as any,
      })

      expect(result).toBe(token)
    })
  })

  describe('session callback', () => {
    it('enriches session user from token', async () => {
      const cb = authConfig.callbacks!.session!
      const session = { user: { name: 'Test', email: 'test@test.com' } } as any
      const token = { id: 'user-1', plan: 'PREMIUM', onboardingDone: true }

      const result = await cb({ session, token, trigger: undefined as any, newSession: undefined as any })

      expect(result.user).toMatchObject({
        id: 'user-1',
        name: 'Test',
        email: 'test@test.com',
        plan: 'PREMIUM',
        onboardingDone: true,
      })
    })

    it('uses default values when token lacks plan/onboarding', async () => {
      const cb = authConfig.callbacks!.session!
      const session = { user: { name: 'Test' } } as any
      const token = { id: 'user-1' }

      const result = await cb({ session, token, trigger: undefined as any, newSession: undefined as any })

      expect(result.user).toMatchObject({
        id: 'user-1',
        plan: 'FREE',
        onboardingDone: false,
      })
    })

    it('returns session unchanged when session has no user', async () => {
      const cb = authConfig.callbacks!.session!
      const session = {} as any
      const token = { id: 'user-1' }

      const result = await cb({ session, token, trigger: undefined as any, newSession: undefined as any })

      expect(result).toBe(session)
    })
  })
})

// ============================================================================
// auth.ts — Credentials authorize
// ============================================================================
describe('Credentials authorize', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns user object on valid email + password', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
      hashedPassword: '$2a$10$storedhash',
      plan: 'FREE',
      onboardingDone: true,
      emailVerified: null,
    }
    mockDbFindFirst.mockResolvedValue(mockUser)
    mockVerifyPassword.mockResolvedValue(true)

    const result = await capturedAuthorize.current!({
      email: 'test@example.com',
      password: 'correct-password',
    })

    expect(result).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
      plan: 'FREE',
      onboardingDone: true,
    })
    // Hash must NOT be leaked
    expect(result).not.toHaveProperty('hashedPassword')
  })

  it('normalizes email to lowercase and trims', async () => {
    mockDbFindFirst.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test',
      image: null,
      hashedPassword: '$2a$10$hash',
      plan: 'FREE',
      onboardingDone: false,
      emailVerified: null,
    })
    mockVerifyPassword.mockResolvedValue(true)

    await capturedAuthorize.current!({
      email: '  TEST@EXAMPLE.COM  ',
      password: 'password',
    })

    expect(mockDbFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ email: 'test@example.com' }),
      }),
    )
  })

  it('returns null when credentials are empty', async () => {
    const result1 = await capturedAuthorize.current!({ email: '', password: '' })
    expect(result1).toBeNull()

    const result2 = await capturedAuthorize.current!({ email: '', password: 'pass' })
    expect(result2).toBeNull()
  })

  it('returns null when user is not found', async () => {
    mockDbFindFirst.mockResolvedValue(null)

    const result = await capturedAuthorize.current!({
      email: 'unknown@test.com',
      password: 'password',
    })

    expect(result).toBeNull()
  })

  it('returns null for OAuth-only user (no hashedPassword)', async () => {
    mockDbFindFirst.mockResolvedValue({
      id: 'user-2',
      email: 'oauth@test.com',
      name: 'OAuth User',
      image: null,
      hashedPassword: null,
      plan: 'FREE',
      onboardingDone: true,
      emailVerified: new Date(),
    })

    const result = await capturedAuthorize.current!({
      email: 'oauth@test.com',
      password: 'any-password',
    })

    expect(result).toBeNull()
  })

  it('returns null when password is invalid', async () => {
    mockDbFindFirst.mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      name: 'Test',
      image: null,
      hashedPassword: '$2a$10$hash',
      plan: 'FREE',
      onboardingDone: false,
      emailVerified: null,
    })
    mockVerifyPassword.mockResolvedValue(false)

    const result = await capturedAuthorize.current!({
      email: 'test@test.com',
      password: 'wrong-password',
    })

    expect(result).toBeNull()
  })
})

// ============================================================================
// auth.ts — authOptions callbacks
// ============================================================================
describe('authOptions JWT callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('enriches token with user data on initial sign-in', async () => {
    const cb = authOptions.callbacks!.jwt!
    const result = await cb({
      token: { sub: '123' },
      user: { id: 'user-1', plan: 'PREMIUM', onboardingDone: true },
      trigger: undefined as any,
      session: undefined as any,
      account: undefined as any,
      profile: undefined as any,
      isNewUser: undefined as any,
    })

    expect(result).toMatchObject({
      id: 'user-1',
      plan: 'PREMIUM',
      onboardingDone: true,
    })
  })

  it('handles session update trigger (onboardingDone)', async () => {
    const cb = authOptions.callbacks!.jwt!
    const token = { id: 'user-1', plan: 'FREE', onboardingDone: false }

    const result = await cb({
      token,
      user: undefined,
      trigger: 'update',
      session: { onboardingDone: true },
      account: undefined as any,
      profile: undefined as any,
      isNewUser: undefined as any,
    })

    expect(result.onboardingDone).toBe(true)
    expect(result.plan).toBe('FREE') // unchanged
  })

  it('handles session update trigger (plan change)', async () => {
    const cb = authOptions.callbacks!.jwt!
    const token = { id: 'user-1', plan: 'FREE', onboardingDone: true }

    const result = await cb({
      token,
      user: undefined,
      trigger: 'update',
      session: { plan: 'PREMIUM' },
      account: undefined as any,
      profile: undefined as any,
      isNewUser: undefined as any,
    })

    expect(result.plan).toBe('PREMIUM')
    expect(result.onboardingDone).toBe(true) // unchanged
  })

  it('handles session update trigger (name change)', async () => {
    const cb = authOptions.callbacks!.jwt!
    const token = { id: 'user-1', plan: 'FREE', onboardingDone: true, name: 'Old' }

    const result = await cb({
      token,
      user: undefined,
      trigger: 'update',
      session: { name: 'New Name' },
      account: undefined as any,
      profile: undefined as any,
      isNewUser: undefined as any,
    })

    expect(result.name).toBe('New Name')
  })

  it('ignores non-boolean onboardingDone in session update', async () => {
    const cb = authOptions.callbacks!.jwt!
    const token = { id: 'user-1', plan: 'FREE', onboardingDone: false }

    const result = await cb({
      token,
      user: undefined,
      trigger: 'update',
      session: { onboardingDone: 123 },
      account: undefined as any,
      profile: undefined as any,
      isNewUser: undefined as any,
    })

    expect(result.onboardingDone).toBe(false) // unchanged because 123 is not boolean
  })

  it('ignores non-string plan in session update', async () => {
    const cb = authOptions.callbacks!.jwt!
    const token = { id: 'user-1', plan: 'FREE' }

    const result = await cb({
      token,
      user: undefined,
      trigger: 'update',
      session: { plan: null },
      account: undefined as any,
      profile: undefined as any,
      isNewUser: undefined as any,
    })

    expect(result.plan).toBe('FREE') // unchanged
  })

  it('returns token unchanged on unknown trigger', async () => {
    const cb = authOptions.callbacks!.jwt!
    const token = { id: 'user-1', plan: 'FREE', onboardingDone: true }

    const result = await cb({
      token,
      user: undefined,
      trigger: undefined as any,
      session: undefined as any,
      account: undefined as any,
      profile: undefined as any,
      isNewUser: undefined as any,
    })

    expect(result).toBe(token)
  })
})

describe('authOptions signIn callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows sign in for active users', async () => {
    mockDbFindFirst.mockResolvedValue({ deletedAt: null })

    const cb = authOptions.callbacks!.signIn!
    const result = await cb({
      user: { id: 'user-1', email: 'active@test.com' },
      account: null,
      profile: undefined as any,
      email: undefined as any,
      credentials: undefined as any,
    })

    expect(result).toBe(true)
    expect(mockDbFindFirst).toHaveBeenCalledWith({
      where: { email: 'active@test.com' },
      select: { deletedAt: true },
    })
  })

  it('blocks sign in for soft-deleted users', async () => {
    mockDbFindFirst.mockResolvedValue({ deletedAt: new Date() })

    const cb = authOptions.callbacks!.signIn!
    const result = await cb({
      user: { id: 'user-2', email: 'deleted@test.com' },
      account: null,
      profile: undefined as any,
      email: undefined as any,
      credentials: undefined as any,
    })

    expect(result).toBe(false)
  })

  it('allows sign in when user has no email', async () => {
    const cb = authOptions.callbacks!.signIn!
    const result = await cb({
      user: { id: 'user-3' },
      account: null,
      profile: undefined as any,
      email: undefined as any,
      credentials: undefined as any,
    })

    expect(result).toBe(true)
    // Should not query DB when there's no email
    expect(mockDbFindFirst).not.toHaveBeenCalled()
  })

  it('allows sign in when DB lookup fails gracefully', async () => {
    const cb = authOptions.callbacks!.signIn!
    // If mockDbFindFirst returns null (user not found in DB but somehow
    // still trying to sign in), the callback should still allow it
    // because deletedAt check only blocks when user exists AND has deletedAt
    mockDbFindFirst.mockResolvedValue(null)

    const result = await cb({
      user: { id: 'user-4', email: 'orphan@test.com' },
      account: null,
      profile: undefined as any,
      email: undefined as any,
      credentials: undefined as any,
    })

    expect(result).toBe(true)
  })
})

describe('authOptions events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createUser', () => {
    it('updates lastLoginAt for new user', async () => {
      mockDbUserUpdate.mockResolvedValue({})

      await authOptions.events?.createUser!({ user: { id: 'new-user' } } as any)

      expect(mockDbUserUpdate).toHaveBeenCalledWith({
        where: { id: 'new-user' },
        data: { lastLoginAt: expect.any(Date) },
      })
    })

    it('handles update error gracefully (non-fatal)', async () => {
      mockDbUserUpdate.mockRejectedValue(new Error('DB error'))

      // Should not throw
      await expect(
        authOptions.events?.createUser!({ user: { id: 'new-user' } } as any),
      ).resolves.toBeUndefined()
    })

    it('skips update when user has no id', async () => {
      await authOptions.events?.createUser!({ user: {} } as any)

      expect(mockDbUserUpdate).not.toHaveBeenCalled()
    })
  })

  describe('signIn', () => {
    it('updates lastLoginAt on sign in', async () => {
      mockDbUserUpdate.mockResolvedValue({})

      await authOptions.events?.signIn!({ user: { id: 'existing-user' } } as any)

      expect(mockDbUserUpdate).toHaveBeenCalledWith({
        where: { id: 'existing-user' },
        data: { lastLoginAt: expect.any(Date) },
      })
    })

    it('handles update error gracefully (non-fatal)', async () => {
      mockDbUserUpdate.mockRejectedValue(new Error('DB error'))

      await expect(
        authOptions.events?.signIn!({ user: { id: 'existing-user' } } as any),
      ).resolves.toBeUndefined()
    })

    it('skips update when user has no id', async () => {
      await authOptions.events?.signIn!({ user: {} } as any)

      expect(mockDbUserUpdate).not.toHaveBeenCalled()
    })
  })
})

// ============================================================================
// auth.actions.ts — requestPasswordReset
// ============================================================================
describe('requestPasswordReset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns validation error for invalid email', async () => {
    const result = await requestPasswordReset({ email: 'not-an-email' })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe('Enter a valid email address.')
      expect(result.fieldErrors?.email).toBeDefined()
    }
  })

  it('returns success even when email is not found (prevents enumeration)', async () => {
    mockDbFindFirst.mockResolvedValue(null)

    const result = await requestPasswordReset({ email: 'unknown@test.com' })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.sent).toBe(true)
    }
    // Should not create any tokens
    expect(mockVerifyTokenCreate).not.toHaveBeenCalled()
  })

  it('creates reset token when user exists with password', async () => {
    mockDbFindFirst.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      hashedPassword: '$2a$10$hash',
    })
    mockVerifyTokenDeleteMany.mockResolvedValue({ count: 0 })
    mockVerifyTokenCreate.mockResolvedValue({
      identifier: 'test@test.com',
      token: 'mocked-reset-token-abc123',
      expires: new Date(Date.now() + 1000 * 60 * 15),
    })

    const result = await requestPasswordReset({ email: 'test@test.com' })

    expect(result.ok).toBe(true)
    // Should clean old tokens and create new one
    expect(mockVerifyTokenDeleteMany).toHaveBeenCalledWith({
      where: { identifier: 'test@test.com' },
    })
    expect(mockVerifyTokenCreate).toHaveBeenCalledWith({
      data: {
        identifier: 'test@test.com',
        token: 'mocked-reset-token-abc123',
        expires: expect.any(Date),
      },
    })
  })

  it('skips token creation if user has no password (OAuth-only)', async () => {
    mockDbFindFirst.mockResolvedValue({
      id: 'user-1',
      name: 'OAuth User',
      hashedPassword: null,
    })

    const result = await requestPasswordReset({ email: 'oauth@test.com' })

    // Must still return success (prevents enumeration)
    expect(result.ok).toBe(true)
    expect(mockVerifyTokenDeleteMany).not.toHaveBeenCalled()
    expect(mockVerifyTokenCreate).not.toHaveBeenCalled()
  })
})

// ============================================================================
// auth.actions.ts — resetPassword
// ============================================================================
describe('resetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns validation error for invalid input', async () => {
    const result = await resetPassword({
      token: '',
      password: 'short',
      confirmPassword: '',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBeDefined()
      expect(result.fieldErrors).toBeDefined()
    }
  })

  it('returns error when token is not found', async () => {
    mockVerifyTokenFindUnique.mockResolvedValue(null)

    const result = await resetPassword({
      token: 'invalid-token',
      password: 'NewPass1!',
      confirmPassword: 'NewPass1!',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('invalid or has expired')
    }
    // Should NOT try to delete a null token
    expect(mockVerifyTokenDelete).not.toHaveBeenCalled()
  })

  it('returns error when token is expired and cleans it up', async () => {
    mockVerifyTokenFindUnique.mockResolvedValue({
      identifier: 'test@test.com',
      expires: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    })
    mockVerifyTokenDelete.mockResolvedValue({})

    const result = await resetPassword({
      token: 'expired-token',
      password: 'NewPass1!',
      confirmPassword: 'NewPass1!',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('invalid or has expired')
    }
    // Should clean up expired token
    expect(mockVerifyTokenDelete).toHaveBeenCalledWith({
      where: { token: 'expired-token' },
    })
  })

  it('handles cleanup error gracefully when token is expired', async () => {
    mockVerifyTokenFindUnique.mockResolvedValue({
      identifier: 'test@test.com',
      expires: new Date(Date.now() - 1000 * 60 * 60),
    })
    // Delete throws
    mockVerifyTokenDelete.mockRejectedValue(new Error('DB error'))

    // Should not throw — the catch() handles it
    const result = await resetPassword({
      token: 'expired-token',
      password: 'NewPass1!',
      confirmPassword: 'NewPass1!',
    })

    expect(result.ok).toBe(false)
  })

  it('returns error when user for token identifier is not found', async () => {
    mockVerifyTokenFindUnique.mockResolvedValue({
      identifier: 'deleted@test.com',
      expires: new Date(Date.now() + 1000 * 60 * 60),
    })
    mockDbFindFirst.mockResolvedValue(null) // user soft-deleted or gone

    const result = await resetPassword({
      token: 'valid-token',
      password: 'NewPass1!',
      confirmPassword: 'NewPass1!',
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('No account found')
    }
  })

  it('successfully resets password and invalidates token', async () => {
    mockVerifyTokenFindUnique.mockResolvedValue({
      identifier: 'test@test.com',
      expires: new Date(Date.now() + 1000 * 60 * 60),
    })
    mockDbFindFirst.mockResolvedValue({ id: 'user-1' })
    mockTransaction.mockImplementation(async (promises: unknown[]) => {
      // For array-based transactions, resolve all promises
      if (Array.isArray(promises)) return Promise.all(promises)
      return null
    })
    mockDbUserUpdate.mockResolvedValue({ id: 'user-1' })
    mockVerifyTokenDelete.mockResolvedValue({})

    const result = await resetPassword({
      token: 'valid-token',
      password: 'NewSecurePass1!',
      confirmPassword: 'NewSecurePass1!',
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.done).toBe(true)
    }

    // Should hash the new password
    expect(mockHashPassword).toHaveBeenCalledWith('NewSecurePass1!')

    // Should update user password and delete token in a transaction
    expect(mockTransaction).toHaveBeenCalled()
    expect(mockDbUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { hashedPassword: '$2a$10$mockedhashedpassword' },
    })
    expect(mockVerifyTokenDelete).toHaveBeenCalledWith({
      where: { token: 'valid-token' },
    })
  })
})

// ============================================================================
// auth.actions.ts — redirectToLogin
// ============================================================================
describe('redirectToLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects to /login with registered=1 param', async () => {
    await expect(redirectToLogin()).rejects.toThrow('NEXT_REDIRECT')
    expect(redirect).toHaveBeenCalledWith('/login?registered=1')
  })
})
