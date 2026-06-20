// ============================================================================
// What-If Simulator — scenario definitions + impact models.
//
// 6 scenarios the user can toggle to model future decisions:
//   Solar Panels · Electric Vehicle · Remote Work · LED Upgrade ·
//   Public Transport · Plant-Based Diet
//
// Each scenario defines:
//   - which footprint dimension it affects
//   - the reduction fraction applied to that dimension
//   - upfront cost (USD)
//   - annual cost savings (USD)
//   - payback period (years, computed)
//   - a 10-year projection model
// ============================================================================

import type { TwinDimension } from '@/lib/services/twin.service'

export type ScenarioKey =
  | 'solar'
  | 'ev'
  | 'remote'
  | 'led'
  | 'transit'
  | 'diet'

export type ScenarioDef = {
  key: ScenarioKey
  title: string
  shortTitle: string
  description: string
  icon: string // lucide name
  color: string
  category: string // which dimension it affects
  // Impact model
  reductionPct: number // fraction of the affected dimension's kg reduced (0..1)
  upfrontCostUsd: number // one-time investment
  annualSavingsUsd: number // yearly $ saved on energy/fuel/food
  implementationTime: string // "1-3 months"
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
}

export const SCENARIOS: ScenarioDef[] = [
  {
    key: 'solar',
    title: 'Install Solar Panels',
    shortTitle: 'Solar Panels',
    description:
      'Generate clean electricity from rooftop solar. Eliminates 70-90% of grid electricity emissions for 25+ years.',
    icon: 'Sun',
    color: '#f59e0b',
    category: 'home',
    reductionPct: 0.75,
    upfrontCostUsd: 12000,
    annualSavingsUsd: 1400,
    implementationTime: '2-4 months',
    difficulty: 'HARD',
  },
  {
    key: 'ev',
    title: 'Switch to Electric Vehicle',
    shortTitle: 'Electric Vehicle',
    description:
      'Replace your gas car with an EV. Cuts transport emissions by 60% and fuel costs by 70%, especially on a green tariff.',
    icon: 'Car',
    color: '#0ea5e9',
    category: 'transport',
    reductionPct: 0.60,
    upfrontCostUsd: 8000, // net after trade-in vs gas car
    annualSavingsUsd: 1200,
    implementationTime: '1-2 months',
    difficulty: 'HARD',
  },
  {
    key: 'remote',
    title: 'Work Remotely 3 Days/Week',
    shortTitle: 'Remote Work',
    description:
      'Eliminate 3 commute days per week. Reduces transport emissions by ~60% for commuting, with no upfront cost.',
    icon: 'Home',
    color: '#8b5cf6',
    category: 'transport',
    reductionPct: 0.45,
    upfrontCostUsd: 0,
    annualSavingsUsd: 2400,
    implementationTime: 'Immediate',
    difficulty: 'EASY',
  },
  {
    key: 'led',
    title: 'Upgrade All Lighting to LED',
    shortTitle: 'LED Upgrade',
    description:
      'Replace incandescent and CFL bulbs with LEDs. Uses 75% less energy and lasts 25× longer. Quick win.',
    icon: 'Lightbulb',
    color: '#eab308',
    category: 'appliances',
    reductionPct: 0.20,
    upfrontCostUsd: 200,
    annualSavingsUsd: 180,
    implementationTime: '1 day',
    difficulty: 'EASY',
  },
  {
    key: 'transit',
    title: 'Switch to Public Transport',
    shortTitle: 'Public Transport',
    description:
      'Replace solo driving with bus/rail for commutes. Cuts transport emissions 50% and removes parking + fuel costs.',
    icon: 'Bus',
    color: '#06b6d4',
    category: 'transport',
    reductionPct: 0.50,
    upfrontCostUsd: 100, // monthly pass adjustment
    annualSavingsUsd: 600,
    implementationTime: '1 week',
    difficulty: 'EASY',
  },
  {
    key: 'diet',
    title: 'Adopt Plant-Based Diet',
    shortTitle: 'Plant-Based Diet',
    description:
      'Shift to a plant-based diet 5 days/week. Cuts food footprint by 60% — the single highest-impact dietary change.',
    icon: 'Leaf',
    color: '#10b981',
    category: 'diet',
    reductionPct: 0.60,
    upfrontCostUsd: 0,
    annualSavingsUsd: 400, // plant proteins cheaper than meat
    implementationTime: 'Immediate',
    difficulty: 'MEDIUM',
  },
]

// ============================================================================
// Simulator computation — given the user's twin dimensions and a set of active
// scenarios, compute the before/after totals, savings, payback, and a 10-year
// projection.
// ============================================================================

export type ScenarioResult = {
  scenario: ScenarioDef
  carbonSavedKg: number // annual kg CO₂e saved
  costSavedUsd: number // annual $ saved
  paybackYears: number // years to recoup upfront cost (0 if no cost)
  net10yrUsd: number // 10-year net financial benefit
  newDimensionKg: number // the dimension's new annual kg after the scenario
}

export type SimulationResult = {
  beforeKg: number
  afterKg: number
  totalCarbonSavedKg: number
  totalCostSavedUsd: number
  totalUpfrontUsd: number
  blendedPaybackYears: number
  reductionPct: number
  perScenario: ScenarioResult[]
  timeline: TimelinePoint[]
  comparison: ComparisonBar[]
}

export type TimelinePoint = {
  year: number
  cumulativeCarbonKg: number
  cumulativeCostUsd: number
  netUsd: number // cumulative cost savings minus upfront
}

export type ComparisonBar = {
  label: string
  before: number
  after: number
  color: string
}

/**
 * Run a simulation: compute the impact of a set of active scenarios on the
 * user's twin dimensions.
 *
 * @param dimensions    the user's twin dimensions (home, appliances, etc.)
 * @param activeScenarios  array of active scenario keys
 */
export function runSimulation(
  dimensions: TwinDimension[],
  activeScenarios: ScenarioKey[],
): SimulationResult {
  const beforeKg = dimensions.reduce((s, d) => s + d.annualKg, 0)

  // Apply each scenario's reduction to the matching dimension.
  // Multiple scenarios on the same dimension compound multiplicatively
  // (e.g. remote 45% + transit 50% on transport → 0.55 × 0.50 remaining).
  const dimMultipliers = new Map<string, number>()
  for (const dim of dimensions) {
    dimMultipliers.set(dim.key, 1)
  }

  const perScenario: ScenarioResult[] = []
  let totalCostSavedUsd = 0
  let totalUpfrontUsd = 0

  for (const key of activeScenarios) {
    const scenario = SCENARIOS.find((s) => s.key === key)
    if (!scenario) continue

    const dim = dimensions.find((d) => d.key === scenario.category)
    const dimKg = dim?.annualKg ?? 0

    // The carbon saved is the reduction applied to the CURRENT (post-compound)
    // value of that dimension.
    const currentMultiplier = dimMultipliers.get(scenario.category) ?? 1
    const currentDimKg = dimKg * currentMultiplier
    const carbonSavedKg = currentDimKg * scenario.reductionPct
    const newMultiplier = currentMultiplier * (1 - scenario.reductionPct)
    dimMultipliers.set(scenario.category, newMultiplier)

    const paybackYears =
      scenario.upfrontCostUsd > 0 && scenario.annualSavingsUsd > 0
        ? Math.round((scenario.upfrontCostUsd / scenario.annualSavingsUsd) * 10) / 10
        : 0

    const net10yrUsd =
      scenario.annualSavingsUsd * 10 - scenario.upfrontCostUsd

    perScenario.push({
      scenario,
      carbonSavedKg: Math.round(carbonSavedKg * 10) / 10,
      costSavedUsd: scenario.annualSavingsUsd,
      paybackYears,
      net10yrUsd,
      newDimensionKg: Math.round(currentDimKg * (1 - scenario.reductionPct) * 10) / 10,
    })

    totalCostSavedUsd += scenario.annualSavingsUsd
    totalUpfrontUsd += scenario.upfrontCostUsd
  }

  // Compute the after-state
  const afterKg = dimensions.reduce((s, d) => {
    const mult = dimMultipliers.get(d.key) ?? 1
    return s + d.annualKg * mult
  }, 0)

  const totalCarbonSavedKg = Math.round((beforeKg - afterKg) * 10) / 10
  const blendedPaybackYears =
    totalUpfrontUsd > 0 && totalCostSavedUsd > 0
      ? Math.round((totalUpfrontUsd / totalCostSavedUsd) * 10) / 10
      : 0
  const reductionPct = beforeKg > 0 ? Math.round((totalCarbonSavedKg / beforeKg) * 10) / 10 : 0

  // 10-year timeline
  const timeline: TimelinePoint[] = []
  let cumCarbon = 0
  let cumCost = 0
  for (let year = 0; year <= 10; year++) {
    timeline.push({
      year,
      cumulativeCarbonKg: Math.round(cumCarbon * 10) / 10,
      cumulativeCostUsd: Math.round(cumCost * 10) / 10,
      netUsd: Math.round((cumCost - totalUpfrontUsd) * 10) / 10,
    })
    cumCarbon += totalCarbonSavedKg
    cumCost += totalCostSavedUsd
  }

  // Comparison bars — before vs after per dimension that has an active scenario
  const comparison: ComparisonBar[] = dimensions
    .filter((d) => activeScenarios.some((k) => {
      const s = SCENARIOS.find((x) => x.key === k)
      return s?.category === d.key
    }))
    .map((d) => {
      const mult = dimMultipliers.get(d.key) ?? 1
      return {
        label: d.label,
        before: d.annualKg,
        after: Math.round(d.annualKg * mult * 10) / 10,
        color: d.color,
      }
    })

  return {
    beforeKg: Math.round(beforeKg * 10) / 10,
    afterKg: Math.round(afterKg * 10) / 10,
    totalCarbonSavedKg,
    totalCostSavedUsd,
    totalUpfrontUsd,
    blendedPaybackYears,
    reductionPct,
    perScenario,
    timeline,
    comparison,
  }
}
