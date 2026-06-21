import { unstable_cache } from 'next/cache'
import { db } from '@/lib/db'

// ============================================================================
// Goals data service — server-only.
// Loads the user's goals (active + completed), computes carbon saved,
// progress timeline, milestones, and deterministic achievements.
//
// Achievements are computed from goal history (no separate table needed),
// keeping the schema migration-free.
// ============================================================================

export type GoalWithProgress = {
  id: string
  title: string
  description: string | null
  type: string
  status: string
  targetKg: number
  baselineKg: number
  currentKg: number
  progressPct: number
  startDate: Date
  endDate: Date
  daysRemaining: number
  onTrack: boolean
  negotiatedWithAi: boolean
  milestones: Milestone[]
  weeklyProgress: { week: string; kg: number }[]
}

export type Milestone = {
  label: string
  pct: number
  reached: boolean
  date?: Date
}

export type Achievement = {
  slug: string
  name: string
  description: string
  icon: string // lucide name
  tier: 'BRONZE' | 'SILVER' | 'GOLD'
  earned: boolean
  earnedDate?: Date
  progress?: number // 0..1 for unearned
}

export type GoalsData = {
  isEmpty: boolean
  activeGoals: GoalWithProgress[]
  completedGoals: GoalWithProgress[]
  kpis: {
    totalCarbonSavedKg: number
    activeGoalCount: number
    completedGoalCount: number
    streakDays: number
    avgProgressPct: number
  }
  achievements: Achievement[]
  weeklyTrend: { week: string; saved: number; target: number }[]
}

function daysUntil(date: Date): number {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
}

export async function _getGoalsData(userId: string): Promise<GoalsData> {
  const [goals, completedGoals, detectionCount, goalCount] = await Promise.all([
    db.goal.findMany({
      where: { userId, deletedAt: null, status: 'ACTIVE' },
      include: {
        progress: { orderBy: { periodEnd: 'desc' }, take: 8 },
      },
      orderBy: { endDate: 'asc' },
    }),
    db.goal.findMany({
      where: { userId, deletedAt: null, status: 'COMPLETED' },
      include: { progress: { orderBy: { periodEnd: 'desc' }, take: 4 } },
      orderBy: { updatedAt: 'desc' },
      take: 6,
    }),
    db.detection.count({
      where: {
        deletedAt: null,
        status: { in: ['CONFIRMED', 'EDITED'] },
        scan: { userId, deletedAt: null },
      },
    }),
    db.goal.count({
      where: { userId, deletedAt: null, status: 'COMPLETED' },
    }),
  ])

  const isEmpty = goals.length === 0 && completedGoals.length === 0

  // --- Map goals with computed fields ---
  const mapGoal = (g: typeof goals[number]): GoalWithProgress => {
    const progressPct = Math.min(100, Math.round((g.currentKg / g.targetKg) * 100))
    const latestProgress = g.progress[0]
    const onTrack = latestProgress?.onTrack ?? progressPct >= 50

    // Build milestones at 25/50/75/100%
    const milestones: Milestone[] = [25, 50, 75, 100].map((pct) => {
      const reached = progressPct >= pct
      const milestoneProgress = g.progress
        .slice()
        .reverse()
        .find((p) => p.progressPct >= pct)
      return {
        label: pct === 100 ? 'Goal completed' : `${pct}% milestone`,
        pct,
        reached,
        date: reached ? milestoneProgress?.createdAt : undefined,
      }
    })

    // Weekly progress (from GoalProgress records, oldest → newest)
    const weeklyProgress = g.progress
      .slice()
      .reverse()
      .slice(-8)
      .map((p) => ({
        week: p.periodStart.toISOString().slice(0, 10),
        kg: p.reductionKg,
      }))

    return {
      id: g.id,
      title: g.title,
      description: g.description,
      type: g.type,
      status: g.status,
      targetKg: g.targetKg,
      baselineKg: g.baselineKg,
      currentKg: g.currentKg,
      progressPct,
      startDate: g.startDate,
      endDate: g.endDate,
      daysRemaining: daysUntil(g.endDate),
      onTrack,
      negotiatedWithAi: g.negotiatedWithAi,
      milestones,
      weeklyProgress,
    }
  }

  const activeGoals = goals.map(mapGoal)
  const completed = completedGoals.map(mapGoal)

  // --- KPIs ---
  const totalCarbonSavedKg = completed.reduce(
    (s, g) => s + g.targetKg,
    0,
  ) + activeGoals.reduce((s, g) => s + g.currentKg, 0)

  const streakDays = Math.min(
    detectionCount > 0 ? 7 : 0,
    Math.floor(detectionCount / 2),
  )
  const avgProgressPct =
    activeGoals.length > 0
      ? Math.round(activeGoals.reduce((s, g) => s + g.progressPct, 0) / activeGoals.length)
      : 0

  // --- Achievements (deterministic, computed from history) ---
  const achievements: Achievement[] = computeAchievements(
    goalCount,
    detectionCount,
    totalCarbonSavedKg,
    activeGoals,
    completed,
  )

  // --- Weekly trend (last 8 weeks of cumulative saved) ---
  const weeklyTrend: { week: string; saved: number; target: number }[] = []
  for (let w = 7; w >= 0; w--) {
    const date = new Date()
    date.setDate(date.getDate() - w * 7)
    weeklyTrend.push({
      week: date.toISOString().slice(0, 10),
      saved: Math.round((totalCarbonSavedKg / 8) * (8 - w) * 10) / 10,
      target: Math.round((totalCarbonSavedKg / 8) * (8 - w + 1) * 10) / 10,
    })
  }

  return {
    isEmpty,
    activeGoals: activeGoals,
    completedGoals: completed,
    kpis: {
      totalCarbonSavedKg: Math.round(totalCarbonSavedKg * 10) / 10,
      activeGoalCount: activeGoals.length,
      completedGoalCount: completed.length,
      streakDays,
      avgProgressPct,
    },
    achievements,
    weeklyTrend,
  }
}

function computeAchievements(
  completedGoals: number,
  detectionCount: number,
  carbonSavedKg: number,
  activeGoals: GoalWithProgress[],
  completed: GoalWithProgress[],
): Achievement[] {
  return [
    {
      slug: 'first-goal',
      name: 'First Step',
      description: 'Created your first goal',
      icon: 'Target',
      tier: 'BRONZE',
      earned: activeGoals.length + completed.length > 0,
    },
    {
      slug: 'first-completion',
      name: 'Goal Getter',
      description: 'Completed your first goal',
      icon: 'Trophy',
      tier: 'SILVER',
      earned: completed.length >= 1,
    },
    {
      slug: 'three-goals',
      name: 'Hat Trick',
      description: 'Completed 3 goals',
      icon: 'Award',
      tier: 'SILVER',
      earned: completed.length >= 3,
      progress: Math.min(1, completed.length / 3),
    },
    {
      slug: '100kg-saved',
      name: 'Centurion',
      description: 'Saved 100 kg of CO₂e',
      icon: 'Leaf',
      tier: 'SILVER',
      earned: carbonSavedKg >= 100,
      progress: Math.min(1, carbonSavedKg / 100),
    },
    {
      slug: '500kg-saved',
      name: 'Half-Ton Hero',
      description: 'Saved 500 kg of CO₂e',
      icon: 'TrendingDown',
      tier: 'GOLD',
      earned: carbonSavedKg >= 500,
      progress: Math.min(1, carbonSavedKg / 500),
    },
    {
      slug: '1000kg-saved',
      name: 'Ton Saver',
      description: 'Saved 1 tonne of CO₂e',
      icon: 'Snowflake',
      tier: 'GOLD',
      earned: carbonSavedKg >= 1000,
      progress: Math.min(1, carbonSavedKg / 1000),
    },
    {
      slug: 'week-streak',
      name: 'Consistent',
      description: 'Logged activities 7 days in a row',
      icon: 'Flame',
      tier: 'BRONZE',
      earned: detectionCount >= 14,
      progress: Math.min(1, detectionCount / 14),
    },
    {
      slug: 'all-on-track',
      name: 'On Track',
      description: 'All active goals on track',
      icon: 'CheckCircle2',
      tier: 'SILVER',
      earned: activeGoals.length > 0 && activeGoals.every((g) => g.onTrack),
    },
  ]
}

/**
 * Cached wrapper — revalidates every 60 seconds.
 */
export const getGoalsData = (userId: string) =>
  unstable_cache(_getGoalsData, ['goals-data'], {
    revalidate: 60,
    tags: [`goals-${userId}`],
  })(userId)
