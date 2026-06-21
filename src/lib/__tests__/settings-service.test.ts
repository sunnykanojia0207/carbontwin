/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================================================
// Tests for settings data service.
//
// We mock Prisma at the module level and test the getSettingsData function
// from src/lib/services/settings.service.ts, verifying:
//   • Correct data shape mapping
//   • Settings row creation when missing
//   • null return when user not found
//
// NOTE: vi.mock factory callbacks are hoisted, so mock functions must be
// created inside vi.hoisted() to be available at factory-evaluation time.
// ============================================================================

const {
  mockFindFirst,
  mockFindMany,
  mockSettingsFindUnique,
  mockSettingsCreate,
} = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockFindMany: vi.fn(),
  mockSettingsFindUnique: vi.fn(),
  mockSettingsCreate: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findFirst: mockFindFirst,
    },
    account: {
      findMany: mockFindMany,
    },
    aIConversation: {
      count: vi.fn().mockResolvedValue(3),
    },
    aIMessage: {
      count: vi.fn().mockResolvedValue(5),
    },
    settings: {
      findUnique: mockSettingsFindUnique,
      create: mockSettingsCreate,
    },
  },
  active: () => ({ deletedAt: null }),
}))

vi.mock('@/lib/ai', () => ({
  LAST_QUOTA_ERROR: {},
}))

import { getSettingsData } from '@/lib/services/settings.service'

describe('getSettingsData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps DB user and settings to the correct shape', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      image: null,
      plan: 'FREE',
      country: 'US',
      region: 'California',
      city: 'San Francisco',
      householdSize: 2,
      unitSystem: 'METRIC',
      currency: 'USD',
      baselineAnnualKg: 5000,
      createdAt: new Date('2026-01-01'),
      lastLoginAt: new Date('2026-06-01'),
      hashedPassword: 'hashed-pw',
    })

    mockFindMany.mockResolvedValue([
      { id: 'acc-1', provider: 'google' },
    ])

    mockSettingsFindUnique.mockResolvedValue({
      theme: 'DARK',
      reducedMotion: false,
      plainLanguage: false,
      highContrast: false,
      emailDigest: 'WEEKLY',
      pushEnabled: true,
      insightNotifications: true,
      goalReminders: false,
      aiEnabled: true,
      aiDailyBudget: 20,
      shareTwinPublic: false,
      exportFormat: 'PDF',
    })

    const result = await getSettingsData('user-1')

    expect(result).not.toBeNull()
    expect(result!.user.id).toBe('user-1')
    expect(result!.user.name).toBe('Test User')
    expect(result!.user.email).toBe('test@example.com')
    expect(result!.user.plan).toBe('FREE')
    expect(result!.user.country).toBe('US')
    expect(result!.user.hasPassword).toBe(true)

    expect(result!.settings.theme).toBe('DARK')
    expect(result!.settings.emailDigest).toBe('WEEKLY')
    expect(result!.settings.aiDailyBudget).toBe(20)

    expect(result!.accounts).toHaveLength(1)
    expect(result!.accounts[0].provider).toBe('google')

    expect(result!.aiUsage.totalConversations).toBe(3)
    expect(result!.aiUsage.todayMessageCount).toBe(5)
    expect(result!.aiUsage.dailyBudget).toBe(20)
  })

  it('creates default settings when none exist', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'user-2',
      name: 'No Settings',
      email: 'nosettings@example.com',
      image: null,
      plan: 'FREE',
      country: null,
      region: null,
      city: null,
      householdSize: 1,
      unitSystem: 'METRIC',
      currency: 'USD',
      baselineAnnualKg: null,
      createdAt: new Date(),
      lastLoginAt: null,
      hashedPassword: null,
    })

    mockFindMany.mockResolvedValue([])

    // Settings not found → will be created
    mockSettingsFindUnique.mockResolvedValue(null)

    const newSettings = {
      theme: 'SYSTEM',
      reducedMotion: false,
      plainLanguage: false,
      highContrast: false,
      emailDigest: 'OFF',
      pushEnabled: true,
      insightNotifications: true,
      goalReminders: true,
      aiEnabled: true,
      aiDailyBudget: 10,
      shareTwinPublic: false,
      exportFormat: 'CSV',
    }
    mockSettingsCreate.mockResolvedValue(newSettings)

    const result = await getSettingsData('user-2')

    expect(result).not.toBeNull()
    expect(mockSettingsCreate).toHaveBeenCalledWith({ data: { userId: 'user-2' } })
    expect(result!.user.hasPassword).toBe(false)
    expect(result!.settings.theme).toBe('SYSTEM')
    expect(result!.aiUsage.totalConversations).toBe(3)
    expect(result!.aiUsage.todayMessageCount).toBe(5)
  })

  it('returns null when user is not found', async () => {
    mockFindFirst.mockResolvedValue(null)

    const result = await getSettingsData('nonexistent-user')
    expect(result).toBeNull()
  })

  it('handles missing hashedPassword gracefully', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'user-3',
      name: 'OAuth User',
      email: 'oauth@example.com',
      image: 'https://example.com/avatar.png',
      plan: 'PRO',
      country: null,
      region: null,
      city: null,
      householdSize: 1,
      unitSystem: 'METRIC',
      currency: 'EUR',
      baselineAnnualKg: 3000,
      createdAt: new Date(),
      lastLoginAt: null,
      hashedPassword: null,
    })

    mockFindMany.mockResolvedValue([])

    mockSettingsFindUnique.mockResolvedValue({
      theme: 'LIGHT',
      reducedMotion: false,
      plainLanguage: false,
      highContrast: false,
      emailDigest: 'MONTHLY',
      pushEnabled: false,
      insightNotifications: false,
      goalReminders: false,
      aiEnabled: true,
      aiDailyBudget: 10,
      shareTwinPublic: false,
      exportFormat: 'PDF',
    })

    const result = await getSettingsData('user-3')
    expect(result).not.toBeNull()
    expect(result!.user.hasPassword).toBe(false)
    expect(result!.user.image).toBe('https://example.com/avatar.png')
    expect(result!.user.plan).toBe('PRO')
    expect(result!.user.currency).toBe('EUR')
  })
})
