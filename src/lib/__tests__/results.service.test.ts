/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================================================
// Tests for results data service (src/lib/services/results.service.ts)
//
// The service loads the latest (or specific) PHOTO scan with detections,
// computes per-appliance carbon + cost + suggestions, aggregate KPIs,
// impact breakdown, top emitters, savings opportunities, and trend.
// ============================================================================

const { mockScanFindFirst } = vi.hoisted(() => ({
  mockScanFindFirst: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    scan: { findFirst: mockScanFindFirst },
  },
}))

// Do NOT mock appliance-calc or appliance-suggestions — we want to test with
// real deterministic math. The results service doesn't use unstable_cache.

import { getResultsData } from '@/lib/services/results.service'
import type { ResultsData } from '@/lib/services/results.service'

/** Build a scan-like object as returned by Prisma for the results query. */
function buildScan(overrides: {
  id?: string
  status?: string
  createdAt?: Date
  aiModel?: string | null
  promptVersion?: string | null
  inputMeta?: Record<string, unknown>
  detections?: Array<Record<string, unknown>>
} = {}) {
  return {
    id: 'scan-1',
    status: 'COMPLETED',
    createdAt: new Date('2026-06-15T10:00:00Z'),
    aiModel: 'gemini-2.0-flash',
    promptVersion: 'v2',
    inputMeta: { roomType: 'Living Room', summary: '5 appliances detected' },
    detections: [],
    ...overrides,
  }
}

/** Build a detection-like object. */
function buildDetection(overrides: {
  id?: string
  label?: string
  categorySlug?: string
  amount?: number
  unit?: string
  co2eKg?: number | null
  confidence?: number
  sourceSnippet?: string | null
  aiMetadata?: Record<string, unknown> | null
} = {}) {
  return {
    id: `det-${Math.random().toString(36).slice(2, 6)}`,
    label: 'Window AC Unit',
    categorySlug: 'home.ac',
    amount: 1500,
    unit: 'W',
    co2eKg: 250,
    confidence: 0.92,
    sourceSnippet: 'Window AC unit in living room',
    aiMetadata: { type: 'HVAC', estimatedWatts: 1500, estimatedHoursPerDay: 8 },
    ...overrides,
  }
}

describe('getResultsData', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  // ─── Full data with latest scan (no scanId) ──────────────────────────────

  it('returns complete ResultsData with appliances, KPIs, breakdown, top emitters, savings, trend', async () => {
    mockScanFindFirst.mockResolvedValue(
      buildScan({
        detections: [
          buildDetection({
            id: 'det-1',
            label: 'Central AC',
            categorySlug: 'home.ac',
            amount: 3500,
            aiMetadata: { type: 'HVAC', estimatedWatts: 3500, estimatedHoursPerDay: 10 },
          }),
          buildDetection({
            id: 'det-2',
            label: 'Fridge',
            categorySlug: 'home.fridge',
            amount: 200,
            aiMetadata: { type: 'REFRIGERATION', estimatedWatts: 200, estimatedHoursPerDay: 24 },
          }),
          buildDetection({
            id: 'det-3',
            label: 'LED Bulb',
            categorySlug: 'home.light',
            amount: 10,
            aiMetadata: { type: 'LIGHTING', estimatedWatts: 10, estimatedHoursPerDay: 5 },
          }),
        ],
      }),
    )

    const result = await getResultsData('user-1')

    // ── Scan info ──
    expect(result.isEmpty).toBe(false) // no wait, isEmpty should be false here since we have detections
    expect(result.scan).not.toBeNull()
    expect(result.scan!.id).toBe('scan-1')
    expect(result.scan!.roomType).toBe('Living Room')
    expect(result.scan!.summary).toBe('5 appliances detected')
    expect(result.scan!.aiModel).toBe('gemini-2.0-flash')

    // ── Appliances ──
    expect(result.appliances).toHaveLength(3)
    expect(result.appliances[0].name).toBe('Central AC')
    expect(result.appliances[0].type).toBe('HVAC')
    expect(result.appliances[0].watts).toBe(3500)
    expect(result.appliances[0].hoursPerDay).toBe(10)
    expect(result.appliances[0].daysPerWeek).toBe(7)
    expect(result.appliances[0].confidence).toBe(0.92)
    expect(result.appliances[0].carbon.annualCo2eKg).toBeGreaterThan(0)
    expect(result.appliances[0].cost.annualUsd).toBeGreaterThan(0)
    expect(result.appliances[0].suggestions.length).toBeGreaterThan(0)
    expect(result.appliances[0].suggestions[0]).toHaveProperty('suggestion')
    expect(result.appliances[0].suggestions[0]).toHaveProperty('savings')

    // ── KPIs ──
    expect(result.kpis.applianceCount).toBe(3)
    expect(result.kpis.totalCo2eKg).toBeGreaterThan(0)
    expect(result.kpis.totalCostUsd).toBeGreaterThan(0)
    expect(result.kpis.totalKwh).toBeGreaterThan(0)
    expect(result.kpis.potentialSavingsKg).toBeGreaterThan(0)
    expect(result.kpis.potentialSavingsUsd).toBeGreaterThan(0)

    // ── Impact breakdown ──
    expect(result.impactBreakdown.length).toBeGreaterThan(0)
    for (const slice of result.impactBreakdown) {
      expect(slice).toHaveProperty('type')
      expect(slice).toHaveProperty('name')
      expect(slice).toHaveProperty('kg')
      expect(slice).toHaveProperty('share')
      expect(slice).toHaveProperty('color')
      expect(slice).toHaveProperty('cost')
    }
    // Sorted by kg descending
    for (let i = 1; i < result.impactBreakdown.length; i++) {
      expect(result.impactBreakdown[i - 1].kg).toBeGreaterThanOrEqual(result.impactBreakdown[i].kg)
    }

    // ── Top emitters (up to 5, sorted) ──
    expect(result.topEmitters.length).toBeLessThanOrEqual(5)
    expect(result.topEmitters.length).toBeGreaterThan(0)
    for (let i = 1; i < result.topEmitters.length; i++) {
      expect(result.topEmitters[i - 1].carbon.annualCo2eKg)
        .toBeGreaterThanOrEqual(result.topEmitters[i].carbon.annualCo2eKg)
    }

    // ── Savings opportunities (top suggestion per appliance) ──
    expect(result.savingsOpportunities.length).toBeGreaterThan(0)
    for (const opp of result.savingsOpportunities) {
      expect(opp).toHaveProperty('applianceName')
      expect(opp).toHaveProperty('applianceType')
      expect(opp).toHaveProperty('title')
      expect(opp).toHaveProperty('co2eKgPerYear')
      expect(opp).toHaveProperty('usdPerYear')
    }
    // Sorted by co2eKgPerYear descending
    for (let i = 1; i < result.savingsOpportunities.length; i++) {
      expect(result.savingsOpportunities[i - 1].co2eKgPerYear)
        .toBeGreaterThanOrEqual(result.savingsOpportunities[i].co2eKgPerYear)
    }

    // ── Trend (12 weeks) ──
    expect(result.trend).toHaveLength(12)
    expect(result.trend[0].current).toBeGreaterThan(0)
    expect(result.trend[0].optimized).toBeNull() // first week has no optimized
    expect(result.trend[1].optimized).not.toBeNull()
  })

  // ─── Empty state: no scan found ──────────────────────────────────────────

  it('returns isEmpty=true when no scan exists', async () => {
    mockScanFindFirst.mockResolvedValue(null)

    const result = await getResultsData('user-empty')

    expect(result.isEmpty).toBe(true)
    expect(result.scan).toBeNull()
    expect(result.appliances).toHaveLength(0)
    expect(result.kpis.totalCo2eKg).toBe(0)
    expect(result.kpis.totalCostUsd).toBe(0)
    expect(result.kpis.applianceCount).toBe(0)
    expect(result.kpis.totalKwh).toBe(0)
    expect(result.kpis.potentialSavingsKg).toBe(0)
    expect(result.kpis.potentialSavingsUsd).toBe(0)
    expect(result.impactBreakdown).toHaveLength(0)
    expect(result.topEmitters).toHaveLength(0)
    expect(result.savingsOpportunities).toHaveLength(0)
    expect(result.trend).toHaveLength(0)
  })

  // ─── Empty state: scan with no detections ────────────────────────────────

  it('returns isEmpty=true when scan has zero detections', async () => {
    mockScanFindFirst.mockResolvedValue(buildScan({ detections: [] }))

    const result = await getResultsData('user-empty-scan')

    expect(result.isEmpty).toBe(true)
    expect(result.scan).toBeNull() // scan is null because no detections
    expect(result.appliances).toHaveLength(0)
    expect(result.kpis.applianceCount).toBe(0)
  })

  // ─── With specific scanId ────────────────────────────────────────────────

  it('uses scanId when provided', async () => {
    mockScanFindFirst.mockResolvedValue(
      buildScan({
        id: 'specific-scan',
        detections: [
          buildDetection({
            label: 'Specific AC',
            aiMetadata: { type: 'HVAC', estimatedWatts: 2000, estimatedHoursPerDay: 6 },
          }),
        ],
      }),
    )

    const result = await getResultsData('user-1', 'specific-scan')

    expect(mockScanFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'specific-scan' }),
      }),
    )
    expect(result.isEmpty).toBe(false)
    expect(result.scan!.id).toBe('specific-scan')
    expect(result.appliances).toHaveLength(1)
    expect(result.appliances[0].name).toBe('Specific AC')
  })

  // ─── Detection without aiMetadata (fallback) ─────────────────────────────

  it('handles detections without aiMetadata by falling back to defaults', async () => {
    mockScanFindFirst.mockResolvedValue(
      buildScan({
        detections: [
          buildDetection({
            label: 'Unknown Device',
            categorySlug: 'home.other',
            amount: 100,
            aiMetadata: null, // no metadata
          }),
        ],
      }),
    )

    const result = await getResultsData('user-1')

    expect(result.appliances).toHaveLength(1)
    // Without aiMetadata: type falls back to categorySlug last part → 'OTHER'
    // watts falls back to det.amount = 100
    // hoursPerDay falls back to 4
    expect(result.appliances[0].type).toBe('OTHER')
    expect(result.appliances[0].watts).toBe(100)
    expect(result.appliances[0].hoursPerDay).toBe(4)
    expect(result.appliances[0].suggestions.length).toBeGreaterThan(0)
  })

  // ─── Single detection edge case ──────────────────────────────────────────

  it('handles a single detection gracefully', async () => {
    mockScanFindFirst.mockResolvedValue(
      buildScan({
        detections: [
          buildDetection({
            label: 'Heater',
            aiMetadata: { type: 'WATER_HEATING', estimatedWatts: 4500, estimatedHoursPerDay: 3 },
          }),
        ],
      }),
    )

    const result = await getResultsData('user-single')

    expect(result.isEmpty).toBe(false)
    expect(result.appliances).toHaveLength(1)
    expect(result.kpis.applianceCount).toBe(1)
    expect(result.impactBreakdown).toHaveLength(1)
    expect(result.impactBreakdown[0].type).toBe('WATER_HEATING')
    expect(result.impactBreakdown[0].share).toBe(100)
    expect(result.topEmitters).toHaveLength(1)
    expect(result.savingsOpportunities).toHaveLength(1)
    expect(result.trend).toHaveLength(12)
  })

  // ─── Multiple appliance types in one scan ───────────────────────────────

  it('groups impact breakdown by appliance type with correct shares', async () => {
    mockScanFindFirst.mockResolvedValue(
      buildScan({
        detections: [
          buildDetection({ label: 'AC', aiMetadata: { type: 'HVAC', estimatedWatts: 3000, estimatedHoursPerDay: 8 } }),
          buildDetection({ label: 'Fridge', aiMetadata: { type: 'REFRIGERATION', estimatedWatts: 200, estimatedHoursPerDay: 24 } }),
          buildDetection({ label: 'Washer', aiMetadata: { type: 'LAUNDRY', estimatedWatts: 1500, estimatedHoursPerDay: 1 } }),
          buildDetection({ label: 'Oven', aiMetadata: { type: 'KITCHEN', estimatedWatts: 2500, estimatedHoursPerDay: 1 } }),
          buildDetection({ label: 'TV', aiMetadata: { type: 'ELECTRONICS', estimatedWatts: 150, estimatedHoursPerDay: 6 } }),
        ],
      }),
    )

    const result = await getResultsData('user-multi')

    expect(result.isEmpty).toBe(false)
    expect(result.appliances).toHaveLength(5)

    // Impact breakdown should have one entry per unique type
    const typeNames = result.impactBreakdown.map((s) => s.type)
    expect(typeNames).toContain('HVAC')
    expect(typeNames).toContain('REFRIGERATION')
    expect(typeNames).toContain('LAUNDRY')
    expect(typeNames).toContain('KITCHEN')
    expect(typeNames).toContain('ELECTRONICS')

    // Shares should sum to 100
    const totalShare = result.impactBreakdown.reduce((s, x) => s + x.share, 0)
    expect(totalShare).toBeCloseTo(100, -1)
  })

  // ─── Partial aiMetadata (missing type, watts, hours) ─────────────────────

  it('handles partial aiMetadata with fallbacks', async () => {
    mockScanFindFirst.mockResolvedValue(
      buildScan({
        detections: [
          buildDetection({
            label: 'Mystery Device',
            categorySlug: 'home.appliance',
            amount: 500,
            aiMetadata: { estimatedWatts: null, estimatedHoursPerDay: null }, // type also missing
          }),
        ],
      }),
    )

    const result = await getResultsData('user-partial-meta')

    expect(result.appliances).toHaveLength(1)
    // type falls back from categorySlug last part: 'APPLIANCE'
    expect(result.appliances[0].type).toBe('APPLIANCE')
    // watts falls back to det.amount = 500
    expect(result.appliances[0].watts).toBe(500)
    // hoursPerDay falls back to 4
    expect(result.appliances[0].hoursPerDay).toBe(4)
    // Suggestions for unknown type should come from OTHER
    expect(result.appliances[0].suggestions.length).toBeGreaterThan(0)
  })

  // ─── No inputMeta on scan ────────────────────────────────────────────────

  it('uses default values when inputMeta is missing', async () => {
    mockScanFindFirst.mockResolvedValue(
      buildScan({
        inputMeta: null,
        detections: [
          buildDetection({
            aiMetadata: { type: 'LIGHTING', estimatedWatts: 15, estimatedHoursPerDay: 6 },
          }),
        ],
      }),
    )

    const result = await getResultsData('user-no-meta')

    expect(result.scan!.roomType).toBe('Room')
    expect(result.scan!.summary).toBe('1 appliances detected')
  })

  // ─── Full shape verification ─────────────────────────────────────────────

  it('returns the full ResultsData shape', async () => {
    mockScanFindFirst.mockResolvedValue(
      buildScan({
        detections: [
          buildDetection({
            aiMetadata: { type: 'HVAC', estimatedWatts: 2000, estimatedHoursPerDay: 8 },
          }),
        ],
      }),
    )

    const result = await getResultsData('user-shape')

    expect(result).toHaveProperty('isEmpty')
    expect(result).toHaveProperty('scan')
    expect(result).toHaveProperty('appliances')
    expect(result).toHaveProperty('kpis')
    expect(result).toHaveProperty('impactBreakdown')
    expect(result).toHaveProperty('topEmitters')
    expect(result).toHaveProperty('savingsOpportunities')
    expect(result).toHaveProperty('trend')

    const kpiKeys: (keyof ResultsData['kpis'])[] = [
      'totalCo2eKg', 'totalCostUsd', 'applianceCount', 'totalKwh',
      'potentialSavingsKg', 'potentialSavingsUsd',
    ]
    for (const key of kpiKeys) {
      expect(result.kpis).toHaveProperty(key)
    }

    if (!result.isEmpty && result.appliances.length > 0) {
      const app = result.appliances[0]
      expect(app).toHaveProperty('id')
      expect(app).toHaveProperty('name')
      expect(app).toHaveProperty('type')
      expect(app).toHaveProperty('watts')
      expect(app).toHaveProperty('hoursPerDay')
      expect(app).toHaveProperty('carbon')
      expect(app).toHaveProperty('cost')
      expect(app).toHaveProperty('suggestions')
    }
  })
})
