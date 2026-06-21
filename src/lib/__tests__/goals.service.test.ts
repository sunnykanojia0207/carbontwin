/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================================================
// Tests for goals data service (src/lib/services/goals.service.ts)
//
// The service loads active + completed goals with progress records,
// computes KPIs, achievements (deterministic from history), and a weekly
// trend projection.
// ============================================================================

const {
  mockGoalFindMany,
  mockDetectionCount,
  mockGoalCount,
} = vi.hoisted(() => ({
  mockGoalFindMany: vi.fn(),
  mockDetectionCount: vi.fn(),
  mockGoalCount: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {
    goal: { findMany: mockGoalFindMany, count: mockGoalCount },
    detection: { count: mockDetectionCount },
  },
}))

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) =>
    (...args: unknown[]) => fn(...args),
}))

import { _getGoalsData } from '@/lib/services/goals.service'

/** Minimal active goal builder. */
function activeGoal(
  id: string,
  overrides: Partial<{
    title: string; description: string | null; type: string; targetKg: number;
    baselineKg: number; currentKg: number; startDate: Date; endDate: Date;
    negotiatedWithAi: boolean; progress: Array<Record<string, unknown>>;
  }> = {},
) {
  return {
    id,
    title: 'Test Goal',
    description: 'A test goal',
    type: 'MONTHLY',
    status: 'ACTIVE',
    targetKg: 100,
    baselineKg: 200,
    currentKg: 30,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    negotiatedWithAi: false,
    progress: [],
    ...overrides,
  }
}

/** Progress record builder. */
function progressRec(overrides: Partial<{
  periodStart: Date; periodEnd: Date; reductionKg: number; progressPct: number;
  onTrack: boolean; createdAt: Date;
}> = {}) {
  return {
    id: `prog-${Math.random()}`,
    goalId: 'g1',
    periodStart: new Date('2026-06-01'),
    periodEnd: new Date('2026-06-07'),
    periodKg: 10,
    reductionKg: 5,
    cumulativeKg: 5,
    progressPct: 25,
    onTrack: true,
    createdAt: new Date('2026-06-07'),
    ...overrides,
  }
}

describe('_getGoalsData', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-01T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  // ─── Full data with active goals ─────────────────────────────────────────

  it('returns active goals with progress, milestones, and weekly progress', async () => {
    mockGoalFindMany.mockImplementation(
      (args: { where?: { status?: string } }) => {
        if (args.where?.status === 'ACTIVE') {
          return Promise.resolve([
            activeGoal('g1', {
              title: 'Reduce transport',
              targetKg: 100,
              currentKg: 30,
              progress: [
                progressRec({ periodStart: new Date('2026-06-01'), periodEnd: new Date('2026-06-07'), reductionKg: 5, progressPct: 25, onTrack: true, createdAt: new Date('2026-06-07') }),
                progressRec({ periodStart: new Date('2026-06-08'), periodEnd: new Date('2026-06-14'), reductionKg: 10, progressPct: 35, onTrack: true, createdAt: new Date('2026-06-14') }),
              ],
            }),
            activeGoal('g2', {
              title: 'Reduce energy',
              targetKg: 50,
              currentKg: 10,
              progress: [progressRec({ progressPct: 20, onTrack: false })],
            }),
          ])
        }
        // Completed goals
        return Promise.resolve([
          activeGoal('g3', {
            title: 'Old goal',
            status: 'COMPLETED',
            targetKg: 30,
            currentKg: 30,
            progress: [progressRec({ progressPct: 100, onTrack: true, createdAt: new Date('2026-05-01') })],
          }),
        ])
      },
    )

    mockDetectionCount.mockResolvedValue(20)
    mockGoalCount.mockResolvedValue(1)

    const result = await _getGoalsData('user-1')

    expect(result.isEmpty).toBe(false)

    // ── Active goals ──
    expect(result.activeGoals).toHaveLength(2)
    expect(result.activeGoals[0].title).toBe('Reduce transport')
    expect(result.activeGoals[0].targetKg).toBe(100)
    expect(result.activeGoals[0].currentKg).toBe(30)
    expect(result.activeGoals[0].progressPct).toBe(30) // round(30/100*100)
    expect(result.activeGoals[0].daysRemaining).toBeGreaterThan(0)
    expect(result.activeGoals[0].onTrack).toBe(true)
    expect(result.activeGoals[0].negotiatedWithAi).toBe(false)

    // ── Milestones ──
    expect(result.activeGoals[0].milestones).toHaveLength(4)
    expect(result.activeGoals[0].milestones[0].label).toBe('25% milestone')
    expect(result.activeGoals[0].milestones[0].pct).toBe(25)
    expect(result.activeGoals[0].milestones[0].reached).toBe(true)
    expect(result.activeGoals[0].milestones[1].label).toBe('50% milestone')
    expect(result.activeGoals[0].milestones[1].reached).toBe(false)

    // ── Weekly progress ──
    expect(result.activeGoals[0].weeklyProgress.length).toBeGreaterThan(0)
    expect(result.activeGoals[0].weeklyProgress[0]).toHaveProperty('week')
    expect(result.activeGoals[0].weeklyProgress[0]).toHaveProperty('kg')

    // ── Completed goals ──
    expect(result.completedGoals).toHaveLength(1)
    expect(result.completedGoals[0].status).toBe('COMPLETED')

    // ── KPIs ──
    // totalCarbonSavedKg = completed target sum + active current sum
    // = 30 + (30 + 10) = 70
    expect(result.kpis.totalCarbonSavedKg).toBe(70)
    expect(result.kpis.activeGoalCount).toBe(2)
    expect(result.kpis.completedGoalCount).toBe(1)
    // streakDays = min(7, floor(20/2)) = min(7, 10) = 7
    expect(result.kpis.streakDays).toBe(7)
    // avgProgressPct = round((30 + 20) / 2) = round(25) = 25
    expect(result.kpis.avgProgressPct).toBe(25)
  })

  // ─── Empty state ─────────────────────────────────────────────────────────

  it('returns isEmpty=true when no goals exist', async () => {
    mockGoalFindMany.mockImplementation(
      (args: { where?: { status?: string } }) => {
        return Promise.resolve([]) // both active and completed return empty
      },
    )

    mockDetectionCount.mockResolvedValue(0)
    mockGoalCount.mockResolvedValue(0)

    const result = await _getGoalsData('user-empty')

    expect(result.isEmpty).toBe(true)
    expect(result.activeGoals).toHaveLength(0)
    expect(result.completedGoals).toHaveLength(0)
    expect(result.kpis.totalCarbonSavedKg).toBe(0)
    expect(result.kpis.activeGoalCount).toBe(0)
    expect(result.kpis.completedGoalCount).toBe(0)
    expect(result.kpis.streakDays).toBe(0)
    expect(result.kpis.avgProgressPct).toBe(0)

    // Achievements should still exist but none earned
    expect(result.achievements.length).toBeGreaterThan(0)
    expect(result.achievements.every((a) => a.earned === false)).toBe(true)
  })

  // ─── Goals with no progress records ──────────────────────────────────────

  it('handles goals with no progress records (fallback onTrack)', async () => {
    mockGoalFindMany.mockImplementation(
      (args: { where?: { status?: string } }) => {
        if (args.where?.status === 'ACTIVE') {
          return Promise.resolve([
            activeGoal('g1', {
              title: 'No progress',
              targetKg: 200,
              currentKg: 60, // 30%
              progress: [],
            }),
          ])
        }
        return Promise.resolve([])
      },
    )

    mockDetectionCount.mockResolvedValue(0)
    mockGoalCount.mockResolvedValue(0)

    const result = await _getGoalsData('user-no-progress')

    // Fallback: progressPct = min(100, 60/200 * 100) = 30
    expect(result.activeGoals[0].progressPct).toBe(30)
    // onTrack fallback: progressPct >= 50 → false
    expect(result.activeGoals[0].onTrack).toBe(false)

    // Milestones: 25% IS reached (30 >= 25), 50% is NOT (30 < 50)
    expect(result.activeGoals[0].milestones[0].reached).toBe(true)
    expect(result.activeGoals[0].milestones[1].reached).toBe(false)
    expect(result.activeGoals[0].milestones[0].date).toBeUndefined()
    // weeklyProgress is empty
    expect(result.activeGoals[0].weeklyProgress).toHaveLength(0)
  })

  // ─── Achievements ────────────────────────────────────────────────────────

  it('computes achievements with partial progress', async () => {
    mockGoalFindMany.mockImplementation(
      (args: { where?: { status?: string } }) => {
        if (args.where?.status === 'ACTIVE') {
          return Promise.resolve([
            activeGoal('g1', {
              title: 'Active',
              currentKg: 10,
              progress: [progressRec({ progressPct: 20, onTrack: true })],
            }),
          ])
        }
        return Promise.resolve([
          activeGoal('g2', { title: 'Completed 1', status: 'COMPLETED', targetKg: 40, currentKg: 40, progress: [progressRec({ progressPct: 100, onTrack: true })] }),
        ])
      },
    )

    mockDetectionCount.mockResolvedValue(8)
    mockGoalCount.mockResolvedValue(1)

    const result = await _getGoalsData('user-achievements')

    const firstGoal = result.achievements.find((a) => a.slug === 'first-goal')
    expect(firstGoal?.earned).toBe(true) // has at least one goal

    const firstCompletion = result.achievements.find((a) => a.slug === 'first-completion')
    expect(firstCompletion?.earned).toBe(true) // has at least one completed

    const threeGoals = result.achievements.find((a) => a.slug === 'three-goals')
    expect(threeGoals?.earned).toBe(false) // only 1 completed
    expect(threeGoals?.progress).toBe(1 / 3)

    // totalCarbonSavedKg = 40 (completed targetKg) + 10 (active currentKg) = 50
    const centurion = result.achievements.find((a) => a.slug === '100kg-saved')
    expect(centurion?.earned).toBe(false) // 50 < 100
    expect(centurion?.progress).toBe(50 / 100)

    // detectionCount = 8 < 14
    const weekStreak = result.achievements.find((a) => a.slug === 'week-streak')
    expect(weekStreak?.earned).toBe(false)
    expect(weekStreak?.progress).toBe(8 / 14)
  })

  it('earns all achievements when thresholds are met', async () => {
    mockGoalFindMany.mockImplementation(
      (args: { where?: { status?: string } }) => {
        if (args.where?.status === 'ACTIVE') {
          return Promise.resolve([
            activeGoal('g1', {
              title: 'On track goal',
              currentKg: 500,
              targetKg: 600,
              progress: [progressRec({ progressPct: 83, onTrack: true })],
            }),
          ])
        }
        return Promise.resolve(Array.from({ length: 3 }, (_, i) =>
          activeGoal(`g-completed-${i}`, {
            title: `Completed ${i}`,
            status: 'COMPLETED',
            targetKg: 500,
            currentKg: 500,
            progress: [progressRec({ progressPct: 100, onTrack: true })],
          }),
        ))
      },
    )

    // detectionCount >= 14 for week-streak
    mockDetectionCount.mockResolvedValue(20)
    // goalCount means number of COMPLETED goals
    mockGoalCount.mockResolvedValue(3)

    const result = await _getGoalsData('user-all-achievements')

    // totalCarbonSavedKg = (500*3) + 500 = 2000
    expect(result.kpis.totalCarbonSavedKg).toBe(2000)

    const check = (slug: string, earned: boolean) => {
      const a = result.achievements.find((x) => x.slug === slug)
      expect(a?.earned).toBe(earned)
    }

    check('first-goal', true)
    check('first-completion', true)
    check('three-goals', true)
    check('100kg-saved', true)
    check('500kg-saved', true)
    check('1000kg-saved', true)
    check('week-streak', true)
    check('all-on-track', true) // all active goals on track
  })

  it('does not earn all-on-track when some active goals are off track', async () => {
    mockGoalFindMany.mockImplementation(
      (args: { where?: { status?: string } }) => {
        if (args.where?.status === 'ACTIVE') {
          return Promise.resolve([
            activeGoal('g1', {
              title: 'On track',
              currentKg: 60,
              progress: [progressRec({ progressPct: 60, onTrack: true })],
            }),
            activeGoal('g2', {
              title: 'Off track',
              currentKg: 10,
              targetKg: 100,
              progress: [progressRec({ progressPct: 10, onTrack: false })],
            }),
          ])
        }
        return Promise.resolve([])
      },
    )

    mockDetectionCount.mockResolvedValue(0)
    mockGoalCount.mockResolvedValue(0)

    const result = await _getGoalsData('user-mixed-track')

    const onTrack = result.achievements.find((a) => a.slug === 'all-on-track')
    expect(onTrack?.earned).toBe(false)
  })

  // ─── Weekly trend ────────────────────────────────────────────────────────

  it('computes weekly trend with saved and target values', async () => {
    mockGoalFindMany.mockImplementation(
      (args: { where?: { status?: string } }) => {
        if (args.where?.status === 'ACTIVE') {
          return Promise.resolve([
            activeGoal('g1', { currentKg: 80, targetKg: 100, progress: [progressRec({ progressPct: 80, onTrack: true })] }),
          ])
        }
        return Promise.resolve([])
      },
    )

    mockDetectionCount.mockResolvedValue(5)
    mockGoalCount.mockResolvedValue(0)

    const result = await _getGoalsData('user-trend')

    expect(result.weeklyTrend).toHaveLength(8)
    for (const point of result.weeklyTrend) {
      expect(point).toHaveProperty('week')
      expect(point).toHaveProperty('saved')
      expect(point).toHaveProperty('target')
      expect(typeof point.saved).toBe('number')
      expect(typeof point.target).toBe('number')
    }
    // Last entry (w=0) should have saved = total (80)
    expect(result.weeklyTrend[result.weeklyTrend.length - 1].saved).toBe(80)
  })

  // ─── Full shape ──────────────────────────────────────────────────────────

  it('returns the full GoalsData shape', async () => {
    mockGoalFindMany.mockImplementation(
      (args: { where?: { status?: string } }) => {
        if (args.where?.status === 'ACTIVE') {
          return Promise.resolve([
            activeGoal('g1', { progress: [progressRec({ progressPct: 50, onTrack: true })] }),
          ])
        }
        return Promise.resolve([])
      },
    )

    mockDetectionCount.mockResolvedValue(4)
    mockGoalCount.mockResolvedValue(0)

    const result = await _getGoalsData('user-shape')

    expect(result).toHaveProperty('isEmpty')
    expect(result).toHaveProperty('activeGoals')
    expect(result).toHaveProperty('completedGoals')
    expect(result).toHaveProperty('kpis')
    expect(result).toHaveProperty('achievements')
    expect(result).toHaveProperty('weeklyTrend')

    const kpiKeys = ['totalCarbonSavedKg', 'activeGoalCount', 'completedGoalCount', 'streakDays', 'avgProgressPct']
    for (const key of kpiKeys) {
      expect(result.kpis).toHaveProperty(key)
    }

    // Each active goal has the full shape
    for (const g of result.activeGoals) {
      expect(g).toHaveProperty('id')
      expect(g).toHaveProperty('title')
      expect(g).toHaveProperty('targetKg')
      expect(g).toHaveProperty('progressPct')
      expect(g).toHaveProperty('daysRemaining')
      expect(g).toHaveProperty('milestones')
      expect(g).toHaveProperty('weeklyProgress')
      expect(g.milestones).toHaveLength(4)
    }
  })
})
