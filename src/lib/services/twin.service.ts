import { db, active } from '@/lib/db'
import {
  estimateApplianceCarbon,
  formatCo2e,
} from '@/lib/emissions/appliance-calc'

// ============================================================================
// Climate Twin data service — server-only.
//
// Builds a digital model of the user's lifestyle across 5 input dimensions:
//   Home · Appliances · Transport · Lifestyle · Diet
//
// Then computes:
//   - Current carbon state (annual kg CO₂e per dimension)
//   - 1 / 3 / 5-year forecasts (current trajectory vs optimized)
//   - Category comparison (radar data)
//   - Scenario forecast (what-if with interventions)
//   - Risk areas + opportunities (deterministic, ranked)
// ============================================================================

export type TwinDimension = {
  key: 'home' | 'appliances' | 'transport' | 'lifestyle' | 'diet'
  label: string
  annualKg: number
  share: number
  color: string
  icon: string // lucide name
  detail: string // human-readable summary
}

export type ForecastPoint = {
  year: number
  label: string
  current: number // business-as-usual trajectory
  optimized: number // if recommendations applied
  aggressive: number // maximum reduction
}

export type RadarAxis = {
  dimension: string
  value: number // 0-100 normalized
  fullMark: number
}

export type ScenarioData = {
  label: string
  annualKg: number
  reductionPct: number
  color: string
}

export type RiskArea = {
  dimension: string
  label: string
  annualKg: number
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  reason: string
}

export type Opportunity = {
  dimension: string
  title: string
  description: string
  potentialKg: number
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  timeframe: string
}

export type TwinData = {
  isEmpty: boolean
  profile: {
    name: string
    country: string | null
    region: string | null
    householdSize: number
    baselineAnnualKg: number | null
  }
  tier: {
    name: string
    color: string
    description: string
  }
  current: {
    totalAnnualKg: number
    monthlyKg: number
    vsBaselinePct: number
    vsCountryAvgPct: number
    parisTargetKg: number
    onTrack: boolean
  }
  dimensions: TwinDimension[]
  forecast: ForecastPoint[]
  radar: RadarAxis[]
  scenarios: ScenarioData[]
  riskAreas: RiskArea[]
  opportunities: Opportunity[]
}

const DIMENSION_META: Record<
  TwinDimension['key'],
  { label: string; color: string; icon: string }
> = {
  home: { label: 'Home', color: '#f59e0b', icon: 'Home' },
  appliances: { label: 'Appliances', color: '#8b5cf6', icon: 'Zap' },
  transport: { label: 'Transport', color: '#0ea5e9', icon: 'Car' },
  lifestyle: { label: 'Lifestyle', color: '#ec4899', icon: 'ShoppingBag' },
  diet: { label: 'Diet', color: '#10b981', icon: 'UtensilsCrossed' },
}

const PARIS_TARGET_KG = 1800 // 1.8t/yr individual Paris-1.5-aligned
const COUNTRY_AVG_KG = 7400 // global developed-country average

// Forecast assumptions (annual reduction rates)
const BAU_DRIFT = 0.01 // 1% natural efficiency improvement / yr
const OPTIMIZED_RATE = 0.08 // 8% reduction / yr with recommendations
const AGGRESSIVE_RATE = 0.15 // 15% reduction / yr with max effort

export async function getTwinData(userId: string): Promise<TwinData> {
  // --- Load user profile + appliances + recent detections in parallel ---
  const [user, appliances, detections] = await Promise.all([
    db.user.findFirst({
      where: { id: userId, ...active() },
      select: {
        id: true,
        name: true,
        country: true,
        region: true,
        householdSize: true,
        baselineAnnualKg: true,
      },
    }),
    db.appliance.findMany({
      where: { userId, deletedAt: null },
      select: { watts: true, hoursPerDay: true, daysPerWeek: true, type: true, name: true },
    }),
    db.detection.findMany({
      where: {
        deletedAt: null,
        status: { in: ['CONFIRMED', 'EDITED'] },
        scan: { userId, deletedAt: null },
      },
      select: { co2eKg: true, categorySlug: true, scan: { select: { createdAt: true } } },
    }),
  ])

  if (!user) {
    return emptyTwin()
  }

  // --- Compute appliance emissions (annualized) ---
  const applianceCarbon = appliances.map((a) =>
    estimateApplianceCarbon(a.watts ?? 0, a.hoursPerDay ?? 0, a.daysPerWeek ?? 7),
  )
  const applianceAnnualKg = applianceCarbon.reduce((s, c) => s + c.annualCo2eKg, 0)

  // --- Categorize detection emissions into dimensions ---
  // Detections are point-in-time (a single meal, a single drive). To annualize,
  // we extrapolate based on category frequency heuristics.
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentDetections = detections.filter(
    (d) => d.scan.createdAt >= thirtyDaysAgo,
  )

  // Sum CO₂e by top-level category over the last 30 days, then annualize (×12.17)
  const monthlyByCategory = new Map<string, number>()
  for (const d of recentDetections) {
    const top = d.categorySlug.split('.')[0]
    monthlyByCategory.set(top, (monthlyByCategory.get(top) ?? 0) + (d.co2eKg ?? 0))
  }
  const annualize = (monthly: number) => monthly * 12.17

  const transportMonthly = (monthlyByCategory.get('transport') ?? 0)
  const foodMonthly = (monthlyByCategory.get('food') ?? 0)
  const shoppingMonthly = (monthlyByCategory.get('shopping') ?? 0)
  const digitalMonthly = (monthlyByCategory.get('digital') ?? 0)
  const homeMonthly = (monthlyByCategory.get('home') ?? 0)

  // --- Build the 5 dimensions ---
  // Home = home-energy detections + household baseline share
  const homeEnergyKg = annualize(homeMonthly)
  const householdBaseKg = (user.baselineAnnualKg ?? COUNTRY_AVG_KG) * 0.25 // 25% of baseline is home
  const homeKg = homeEnergyKg > 0 ? homeEnergyKg : householdBaseKg

  // Appliances = sum of appliance annual emissions
  const appliancesKg = applianceAnnualKg

  // Transport = annualized transport detections
  const transportKg = annualize(transportMonthly) || COUNTRY_AVG_KG * 0.28 // fallback to avg

  // Lifestyle = shopping + digital
  const lifestyleKg = annualize(shoppingMonthly + digitalMonthly) || COUNTRY_AVG_KG * 0.12

  // Diet = annualized food detections
  const dietKg = annualize(foodMonthly) || COUNTRY_AVG_KG * 0.18

  const dimensions: TwinDimension[] = [
    {
      key: 'home',
      ...DIMENSION_META.home,
      annualKg: Math.round(homeKg * 10) / 10,
      share: 0,
      detail: `${user.householdSize}-person household · ${user.region ?? 'global'} grid`,
    },
    {
      key: 'appliances',
      ...DIMENSION_META.appliances,
      annualKg: Math.round(appliancesKg * 10) / 10,
      share: 0,
      detail: `${appliances.length} appliance${appliances.length !== 1 ? 's' : ''} tracked`,
    },
    {
      key: 'transport',
      ...DIMENSION_META.transport,
      annualKg: Math.round(transportKg * 10) / 10,
      share: 0,
      detail: recentDetections.filter((d) => d.categorySlug.startsWith('transport')).length + ' trips logged (30d)',
    },
    {
      key: 'lifestyle',
      ...DIMENSION_META.lifestyle,
      annualKg: Math.round(lifestyleKg * 10) / 10,
      share: 0,
      detail: 'Shopping + digital footprint',
    },
    {
      key: 'diet',
      ...DIMENSION_META.diet,
      annualKg: Math.round(dietKg * 10) / 10,
      share: 0,
      detail: 'Food & beverage emissions',
    },
  ]

  // Compute shares
  const totalAnnualKg = dimensions.reduce((s, d) => s + d.annualKg, 0)
  for (const d of dimensions) {
    d.share = totalAnnualKg > 0 ? Math.round((d.annualKg / totalAnnualKg) * 100) : 0
  }

  const isEmpty = totalAnnualKg === 0

  // --- Current state ---
  const monthlyKg = Math.round((totalAnnualKg / 12) * 10) / 10
  const vsBaselinePct = user.baselineAnnualKg
    ? Math.round(((totalAnnualKg - user.baselineAnnualKg) / user.baselineAnnualKg) * 100 * 10) / 10
    : 0
  const vsCountryAvgPct = Math.round(((totalAnnualKg - COUNTRY_AVG_KG) / COUNTRY_AVG_KG) * 100 * 10) / 10
  const onTrack = totalAnnualKg <= PARIS_TARGET_KG * 1.5

  // --- Tier ---
  const tier = computeTier(totalAnnualKg)

  // --- Forecast (1/3/5 year) ---
  const forecast: ForecastPoint[] = []
  for (const year of [1, 3, 5]) {
    const current = totalAnnualKg * Math.pow(1 - BAU_DRIFT, year)
    const optimized = totalAnnualKg * Math.pow(1 - OPTIMIZED_RATE, year)
    const aggressive = totalAnnualKg * Math.pow(1 - AGGRESSIVE_RATE, year)
    forecast.push({
      year,
      label: `+${year}yr`,
      current: Math.round(current * 10) / 10,
      optimized: Math.round(optimized * 10) / 10,
      aggressive: Math.round(aggressive * 10) / 10,
    })
  }

  // --- Radar data (normalized 0-100, higher = more emissions) ---
  const maxDim = Math.max(...dimensions.map((d) => d.annualKg), 1)
  const radar: RadarAxis[] = dimensions.map((d) => ({
    dimension: d.label,
    value: Math.round((d.annualKg / maxDim) * 100),
    fullMark: 100,
  }))

  // --- Scenarios ---
  const scenarios: ScenarioData[] = [
    {
      label: 'Current',
      annualKg: Math.round(totalAnnualKg * 10) / 10,
      reductionPct: 0,
      color: 'var(--primary)',
    },
    {
      label: 'Optimized',
      annualKg: forecast[0].optimized,
      reductionPct: Math.round((1 - forecast[0].optimized / totalAnnualKg) * 100),
      color: '#10b981',
    },
    {
      label: 'Aggressive',
      annualKg: forecast[0].aggressive,
      reductionPct: Math.round((1 - forecast[0].aggressive / totalAnnualKg) * 100),
      color: '#0ea5e9',
    },
    {
      label: 'Paris 1.5°C',
      annualKg: PARIS_TARGET_KG,
      reductionPct: Math.round((1 - PARIS_TARGET_KG / totalAnnualKg) * 100),
      color: '#f59e0b',
    },
  ]

  // --- Risk areas (deterministic, ranked by emissions) ---
  const sortedDims = [...dimensions].sort((a, b) => b.annualKg - a.annualKg)
  const riskAreas: RiskArea[] = sortedDims
    .filter((d) => d.annualKg > 0)
    .slice(0, 3)
    .map((d) => {
      const severity: RiskArea['severity'] =
        d.share >= 30 ? 'HIGH' : d.share >= 15 ? 'MEDIUM' : 'LOW'
      return {
        dimension: d.label,
        label: `${d.label} is ${d.share}% of your footprint`,
        annualKg: d.annualKg,
        severity,
        reason: getRiskReason(d.key, d.annualKg),
      }
    })

  // --- Opportunities (deterministic, based on dimensions) ---
  const opportunities: Opportunity[] = sortedDims
    .filter((d) => d.annualKg > 0)
    .slice(0, 4)
    .map((d) => getOpportunityForDimension(d.key, d.annualKg))

  return {
    isEmpty,
    profile: {
      name: user.name ?? 'You',
      country: user.country,
      region: user.region,
      householdSize: user.householdSize,
      baselineAnnualKg: user.baselineAnnualKg,
    },
    tier,
    current: {
      totalAnnualKg: Math.round(totalAnnualKg * 10) / 10,
      monthlyKg,
      vsBaselinePct,
      vsCountryAvgPct,
      parisTargetKg: PARIS_TARGET_KG,
      onTrack,
    },
    dimensions,
    forecast,
    radar,
    scenarios,
    riskAreas,
    opportunities,
  }
}

// --- Tier computation ---
function computeTier(annualKg: number): TwinData['tier'] {
  if (annualKg <= 2000)
    return { name: 'Verdant', color: '#10b981', description: 'Excellent — well below average' }
  if (annualKg <= 4000)
    return { name: 'Aurora', color: '#34d399', description: 'Good — below average' }
  if (annualKg <= 7000)
    return { name: 'Ember', color: '#f59e0b', description: 'Moderate — near average' }
  return { name: 'Drift', color: '#ef4444', description: 'High — above average' }
}

function getRiskReason(key: TwinDimension['key'], kg: number): string {
  const reasons: Record<TwinDimension['key'], string> = {
    home: 'Home energy is a fixed daily draw — heating, cooling, and standby power run regardless of awareness.',
    appliances: 'Older or inefficient appliances can draw 2-3× more power than modern equivalents.',
    transport: 'Transport is often the largest single source — especially frequent flights or solo driving.',
    lifestyle: 'Shopping and digital consumption compound: each purchase and stream has hidden supply-chain emissions.',
    diet: 'Animal-based foods, especially meat and dairy, carry 5-10× the footprint of plant-based alternatives.',
  }
  return reasons[key]
}

function getOpportunityForDimension(
  key: TwinDimension['key'],
  kg: number,
): Opportunity {
  const ops: Record<TwinDimension['key'], Omit<Opportunity, 'dimension'>> = {
    home: {
      title: 'Switch to a green energy tariff',
      description: 'Many utilities offer 100% renewable plans at the same price. A one-call fix for your home energy.',
      potentialKg: Math.round(kg * 0.7 * 10) / 10,
      difficulty: 'EASY',
      timeframe: '1 month',
    },
    appliances: {
      title: 'Replace top emitter with inverter model',
      description: 'Your highest-wattage appliance is the best ROI upgrade. Inverter tech cuts 30-50% of energy use.',
      potentialKg: Math.round(kg * 0.35 * 10) / 10,
      difficulty: 'HARD',
      timeframe: '1-2 years',
    },
    transport: {
      title: 'Replace 2 short car trips/week with walking or transit',
      description: 'Short trips are the least efficient. Two fewer per week cuts ~15% of transport emissions.',
      potentialKg: Math.round(kg * 0.15 * 10) / 10,
      difficulty: 'EASY',
      timeframe: 'Immediate',
    },
    lifestyle: {
      title: 'Buy secondhand for non-essential purchases',
      description: 'Secondhand avoids 80-90% of manufacturing emissions. Applies to clothes, electronics, furniture.',
      potentialKg: Math.round(kg * 0.4 * 10) / 10,
      difficulty: 'EASY',
      timeframe: 'Ongoing',
    },
    diet: {
      title: 'Two plant-based days per week',
      description: 'Cutting meat 2 days/week reduces food footprint by ~25% without going fully vegan.',
      potentialKg: Math.round(kg * 0.25 * 10) / 10,
      difficulty: 'EASY',
      timeframe: 'Immediate',
    },
  }
  return { dimension: DIMENSION_META[key].label, ...ops[key] }
}

function emptyTwin(): TwinData {
  return {
    isEmpty: true,
    profile: { name: 'You', country: null, region: null, householdSize: 1, baselineAnnualKg: null },
    tier: { name: '—', color: 'var(--muted)', description: 'No data yet' },
    current: {
      totalAnnualKg: 0, monthlyKg: 0, vsBaselinePct: 0, vsCountryAvgPct: 0,
      parisTargetKg: PARIS_TARGET_KG, onTrack: false,
    },
    dimensions: [],
    forecast: [],
    radar: [],
    scenarios: [],
    riskAreas: [],
    opportunities: [],
  }
}
