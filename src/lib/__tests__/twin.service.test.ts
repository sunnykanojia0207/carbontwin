/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================================================
// Tests for climate twin data service (src/lib/services/twin.service.ts)
//
// The service loads the user profile, appliances, and recent detections then
// computes 5 Twin dimensions (home, appliances, transport, lifestyle, diet),
// forecasts, radar data, scenarios, risk areas, and opportunities.
//
// Mocked: db (Prisma), next/cache (unstable_cache), and appliance-calc.
// ============================================================================

const {
  mockUserFindFirst,
  mockApplianceFindMany,
  mockDetectionFindMany,
} = vi.hoisted(() => ({
  mockUserFindFirst: vi.fn(),
  mockApplianceFindMany: vi.fn(),
  mockDetectionFindMany: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    user: { findFirst: mockUserFindFirst },
    appliance: { findMany: mockApplianceFindMany },
    detection: { findMany: mockDetectionFindMany },
  },
  active: () => ({ deletedAt: null }),
}))

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) =>
    (...args: unknown[]) => fn(...args),
}))

// Mock appliance-calc so appliance emissions are deterministic and easily controlled
vi.mock('@/lib/emissions/appliance-calc', () => ({
  estimateApplianceCarbon: vi.fn(() => ({
    annualKwh: 0,
    annualCo2eKg: 0,
    monthlyCo2eKg: 0,
    dailyCo2eKg: 0,
  })),
}))

import { _getTwinData } from '@/lib/services/twin.service'
import type { TwinData } from '@/lib/services/twin.service'

describe('_getTwinData', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Set to July 1 so the 30-day window includes June dates
    vi.setSystemTime(new Date('2026-07-01T12:00:00Z'))
    // Mock estimateApplianceCarbon to return deterministic values
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  // ─── Full data ────────────────────────────────────────────────────────────

  it('returns complete TwinData with user profile, dimensions, forecast, radar, scenarios, risks, opportunities', async () => {
    mockUserFindFirst.mockResolvedValue({
      id: 'user-1',
      name: 'Alice',
      country: 'US',
      region: 'California',
      householdSize: 2,
      baselineAnnualKg: 8000,
    })

    mockApplianceFindMany.mockResolvedValue([
      { watts: 1500, hoursPerDay: 8, daysPerWeek: 7, type: 'HVAC', name: 'Central AC' },
      { watts: 200, hoursPerDay: 24, daysPerWeek: 7, type: 'REFRIGERATION', name: 'Fridge' },
    ])

    // Detections across different categories within the 30-day window
    mockDetectionFindMany.mockResolvedValue([
      { co2eKg: 3.0, categorySlug: 'transport.car', scan: { createdAt: new Date('2026-06-15T08:00:00Z') } },
      { co2eKg: 2.0, categorySlug: 'transport.flight', scan: { createdAt: new Date('2026-06-20T08:00:00Z') } },
      { co2eKg: 5.0, categorySlug: 'food.meat', scan: { createdAt: new Date('2026-06-18T12:00:00Z') } },
      { co2eKg: 1.0, categorySlug: 'shopping', scan: { createdAt: new Date('2026-06-22T09:00:00Z') } },
      { co2eKg: 0.5, categorySlug: 'digital', scan: { createdAt: new Date('2026-06-25T10:00:00Z') } },
      { co2eKg: 4.0, categorySlug: 'home.electricity', scan: { createdAt: new Date('2026-06-10T14:00:00Z') } },
    ])

    const result = await _getTwinData('user-1')

    // ── Structure ──
    expect(result.isEmpty).toBe(false)
    expect(result.profile.name).toBe('Alice')
    expect(result.profile.country).toBe('US')
    expect(result.profile.region).toBe('California')
    expect(result.profile.householdSize).toBe(2)
    expect(result.profile.baselineAnnualKg).toBe(8000)

    // ── Current ──
    expect(result.current.totalAnnualKg).toBeGreaterThan(0)
    expect(result.current.monthlyKg).toBeGreaterThan(0)
    expect(typeof result.current.onTrack).toBe('boolean')
    expect(result.current.parisTargetKg).toBe(1800)

    // ── Dimensions (5 expected) ──
    expect(result.dimensions).toHaveLength(5)
    const keys = result.dimensions.map((d) => d.key)
    expect(keys).toContain('home')
    expect(keys).toContain('appliances')
    expect(keys).toContain('transport')
    expect(keys).toContain('lifestyle')
    expect(keys).toContain('diet')

    // ── Forecast ──
    expect(result.forecast).toHaveLength(3)
    expect(result.forecast[0].year).toBe(1)
    expect(result.forecast[1].year).toBe(3)
    expect(result.forecast[2].year).toBe(5)
    for (const point of result.forecast) {
      expect(point.current).toBeGreaterThan(0)
      expect(point.optimized).toBeGreaterThan(0)
      expect(point.aggressive).toBeGreaterThan(0)
      // Forecast should decrease: current > optimized > aggressive
      expect(point.current).toBeGreaterThan(point.optimized)
      expect(point.optimized).toBeGreaterThan(point.aggressive)
    }

    // ── Radar ──
    expect(result.radar).toHaveLength(5)
    for (const axis of result.radar) {
      expect(axis.value).toBeGreaterThanOrEqual(0)
      expect(axis.value).toBeLessThanOrEqual(100)
      expect(axis.fullMark).toBe(100)
    }

    // ── Scenarios ──
    expect(result.scenarios).toHaveLength(4)
    expect(result.scenarios[0].label).toBe('Current')
    expect(result.scenarios[1].label).toBe('Optimized')
    expect(result.scenarios[2].label).toBe('Aggressive')
    expect(result.scenarios[3].label).toBe('Paris 1.5°C')

    // ── Risk areas ──
    expect(result.riskAreas.length).toBeGreaterThan(0)
    expect(result.riskAreas.length).toBeLessThanOrEqual(3)
    for (const risk of result.riskAreas) {
      expect(['HIGH', 'MEDIUM', 'LOW']).toContain(risk.severity)
      expect(risk.dimension).toBeTruthy()
      expect(risk.annualKg).toBeGreaterThan(0)
    }

    // ── Opportunities ──
    expect(result.opportunities.length).toBeGreaterThan(0)
    expect(result.opportunities.length).toBeLessThanOrEqual(4)
    for (const opp of result.opportunities) {
      expect(['EASY', 'MEDIUM', 'HARD']).toContain(opp.difficulty)
      expect(opp.potentialKg).toBeGreaterThan(0)
    }
  })

  // ─── No user ──────────────────────────────────────────────────────────────

  it('returns isEmpty=true when user is not found', async () => {
    mockUserFindFirst.mockResolvedValue(null)
    mockApplianceFindMany.mockResolvedValue([])
    mockDetectionFindMany.mockResolvedValue([])

    const result = await _getTwinData('nonexistent')

    expect(result.isEmpty).toBe(true)
    expect(result.profile.name).toBe('You')
    expect(result.profile.country).toBeNull()
    expect(result.profile.baselineAnnualKg).toBeNull()
    expect(result.dimensions).toHaveLength(0)
    expect(result.forecast).toHaveLength(0)
    expect(result.radar).toHaveLength(0)
    expect(result.scenarios).toHaveLength(0)
    expect(result.riskAreas).toHaveLength(0)
    expect(result.opportunities).toHaveLength(0)
    expect(result.current.totalAnnualKg).toBe(0)
    expect(result.tier.name).toBe('—')
  })

  // ─── No appliances ────────────────────────────────────────────────────────

  it('handles missing appliances gracefully', async () => {
    mockUserFindFirst.mockResolvedValue({
      id: 'user-2',
      name: 'Bob',
      country: 'UK',
      region: 'London',
      householdSize: 1,
      baselineAnnualKg: 6000,
    })

    mockApplianceFindMany.mockResolvedValue([]) // no appliances

    mockDetectionFindMany.mockResolvedValue([
      { co2eKg: 2.0, categorySlug: 'transport.car', scan: { createdAt: new Date('2026-06-15T08:00:00Z') } },
      { co2eKg: 3.0, categorySlug: 'food.plant', scan: { createdAt: new Date('2026-06-18T12:00:00Z') } },
    ])

    const result = await _getTwinData('user-2')

    expect(result.isEmpty).toBe(false)
    const appliancesDim = result.dimensions.find((d) => d.key === 'appliances')
    expect(appliancesDim).toBeDefined()
    expect(appliancesDim!.annualKg).toBe(0)
    expect(appliancesDim!.detail).toBe('0 appliances tracked')
  })

  // ─── No detections in the 30-day window ───────────────────────────────────

  it('uses baseline fallback when no recent detections exist', async () => {
    mockUserFindFirst.mockResolvedValue({
      id: 'user-3',
      name: 'Charlie',
      country: 'US',
      region: null,
      householdSize: 1,
      baselineAnnualKg: null, // no baseline either
    })

    mockApplianceFindMany.mockResolvedValue([])

    // Detection outside the 30-day window
    mockDetectionFindMany.mockResolvedValue([
      { co2eKg: 10, categorySlug: 'transport.car', scan: { createdAt: new Date('2026-05-01T08:00:00Z') } },
    ])

    const result = await _getTwinData('user-3')

    // No recent detections → falls back to country average fractions
    // homeKg = 7400 * 0.25 = 1850
    // appliancesKg = 0
    // transportKg = 7400 * 0.28 = 2072
    // lifestyleKg = 7400 * 0.12 = 888
    // dietKg = 7400 * 0.18 = 1332
    // total = 1850 + 0 + 2072 + 888 + 1332 = 6142
    expect(result.isEmpty).toBe(false)
    expect(result.current.totalAnnualKg).toBeGreaterThan(0)

    const homeDim = result.dimensions.find((d) => d.key === 'home')
    expect(homeDim).toBeDefined()
    expect(homeDim!.annualKg).toBeGreaterThan(0)

    const lifestyleDim = result.dimensions.find((d) => d.key === 'lifestyle')
    expect(lifestyleDim).toBeDefined()
    expect(lifestyleDim!.annualKg).toBeGreaterThan(0)
  })

  // ─── Tier computation (tested via controlled detection volumes) ─────────

  it('returns Verdant tier for very low emissions', async () => {
    mockUserFindFirst.mockResolvedValue({
      id: 'user-tier', name: 'Low', country: 'US', region: null,
      householdSize: 1, baselineAnnualKg: null,
    })
    mockApplianceFindMany.mockResolvedValue([])
    // Small detections → annualized total ~1217 → Verdant (≤2000)
    mockDetectionFindMany.mockResolvedValue([
      { co2eKg: 20, categorySlug: 'home.electricity', scan: { createdAt: new Date('2026-06-28T08:00:00Z') } },
      { co2eKg: 30, categorySlug: 'transport.car', scan: { createdAt: new Date('2026-06-28T08:00:00Z') } },
      { co2eKg: 20, categorySlug: 'shopping', scan: { createdAt: new Date('2026-06-28T08:00:00Z') } },
      { co2eKg: 30, categorySlug: 'food.plant', scan: { createdAt: new Date('2026-06-28T08:00:00Z') } },
    ])
    const result = await _getTwinData('user-tier')
    expect(result.tier.name).toBe('Verdant')
    expect(result.tier.color).toBe('#10b981')
    expect(result.current.totalAnnualKg).toBeLessThanOrEqual(2000)
  })

  it('returns Aurora tier for moderate emissions', async () => {
    mockUserFindFirst.mockResolvedValue({
      id: 'user-tier', name: 'Mod', country: 'US', region: null,
      householdSize: 1, baselineAnnualKg: null,
    })
    mockApplianceFindMany.mockResolvedValue([])
    // Medium detections → annualized total ~2677 → Aurora (2001-4000)
    mockDetectionFindMany.mockResolvedValue([
      { co2eKg: 50, categorySlug: 'home.electricity', scan: { createdAt: new Date('2026-06-28T08:00:00Z') } },
      { co2eKg: 60, categorySlug: 'transport.car', scan: { createdAt: new Date('2026-06-28T08:00:00Z') } },
      { co2eKg: 50, categorySlug: 'shopping', scan: { createdAt: new Date('2026-06-28T08:00:00Z') } },
      { co2eKg: 60, categorySlug: 'food.meat', scan: { createdAt: new Date('2026-06-28T08:00:00Z') } },
    ])
    const result = await _getTwinData('user-tier')
    expect(result.tier.name).toBe('Aurora')
    expect(result.current.totalAnnualKg).toBeGreaterThan(2000)
    expect(result.current.totalAnnualKg).toBeLessThanOrEqual(4000)
  })

  it('returns Ember tier for average emissions (coverage fallback path)', async () => {
    mockUserFindFirst.mockResolvedValue({
      id: 'user-tier', name: 'Avg', country: 'US', region: null,
      householdSize: 1, baselineAnnualKg: null,
    })
    mockApplianceFindMany.mockResolvedValue([])
    // No recent detections → fallback to country avg ~6142 → Ember (4001-7000)
    mockDetectionFindMany.mockResolvedValue([])
    const result = await _getTwinData('user-tier')
    expect(result.tier.name).toBe('Ember')
    expect(result.current.totalAnnualKg).toBeGreaterThan(4000)
    expect(result.current.totalAnnualKg).toBeLessThanOrEqual(7000)
  })

  it('returns Drift tier for very high emissions', async () => {
    mockUserFindFirst.mockResolvedValue({
      id: 'user-tier', name: 'High', country: 'US', region: null,
      householdSize: 1, baselineAnnualKg: null,
    })
    mockApplianceFindMany.mockResolvedValue([])
    // Large detections → annualized total ~10953 → Drift (>7000)
    mockDetectionFindMany.mockResolvedValue([
      { co2eKg: 200, categorySlug: 'home.electricity', scan: { createdAt: new Date('2026-06-28T08:00:00Z') } },
      { co2eKg: 250, categorySlug: 'transport.flight', scan: { createdAt: new Date('2026-06-28T08:00:00Z') } },
      { co2eKg: 200, categorySlug: 'shopping', scan: { createdAt: new Date('2026-06-28T08:00:00Z') } },
      { co2eKg: 250, categorySlug: 'food.meat', scan: { createdAt: new Date('2026-06-28T08:00:00Z') } },
    ])
    const result = await _getTwinData('user-tier')
    expect(result.tier.name).toBe('Drift')
    expect(result.current.totalAnnualKg).toBeGreaterThan(7000)
  })

  // ─── Profile name fallback ──────────────────────────────────────────────

  it('falls back to "You" when user has no name', async () => {
    mockUserFindFirst.mockResolvedValue({
      id: 'user-noname',
      name: null,
      country: 'US',
      region: null,
      householdSize: 1,
      baselineAnnualKg: null,
    })
    mockApplianceFindMany.mockResolvedValue([])
    mockDetectionFindMany.mockResolvedValue([
      { co2eKg: 2.0, categorySlug: 'food.plant', scan: { createdAt: new Date('2026-06-28T08:00:00Z') } },
    ])

    const result = await _getTwinData('user-noname')
    expect(result.profile.name).toBe('You')
  })

  // ─── Appliance detail pluralization ─────────────────────────────────────

  it('uses singular "appliance" in detail when exactly 1 appliance', async () => {
    mockUserFindFirst.mockResolvedValue({
      id: 'user-single-app', name: 'Single App', country: 'US', region: null,
      householdSize: 1, baselineAnnualKg: null,
    })
    mockApplianceFindMany.mockResolvedValue([
      { watts: 100, hoursPerDay: 5, daysPerWeek: 7, type: 'LIGHTING', name: 'Lamp' },
    ])
    mockDetectionFindMany.mockResolvedValue([])

    const result = await _getTwinData('user-single-app')
    const appDim = result.dimensions.find((d) => d.key === 'appliances')
    expect(appDim?.detail).toBe('1 appliance tracked')
  })

  // ─── vsBaselinePct computation ────────────────────────────────────────────

  it('computes vsBaselinePct correctly', async () => {
    mockUserFindFirst.mockResolvedValue({
      id: 'user-base',
      name: 'Baseline',
      country: 'US',
      region: null,
      householdSize: 1,
      baselineAnnualKg: 5000,
    })

    mockApplianceFindMany.mockResolvedValue([])

    // Some detections to produce a totalAnnualKg
    mockDetectionFindMany.mockResolvedValue([
      { co2eKg: 2.0, categorySlug: 'transport.car', scan: { createdAt: new Date('2026-06-28T08:00:00Z') } },
      { co2eKg: 1.0, categorySlug: 'food.plant', scan: { createdAt: new Date('2026-06-28T10:00:00Z') } },
    ])

    const result = await _getTwinData('user-base')

    // vsBaselinePct = round((total - 5000) / 5000 * 100 * 10) / 10
    expect(result.current.vsBaselinePct).not.toBeNaN()
    expect(typeof result.current.vsBaselinePct).toBe('number')
  })

  // ─── Risk areas sorted and filtered ───────────────────────────────────────

  it('ranks risk areas by emission share and limits to 3', async () => {
    mockUserFindFirst.mockResolvedValue({
      id: 'user-risk',
      name: 'Risk',
      country: 'US',
      region: null,
      householdSize: 1,
      baselineAnnualKg: 10000,
    })

    mockApplianceFindMany.mockResolvedValue([
      { watts: 5000, hoursPerDay: 12, daysPerWeek: 7, type: 'HVAC', name: 'Big AC' },
    ])

    // Detections across all categories to ensure 5 dimensions are populated
    mockDetectionFindMany.mockResolvedValue([
      { co2eKg: 10, categorySlug: 'transport.car', scan: { createdAt: new Date('2026-06-28T08:00:00Z') } },
      { co2eKg: 8, categorySlug: 'food.meat', scan: { createdAt: new Date('2026-06-28T10:00:00Z') } },
      { co2eKg: 6, categorySlug: 'shopping', scan: { createdAt: new Date('2026-06-28T12:00:00Z') } },
      { co2eKg: 4, categorySlug: 'digital', scan: { createdAt: new Date('2026-06-28T14:00:00Z') } },
      { co2eKg: 12, categorySlug: 'home.electricity', scan: { createdAt: new Date('2026-06-28T16:00:00Z') } },
    ])

    const result = await _getTwinData('user-risk')

    expect(result.riskAreas.length).toBeLessThanOrEqual(3)
    // Sorted by annualKg descending
    for (let i = 1; i < result.riskAreas.length; i++) {
      expect(result.riskAreas[i - 1].annualKg).toBeGreaterThanOrEqual(result.riskAreas[i].annualKg)
    }
  })

  // ─── Verifies full shape ──────────────────────────────────────────────────

  it('returns all TwinData fields', async () => {
    mockUserFindFirst.mockResolvedValue({
      id: 'user-shape',
      name: 'Shape Test',
      country: 'DE',
      region: 'Berlin',
      householdSize: 3,
      baselineAnnualKg: 7000,
    })

    mockApplianceFindMany.mockResolvedValue([])
    mockDetectionFindMany.mockResolvedValue([
      { co2eKg: 2.0, categorySlug: 'food.plant', scan: { createdAt: new Date('2026-06-28T08:00:00Z') } },
    ])

    const result = await _getTwinData('user-shape')

    expect(result).toHaveProperty('isEmpty')
    expect(result).toHaveProperty('profile')
    expect(result).toHaveProperty('tier')
    expect(result).toHaveProperty('current')
    expect(result).toHaveProperty('dimensions')
    expect(result).toHaveProperty('forecast')
    expect(result).toHaveProperty('radar')
    expect(result).toHaveProperty('scenarios')
    expect(result).toHaveProperty('riskAreas')
    expect(result).toHaveProperty('opportunities')

    const profileKeys: (keyof TwinData['profile'])[] = [
      'name', 'country', 'region', 'householdSize', 'baselineAnnualKg',
    ]
    for (const key of profileKeys) {
      expect(result.profile).toHaveProperty(key)
    }

    const currentKeys: (keyof TwinData['current'])[] = [
      'totalAnnualKg', 'monthlyKg', 'vsBaselinePct', 'vsCountryAvgPct',
      'parisTargetKg', 'onTrack',
    ]
    for (const key of currentKeys) {
      expect(result.current).toHaveProperty(key)
    }
  })
})
