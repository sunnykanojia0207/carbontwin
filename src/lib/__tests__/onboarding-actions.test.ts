/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================================================
// Tests for onboarding actions.
// ============================================================================

const { mockGetServerSession, mockUserUpdate } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockUserUpdate: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  getServerSession: mockGetServerSession,
  authOptions: {},
}))

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      update: mockUserUpdate,
    },
  },
}))

import { completeOnboarding } from '@/lib/onboarding.actions'

describe('completeOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('marks onboarding as done when authenticated', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockUserUpdate.mockResolvedValue({ id: 'user-1' })

    const result = await completeOnboarding()

    expect(result).toEqual({ ok: true })
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { onboardingDone: true },
    })
  })

  it('returns error when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const result = await completeOnboarding()

    expect(result).toEqual({ ok: false, error: 'Not authenticated' })
    expect(mockUserUpdate).not.toHaveBeenCalled()
  })

  it('returns error when session has no user id', async () => {
    mockGetServerSession.mockResolvedValue({ user: {} })

    const result = await completeOnboarding()

    expect(result).toEqual({ ok: false, error: 'Not authenticated' })
    expect(mockUserUpdate).not.toHaveBeenCalled()
  })

  it('handles session being undefined', async () => {
    mockGetServerSession.mockResolvedValue(undefined)

    const result = await completeOnboarding()

    expect(result).toEqual({ ok: false, error: 'Not authenticated' })
  })
})
