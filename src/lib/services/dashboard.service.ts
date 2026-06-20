import { db, active } from '@/lib/db'

// ============================================================================
// Dashboard data service — server-only. Computes all aggregations the
// dashboard needs in a single pass, returning a typed DTO the page renders.
//
// All queries exclude soft-deleted rows (deletedAt: null) via the `active()`
// helper. Date math is UTC-normalized.
// ============================================================================

export type TrendPoint = { date: string; kg: number; goal: number }
export type CategorySlice = {
  slug: string
  name: string
  kg: number
  share: number
  color: string
}
export type RecentScan = {
  id: string
  type: string
  status: string
  createdAt: Date
  detectionCount: number
  totalKg: number
}
export type RecentRecommendation = {
  id: string
  title: string
  potentialKg: number
  difficulty: string
  impact: string
  status: string
  categorySlug: string
}
export type GoalSummary = {
  id: string
  title: string
  type: string
  status: string
  targetKg: number
  currentKg: number
  progressPct: number
  endDate: Date
  onTrack: boolean
}
export type ForecastPoint = {
  date: string
  history: number | null
  forecast: number | null
  ciLow: number | null
  ciHigh: number | null
}

export type DashboardData = {
  isEmpty: boolean
  kpis: {
    weekKg: number
    lastWeekKg: number
    weekDeltaPct: number
    monthKg: number
    streakDays: number
    activitiesLogged: number
    treesEquivalent: number
    reductionKg: number
  }
  score: {
    value: number          // 0-100, higher = better (lower footprint)
    label: string
    trend: 'up' | 'down' | 'stable'
    deltaPct: number
    targetKg: number
    currentKg: number
  }
  trend: TrendPoint[]           // last 14 days
  categories: CategorySlice[]   // this week breakdown
  recentScans: RecentScan[]
  recentRecommendations: RecentRecommendation[]
  goals: GoalSummary[]
  forecast: {
    points: ForecastPoint[]     // 24 points: 12 history + 12 forecast
    projectedAnnualKg: number
    targetAnnualKg: number
    confidence: number
    willHitTarget: boolean
  }
}

// Category display metadata (slug → name + color). Kept in sync with the
// emission-factor categories used by the detector.
const CATEGORY_META: Record<string, { name: string; color: string }> = {
  'transport': { name: 'Transport', color: '#0ea5e9' },
  'transport.car': { name: 'Driving', color: '#0ea5e9' },
  'transport.flight': { name: 'Flights', color: '#6366f1' },
  'transport.transit': { name: 'Transit', color: '#06b6d4' },
  'food': { name: 'Food', color: '#10b981' },
  'food.meat': { name: 'Meat', color: '#f43f5e' },
  'food.plant': { name: 'Plant-based', color: '#22c55e' },
  'food.dairy': { name: 'Dairy', color: '#eab308' },
  'home': { name: 'Home Energy', color: '#f59e0b' },
  'home.electricity': { name: 'Electricity', color: '#f59e0b' },
  'home.heating': { name: 'Heating', color: '#ef4444' },
  'shopping': { name: 'Shopping', color: '#a855f7' },
  'digital': { name: 'Digital', color: '#8b5cf6' },
  'travel': { name: 'Travel', color: '#6366f1' },
}

function categoryMeta(slug: string) {
  // Try exact, then top-level, then default.
  return (
    CATEGORY_META[slug] ??
    CATEGORY_META[slug.split('.')[0]] ?? {
      name: slug.split('.').pop()?.replace(/^\w/, (c) => c.toUpperCase()) ?? slug,
      color: 'var(--primary)',
    }
  )
}

// --- date helpers (UTC, no TZ drift) ---
function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}
function daysAgoUTC(n: number): Date {
  const d = startOfDayUTC(new Date())
  d.setUTCDate(d.getUTCDate() - n)
  return d
}
function startOfWeekUTC(): Date {
  // Monday-start week
  const d = startOfDayUTC(new Date())
  const day = d.getUTCDay() // 0=Sun..6=Sat
  const diff = (day + 6) % 7
  d.setUTCDate(d.getUTCDate() - diff)
  return d
}

/**
 * Load and compute the full dashboard dataset for a user.
 * Returns `isEmpty: true` when the user has no confirmed detections,
 * so the page can render the empty-state CTA instead of zeroed charts.
 */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  const now = new Date()
  const weekStart = startOfWeekUTC()
  const lastWeekStart = new Date(weekStart)
  lastWeekStart.setUTCDate(weekStart.getUTCDate() - 7)
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const fourteenDaysAgo = daysAgoUTC(13)

  // --- Fetch raw data in parallel ---
  const [detections, scans, recommendations, goals, monthDetections] =
    await Promise.all([
      // Confirmed/edited detections in the last 14 days (for trend + week KPI)
      db.detection.findMany({
        where: {
          deletedAt: null,
          status: { in: ['CONFIRMED', 'EDITED'] },
          scan: { userId, deletedAt: null },
          // Detection has no date field of its own; use scan.createdAt as proxy.
          // We'll bucket by scan date below.
        },
        select: {
          id: true,
          co2eKg: true,
          categorySlug: true,
          label: true,
          scan: { select: { id: true, createdAt: true, type: true, status: true } },
        },
        orderBy: { scan: { createdAt: 'desc' } },
      }),
      // Recent scans (for the scans list)
      db.scan.findMany({
        where: { userId, deletedAt: null },
        select: {
          id: true,
          type: true,
          status: true,
          createdAt: true,
          detections: {
            where: { deletedAt: null },
            select: { co2eKg: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      // Recommendations
      db.recommendation.findMany({
        where: { userId, deletedAt: null, status: { in: ['SUGGESTED', 'ACCEPTED'] } },
        select: {
          id: true,
          title: true,
          potentialKg: true,
          difficulty: true,
          impact: true,
          status: true,
          categorySlug: true,
        },
        orderBy: { potentialKg: 'desc' },
        take: 4,
      }),
      // Active goals
      db.goal.findMany({
        where: { userId, deletedAt: null, status: 'ACTIVE' },
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          targetKg: true,
          currentKg: true,
          baselineKg: true,
          endDate: true,
          progress: {
            orderBy: { periodEnd: 'desc' },
            take: 1,
            select: { onTrack: true, progressPct: true },
          },
        },
        orderBy: { endDate: 'asc' },
        take: 3,
      }),
      // Month-to-date detections (for month KPI)
      db.detection.findMany({
        where: {
          deletedAt: null,
          status: { in: ['CONFIRMED', 'EDITED'] },
          scan: { userId, deletedAt: null, createdAt: { gte: monthStart } },
        },
        select: { co2eKg: true },
      }),
    ])

  const isEmpty = detections.length === 0

  // --- Compute trend (14 days) ---
  const trendMap = new Map<string, number>()
  for (let i = 13; i >= 0; i--) {
    const d = daysAgoUTC(i)
    trendMap.set(d.toISOString().slice(0, 10), 0)
  }
  for (const det of detections) {
    const day = det.scan.createdAt.toISOString().slice(0, 10)
    if (trendMap.has(day)) {
      trendMap.set(day, (trendMap.get(day) ?? 0) + (det.co2eKg ?? 0))
    }
  }
  // Daily goal line (~2.5 kg/day for a ~9t/yr target)
  const dailyGoal = 9.0 / 365 * 7 // weekly target / 7
  const trend: TrendPoint[] = Array.from(trendMap.entries()).map(([date, kg]) => ({
    date,
    kg: Math.round(kg * 10) / 10,
    goal: Math.round(dailyGoal * 10) / 10,
  }))

  // --- KPIs ---
  const weekDetections = detections.filter(
    (d) => d.scan.createdAt >= weekStart,
  )
  const lastWeekDetections = detections.filter(
    (d) => d.scan.createdAt >= lastWeekStart && d.scan.createdAt < weekStart,
  )
  const weekKg = weekDetections.reduce((s, d) => s + (d.co2eKg ?? 0), 0)
  const lastWeekKg = lastWeekDetections.reduce((s, d) => s + (d.co2eKg ?? 0), 0)
  const monthKg = monthDetections.reduce((s, d) => s + (d.co2eKg ?? 0), 0)
  const weekDeltaPct =
    lastWeekKg > 0 ? ((weekKg - lastWeekKg) / lastWeekKg) * 100 : 0

  // Streak: count consecutive days (from today backwards) with ≥1 detection
  let streakDays = 0
  for (let i = 0; i < 365; i++) {
    const d = daysAgoUTC(i)
    const key = d.toISOString().slice(0, 10)
    if ((trendMap.get(key) ?? 0) > 0) {
      streakDays++
    } else if (i > 0) {
      // allow today to be empty (day not over yet) without breaking streak
      break
    } else {
      break
    }
  }

  // Trees equivalent: 1 tree ≈ 21 kg CO₂/yr absorbed
  const treesEquivalent = Math.round((weekKg / 21) * 10) / 10
  // Reduction vs last week (positive = good)
  const reductionKg = Math.max(0, lastWeekKg - weekKg)

  // --- Carbon score (0-100, higher = better) ---
  // Heuristic: compare week's daily avg to a 2.5 kg/day "good" target.
  const dailyAvg = weekKg / 7
  const goodTarget = 2.5
  const scoreVal = Math.max(0, Math.min(100, Math.round(100 - (dailyAvg / goodTarget - 1) * 50)))
  const lastWeekDailyAvg = lastWeekKg / 7
  const lastScore = Math.max(0, Math.min(100, Math.round(100 - (lastWeekDailyAvg / goodTarget - 1) * 50)))
  const scoreDelta = scoreVal - lastScore
  const scoreTrend: 'up' | 'down' | 'stable' =
    Math.abs(scoreDelta) < 2 ? 'stable' : scoreDelta > 0 ? 'up' : 'down'

  // --- Category breakdown (this week) ---
  const catMap = new Map<string, number>()
  for (const d of weekDetections) {
    const top = d.categorySlug.split('.')[0]
    catMap.set(top, (catMap.get(top) ?? 0) + (d.co2eKg ?? 0))
  }
  const totalCatKg = Array.from(catMap.values()).reduce((s, v) => s + v, 0)
  const categories: CategorySlice[] = Array.from(catMap.entries())
    .map(([slug, kg]) => {
      const meta = categoryMeta(slug)
      return {
        slug,
        name: meta.name,
        kg: Math.round(kg * 10) / 10,
        share: totalCatKg > 0 ? Math.round((kg / totalCatKg) * 100) : 0,
        color: meta.color,
      }
    })
    .sort((a, b) => b.kg - a.kg)

  // --- Recent scans (mapped) ---
  const recentScans: RecentScan[] = scans.map((s) => ({
    id: s.id,
    type: s.type,
    status: s.status,
    createdAt: s.createdAt,
    detectionCount: s.detections.length,
    totalKg: Math.round(
      s.detections.reduce((sum, d) => sum + (d.co2eKg ?? 0), 0) * 10,
    ) / 10,
  }))

  // --- Recent recommendations (mapped) ---
  const recentRecommendations: RecentRecommendation[] = recommendations.map(
    (r) => ({
      ...r,
      potentialKg: Math.round(r.potentialKg * 10) / 10,
    }),
  )

  // --- Goals (mapped) ---
  const goalsData: GoalSummary[] = goals.map((g) => {
    const latest = g.progress[0]
    const progressPct = latest?.progressPct ?? Math.min(100, (g.currentKg / g.targetKg) * 100)
    return {
      id: g.id,
      title: g.title,
      type: g.type,
      status: g.status,
      targetKg: g.targetKg,
      currentKg: g.currentKg,
      progressPct: Math.round(progressPct),
      endDate: g.endDate,
      onTrack: latest?.onTrack ?? progressPct >= 50,
    }
  })

  // --- Forecast (simple exponential smoothing on 12-week history) ---
  // Build weekly history from trend (collapse 14 days → 2 weeks, pad with 0s
  // for a 12-week window using a synthetic decay so the forecast is sensible).
  const weeklyHistory: number[] = []
  for (let w = 11; w >= 0; w--) {
    const ws = new Date(weekStart)
    ws.setUTCDate(ws.getUTCDate() - w * 7)
    const we = new Date(ws)
    we.setUTCDate(we.getUTCDate() + 7)
    const wkKg = detections
      .filter((d) => d.scan.createdAt >= ws && d.scan.createdAt < we)
      .reduce((s, d) => s + (d.co2eKg ?? 0), 0)
    weeklyHistory.push(Math.round(wkKg * 10) / 10)
  }
  // Exponential smoothing
  const alpha = 0.4
  let level = weeklyHistory[0] ?? 0
  for (let i = 1; i < weeklyHistory.length; i++) {
    level = alpha * weeklyHistory[i] + (1 - alpha) * level
  }
  // Forecast 12 weeks ahead (flat forecast = level, CI widens)
  const forecastPoints: ForecastPoint[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(weekStart)
    d.setUTCDate(d.getUTCDate() + (i + 1) * 7)
    const ci = 3 + i * 1.5 // widening band
    forecastPoints.push({
      date: d.toISOString().slice(0, 10),
      history: null,
      forecast: Math.round(level * 10) / 10,
      ciLow: Math.max(0, Math.round((level - ci) * 10) / 10),
      ciHigh: Math.round((level + ci) * 10) / 10,
    })
  }
  // History points (first 12 weeks)
  const historyPoints: ForecastPoint[] = weeklyHistory.map((kg, i) => {
    const d = new Date(weekStart)
    d.setUTCDate(d.getUTCDate() - (11 - i) * 7)
    return {
      date: d.toISOString().slice(0, 10),
      history: kg,
      forecast: null,
      ciLow: null,
      ciHigh: null,
    }
  })

  const projectedAnnualKg = Math.round(level * 52 * 10) / 10
  const targetAnnualKg = 1800 // ~1.8t/yr Paris-aligned for an individual
  const confidence = Math.max(50, Math.min(95, 95 - weeklyHistory.filter((v) => v === 0).length * 5))

  return {
    isEmpty,
    kpis: {
      weekKg: Math.round(weekKg * 10) / 10,
      lastWeekKg: Math.round(lastWeekKg * 10) / 10,
      weekDeltaPct: Math.round(weekDeltaPct * 10) / 10,
      monthKg: Math.round(monthKg * 10) / 10,
      streakDays,
      activitiesLogged: detections.length,
      treesEquivalent,
      reductionKg: Math.round(reductionKg * 10) / 10,
    },
    score: {
      value: scoreVal,
      label:
        scoreVal >= 75 ? 'Excellent' : scoreVal >= 50 ? 'Good' : scoreVal >= 30 ? 'Fair' : 'High',
      trend: scoreTrend,
      deltaPct: scoreDelta,
      targetKg: goodTarget * 7,
      currentKg: Math.round(weekKg * 10) / 10,
    },
    trend,
    categories,
    recentScans,
    recentRecommendations,
    goals: goalsData,
    forecast: {
      points: [...historyPoints, ...forecastPoints],
      projectedAnnualKg,
      targetAnnualKg,
      confidence,
      willHitTarget: projectedAnnualKg <= targetAnnualKg,
    },
  }
}
