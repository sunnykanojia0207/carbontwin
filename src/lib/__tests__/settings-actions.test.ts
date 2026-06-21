/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================================================
// Tests for settings server actions.
//
// Mocks: @/lib/db (Prisma), @/lib/auth (getServerSession), next/cache
// ============================================================================

const { mockGetServerSession, mockUserUpdate, mockSettingsUpdate } = vi.hoisted(
  () => ({
    mockGetServerSession: vi.fn(),
    mockUserUpdate: vi.fn(),
    mockSettingsUpdate: vi.fn(),
  }),
)

vi.mock('@/lib/auth', () => ({
  getServerSession: mockGetServerSession,
  authOptions: {},
}))

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      update: mockUserUpdate,
    },
    settings: {
      update: mockSettingsUpdate,
    },
  },
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

import { revalidatePath } from 'next/cache'
import {
  updateProfile,
  updatePreferences,
  updateTheme,
  updateNotifications,
  updatePrivacy,
  deleteAccount,
} from '@/lib/settings-actions'

// ---------------------------------------------------------------------------
// updateProfile
// ---------------------------------------------------------------------------
describe('updateProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates profile with all fields when authenticated', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockUserUpdate.mockResolvedValue({ id: 'user-1' })

    const result = await updateProfile({
      name: 'John Doe',
      country: 'US',
      region: 'California',
      city: 'San Francisco',
      householdSize: 2,
      unitSystem: 'METRIC',
      currency: 'USD',
    })

    expect(result).toEqual({ ok: true })
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        name: 'John Doe',
        country: 'US',
        region: 'California',
        city: 'San Francisco',
        householdSize: 2,
        unitSystem: 'METRIC',
        currency: 'USD',
      },
    })
    expect(revalidatePath).toHaveBeenCalledWith('/settings')
  })

  it('converts empty optional strings to null', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockUserUpdate.mockResolvedValue({ id: 'user-1' })

    const result = await updateProfile({
      name: 'Jane',
      country: '',
      region: '',
      city: '',
      householdSize: 1,
      unitSystem: 'IMPERIAL',
    })

    expect(result).toEqual({ ok: true })
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        name: 'Jane',
        country: null,
        region: null,
        city: null,
        householdSize: 1,
        unitSystem: 'IMPERIAL',
        currency: 'USD',
      },
    })
  })

  it('returns error when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const result = await updateProfile({
      name: 'Ghost',
      country: '',
      region: '',
      city: '',
      householdSize: 1,
      unitSystem: 'METRIC',
    })

    expect(result).toEqual({ ok: false, error: 'Not authenticated' })
    expect(mockUserUpdate).not.toHaveBeenCalled()
  })

  it('returns error on invalid input (empty name)', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } })

    const result = await updateProfile({
      name: '',
      country: '',
      region: '',
      city: '',
      householdSize: 1,
      unitSystem: 'METRIC',
    })

    expect(result.ok).toBe(false)
    expect(result.error).toBeDefined()
    expect(mockUserUpdate).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// updatePreferences
// ---------------------------------------------------------------------------
describe('updatePreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates preferences when authenticated', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockSettingsUpdate.mockResolvedValue({ userId: 'user-1' })

    const result = await updatePreferences({
      plainLanguage: true,
      reducedMotion: false,
      highContrast: true,
    })

    expect(result).toEqual({ ok: true })
    expect(mockSettingsUpdate).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { plainLanguage: true, reducedMotion: false, highContrast: true },
    })
    expect(revalidatePath).toHaveBeenCalledWith('/settings')
  })

  it('returns error when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const result = await updatePreferences({
      plainLanguage: false,
      reducedMotion: false,
      highContrast: false,
    })

    expect(result).toEqual({ ok: false, error: 'Not authenticated' })
    expect(mockSettingsUpdate).not.toHaveBeenCalled()
  })

  it('rejects non-boolean values', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } })

    const result = await updatePreferences({
      plainLanguage: 'yes' as any,
      reducedMotion: 0 as any,
      highContrast: null as any,
    })

    expect(result.ok).toBe(false)
    expect(mockSettingsUpdate).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// updateTheme
// ---------------------------------------------------------------------------
describe('updateTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates theme to LIGHT', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockSettingsUpdate.mockResolvedValue({ userId: 'user-1' })

    const result = await updateTheme('LIGHT')

    expect(result).toEqual({ ok: true })
    expect(mockSettingsUpdate).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { theme: 'LIGHT' },
    })
  })

  it('updates theme to DARK', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockSettingsUpdate.mockResolvedValue({ userId: 'user-1' })

    const result = await updateTheme('DARK')

    expect(result).toEqual({ ok: true })
    expect(mockSettingsUpdate).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { theme: 'DARK' },
    })
  })

  it('updates theme to SYSTEM', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockSettingsUpdate.mockResolvedValue({ userId: 'user-1' })

    const result = await updateTheme('SYSTEM')

    expect(result).toEqual({ ok: true })
    expect(mockSettingsUpdate).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { theme: 'SYSTEM' },
    })
  })

  it('returns error when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const result = await updateTheme('DARK')

    expect(result).toEqual({ ok: false, error: 'Not authenticated' })
    expect(mockSettingsUpdate).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// updateNotifications
// ---------------------------------------------------------------------------
describe('updateNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates notifications when authenticated', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockSettingsUpdate.mockResolvedValue({ userId: 'user-1' })

    const result = await updateNotifications({
      emailDigest: 'WEEKLY',
      pushEnabled: true,
      insightNotifications: false,
      goalReminders: true,
    })

    expect(result).toEqual({ ok: true })
    expect(mockSettingsUpdate).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: {
        emailDigest: 'WEEKLY',
        pushEnabled: true,
        insightNotifications: false,
        goalReminders: true,
      },
    })
    expect(revalidatePath).toHaveBeenCalledWith('/settings')
  })

  it('accepts all email digest options', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockSettingsUpdate.mockResolvedValue({ userId: 'user-1' })

    for (const digest of ['OFF', 'WEEKLY', 'MONTHLY'] as const) {
      const result = await updateNotifications({
        emailDigest: digest,
        pushEnabled: false,
        insightNotifications: false,
        goalReminders: false,
      })
      expect(result.ok).toBe(true)
    }
  })

  it('rejects invalid email digest', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } })

    const result = await updateNotifications({
      emailDigest: 'DAILY' as any,
      pushEnabled: true,
      insightNotifications: true,
      goalReminders: true,
    })

    expect(result.ok).toBe(false)
    expect(mockSettingsUpdate).not.toHaveBeenCalled()
  })

  it('returns error when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const result = await updateNotifications({
      emailDigest: 'WEEKLY',
      pushEnabled: true,
      insightNotifications: true,
      goalReminders: true,
    })

    expect(result).toEqual({ ok: false, error: 'Not authenticated' })
  })
})

// ---------------------------------------------------------------------------
// updatePrivacy
// ---------------------------------------------------------------------------
describe('updatePrivacy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates privacy settings when authenticated', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockSettingsUpdate.mockResolvedValue({ userId: 'user-1' })

    const result = await updatePrivacy({
      aiEnabled: true,
      aiDailyBudget: 50,
      shareTwinPublic: false,
    })

    expect(result).toEqual({ ok: true })
    expect(mockSettingsUpdate).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { aiEnabled: true, aiDailyBudget: 50, shareTwinPublic: false },
    })
    expect(revalidatePath).toHaveBeenCalledWith('/settings')
  })

  it('rejects aiDailyBudget below min', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } })

    const result = await updatePrivacy({
      aiEnabled: true,
      aiDailyBudget: -1,
      shareTwinPublic: false,
    })

    expect(result.ok).toBe(false)
    expect(mockSettingsUpdate).not.toHaveBeenCalled()
  })

  it('rejects aiDailyBudget above max', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } })

    const result = await updatePrivacy({
      aiEnabled: true,
      aiDailyBudget: 101,
      shareTwinPublic: false,
    })

    expect(result.ok).toBe(false)
    expect(mockSettingsUpdate).not.toHaveBeenCalled()
  })

  it('handles boundary value aiDailyBudget=0', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockSettingsUpdate.mockResolvedValue({ userId: 'user-1' })

    const result = await updatePrivacy({
      aiEnabled: true,
      aiDailyBudget: 0,
      shareTwinPublic: false,
    })

    expect(result.ok).toBe(true)
  })

  it('handles boundary value aiDailyBudget=100', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockSettingsUpdate.mockResolvedValue({ userId: 'user-1' })

    const result = await updatePrivacy({
      aiEnabled: true,
      aiDailyBudget: 100,
      shareTwinPublic: true,
    })

    expect(result.ok).toBe(true)
  })

  it('returns error when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const result = await updatePrivacy({
      aiEnabled: true,
      aiDailyBudget: 50,
      shareTwinPublic: false,
    })

    expect(result).toEqual({ ok: false, error: 'Not authenticated' })
  })
})

// ---------------------------------------------------------------------------
// deleteAccount
// ---------------------------------------------------------------------------
describe('deleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('soft-deletes the user when authenticated', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } })
    mockUserUpdate.mockResolvedValue({ id: 'user-1' })

    const result = await deleteAccount()

    expect(result).toEqual({ ok: true })
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { deletedAt: expect.any(Date) },
    })
    expect(revalidatePath).toHaveBeenCalledWith('/settings')
  })

  it('returns error when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const result = await deleteAccount()

    expect(result).toEqual({ ok: false, error: 'Not authenticated' })
    expect(mockUserUpdate).not.toHaveBeenCalled()
  })
})
