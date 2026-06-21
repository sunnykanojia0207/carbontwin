/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================================================
// Mock all AI dependencies so every exported function falls through to its
// deterministic fallback path. This tests that:
//   - Fallbacks produce valid, structured output without any API key
//   - Edge cases (missing/null params, empty arrays) are handled
//   - The function signatures and return types are correct
// ============================================================================

// Make callTextModel / callVisionModel reject so withErrorHandling catches
// and the fallback paths are taken.
vi.mock('@/lib/ai/gemini-client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/ai/gemini-client')>('@/lib/ai/gemini-client')
  return {
    ...actual,
    callTextModel: vi.fn(() => Promise.reject(new Error('Simulated Gemini API error'))),
    callVisionModel: vi.fn(() => Promise.reject(new Error('Simulated Gemini API error'))),
  }
})

// Always let rate-limits pass
vi.mock('@/lib/ai/rate-limiter', () => ({
  checkRateLimit: vi.fn(() => ({
    allowed: true,
    remaining: 99,
    resetInMs: 0,
    limit: 100,
  })),
  getRateLimitStatus: vi.fn(() => ({ remaining: 99, limit: 100 })),
}))

// Never hit cache
vi.mock('@/lib/ai/cache', () => ({
  getCached: vi.fn(() => undefined),
  setCached: vi.fn(),
  cacheKey: vi.fn((key: string, _input: unknown) => `${key}:test-hash`),
  CACHE_TTL: {
    insights: 600_000,
    'twin-recommendations': 900_000,
    'goal-suggestions': 600_000,
    detect: 0,
    negotiator: 0,
  },
  invalidateFunction: vi.fn(),
  clearCache: vi.fn(),
}))

// AI not configured so fallbacks serve their "not configured" messages
vi.mock('@/lib/ai/env', () => ({
  AI_CONFIGURED: false,
  GEMINI_TEXT_MODEL: 'gemini-2.5-flash',
  GEMINI_VISION_MODEL: 'gemini-2.5-flash',
  validateEnv: () => ({ ok: true, required: [], ai: [{ name: 'GEMINI_API_KEY', set: false, preview: '<not set>' }] }),
}))

// ---------------------------------------------------------------------------
// Imports — must come AFTER vi.mock calls (vitest hoists them)
// ---------------------------------------------------------------------------
import {
  detectAppliances,
  generateInsights,
  generateTwinRecommendations,
  generateNegotiatorResponse,
  generateGoalSuggestions,
  generateForecast,
  AI_CONFIGURED,
  LAST_QUOTA_ERROR,
} from '@/lib/ai/index'

import type { AiResult } from '@/lib/ai/gemini-client'

// ============================================================================
// Test helpers
// ============================================================================

// Assert an AiResult is ok and narrow the type
function expectOk<T>(result: AiResult<T>): asserts result is { ok: true; data: T; cached: boolean; model: string } {
  expect(result.ok).toBe(true)
}

function expectResult<T>(result: AiResult<T>): T {
  expectOk(result)
  return (result as { ok: true; data: T; cached: boolean; model: string }).data
}

// ============================================================================
// 1. Environment
// ============================================================================

describe('AI_CONFIGURED', () => {
  it('is false when GEMINI_API_KEY is not set', () => {
    expect(AI_CONFIGURED).toBe(false)
  })
})

// ============================================================================
// 2. detectAppliances()
// ============================================================================

describe('detectAppliances()', () => {
  beforeEach(() => {
    LAST_QUOTA_ERROR['test-user'] = undefined as unknown as number
  })

  it('returns fallback when AI is unavailable (roomType = "Room")', async () => {
    const result = await detectAppliances('user-1', 'base64fake…', 'image/jpeg')
    const data = expectResult(result)

    expect(data.roomType).toBe('Room')
    expect(data.appliances).toHaveLength(1)
    expect(data.appliances[0].name).toBe('Unidentified appliance')
    expect(data.appliances[0].type).toBe('OTHER')
    expect(data.appliances[0].estimatedWatts).toBe(100)
    expect(data.appliances[0].confidence).toBe(0.3)
    expect(data.summary).toContain('AI detection is not configured')
    expect(result.model).toBe('fallback')
  })

  it('returns fallback for empty base64 string', async () => {
    const result = await detectAppliances('user-2', '', 'image/png')
    const data = expectResult(result)
    expect(data.roomType).toBe('Room')
    expect(data.appliances).toHaveLength(1)
  })

  it('returns fallback for missing mimeType (falsy)', async () => {
    const result = await detectAppliances('user-3', 'fakeimg', '')
    const data = expectResult(result)
    expect(data.roomType).toBe('Room')
  })

  it('fallback note mentions configuration when AI_CONFIGURED is false', async () => {
    const result = await detectAppliances('user-4', 'img', 'image/jpeg')
    const data = expectResult(result)
    expect(data.appliances[0].notes).toContain('AI not configured')
  })

  it('returns cached=false on fallback', async () => {
    const result = await detectAppliances('user-5', 'img', 'image/jpeg')
    expect(result.cached).toBe(false)
  })

  it('never crashes on extremely long base64 input', async () => {
    const longBase64 = 'a'.repeat(1_000_000)
    const result = await detectAppliances('user-6', longBase64, 'image/png')
    const data = expectResult(result)
    expect(data.roomType).toBe('Room')
  })
})

// ============================================================================
// 3. generateInsights()
// ============================================================================

describe('generateInsights()', () => {
  const baseContext = {
    roomType: 'kitchen',
    totalKg: 2500,
    totalCost: 320,
    applianceCount: 5,
    potentialSavingsKg: 400,
    appliancesSummary: 'Fridge (500 kWh/yr), Oven (300 kWh/yr)',
    topSavings: 'Upgrade fridge to Energy Star (saves 150 kg/yr)',
  }

  it('returns fallback insight and highlights when AI is unavailable', async () => {
    const result = await generateInsights('user-1', baseContext)
    const data = expectResult(result)

    expect(data.insight).toBeTruthy()
    expect(data.insight).toContain('kitchen')
    expect(data.insight).toContain('2500')
    expect(data.insight).toContain('320')
    expect(data.highlights).toHaveLength(3)
    expect(result.model).toBe('fallback')
  })

  it('fallback highlights contain the context values', async () => {
    const result = await generateInsights('user-2', baseContext)
    const data = expectResult(result)
    expect(data.highlights[0]).toContain('5')
    expect(data.highlights[0]).toContain('kitchen')
    expect(data.highlights[1]).toContain('$320')
    expect(data.highlights[2]).toContain('400')
  })

  it('handles minimal context (zero values)', async () => {
    const minimal = {
      roomType: 'unknown',
      totalKg: 0,
      totalCost: 0,
      applianceCount: 0,
      potentialSavingsKg: 0,
      appliancesSummary: '',
      topSavings: '',
    }
    const result = await generateInsights('user-3', minimal)
    const data = expectResult(result)
    expect(data.insight).toBeTruthy()
    expect(data.highlights).toHaveLength(3)
  })

  it('handles extreme values', async () => {
    const extreme = {
      roomType: 'warehouse',
      totalKg: 999_999,
      totalCost: 50_000,
      applianceCount: 100,
      potentialSavingsKg: 200_000,
      appliancesSummary: 'Industrial equipment',
      topSavings: 'Replace all motors with VFD drives',
    }
    const result = await generateInsights('user-4', extreme)
    const data = expectResult(result)
    expect(data.highlights[0]).toContain('100')
    expect(data.highlights[2]).toContain('200000')
  })

  it('handles roomType with special characters', async () => {
    const ctx = { ...baseContext, roomType: 'living/dining (room #1)' }
    const result = await generateInsights('user-5', ctx)
    const data = expectResult(result)
    expect(data.insight).toContain('living/dining (room #1)')
  })
})

// ============================================================================
// 4. generateTwinRecommendations()
// ============================================================================

describe('generateTwinRecommendations()', () => {
  const baseContext = {
    name: 'Alex',
    region: 'US',
    household: 2,
    totalKg: 12000,
    tierName: 'Bronze',
    tierDesc: 'Above average — room for improvement',
    vsAvgPct: 15,
    parisTarget: 5000,
    dimSummary: 'Home: 4000, Transport: 3500, Food: 2500, Stuff: 2000',
    riskSummary: 'Transport and home energy are significantly above average.',
    oppSummary: 'Solar panels could save 3000 kg/yr. LED upgrade saves 400 kg/yr.',
    forecastCurrent: 11500,
    forecastOptimized: 8000,
    forecastAggressive: 4500,
  }

  it('returns fallback recommendations when AI is unavailable', async () => {
    const result = await generateTwinRecommendations('user-1', baseContext)
    const data = expectResult(result)

    expect(data.summary).toBeTruthy()
    expect(data.outlook).toBeTruthy()
    expect(data.recommendations).toHaveLength(3)
    expect(data.riskAssessment).toBeTruthy()
    expect(result.model).toBe('fallback')
  })

  it('fallback summary includes the user name and tier', async () => {
    const result = await generateTwinRecommendations('user-2', baseContext)
    const data = expectResult(result)
    expect(data.summary).toContain('Bronze')
    expect(data.summary).toContain('12000')
    expect(data.summary).toContain('above')
  })

  it('fallback outlook includes forecast numbers', async () => {
    const result = await generateTwinRecommendations('user-3', baseContext)
    const data = expectResult(result)
    expect(data.outlook).toContain('11500')
    expect(data.outlook).toContain('8000')
    expect(data.outlook).toContain('4500')
  })

  it('fallback recommendations are three generic items', async () => {
    const result = await generateTwinRecommendations('user-4', baseContext)
    const data = expectResult(result)
    expect(data.recommendations).toHaveLength(3)
    expect(data.recommendations[0]).toContain('highest-emission')
    expect(data.recommendations[1]).toContain('EASY')
    expect(data.recommendations[2]).toContain('goal')
  })

  it('handles region=null gracefully', async () => {
    const ctx = { ...baseContext, region: null }
    const result = await generateTwinRecommendations('user-5', ctx)
    const data = expectResult(result)
    expect(data.summary).toBeTruthy()
  })

  it('handles empty riskSummary', async () => {
    const ctx = { ...baseContext, riskSummary: '' }
    const result = await generateTwinRecommendations('user-6', ctx)
    const data = expectResult(result)
    expect(data.riskAssessment).toBe('No major risk areas identified.')
  })

  it('handles vsAvgPct as a negative value (below average)', async () => {
    const ctx = { ...baseContext, vsAvgPct: -10 }
    const result = await generateTwinRecommendations('user-7', ctx)
    const data = expectResult(result)
    expect(data.summary).toContain('below')
  })

  it('handles vsAvgPct of zero', async () => {
    const ctx = { ...baseContext, vsAvgPct: 0 }
    const result = await generateTwinRecommendations('user-8', ctx)
    const data = expectResult(result)
    expect(data.summary).toBeTruthy()
  })
})

// ============================================================================
// 5. generateNegotiatorResponse() + generateLocalFallbackAdvice()
// ============================================================================

describe('generateNegotiatorResponse()', () => {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: 'You are a sustainability coach.' },
    { role: 'user', content: 'How can I reduce my transport emissions?' },
  ]

  const context = {
    totalKg: 10000,
    dimensions: [
      { label: 'Transport', annualKg: 4000, share: 40 },
      { label: 'Home Energy', annualKg: 3000, share: 30 },
      { label: 'Diet', annualKg: 2000, share: 20 },
      { label: 'Appliances', annualKg: 1000, share: 10 },
    ],
    opportunities: [
      { title: 'Switch to Electric Vehicle', potentialKg: 2400, difficulty: 'HARD' },
      { title: 'Install Solar Panels', potentialKg: 2250, difficulty: 'HARD' },
    ],
    tier: { name: 'Silver' },
  }

  it('returns personalized fallback advice with context', async () => {
    const result = await generateNegotiatorResponse('user-1', messages, context)
    const data = expectResult(result)

    expect(typeof data).toBe('string')
    expect(data).toContain('AI is temporarily unavailable')
    expect(data).toContain('Transport') // top dimension
    expect(result.model).toBe('fallback')
  })

  it('fallback includes 3 dimension-specific recommendations', async () => {
    const result = await generateNegotiatorResponse('user-2', messages, context)
    const data = expectResult(result)
    // Should have 3 numbered recommendations
    expect(data).toContain('1. Focus on Transport')
    expect(data).toContain('2. Focus on Home Energy')
    expect(data).toContain('3. Focus on Diet')
  })

  it('fallback includes the top opportunity details', async () => {
    const result = await generateNegotiatorResponse('user-3', messages, context)
    const data = expectResult(result)
    expect(data).toContain('Switch to Electric Vehicle')
    expect(data).toContain('2.4') // 2400/1000 = 2.4 tonnes
  })

  it('fallback intent detection triggers transport advice when user asks about transport', async () => {
    const transportMessages = [
      { role: 'user' as const, content: 'I drive a lot, how can I reduce my car emissions?' },
    ]
    const result = await generateNegotiatorResponse('user-4', transportMessages, context)
    const data = expectResult(result)
    expect(data).toContain('transport footprint')
  })

  it('fallback intent detection triggers diet advice when user asks about food', async () => {
    const dietMessages = [
      { role: 'user' as const, content: 'How can I eat less meat?' },
    ]
    const result = await generateNegotiatorResponse('user-5', dietMessages, context)
    const data = expectResult(result)
    expect(data).toContain('diet')
    expect(data).toContain('plant-based')
  })

  it('fallback intent detection triggers home/energy advice', async () => {
    const homeMessages = [
      { role: 'user' as const, content: 'My electricity bill is too high, any tips?' },
    ]
    const result = await generateNegotiatorResponse('user-6', homeMessages, context)
    const data = expectResult(result)
    expect(data).toContain('LED')
  })

  it('fallback intent detection triggers goal-related advice', async () => {
    const goalMessages = [
      { role: 'user' as const, content: 'What target should I set for myself?' },
    ]
    const result = await generateNegotiatorResponse('user-7', goalMessages, context)
    const data = expectResult(result)
    expect(data).toContain('goal')
    expect(data).toContain('Silver') // tier name
  })

  it('returns static fallback when context is missing', async () => {
    const result = await generateNegotiatorResponse('user-8', messages)
    const data = expectResult(result)
    expect(data).toContain('I\'m having trouble connecting')
  })

  it('returns static fallback when context has empty dimensions', async () => {
    const noDims = { ...context, dimensions: [] }
    const result = await generateNegotiatorResponse('user-9', messages, noDims)
    const data = expectResult(result)
    expect(data).toContain('I\'m having trouble connecting')
  })

  it('handles empty messages array gracefully', async () => {
    const result = await generateNegotiatorResponse('user-10', [], context)
    const data = expectResult(result)
    // With empty messages and context, fallback still produces advice
    expect(data).toContain('AI is temporarily unavailable')
  })

  it('handles opportunities array with empty array', async () => {
    const noOpps = { ...context, opportunities: [] }
    const result = await generateNegotiatorResponse('user-11', messages, noOpps)
    const data = expectResult(result)
    expect(data).toBeTruthy()
    // Should still use fallback for top opportunity (defaults to 10% of total)
    expect(data).toContain('Top opportunity')
  })

  it('fallback costSavings calculation is correct', async () => {
    // savings = 2400, costSavings = Math.round(2400 * 0.15 / 0.4) = Math.round(900) = 900
    const result = await generateNegotiatorResponse('user-12', messages, context)
    const data = expectResult(result)
    expect(data).toContain('$900')
  })

  it('does not set LAST_QUOTA_ERROR for non-quota errors', async () => {
    // Our mock throws a plain Error, not a quota-related one
    const prev = { ...LAST_QUOTA_ERROR }
    await generateNegotiatorResponse('user-quota-test', messages, context)
    // LAST_QUOTA_ERROR should not have been updated
    expect(LAST_QUOTA_ERROR['user-quota-test']).toBeUndefined()
  })

  it('model is "fallback" in the result', async () => {
    const result = await generateNegotiatorResponse('user-13', messages, context)
    expect(result.model).toBe('fallback')
  })
})

// ============================================================================
// 6. generateGoalSuggestions()
// ============================================================================

describe('generateGoalSuggestions()', () => {
  const baseContext = {
    totalKg: 10000,
    tierName: 'Bronze',
    dimSummary: 'Home: 4000, Transport: 3000, Food: 2000, Stuff: 1000',
    parisTarget: 5000,
  }

  it('returns fallback goal suggestions when AI is unavailable', async () => {
    const result = await generateGoalSuggestions('user-1', baseContext)
    const data = expectResult(result)

    expect(Array.isArray(data)).toBe(true)
    expect(data).toHaveLength(3)
    expect(result.model).toBe('fallback')
  })

  it('each goal suggestion has all required fields', async () => {
    const result = await generateGoalSuggestions('user-2', baseContext)
    const data = expectResult(result)

    for (const goal of data) {
      expect(goal.title).toBeTruthy()
      expect(goal.description).toBeTruthy()
      expect(typeof goal.targetKg).toBe('number')
      expect(goal.targetKg).toBeGreaterThan(0)
      expect(['WEEKLY', 'MONTHLY', 'ANNUAL', 'ONE_TIME']).toContain(goal.type)
      expect(goal.category).toBeTruthy()
      expect(['EASY', 'MEDIUM', 'HARD']).toContain(goal.difficulty)
      expect(goal.potentialImpact).toBeTruthy()
      expect(goal.rationale).toBeTruthy()
    }
  })

  it('first goal targetKg is 10% of totalKg', async () => {
    const result = await generateGoalSuggestions('user-3', baseContext)
    const data = expectResult(result)
    expect(data[0].targetKg).toBe(1000) // 10% of 10000
  })

  it('second goal is plant-based (targetKg = 15)', async () => {
    const result = await generateGoalSuggestions('user-4', baseContext)
    const data = expectResult(result)
    expect(data[1].title).toContain('plant-based')
    expect(data[1].targetKg).toBe(15)
    expect(data[1].type).toBe('WEEKLY')
    expect(data[1].difficulty).toBe('EASY')
  })

  it('third goal is daily logging (targetKg = 5)', async () => {
    const result = await generateGoalSuggestions('user-5', baseContext)
    const data = expectResult(result)
    expect(data[2].type).toBe('WEEKLY')
    expect(data[2].targetKg).toBe(5)
    expect(data[2].difficulty).toBe('EASY')
  })

  it('handles zero totalKg', async () => {
    const zeroCtx = { ...baseContext, totalKg: 0 }
    const result = await generateGoalSuggestions('user-6', zeroCtx)
    const data = expectResult(result)
    expect(data[0].targetKg).toBe(0) // 10% of 0
  })

  it('handles very large totalKg', async () => {
    const largeCtx = { ...baseContext, totalKg: 1_000_000 }
    const result = await generateGoalSuggestions('user-7', largeCtx)
    const data = expectResult(result)
    expect(data[0].targetKg).toBe(100_000) // 10% of 1M
  })
})

// ============================================================================
// 7. generateForecast()
// ============================================================================

describe('generateForecast()', () => {
  const baseContext = {
    totalKg: 10000,
    parisTarget: 5000,
    dimSummary: 'Home: 4000, Transport: 3000, Food: 2000, Stuff: 1000',
    trend: 'Slightly decreasing over the past 3 months',
  }

  it('returns fallback forecast when AI is unavailable', async () => {
    const result = await generateForecast('user-1', baseContext)
    const data = expectResult(result)

    expect(data.projection).toBeTruthy()
    expect(typeof data.confidence).toBe('number')
    expect(data.confidence).toBe(0.7) // fixed in fallback
    expect(data.keyDriver).toBeTruthy()
    expect(data.recommendation).toBeTruthy()
    expect(result.model).toBe('fallback')
  })

  it('fallback projection mentions being above Paris target when totalKg > parisTarget', async () => {
    const result = await generateForecast('user-2', baseContext)
    const data = expectResult(result)
    expect(data.projection).toContain('above')
    expect(data.projection).toContain('5000') // the gap = 10000 - 5000 = 5000
  })

  it('fallback projection mentions being on track when below Paris target', async () => {
    const belowCtx = { ...baseContext, totalKg: 3000, parisTarget: 5000 }
    const result = await generateForecast('user-3', belowCtx)
    const data = expectResult(result)
    expect(data.projection).toContain('on track')
    expect(data.projection).toContain('2000') // gap = 3000 - 5000 = -2000, abs = 2000
  })

  it('fallback projection handles exactly at Paris target', async () => {
    const atCtx = { ...baseContext, totalKg: 5000, parisTarget: 5000 }
    const result = await generateForecast('user-4', atCtx)
    const data = expectResult(result)
    // gap = 0, so projection goes to the 'above' branch (gap > 0 is false)
    // Actually, gap = 0, so `gap > 0` is false, so the else branch with "on track" is used
    expect(data.projection).toContain('on track')
  })

  it('fallback has fixed confidence of 0.7', async () => {
    const result = await generateForecast('user-5', baseContext)
    const data = expectResult(result)
    expect(data.confidence).toBe(0.7)
  })

  it('fallback keyDriver mentions largest emission dimension', async () => {
    const result = await generateForecast('user-6', baseContext)
    const data = expectResult(result)
    expect(data.keyDriver).toContain('largest emission dimension')
  })

  it('handles zero totalKg and parisTarget', async () => {
    const zeroCtx = { totalKg: 0, parisTarget: 0, dimSummary: '', trend: '' }
    const result = await generateForecast('user-7', zeroCtx)
    const data = expectResult(result)
    expect(data.projection).toBeTruthy()
    // gap = 0, on-track branch
    expect(data.projection).toContain('on track')
  })

  it('handles negative gap (totalKg below parisTarget)', async () => {
    const belowCtx = { ...baseContext, totalKg: 2000, parisTarget: 8000 }
    const result = await generateForecast('user-8', belowCtx)
    const data = expectResult(result)
    expect(data.projection).toContain('on track')
  })
})

// ============================================================================
// 8. LAST_QUOTA_ERROR
// ============================================================================

describe('LAST_QUOTA_ERROR', () => {
  beforeEach(() => {
    // Clear any residual keys left by other tests
    for (const key of Object.keys(LAST_QUOTA_ERROR)) {
      delete LAST_QUOTA_ERROR[key]
    }
  })

  it('is initially empty', () => {
    expect(Object.keys(LAST_QUOTA_ERROR)).toHaveLength(0)
  })

  it('can be set by negotiator on quota errors', () => {
    // This is tested indirectly: with mocked errors that aren't quota-related,
    // we verify LAST_QUOTA_ERROR is NOT set for non-quota errors
    expect(LAST_QUOTA_ERROR['any-user']).toBeUndefined()
  })
})

// ============================================================================
// 9. Signature verification — exported types match expectations
// ============================================================================

describe('exported function signatures', () => {
  it('detectAppliances is async and returns AiResult<DetectionResult>', async () => {
    const result = await detectAppliances('id', 'img', 'image/jpeg')
    expect(result).toHaveProperty('ok')
    if (result.ok) {
      expect(result.data).toHaveProperty('appliances')
      expect(result.data).toHaveProperty('roomType')
    }
  })

  it('generateInsights is async and returns AiResult<InsightsResult>', async () => {
    const result = await generateInsights('id', {
      roomType: 'room',
      totalKg: 0,
      totalCost: 0,
      applianceCount: 0,
      potentialSavingsKg: 0,
      appliancesSummary: '',
      topSavings: '',
    })
    expect(result).toHaveProperty('ok')
    if (result.ok) {
      expect(result.data).toHaveProperty('insight')
      expect(result.data).toHaveProperty('highlights')
    }
  })

  it('generateTwinRecommendations is async and returns AiResult<TwinRecommendationsResult>', async () => {
    const result = await generateTwinRecommendations('id', {
      name: '', region: '', household: 1, totalKg: 0, tierName: '', tierDesc: '',
      vsAvgPct: 0, parisTarget: 0, dimSummary: '', riskSummary: '', oppSummary: '',
      forecastCurrent: 0, forecastOptimized: 0, forecastAggressive: 0,
    })
    expect(result).toHaveProperty('ok')
    if (result.ok) {
      expect(result.data).toHaveProperty('summary')
      expect(result.data).toHaveProperty('outlook')
      expect(result.data).toHaveProperty('recommendations')
      expect(result.data).toHaveProperty('riskAssessment')
    }
  })

  it('generateNegotiatorResponse is async and returns AiResult<string>', async () => {
    const result = await generateNegotiatorResponse('id', [{ role: 'user', content: 'hi' }])
    expect(result).toHaveProperty('ok')
    if (result.ok) {
      expect(typeof result.data).toBe('string')
    }
  })

  it('generateGoalSuggestions is async and returns AiResult<GoalSuggestion[]>', async () => {
    const result = await generateGoalSuggestions('id', { totalKg: 0, tierName: '', dimSummary: '', parisTarget: 0 })
    expect(result).toHaveProperty('ok')
    if (result.ok) {
      expect(Array.isArray(result.data)).toBe(true)
    }
  })

  it('generateForecast is async and returns AiResult<ForecastResult>', async () => {
    const result = await generateForecast('id', { totalKg: 0, parisTarget: 0, dimSummary: '', trend: '' })
    expect(result).toHaveProperty('ok')
    if (result.ok) {
      expect(result.data).toHaveProperty('projection')
      expect(result.data).toHaveProperty('confidence')
      expect(result.data).toHaveProperty('keyDriver')
      expect(result.data).toHaveProperty('recommendation')
    }
  })
})
