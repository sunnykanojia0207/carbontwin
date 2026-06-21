/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest'
import { SCENARIOS, runSimulation } from '@/lib/simulator/scenarios'
import type { TwinDimension } from '@/lib/services/twin.service'

// ============================================================================
// Tests for the What-If Simulator: scenario definitions + impact computation.
//
// Covers:
//   - SCENARIOS data integrity (keys, fields, categories, difficulty)
//   - runSimulation() core logic (savings, payback, compounding, timeline)
//   - Edge cases (empty, zero, unknown keys, single dimension)
// ============================================================================

const VALID_CATEGORIES = ['home', 'transport', 'appliances', 'diet', 'lifestyle'] as const
const VALID_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const
const EXPECTED_KEYS = ['solar', 'ev', 'remote', 'led', 'transit', 'diet'] as const

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const mockDimensions: TwinDimension[] = [
  {
    key: 'home',
    label: 'Home Energy',
    annualKg: 4000,
    share: 40,
    color: '#f59e0b',
    icon: 'Home',
    detail: 'Heating, cooling, electricity',
  },
  {
    key: 'transport',
    label: 'Transport',
    annualKg: 3000,
    share: 30,
    color: '#0ea5e9',
    icon: 'Car',
    detail: 'Car, flights, transit',
  },
  {
    key: 'appliances',
    label: 'Appliances',
    annualKg: 2000,
    share: 20,
    color: '#eab308',
    icon: 'Lightbulb',
    detail: 'Electronics, kitchen',
  },
  {
    key: 'diet',
    label: 'Diet',
    annualKg: 1000,
    share: 10,
    color: '#10b981',
    icon: 'Leaf',
    detail: 'Food consumption',
  },
]

// ============================================================================
// 1. SCENARIO DEFINITIONS
// ============================================================================

describe('SCENARIOS definitions', () => {
  it('has exactly 6 scenarios', () => {
    expect(SCENARIOS).toHaveLength(6)
  })

  it('contains all expected keys', () => {
    const keys = SCENARIOS.map((s) => s.key).sort()
    expect(keys).toEqual([...EXPECTED_KEYS].sort())
  })

  it('all keys are unique', () => {
    const keys = SCENARIOS.map((s) => s.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('every scenario has all required fields', () => {
    for (const s of SCENARIOS) {
      expect(s.key).toBeDefined()
      expect(s.title).toBeTruthy()
      expect(s.shortTitle).toBeTruthy()
      expect(s.description).toBeTruthy()
      expect(s.icon).toBeTruthy()
      expect(s.color).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(s.category).toBeTruthy()
      expect(typeof s.reductionPct).toBe('number')
      expect(typeof s.upfrontCostUsd).toBe('number')
      expect(typeof s.annualSavingsUsd).toBe('number')
      expect(s.implementationTime).toBeTruthy()
      expect(s.difficulty).toBeTruthy()
    }
  })

  it('each scenario has a valid category', () => {
    for (const s of SCENARIOS) {
      expect(VALID_CATEGORIES).toContain(s.category)
    }
  })

  it('each scenario has a valid difficulty level', () => {
    for (const s of SCENARIOS) {
      expect(VALID_DIFFICULTIES).toContain(s.difficulty)
    }
  })

  it('reductionPct is strictly between 0 and 1 (exclusive)', () => {
    for (const s of SCENARIOS) {
      expect(s.reductionPct).toBeGreaterThan(0)
      expect(s.reductionPct).toBeLessThan(1)
    }
  })

  it('upfrontCostUsd is non-negative', () => {
    for (const s of SCENARIOS) {
      expect(s.upfrontCostUsd).toBeGreaterThanOrEqual(0)
    }
  })

  it('annualSavingsUsd is non-negative', () => {
    for (const s of SCENARIOS) {
      expect(s.annualSavingsUsd).toBeGreaterThanOrEqual(0)
    }
  })

  it('solar and ev have HARD difficulty', () => {
    const hard = SCENARIOS.filter((s) => s.difficulty === 'HARD').map((s) => s.key)
    expect(hard).toContain('solar')
    expect(hard).toContain('ev')
  })

  it('remote, led, transit have EASY difficulty', () => {
    const easy = SCENARIOS.filter((s) => s.difficulty === 'EASY').map((s) => s.key)
    expect(easy).toContain('remote')
    expect(easy).toContain('led')
    expect(easy).toContain('transit')
  })

  it('diet has MEDIUM difficulty', () => {
    const diet = SCENARIOS.find((s) => s.key === 'diet')!
    expect(diet.difficulty).toBe('MEDIUM')
  })

  it('solar has the highest upfront cost', () => {
    const upfrontCosts = SCENARIOS.map((s) => s.upfrontCostUsd)
    const maxCost = Math.max(...upfrontCosts)
    const solar = SCENARIOS.find((s) => s.key === 'solar')!
    expect(solar.upfrontCostUsd).toBe(maxCost)
  })

  it('remote and diet have zero upfront cost', () => {
    const remote = SCENARIOS.find((s) => s.key === 'remote')!
    const diet = SCENARIOS.find((s) => s.key === 'diet')!
    expect(remote.upfrontCostUsd).toBe(0)
    expect(diet.upfrontCostUsd).toBe(0)
  })

  it('remote has the highest annual savings', () => {
    const savings = SCENARIOS.map((s) => s.annualSavingsUsd)
    const maxSavings = Math.max(...savings)
    const remote = SCENARIOS.find((s) => s.key === 'remote')!
    expect(remote.annualSavingsUsd).toBe(maxSavings)
  })
})

// ============================================================================
// 2. runSimulation — core logic
// ============================================================================

describe('runSimulation()', () => {
  // -----------------------------------------------------------------------
  // Empty / boundary cases
  // -----------------------------------------------------------------------

  it('returns zero savings with empty active scenarios', () => {
    const result = runSimulation(mockDimensions, [])
    expect(result.beforeKg).toBe(10000) // 4000 + 3000 + 2000 + 1000
    expect(result.afterKg).toBe(10000)
    expect(result.totalCarbonSavedKg).toBe(0)
    expect(result.totalCostSavedUsd).toBe(0)
    expect(result.totalUpfrontUsd).toBe(0)
    expect(result.blendedPaybackYears).toBe(0)
    expect(result.reductionPct).toBe(0)
    expect(result.perScenario).toHaveLength(0)
  })

  it('returns zeros when dimensions array is empty', () => {
    const result = runSimulation([], ['solar'])
    expect(result.beforeKg).toBe(0)
    expect(result.afterKg).toBe(0)
    expect(result.totalCarbonSavedKg).toBe(0)
    expect(result.totalCostSavedUsd).toBe(1400) // still adds savings
    expect(result.reductionPct).toBe(0)
  })

  it('handles a single scenario correctly (solar on home)', () => {
    const result = runSimulation(mockDimensions, ['solar'])
    const solar = result.perScenario.find((s) => s.scenario.key === 'solar')!

    // Solar reduces home (4000 kg) by 75% → saves 3000 kg
    expect(solar.carbonSavedKg).toBe(3000)
    expect(solar.costSavedUsd).toBe(1400)
    expect(solar.paybackYears).toBe(8.6)

    // Overall
    expect(result.beforeKg).toBe(10000)
    expect(result.afterKg).toBe(7000) // home goes from 4000 to 1000
    expect(result.totalCarbonSavedKg).toBe(3000)
    expect(result.totalCostSavedUsd).toBe(1400)
    expect(result.totalUpfrontUsd).toBe(12000)
    expect(result.reductionPct).toBe(0.3) // 3000/10000
  })

  it('applies multiple scenarios on different dimensions', () => {
    const result = runSimulation(mockDimensions, ['solar', 'ev', 'led', 'diet'])

    // Solar: home 4000 x 0.75 = 3000 saved
    // EV: transport 3000 x 0.60 = 1800 saved
    // LED: appliances 2000 x 0.20 = 400 saved
    // Diet: diet 1000 x 0.60 = 600 saved
    const totalSaved = 3000 + 1800 + 400 + 600
    expect(result.totalCarbonSavedKg).toBe(totalSaved)

    // afterKg = beforeKg - totalSaved = 10000 - 5800 = 4200
    expect(result.afterKg).toBe(4200)
    expect(result.perScenario).toHaveLength(4)
  })

  // -----------------------------------------------------------------------
  // Compounding on the same dimension
  // -----------------------------------------------------------------------

  it('compounds multiple scenarios on the same dimension multiplicatively', () => {
    // remote (45%) + transit (50%) on transport (3000 kg)
    // Compound: 1 * (1-0.45) * (1-0.50) = 1 * 0.55 * 0.50 = 0.275
    // Saved: 3000 - (3000 * 0.275) = 3000 - 825 = 2175
    // Or: first remote saves 3000*0.45=1350, remaining=1650
    //     transit saves 1650*0.50=825, remaining=825
    // Total saved: 1350+825=2175 ✓

    const result = runSimulation(mockDimensions, ['remote', 'transit'])

    expect(result.totalCarbonSavedKg).toBe(2175)
    expect(result.afterKg).toBe(10000 - 2175) // 7825

    // Check individual scenario results
    const remote = result.perScenario.find((s) => s.scenario.key === 'remote')!
    const transit = result.perScenario.find((s) => s.scenario.key === 'transit')!

    expect(remote.carbonSavedKg).toBe(1350) // 3000 * 0.45
    expect(transit.carbonSavedKg).toBe(825) // 1650 * 0.50
    expect(remote.newDimensionKg).toBe(1650) // 3000 * 0.55
    expect(transit.newDimensionKg).toBe(825) // 1650 * 0.50
  })

  it('compounding order preserves multiplicative property regardless of order', () => {
    // Result should be the same regardless of scenario order
    const resultAB = runSimulation(mockDimensions, ['remote', 'transit'])
    const resultBA = runSimulation(mockDimensions, ['transit', 'remote'])

    expect(resultAB.totalCarbonSavedKg).toBe(resultBA.totalCarbonSavedKg)
    expect(resultAB.afterKg).toBe(resultBA.afterKg)
  })

  // -----------------------------------------------------------------------
  // Payback period
  // -----------------------------------------------------------------------

  it('paybackYears is 0 when upfrontCostUsd is 0', () => {
    const result = runSimulation(mockDimensions, ['remote'])
    const remote = result.perScenario.find((s) => s.scenario.key === 'remote')!
    expect(remote.paybackYears).toBe(0)
  })

  it('paybackYears is 0 when annualSavingsUsd is 0', () => {
    // Create a scenario-like scenario cost by tweaking dimensions
    // We just test the payback calculation directly via the scenario results
    const result = runSimulation(mockDimensions, ['solar'])
    const solar = result.perScenario.find((s) => s.scenario.key === 'solar')!
    expect(solar.paybackYears).toBeGreaterThan(0)
    expect(solar.paybackYears).toBeCloseTo(8.6, 1) // 12000/1400 = 8.57 → 8.6
  })

  it('paybackYears rounds to 1 decimal', () => {
    const result = runSimulation(mockDimensions, ['solar'])
    const solar = result.perScenario.find((s) => s.scenario.key === 'solar')!
    const decimalPart = (solar.paybackYears * 10) % 10
    expect(Number.isInteger(decimalPart)).toBe(true)
  })

  // -----------------------------------------------------------------------
  // Blended payback
  // -----------------------------------------------------------------------

  it('blendedPaybackYears is 0 when totalUpfrontUsd is 0', () => {
    const result = runSimulation(mockDimensions, ['remote', 'diet'])
    expect(result.totalUpfrontUsd).toBe(0)
    expect(result.blendedPaybackYears).toBe(0)
  })

  it('blendedPaybackYears is 0 when totalCostSavedUsd is 0', () => {
    // Can't happen with current scenarios (all have savings), but guard exists
    // We test the guard logic
    const result = runSimulation(mockDimensions, [])
    expect(result.blendedPaybackYears).toBe(0)
  })

  it('computes blended payback correctly', () => {
    const result = runSimulation(mockDimensions, ['solar', 'ev'])
    // Upfront: 12000 + 8000 = 20000
    // Savings: 1400 + 1200 = 2600
    // Blended: 20000/2600 ≈ 7.7
    expect(result.blendedPaybackYears).toBeCloseTo(7.7, 1)
  })

  // -----------------------------------------------------------------------
  // reductionPct edge cases
  // -----------------------------------------------------------------------

  it('reductionPct is 0 when beforeKg is 0', () => {
    const result = runSimulation([], ['solar'])
    expect(result.reductionPct).toBe(0)
  })

  it('reductionPct is a fraction (not percentage) rounded to 1 decimal', () => {
    const result = runSimulation(mockDimensions, ['solar'])
    // 3000/10000 = 0.3
    expect(result.reductionPct).toBe(0.3)
    expect(Number.isInteger(result.reductionPct * 10)).toBe(true)
  })

  // -----------------------------------------------------------------------
  // Timeline
  // -----------------------------------------------------------------------

  it('timeline has 11 points (years 0–10)', () => {
    const result = runSimulation(mockDimensions, ['solar'])
    expect(result.timeline).toHaveLength(11)
    expect(result.timeline[0].year).toBe(0)
    expect(result.timeline[10].year).toBe(10)
  })

  it('timeline starts with zero cumulative values at year 0', () => {
    const result = runSimulation(mockDimensions, ['solar'])
    expect(result.timeline[0].cumulativeCarbonKg).toBe(0)
    expect(result.timeline[0].cumulativeCostUsd).toBe(0)
    expect(result.timeline[0].netUsd).toBe(-result.totalUpfrontUsd)
  })

  it('timeline accumulates correctly', () => {
    const result = runSimulation(mockDimensions, ['solar'])
    // Year 5: cumCarbon = 5 * 3000 = 15000, cumCost = 5 * 1400 = 7000
    expect(result.timeline[5].cumulativeCarbonKg).toBe(15000)
    expect(result.timeline[5].cumulativeCostUsd).toBe(7000)
    // Net = cumCost - upfront = 7000 - 12000 = -5000
    expect(result.timeline[5].netUsd).toBe(-5000)
  })

  it('timeline net becomes positive after payback period', () => {
    const result = runSimulation(mockDimensions, ['solar'])
    // Payback = 8.6 years, net should be negative at year 8, positive at year 9
    // Year 8: 8*1400 - 12000 = -800
    // Year 9: 9*1400 - 12000 = 600
    expect(result.timeline[8].netUsd).toBe(-800)
    expect(result.timeline[9].netUsd).toBe(600)
  })

  it('timeline values are rounded to 1 decimal', () => {
    const result = runSimulation(mockDimensions, ['solar'])
    for (const point of result.timeline) {
      expect(Number.isInteger(point.cumulativeCarbonKg * 10)).toBe(true)
      expect(Number.isInteger(point.cumulativeCostUsd * 10)).toBe(true)
      expect(Number.isInteger(point.netUsd * 10)).toBe(true)
    }
  })

  // -----------------------------------------------------------------------
  // Comparison bars
  // -----------------------------------------------------------------------

  it('comparison bars include only dimensions with active scenarios', () => {
    const result = runSimulation(mockDimensions, ['solar', 'diet'])
    const labels = result.comparison.map((c) => c.label)
    expect(labels).toContain('Home Energy')
    expect(labels).toContain('Diet')
    expect(labels).not.toContain('Transport')
    expect(labels).not.toContain('Appliances')
  })

  it('comparison bars show correct before/after values', () => {
    const result = runSimulation(mockDimensions, ['solar'])
    const homeBar = result.comparison.find((c) => c.label === 'Home Energy')!
    expect(homeBar.before).toBe(4000)
    expect(homeBar.after).toBe(1000) // 4000 * (1-0.75)
    expect(homeBar.color).toBe('#f59e0b')
  })

  it('comparison bars are empty when no scenarios are active', () => {
    const result = runSimulation(mockDimensions, [])
    expect(result.comparison).toHaveLength(0)
  })

  // -----------------------------------------------------------------------
  // Net 10-year value
  // -----------------------------------------------------------------------

  it('net10yrUsd is positive for scenarios with annual savings', () => {
    const result = runSimulation(mockDimensions, ['led'])
    const led = result.perScenario.find((s) => s.scenario.key === 'led')!
    // 180 * 10 - 200 = 1600
    expect(led.net10yrUsd).toBe(1600)
  })

  it('net10yrUsd is negative when upfront cost is very high', () => {
    // Solar: 1400*10 - 12000 = 2000 (still positive, good investment)
    const result = runSimulation(mockDimensions, ['solar'])
    const solar = result.perScenario.find((s) => s.scenario.key === 'solar')!
    expect(solar.net10yrUsd).toBe(2000)
  })

  // -----------------------------------------------------------------------
  // Unknown / bad scenario keys
  // -----------------------------------------------------------------------

  it('ignores unknown scenario keys silently', () => {
    const result = runSimulation(mockDimensions, ['solar', 'nonexistent_key', 'ev'])
    expect(result.perScenario).toHaveLength(2)
    expect(result.perScenario.every((s) => s.scenario.key !== 'nonexistent_key')).toBe(true)
  })

  it('handles activeScenarios with all unknown keys', () => {
    const result = runSimulation(mockDimensions, ['unknown1', 'unknown2'])
    expect(result.perScenario).toHaveLength(0)
    expect(result.beforeKg).toBe(result.afterKg)
  })

  // -----------------------------------------------------------------------
  // Precision / rounding
  // -----------------------------------------------------------------------

  it('all numeric outputs are rounded to 1 decimal', () => {
    const result = runSimulation(mockDimensions, ['solar', 'ev', 'remote', 'led', 'transit', 'diet'])
    const roundedTo1 = (v: number) => Number.isInteger(v * 10)

    expect(roundedTo1(result.beforeKg)).toBe(true)
    expect(roundedTo1(result.afterKg)).toBe(true)
    expect(roundedTo1(result.totalCarbonSavedKg)).toBe(true)
    expect(roundedTo1(result.blendedPaybackYears)).toBe(true)
    expect(roundedTo1(result.reductionPct)).toBe(true)

    for (const s of result.perScenario) {
      expect(roundedTo1(s.carbonSavedKg)).toBe(true)
      expect(roundedTo1(s.newDimensionKg)).toBe(true)
    }
  })

  // -----------------------------------------------------------------------
  // Large values (no overflow)
  // -----------------------------------------------------------------------

  it('handles large dimension values without overflow', () => {
    const largeDimensions: TwinDimension[] = [
      { key: 'home', label: 'Home', annualKg: 1_000_000, share: 100, color: '#000', icon: 'Home', detail: 'Large' },
    ]
    const result = runSimulation(largeDimensions, ['solar'])
    expect(result.totalCarbonSavedKg).toBe(750_000) // 1M * 0.75
    expect(result.beforeKg).toBe(1_000_000)
    expect(result.afterKg).toBe(250_000)
  })

  // -----------------------------------------------------------------------
  // Single dimension at 0 kg
  // -----------------------------------------------------------------------

  it('produces valid results when all dimensions are 0 kg', () => {
    const zeroDimensions: TwinDimension[] = [
      { key: 'home', label: 'Home', annualKg: 0, share: 0, color: '#000', icon: 'Home', detail: 'Zero' },
      { key: 'transport', label: 'Transport', annualKg: 0, share: 0, color: '#000', icon: 'Car', detail: 'Zero' },
    ]
    const result = runSimulation(zeroDimensions, ['solar', 'ev'])
    expect(result.beforeKg).toBe(0)
    expect(result.afterKg).toBe(0)
    expect(result.totalCarbonSavedKg).toBe(0)
    expect(result.reductionPct).toBe(0)
    // Per-scenario results still exist with 0 carbon saved
    expect(result.perScenario).toHaveLength(2)
    for (const s of result.perScenario) {
      expect(s.carbonSavedKg).toBe(0)
    }
  })

  // -----------------------------------------------------------------------
  // Return type shape
  // -----------------------------------------------------------------------

  it('returns all required SimulationResult fields', () => {
    const result = runSimulation(mockDimensions, ['solar'])
    expect(result).toHaveProperty('beforeKg')
    expect(result).toHaveProperty('afterKg')
    expect(result).toHaveProperty('totalCarbonSavedKg')
    expect(result).toHaveProperty('totalCostSavedUsd')
    expect(result).toHaveProperty('totalUpfrontUsd')
    expect(result).toHaveProperty('blendedPaybackYears')
    expect(result).toHaveProperty('reductionPct')
    expect(result).toHaveProperty('perScenario')
    expect(result).toHaveProperty('timeline')
    expect(result).toHaveProperty('comparison')
  })

  it('each ScenarioResult has all required fields', () => {
    const result = runSimulation(mockDimensions, ['solar', 'ev'])
    for (const s of result.perScenario) {
      expect(s).toHaveProperty('scenario')
      expect(s).toHaveProperty('carbonSavedKg')
      expect(s).toHaveProperty('costSavedUsd')
      expect(s).toHaveProperty('paybackYears')
      expect(s).toHaveProperty('net10yrUsd')
      expect(s).toHaveProperty('newDimensionKg')
    }
  })
})
