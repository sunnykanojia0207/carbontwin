// ============================================================================
// Appliance carbon estimation — deterministic math, NOT AI.
// Given an appliance's wattage and usage pattern, computes annual energy
// consumption (kWh) and CO₂e emissions (kg).
//
// Grid emission factor: 0.4 kg CO₂/kWh (global average, IEA 2023).
// Region-aware factors can be added later via the Appliance.region field.
// ============================================================================

const GRID_FACTOR_KG_PER_KWH = 0.4 // global average

export type ApplianceCarbon = {
  annualKwh: number
  annualCo2eKg: number
  monthlyCo2eKg: number
  dailyCo2eKg: number
}

/**
 * Compute the carbon impact of an appliance from its power + usage.
 *
 * @param watts            rated power in watts
 * @param hoursPerDay      average daily usage hours
 * @param daysPerWeek      days used per week (default 7)
 * @returns                annual/monthly/daily kWh + kg CO₂e
 */
export function estimateApplianceCarbon(
  watts: number,
  hoursPerDay: number,
  daysPerWeek: number = 7,
): ApplianceCarbon {
  // Annual kWh = (W × h/day × days/week × 52 weeks) / 1000
  const annualKwh = (watts * hoursPerDay * daysPerWeek * 52) / 1000
  const annualCo2eKg = annualKwh * GRID_FACTOR_KG_PER_KWH
  return {
    annualKwh: Math.round(annualKwh * 10) / 10,
    annualCo2eKg: Math.round(annualCo2eKg * 10) / 10,
    monthlyCo2eKg: Math.round((annualCo2eKg / 12) * 10) / 10,
    dailyCo2eKg: Math.round((annualCo2eKg / 365) * 100) / 100,
  }
}

/** Human-readable formatter for kg CO₂e. */
export function formatCo2e(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`
  if (kg >= 100) return `${Math.round(kg)}kg`
  return `${kg.toFixed(1)}kg`
}

/** Sum the annual CO₂e of multiple appliance carbon estimates. */
export function totalAnnualCo2e(items: ApplianceCarbon[]): number {
  return Math.round(items.reduce((s, i) => s + i.annualCo2eKg, 0) * 10) / 10
}
