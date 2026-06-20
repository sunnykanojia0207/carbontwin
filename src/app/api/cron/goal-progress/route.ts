import { NextResponse } from 'next/server'

import { db } from '@/lib/db'

// ============================================================================
// GET /api/cron/goal-progress
// Daily 04:00 — snapshot goal progress for active goals.
// Called by Vercel Cron (see vercel.json).
// ============================================================================

export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (process.env.CRON_SECRET && authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const activeGoals = await db.goal.findMany({
      where: { deletedAt: null, status: 'ACTIVE' },
      select: { id: true, currentKg: true, targetKg: true, baselineKg: true, endDate: true },
    })

    // Create a progress snapshot for each active goal
    const now = new Date()
    const periodStart = new Date(now)
    periodStart.setDate(periodStart.getDate() - 7)

    for (const goal of activeGoals) {
      const progressPct = Math.min(100, Math.round((goal.currentKg / goal.targetKg) * 100))
      const onTrack = progressPct >= 50

      // Upsert the progress snapshot (one per goal per week)
      const existing = await db.goalProgress.findFirst({
        where: { goalId: goal.id, periodStart },
      })

      if (existing) {
        await db.goalProgress.update({
          where: { id: existing.id },
          data: {
            cumulativeKg: goal.currentKg,
            reductionKg: Math.max(0, goal.baselineKg - goal.currentKg),
            progressPct,
            onTrack,
          },
        })
      } else {
        await db.goalProgress.create({
          data: {
            goalId: goal.id,
            periodStart,
            periodEnd: goal.endDate,
            periodKg: goal.currentKg,
            reductionKg: Math.max(0, goal.baselineKg - goal.currentKg),
            cumulativeKg: goal.currentKg,
            progressPct,
            onTrack,
          },
        })
      }
    }

    console.log(`[cron] goal-progress: ${activeGoals.length} goals snapshotted`)

    return NextResponse.json({
      ok: true,
      processed: activeGoals.length,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('[cron] goal-progress error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}
