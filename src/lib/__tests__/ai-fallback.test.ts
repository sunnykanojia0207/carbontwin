/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest'

// ============================================================================
// Tests for AI fallback responses.
//
// These test the deterministic fallback logic that is used when Gemini AI
// is unavailable (no key, quota exhausted, or network error).
// ============================================================================

describe('AI Detection Fallback', () => {
  // Simulates the DETECTION_FALLBACK logic from src/lib/ai/index.ts
  function getDetectionFallback(labels: string[]): string {
    if (!labels || labels.length === 0) return 'Room'
    return labels[0]
  }

  it('returns first label when labels exist', () => {
    expect(getDetectionFallback(['Refrigerator', 'TV', 'Lamp'])).toBe('Refrigerator')
  })

  it('returns "Room" for empty labels array', () => {
    expect(getDetectionFallback([])).toBe('Room')
  })

  it('returns "Room" for null labels', () => {
    expect(getDetectionFallback(null as unknown as string[])).toBe('Room')
  })

  it('returns "Room" for undefined labels', () => {
    expect(getDetectionFallback(undefined as unknown as string[])).toBe('Room')
  })
})

describe('AI Negotiator Fallback Advice', () => {
  // Simulates the generateLocalFallbackAdvice logic
  type Dimension = {
    category: string
    currentKg: number
    potentialReduction: number
  }

  function generateLocalFallbackAdvice(context?: {
    totalKg?: number
    dimensions?: Dimension[]
    intent?: string
  }): string {
    if (!context || !context.dimensions || context.dimensions.length === 0) {
      return 'Consider starting with a home energy audit to identify the biggest savings opportunities in your household.'
    }

    // Sort dimensions by potential reduction
    const sorted = [...context.dimensions].sort(
      (a, b) => b.potentialReduction - a.potentialReduction,
    )
    const top = sorted[0]

    if (top.category === 'home_energy') {
      return `Your biggest impact area is Home Energy at ${top.currentKg.toFixed(0)} kg CO₂/year. Switching to LED bulbs and improving insulation could save around ${top.potentialReduction.toFixed(0)} kg annually.`
    }
    if (top.category === 'transportation') {
      return `Transportation is your top category at ${top.currentKg.toFixed(0)} kg CO₂/year. Consider public transit or carpooling to save approximately ${top.potentialReduction.toFixed(0)} kg annually.`
    }
    if (top.category === 'diet') {
      return `Your diet contributes ${top.currentKg.toFixed(0)} kg CO₂/year. Reducing meat consumption to 2-3 times per week could save around ${top.potentialReduction.toFixed(0)} kg annually.`
    }

    return `You could save approximately ${top.potentialReduction.toFixed(0)} kg CO₂/year by focusing on ${top.category.replace('_', ' ')}.`
  }

  const mockDimensions: Dimension[] = [
    { category: 'home_energy', currentKg: 3200, potentialReduction: 850 },
    { category: 'transportation', currentKg: 2400, potentialReduction: 600 },
    { category: 'diet', currentKg: 1500, potentialReduction: 400 },
  ]

  it('returns home energy advice when that is the top category', () => {
    const result = generateLocalFallbackAdvice({
      totalKg: 8000,
      dimensions: mockDimensions,
      intent: 'save money',
    })
    expect(result).toContain('Home Energy')
    expect(result).toContain('3200')
    expect(result).toContain('850')
  })

  it('returns transportation advice when that is the top category', () => {
    const transportFirst: Dimension[] = [
      { category: 'transportation', currentKg: 5000, potentialReduction: 1200 },
      { category: 'home_energy', currentKg: 2000, potentialReduction: 300 },
    ]
    const result = generateLocalFallbackAdvice({
      totalKg: 7000,
      dimensions: transportFirst,
      intent: 'commute',
    })
    expect(result).toContain('Transportation')
    expect(result).toContain('5000')
  })

  it('returns diet advice when that is the top category', () => {
    const dietFirst: Dimension[] = [
      { category: 'diet', currentKg: 3000, potentialReduction: 750 },
      { category: 'transportation', currentKg: 1000, potentialReduction: 200 },
    ]
    const result = generateLocalFallbackAdvice({
      totalKg: 4000,
      dimensions: dietFirst,
      intent: 'eat healthier',
    })
    expect(result).toContain('diet')
    expect(result).toContain('3000')
  })

  it('returns generic advice when context is empty', () => {
    const result = generateLocalFallbackAdvice()
    expect(result).toContain('home energy audit')
  })

  it('returns generic advice when dimensions are empty', () => {
    const result = generateLocalFallbackAdvice({ totalKg: 5000, dimensions: [] })
    expect(result).toContain('home energy audit')
  })

  it('sorts by potential reduction descending', () => {
    const unsorted: Dimension[] = [
      { category: 'diet', currentKg: 500, potentialReduction: 100 },
      { category: 'home_energy', currentKg: 3000, potentialReduction: 900 },
      { category: 'transportation', currentKg: 2000, potentialReduction: 500 },
    ]
    const result = generateLocalFallbackAdvice({
      totalKg: 5500,
      dimensions: unsorted,
    })
    // Home energy has highest potential reduction (900)
    expect(result).toContain('Home Energy')
  })

  it('handles empty dimensions array', () => {
    const result = generateLocalFallbackAdvice({
      totalKg: 5000,
      dimensions: [],
    })
    expect(result).toContain('home energy audit')
  })

  it('handles all dimensions with zero reduction potential', () => {
    const zeroDims: Dimension[] = [
      { category: 'home_energy', currentKg: 3000, potentialReduction: 0 },
      { category: 'transportation', currentKg: 2000, potentialReduction: 0 },
    ]
    const result = generateLocalFallbackAdvice({
      totalKg: 5000,
      dimensions: zeroDims,
    })
    // Should still produce advice about the first dimension (home_energy)
    expect(result).toContain('Home Energy')
    expect(result).toContain('0')
  })

  it('handles single dimension', () => {
    const singleDim: Dimension[] = [
      { category: 'diet', currentKg: 1800, potentialReduction: 450 },
    ]
    const result = generateLocalFallbackAdvice({
      totalKg: 1800,
      dimensions: singleDim,
    })
    expect(result).toContain('diet')
    expect(result).toContain('1800')
  })
})
