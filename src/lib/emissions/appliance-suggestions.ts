// ============================================================================
// Appliance cost estimation + improvement suggestions.
// Deterministic math (not AI) for cost; rule-based suggestions by type.
// ============================================================================

import type { ApplianceCarbon } from './appliance-calc'

const ELECTRICITY_RATE_USD_PER_KWH = 0.15 // US average 2024

export type ApplianceCost = {
  annualUsd: number
  monthlyUsd: number
  dailyUsd: number
}

export function estimateApplianceCost(annualKwh: number): ApplianceCost {
  const annualUsd = annualKwh * ELECTRICITY_RATE_USD_PER_KWH
  return {
    annualUsd: Math.round(annualUsd * 10) / 10,
    monthlyUsd: Math.round((annualUsd / 12) * 10) / 10,
    dailyUsd: Math.round((annualUsd / 365) * 100) / 100,
  }
}

export function formatCost(usd: number): string {
  if (usd >= 1000) return `$${(usd / 1000).toFixed(1)}k`
  if (usd >= 100) return `$${Math.round(usd)}`
  return `$${usd.toFixed(0)}`
}

// ============================================================================
// Improvement suggestions — rule-based, keyed by appliance type.
// Each suggestion includes a potential savings estimate (kg CO₂e/yr and $/yr).
// ============================================================================

export type ImprovementSuggestion = {
  title: string
  description: string
  potentialReductionPct: number // 0..1 fraction of this appliance's footprint
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  category: 'EFFICIENCY' | 'BEHAVIOR' | 'UPGRADE'
}

const SUGGESTIONS_BY_TYPE: Record<string, ImprovementSuggestion[]> = {
  HVAC: [
    {
      title: 'Raise AC temperature by 2°C',
      description: 'Each degree saves ~6% on cooling. 2°C could cut 12% of this unit\'s footprint.',
      potentialReductionPct: 0.12,
      difficulty: 'EASY',
      category: 'BEHAVIOR',
    },
    {
      title: 'Install a programmable thermostat',
      description: 'Auto-adjust when away or asleep. Saves ~10% on heating and cooling.',
      potentialReductionPct: 0.10,
      difficulty: 'MEDIUM',
      category: 'UPGRADE',
    },
    {
      title: 'Service/clean filters quarterly',
      description: 'Dirty filters force 15% more energy use. A 5-min fix, quarterly.',
      potentialReductionPct: 0.05,
      difficulty: 'EASY',
      category: 'EFFICIENCY',
    },
  ],
  REFRIGERATION: [
    {
      title: 'Check door seals',
      description: 'Worn seals let cold air escape, adding up to 10% to energy use.',
      potentialReductionPct: 0.08,
      difficulty: 'EASY',
      category: 'EFFICIENCY',
    },
    {
      title: 'Set temperature to 4°C (not colder)',
      description: 'Every degree below 4°C adds ~5% energy. Optimal is 4°C fridge, -18°C freezer.',
      potentialReductionPct: 0.05,
      difficulty: 'EASY',
      category: 'BEHAVIOR',
    },
    {
      title: 'Consider an inverter model at replacement',
      description: 'Modern inverter fridges use 30% less energy than older compressor types.',
      potentialReductionPct: 0.30,
      difficulty: 'HARD',
      category: 'UPGRADE',
    },
  ],
  LAUNDRY: [
    {
      title: 'Wash with cold water',
      description: '90% of a washer\'s energy heats water. Cold washes cut nearly all of it.',
      potentialReductionPct: 0.80,
      difficulty: 'EASY',
      category: 'BEHAVIOR',
    },
    {
      title: 'Air-dry when possible',
      description: 'Skip the dryer once a week to cut ~15% of laundry energy.',
      potentialReductionPct: 0.15,
      difficulty: 'EASY',
      category: 'BEHAVIOR',
    },
  ],
  KITCHEN: [
    {
      title: 'Use lids on pots',
      description: 'Trapping heat reduces cooking time and energy by ~20%.',
      potentialReductionPct: 0.20,
      difficulty: 'EASY',
      category: 'BEHAVIOR',
    },
    {
      title: 'Batch-cook and reheat',
      description: 'Reheating uses less energy than cooking from scratch each time.',
      potentialReductionPct: 0.10,
      difficulty: 'EASY',
      category: 'BEHAVIOR',
    },
    {
      title: 'Match pan size to burner',
      description: 'Mismatched pans waste ~25% of the heat. Right-size for efficiency.',
      potentialReductionPct: 0.15,
      difficulty: 'EASY',
      category: 'EFFICIENCY',
    },
  ],
  ELECTRONICS: [
    {
      title: 'Use a smart power strip',
      description: 'Kills phantom load. Electronics draw 5-10% power even when "off".',
      potentialReductionPct: 0.08,
      difficulty: 'EASY',
      category: 'UPGRADE',
    },
    {
      title: 'Enable auto-sleep / eco mode',
      description: 'Most devices idle at high power. Auto-sleep can halve standby energy.',
      potentialReductionPct: 0.15,
      difficulty: 'EASY',
      category: 'BEHAVIOR',
    },
    {
      title: 'Right-size your display brightness',
      description: 'Reducing brightness to 70% cuts display energy by ~20%.',
      potentialReductionPct: 0.10,
      difficulty: 'EASY',
      category: 'BEHAVIOR',
    },
  ],
  LIGHTING: [
    {
      title: 'Switch to LED (if not already)',
      description: 'LEDs use 75% less energy than incandescents and last 25× longer.',
      potentialReductionPct: 0.75,
      difficulty: 'EASY',
      category: 'UPGRADE',
    },
    {
      title: 'Add motion sensors in low-traffic areas',
      description: 'Auto-off in hallways, closets, and bathrooms saves ~30% of lighting energy.',
      potentialReductionPct: 0.30,
      difficulty: 'MEDIUM',
      category: 'UPGRADE',
    },
    {
      title: 'Use natural light during the day',
      description: 'Opening blinds costs nothing and cuts daytime lighting to zero.',
      potentialReductionPct: 0.20,
      difficulty: 'EASY',
      category: 'BEHAVIOR',
    },
  ],
  WATER_HEATING: [
    {
      title: 'Lower thermostat to 50°C',
      description: 'Each 5°C reduction saves ~5% on water heating energy.',
      potentialReductionPct: 0.08,
      difficulty: 'EASY',
      category: 'BEHAVIOR',
    },
    {
      title: 'Install low-flow showerheads',
      description: 'Cuts hot water use by ~25% without noticing the difference.',
      potentialReductionPct: 0.20,
      difficulty: 'MEDIUM',
      category: 'UPGRADE',
    },
    {
      title: 'Insulate the tank and pipes',
      description: 'Reduces standby heat loss by 25-45%. A one-time, high-ROI fix.',
      potentialReductionPct: 0.12,
      difficulty: 'MEDIUM',
      category: 'EFFICIENCY',
    },
  ],
  OTHER: [
    {
      title: 'Unplug when not in use',
      description: 'Phantom load can add 5-10% to any plugged-in device\'s energy bill.',
      potentialReductionPct: 0.08,
      difficulty: 'EASY',
      category: 'BEHAVIOR',
    },
    {
      title: 'Audit with a kill-a-watt meter',
      description: 'Identify the hidden high-draw devices in your home for targeted action.',
      potentialReductionPct: 0.10,
      difficulty: 'MEDIUM',
      category: 'EFFICIENCY',
    },
  ],
}

/**
 * Get improvement suggestions for an appliance type.
 * Returns up to 3 suggestions, sorted by potential reduction (descending).
 */
export function getSuggestionsForType(type: string): ImprovementSuggestion[] {
  const suggestions = SUGGESTIONS_BY_TYPE[type] ?? SUGGESTIONS_BY_TYPE.OTHER
  return [...suggestions].sort((a, b) => b.potentialReductionPct - a.potentialReductionPct).slice(0, 3)
}

/**
 * Compute the potential savings (in kg CO₂e/yr and $/yr) for a suggestion
 * applied to a specific appliance.
 */
export function computeSuggestionSavings(
  suggestion: ImprovementSuggestion,
  carbon: ApplianceCarbon,
  cost: ApplianceCost,
): { co2eKgPerYear: number; usdPerYear: number } {
  return {
    co2eKgPerYear: Math.round(carbon.annualCo2eKg * suggestion.potentialReductionPct * 10) / 10,
    usdPerYear: Math.round(cost.annualUsd * suggestion.potentialReductionPct * 10) / 10,
  }
}
