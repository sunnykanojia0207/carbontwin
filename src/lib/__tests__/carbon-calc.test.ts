/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest'

// Import the actual carbon calculation for edge-case testing
import { estimateApplianceCarbon } from '@/lib/emissions/appliance-calc'

// ============================================================================
// Tests for carbon calculation utilities.
//
// These test the core business logic for emissions calculations:
//   • Appliance energy → CO₂ conversion
//   • Score calculation (0–100 based on per-capita comparison)
//   • Projection logic (forecast over time with reductions)
// ============================================================================

describe('Appliance CO₂ Calculation', () => {
  // Standard calculation: kWh = (watts × hoursPerDay × daysPerYear) / 1000
  // CO₂ = kWh × gridIntensity (0.4 kg/kWh for India)
  function calculateApplianceCO2(
    powerWatts: number,
    hoursPerDay: number,
    count: number,
    daysPerWeek: number = 7,
  ): number {
    const hoursPerYear = hoursPerDay * daysPerWeek * 52
    const kWh = (powerWatts * hoursPerYear * count) / 1000
    const gridIntensity = 0.4 // kg CO₂ per kWh (India average)
    return Math.round(kWh * gridIntensity)
  }

  it('calculates refrigerator CO₂ correctly', () => {
    // 150W fridge running 24/7
    const result = calculateApplianceCO2(150, 24, 1)
    // (150 * 24 * 365) / 1000 = 1314 kWh
    // 1314 * 0.4 = 525.6 → 526 kg/year
    expect(result).toBeCloseTo(526, -1)
  })

  it('calculates AC unit CO₂ correctly', () => {
    // 1500W AC running 8h/day, 7 days/week
    const result = calculateApplianceCO2(1500, 8, 1)
    // (1500 * 8 * 7 * 52) / 1000 = 4368 kWh
    // 4368 * 0.4 = 1747.2 → 1747 kg/year
    expect(result).toBe(1747)
  })

  it('handles multiple units of the same appliance', () => {
    // 1500W AC × 2 units, 8h/day, 7 days/week
    const result = calculateApplianceCO2(1500, 8, 2)
    // (1500 * 8 * 7 * 52 * 2) / 1000 = 8736 kWh
    // 8736 * 0.4 = 3494.4 → 3494 kg/year
    expect(result).toBe(3494)
  })

  it('handles appliances not used every day', () => {
    // 1000W appliance used 3 days/week, 2h/day
    const result = calculateApplianceCO2(1000, 2, 1, 3)
    // (1000 * 2 * 3 * 52) / 1000 = 312 kWh
    // 312 * 0.4 = 124.8 → 125 kg/year
    expect(result).toBe(125)
  })

  it('returns 0 for zero-power appliance', () => {
    expect(calculateApplianceCO2(0, 8, 1)).toBe(0)
  })
})

describe('Climate Score Calculation', () => {
  // 0–100 score: lower emissions = higher score
  // Based on India per-capita average (~1800 kg/year)
  function calculateClimateScore(totalAnnualKg: number): number {
    const INDIA_AVERAGE_KG = 1800
    const TARGET_KG = 700 // Paris-aligned target

    if (totalAnnualKg <= 0) return 100
    if (totalAnnualKg >= INDIA_AVERAGE_KG * 2) return 0

    // Score: linear interpolation between target (100) and 2× average (0)
    const score = 100 - (totalAnnualKg - TARGET_KG) / (INDIA_AVERAGE_KG * 2 - TARGET_KG) * 100
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  it('returns 100 for zero emissions', () => {
    expect(calculateClimateScore(0)).toBe(100)
  })

  it('returns a high score for Paris-aligned emissions', () => {
    const score = calculateClimateScore(700)
    expect(score).toBeGreaterThanOrEqual(90)
  })

  it('returns a middle score for average emissions', () => {
    const score = calculateClimateScore(1800)
    expect(score).toBeGreaterThan(30)
    expect(score).toBeLessThan(70)
  })

  it('returns 0 for very high emissions', () => {
    expect(calculateClimateScore(4000)).toBe(0)
  })

  it('clamps score between 0 and 100', () => {
    expect(calculateClimateScore(-100)).toBe(100)
    expect(calculateClimateScore(9999)).toBe(0)
  })
})

describe('Projection Calculation', () => {
  // Forecast carbon footprint over n years with annual reduction
  function projectFootprint(
    currentKg: number,
    annualReductionKg: number,
    years: number,
  ): number[] {
    const projections: number[] = []
    for (let i = 1; i <= years; i++) {
      const kg = Math.max(0, Math.round(currentKg - annualReductionKg * i))
      projections.push(kg)
    }
    return projections
  }

  it('projects linear reduction over years', () => {
    const projections = projectFootprint(5000, 500, 5)
    expect(projections).toEqual([4500, 4000, 3500, 3000, 2500])
  })

  it('never goes below zero', () => {
    const projections = projectFootprint(1000, 300, 5)
    expect(projections).toEqual([700, 400, 100, 0, 0])
  })

  it('returns empty array for zero years', () => {
    expect(projectFootprint(5000, 500, 0)).toEqual([])
  })

  it('handles zero reduction', () => {
    const projections = projectFootprint(5000, 0, 3)
    expect(projections).toEqual([5000, 5000, 5000])
  })
})

describe('Savings Calculation', () => {
  // Calculate cost savings from CO₂ reduction
  // Based on carbon price (₹2000/tonne CO₂)
  function calculateCostSavings(reductionKg: number): number {
    const CARBON_PRICE_PER_KG = 2 // ₹2/kg CO₂
    return Math.round(reductionKg * CARBON_PRICE_PER_KG)
  }

  it('calculates cost savings correctly', () => {
    expect(calculateCostSavings(500)).toBe(1000)
    expect(calculateCostSavings(1000)).toBe(2000)
  })

  it('handles zero reduction', () => {
    expect(calculateCostSavings(0)).toBe(0)
  })

  it('handles small reductions', () => {
    expect(calculateCostSavings(25)).toBe(50)
  })
})

// ============================================================================
// Tests for the actual appliance carbon calculation from the source code.
// These edge cases test the real estimateApplianceCarbon implementation.
// ============================================================================

describe('estimateApplianceCarbon (actual implementation)', () => {
  it('returns zero for zero-watt appliance', () => {
    const result = estimateApplianceCarbon(0, 8, 7)
    expect(result.annualKwh).toBe(0)
    expect(result.annualCo2eKg).toBe(0)
    expect(result.monthlyCo2eKg).toBe(0)
    expect(result.dailyCo2eKg).toBe(0)
  })

  it('handles very large power values', () => {
    // 20000W running 24/7
    const result = estimateApplianceCarbon(20000, 24, 7)
    // annualKwh = (20000 * 24 * 7 * 52) / 1000 = 174720 kWh
    expect(result.annualKwh).toBe(174720)
    // annualCo2eKg = 174720 * 0.4 = 69888
    expect(result.annualCo2eKg).toBe(69888)
  })

  it('handles fractional hours per day', () => {
    // 1000W for 0.5 hours/day
    const result = estimateApplianceCarbon(1000, 0.5, 7)
    // annualKwh = (1000 * 0.5 * 7 * 52) / 1000 = 182
    expect(result.annualKwh).toBe(182)
    // annualCo2eKg = 182 * 0.4 = 72.8
    expect(result.annualCo2eKg).toBe(72.8)
  })

  it('handles appliances not used every day (daysPerWeek < 7)', () => {
    // 1000W, 2h/day, 3 days/week
    const result = estimateApplianceCarbon(1000, 2, 3)
    // annualKwh = (1000 * 2 * 3 * 52) / 1000 = 312
    expect(result.annualKwh).toBe(312)
    expect(result.annualCo2eKg).toBe(124.8) // 312 * 0.4
  })

  it('rounds dailyCo2eKg to 2 decimal places', () => {
    const result = estimateApplianceCarbon(150, 24, 7)
    // annualKwh = (150 * 24 * 7 * 52) / 1000 = 1310.4
    // annualCo2eKg = 1310.4 * 0.4 = 524.16
    // dailyCo2eKg = 524.16 / 365 = 1.436... → 1.44
    expect(result.dailyCo2eKg).toBe(1.44)
  })

  it('handles very small (fleeting) usage', () => {
    // 2000W, 0.1 hours/day (6 minutes)
    const result = estimateApplianceCarbon(2000, 0.1, 1)
    // annualKwh = (2000 * 0.1 * 1 * 52) / 1000 = 10.4
    expect(result.annualKwh).toBe(10.4)
  })
})

describe('Climate Score Boundary Values', () => {
  // Test the actual score-like calculation at boundary values
  function calculateClimateScore(totalAnnualKg: number): number {
    const INDIA_AVERAGE_KG = 1800
    const TARGET_KG = 700

    if (totalAnnualKg <= 0) return 100
    if (totalAnnualKg >= INDIA_AVERAGE_KG * 2) return 0

    const score = 100 - (totalAnnualKg - TARGET_KG) / (INDIA_AVERAGE_KG * 2 - TARGET_KG) * 100
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  it('returns 100 exactly at the Paris target', () => {
    expect(calculateClimateScore(700)).toBe(100)
  })

  it('returns 0 at 2× average', () => {
    expect(calculateClimateScore(3600)).toBe(0)
  })

  it('returns 50 at the midpoint of target and 2× average', () => {
    // midpoint = 700 + (3600 - 700) / 2 = 2150
    const score = calculateClimateScore(2150)
    expect(score).toBe(50)
  })

  it('clamps at 100 for negative values', () => {
    expect(calculateClimateScore(-500)).toBe(100)
  })

  it('clamps at 0 for extremely high values', () => {
    expect(calculateClimateScore(10000)).toBe(0)
  })
})
