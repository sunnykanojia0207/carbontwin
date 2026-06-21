import { db } from '@/lib/db'
import {
  estimateApplianceCarbon,
} from '@/lib/emissions/appliance-calc'
import {
  estimateApplianceCost,
  getSuggestionsForType,
  computeSuggestionSavings,
  type ImprovementSuggestion,
} from '@/lib/emissions/appliance-suggestions'

// ============================================================================
// Results data service — server-only. Loads the latest appliance scan (or a
// specific one by scanId) and computes the full results DTO:
//   - per-appliance carbon + cost + suggestions
//   - aggregate KPIs
//   - impact breakdown by type
//   - top emitters ranking
//   - savings opportunities (aggregated)
//   - weekly trend projection
// ============================================================================

export type ApplianceResult = {
  id: string
  name: string
  type: string
  watts: number
  hoursPerDay: number
  daysPerWeek: number
  confidence: number
  notes: string
  carbon: ReturnType<typeof estimateApplianceCarbon>
  cost: ReturnType<typeof estimateApplianceCost>
  suggestions: Array<{
    suggestion: ImprovementSuggestion
    savings: ReturnType<typeof computeSuggestionSavings>
  }>
}

export type ImpactSlice = {
  type: string
  name: string
  kg: number
  share: number
  color: string
  cost: number
}

export type SavingsOpportunity = {
  applianceName: string
  applianceType: string
  title: string
  description: string
  difficulty: string
  co2eKgPerYear: number
  usdPerYear: number
}

export type TrendPoint = {
  week: string
  current: number
  optimized: number | null
}

export type ResultsData = {
  isEmpty: boolean
  scan: {
    id: string
    roomType: string
    summary: string
    createdAt: Date
    aiModel: string | null
  } | null
  appliances: ApplianceResult[]
  kpis: {
    totalCo2eKg: number
    totalCostUsd: number
    applianceCount: number
    totalKwh: number
    potentialSavingsKg: number
    potentialSavingsUsd: number
  }
  impactBreakdown: ImpactSlice[]
  topEmitters: ApplianceResult[]
  savingsOpportunities: SavingsOpportunity[]
  trend: TrendPoint[]
}

const TYPE_META: Record<string, { name: string; color: string }> = {
  HVAC: { name: 'HVAC', color: '#0ea5e9' },
  REFRIGERATION: { name: 'Refrigeration', color: '#06b6d4' },
  LAUNDRY: { name: 'Laundry', color: '#8b5cf6' },
  KITCHEN: { name: 'Kitchen', color: '#f59e0b' },
  ELECTRONICS: { name: 'Electronics', color: '#6366f1' },
  LIGHTING: { name: 'Lighting', color: '#eab308' },
  WATER_HEATING: { name: 'Water Heating', color: '#ef4444' },
  OTHER: { name: 'Other', color: '#94a3b8' },
}

function typeMeta(type: string) {
  return TYPE_META[type] ?? TYPE_META.OTHER
}

/**
 * Load the full results dataset for a user's latest appliance scan,
 * or a specific scan if scanId is provided.
 */
export async function getResultsData(
  userId: string,
  scanId?: string,
): Promise<ResultsData> {
  // Find the scan to show — specific scanId, or the latest PHOTO scan.
  const scan = scanId
    ? await db.scan.findFirst({
        where: { id: scanId, userId, deletedAt: null, type: 'PHOTO' },
        select: {
          id: true,
          status: true,
          createdAt: true,
          aiModel: true,
          promptVersion: true,
          inputMeta: true,
          detections: {
            where: { deletedAt: null },
            select: {
              id: true,
              label: true,
              categorySlug: true,
              amount: true,
              unit: true,
              co2eKg: true,
              confidence: true,
              sourceSnippet: true,
              aiMetadata: true,
            },
          },
        },
      })
    : await db.scan.findFirst({
        where: { userId, deletedAt: null, type: 'PHOTO', status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          createdAt: true,
          aiModel: true,
          promptVersion: true,
          inputMeta: true,
          detections: {
            where: { deletedAt: null },
            select: {
              id: true,
              label: true,
              categorySlug: true,
              amount: true,
              unit: true,
              co2eKg: true,
              confidence: true,
              sourceSnippet: true,
              aiMetadata: true,
            },
          },
        },
      })

  if (!scan || scan.detections.length === 0) {
    return {
      isEmpty: true,
      scan: null,
      appliances: [],
      kpis: {
        totalCo2eKg: 0,
        totalCostUsd: 0,
        applianceCount: 0,
        totalKwh: 0,
        potentialSavingsKg: 0,
        potentialSavingsUsd: 0,
      },
      impactBreakdown: [],
      topEmitters: [],
      savingsOpportunities: [],
      trend: [],
    }
  }

  // Build per-appliance results from detections.
  const appliances: ApplianceResult[] = scan.detections.map((det) => {
    const meta = (det.aiMetadata ?? {}) as {
      type?: string
      estimatedWatts?: number
      estimatedHoursPerDay?: number
    }
    const type = meta.type ?? det.categorySlug.split('.').pop()?.toUpperCase() ?? 'OTHER'
    const watts = meta.estimatedWatts ?? det.amount ?? 0
    const hoursPerDay = meta.estimatedHoursPerDay ?? 4
    const carbon = estimateApplianceCarbon(watts, hoursPerDay, 7)
    const cost = estimateApplianceCost(carbon.annualKwh)
    const suggestions = getSuggestionsForType(type).map((suggestion) => ({
      suggestion,
      savings: computeSuggestionSavings(suggestion, carbon, cost),
    }))

    return {
      id: det.id,
      name: det.label,
      type,
      watts,
      hoursPerDay,
      daysPerWeek: 7,
      confidence: det.confidence,
      notes: det.sourceSnippet ?? '',
      carbon,
      cost,
      suggestions,
    }
  })

  // --- KPIs ---
  const totalCo2eKg = appliances.reduce((s, a) => s + a.carbon.annualCo2eKg, 0)
  const totalCostUsd = appliances.reduce((s, a) => s + a.cost.annualUsd, 0)
  const totalKwh = appliances.reduce((s, a) => s + a.carbon.annualKwh, 0)
  const potentialSavingsKg = appliances.reduce(
    (s, a) => s + (a.suggestions[0]?.savings.co2eKgPerYear ?? 0),
    0,
  )
  const potentialSavingsUsd = appliances.reduce(
    (s, a) => s + (a.suggestions[0]?.savings.usdPerYear ?? 0),
    0,
  )

  // --- Impact breakdown by type ---
  const typeMap = new Map<string, { kg: number; cost: number }>()
  for (const a of appliances) {
    const existing = typeMap.get(a.type) ?? { kg: 0, cost: 0 }
    existing.kg += a.carbon.annualCo2eKg
    existing.cost += a.cost.annualUsd
    typeMap.set(a.type, existing)
  }
  const impactBreakdown: ImpactSlice[] = Array.from(typeMap.entries())
    .map(([type, { kg, cost }]) => {
      const meta = typeMeta(type)
      return {
        type,
        name: meta.name,
        kg: Math.round(kg * 10) / 10,
        share: totalCo2eKg > 0 ? Math.round((kg / totalCo2eKg) * 100) : 0,
        color: meta.color,
        cost: Math.round(cost * 10) / 10,
      }
    })
    .sort((a, b) => b.kg - a.kg)

  // --- Top emitters (sorted by CO₂e, top 5) ---
  const topEmitters = [...appliances]
    .sort((a, b) => b.carbon.annualCo2eKg - a.carbon.annualCo2eKg)
    .slice(0, 5)

  // --- Savings opportunities (flatten top suggestion per appliance) ---
  const savingsOpportunities: SavingsOpportunity[] = appliances
    .flatMap((a) => {
      const top = a.suggestions[0]
      if (!top) return []
      return [{
        applianceName: a.name,
        applianceType: a.type,
        title: top.suggestion.title,
        description: top.suggestion.description,
        difficulty: top.suggestion.difficulty,
        co2eKgPerYear: top.savings.co2eKgPerYear,
        usdPerYear: top.savings.usdPerYear,
      }]
    })
    .sort((a, b) => b.co2eKgPerYear - a.co2eKgPerYear)

  // --- Weekly trend projection (12 weeks: current vs optimized) ---
  const weeklyCurrentKg = totalCo2eKg / 52
  const weeklyOptimizedKg =
    (totalCo2eKg - potentialSavingsKg) / 52
  const trend: TrendPoint[] = []
  for (let w = 0; w < 12; w++) {
    const date = new Date()
    date.setDate(date.getDate() + w * 7)
    trend.push({
      week: date.toISOString().slice(0, 10),
      current: Math.round(weeklyCurrentKg * 10) / 10,
      optimized: w === 0 ? null : Math.round(weeklyOptimizedKg * 10) / 10,
    })
  }

  // Extract roomType + summary from scan inputMeta (stored by the detect API)
  const inputMeta = (scan.inputMeta ?? {}) as { roomType?: string; summary?: string }

  return {
    isEmpty: false,
    scan: {
      id: scan.id,
      roomType: inputMeta.roomType ?? 'Room',
      summary: inputMeta.summary ?? `${appliances.length} appliances detected`,
      createdAt: scan.createdAt,
      aiModel: scan.aiModel,
    },
    appliances,
    kpis: {
      totalCo2eKg: Math.round(totalCo2eKg * 10) / 10,
      totalCostUsd: Math.round(totalCostUsd * 10) / 10,
      applianceCount: appliances.length,
      totalKwh: Math.round(totalKwh * 10) / 10,
      potentialSavingsKg: Math.round(potentialSavingsKg * 10) / 10,
      potentialSavingsUsd: Math.round(potentialSavingsUsd * 10) / 10,
    },
    impactBreakdown,
    topEmitters,
    savingsOpportunities,
    trend,
  }
}
