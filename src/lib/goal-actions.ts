'use server'

import { db } from '@/lib/db'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================================================
// Goal server actions — create goals, update progress, complete goals.
// All are auth-gated and Zod-validated.
// ============================================================================

const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(80, 'Title too long'),
  description: z.string().max(300).optional(),
  type: z.enum(['WEEKLY', 'MONTHLY', 'ANNUAL', 'ONE_TIME']),
  targetKg: z.number().min(1, 'Target must be at least 1 kg').max(10000),
  baselineKg: z.number().min(0).default(0),
  category: z.string().optional(),
  durationDays: z.number().min(1).max(365).default(30),
})

export async function createGoal(input: z.infer<typeof createGoalSchema>) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { ok: false, error: 'Not authenticated' }
  }

  const parsed = createGoalSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const { title, description, type, targetKg, baselineKg, durationDays } = parsed.data
  const now = new Date()
  const endDate = new Date(now)
  endDate.setDate(endDate.getDate() + durationDays)

  const goal = await db.goal.create({
    data: {
      userId: session.user.id,
      title,
      description: description ?? null,
      type,
      status: 'ACTIVE',
      targetKg,
      baselineKg: baselineKg || targetKg,
      currentKg: 0,
      startDate: now,
      endDate,
      negotiatedWithAi: false,
    },
  })

  // Create initial progress snapshot
  await db.goalProgress.create({
    data: {
      goalId: goal.id,
      periodStart: now,
      periodEnd: endDate,
      periodKg: 0,
      reductionKg: 0,
      cumulativeKg: 0,
      progressPct: 0,
      onTrack: true,
    },
  })

  revalidatePath('/goals')
  return { ok: true, goalId: goal.id }
}

export async function updateGoalProgress(goalId: string, currentKg: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { ok: false, error: 'Not authenticated' }
  }

  const goal = await db.goal.findFirst({
    where: { id: goalId, userId: session.user.id, deletedAt: null },
    select: { id: true, targetKg: true, baselineKg: true, endDate: true },
  })

  if (!goal) {
    return { ok: false, error: 'Goal not found' }
  }

  const progressPct = Math.min(100, Math.round((currentKg / goal.targetKg) * 100))
  const onTrack = progressPct >= 50 || currentKg >= goal.targetKg * 0.5

  await db.goal.update({
    where: { id: goalId },
    data: {
      currentKg,
      status: progressPct >= 100 ? 'COMPLETED' : 'ACTIVE',
    },
  })

  // Update the latest progress snapshot
  const latestProgress = await db.goalProgress.findFirst({
    where: { goalId },
    orderBy: { periodEnd: 'desc' },
  })

  if (latestProgress) {
    await db.goalProgress.update({
      where: { id: latestProgress.id },
      data: {
        cumulativeKg: currentKg,
        reductionKg: Math.max(0, goal.baselineKg - currentKg),
        progressPct,
        onTrack,
      },
    })
  } else {
    await db.goalProgress.create({
      data: {
        goalId,
        periodStart: new Date(),
        periodEnd: goal.endDate,
        periodKg: currentKg,
        reductionKg: Math.max(0, goal.baselineKg - currentKg),
        cumulativeKg: currentKg,
        progressPct,
        onTrack,
      },
    })
  }

  revalidatePath('/goals')
  return { ok: true }
}

export async function completeGoal(goalId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { ok: false, error: 'Not authenticated' }
  }

  const goal = await db.goal.findFirst({
    where: { id: goalId, userId: session.user.id, deletedAt: null },
    select: { id: true, targetKg: true },
  })

  if (!goal) {
    return { ok: false, error: 'Goal not found' }
  }

  await db.goal.update({
    where: { id: goalId },
    data: {
      status: 'COMPLETED',
      currentKg: goal.targetKg,
    },
  })

  revalidatePath('/goals')
  return { ok: true }
}

export async function deleteGoal(goalId: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { ok: false, error: 'Not authenticated' }
  }

  await db.goal.update({
    where: { id: goalId },
    data: { deletedAt: new Date() },
  })

  revalidatePath('/goals')
  return { ok: true }
}
