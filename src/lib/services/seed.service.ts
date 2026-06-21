'use server'

import { db } from '@/lib/db'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'

// ============================================================================
// Demo data seed — creates realistic scans, detections, recommendations, and
// goals for the current user so the dashboard is fully populated.
//
// Triggered by the "Load sample data" button on the dashboard empty state.
// Idempotent-ish: clears the user's existing scans/detections/recommendations/
// goals first, then re-seeds.
// ============================================================================

const NOW = new Date()

// Realistic activity templates with category + emission factor (kg/unit)
type Template = {
  label: string
  categorySlug: string
  amount: number
  unit: string
  co2eKg: number // pre-computed for simplicity
}

const ACTIVITIES: Template[] = [
  { label: 'Drove to work', categorySlug: 'transport.car', amount: 24, unit: 'km', co2eKg: 5.4 },
  { label: 'Burger lunch', categorySlug: 'food.meat', amount: 1, unit: 'item', co2eKg: 5.2 },
  { label: 'Train commute', categorySlug: 'transport.transit', amount: 18, unit: 'km', co2eKg: 0.6 },
  { label: 'Chicken dinner', categorySlug: 'food.meat', amount: 1, unit: 'item', co2eKg: 2.1 },
  { label: 'Electricity (daily)', categorySlug: 'home.electricity', amount: 8, unit: 'kWh', co2eKg: 1.6 },
  { label: 'Oat milk latte', categorySlug: 'food.plant', amount: 1, unit: 'item', co2eKg: 0.3 },
  { label: 'Cotton t-shirt', categorySlug: 'shopping', amount: 1, unit: 'item', co2eKg: 3.1 },
  { label: 'Streaming (2h)', categorySlug: 'digital', amount: 2, unit: 'hr', co2eKg: 0.2 },
  { label: 'Gas heating (daily)', categorySlug: 'home.heating', amount: 12, unit: 'kWh', co2eKg: 2.4 },
  { label: 'Salad bowl', categorySlug: 'food.plant', amount: 1, unit: 'item', co2eKg: 0.5 },
  { label: 'Bus ride', categorySlug: 'transport.transit', amount: 8, unit: 'km', co2eKg: 0.3 },
  { label: 'Cheese pizza', categorySlug: 'food.dairy', amount: 1, unit: 'item', co2eKg: 1.8 },
  { label: 'Drove to gym', categorySlug: 'transport.car', amount: 12, unit: 'km', co2eKg: 2.7 },
  { label: 'Cloud storage (monthly)', categorySlug: 'digital', amount: 100, unit: 'GB', co2eKg: 0.1 },
  { label: 'Online order delivery', categorySlug: 'shopping', amount: 1, unit: 'item', co2eKg: 1.2 },
]

const SCAN_TYPES = ['PHOTO', 'VOICE', 'TEXT', 'RECEIPT'] as const

const RECOMMENDATIONS = [
  {
    title: 'Switch one short-haul flight to rail',
    description: 'You fly ~6×/yr. Cutting 1 to rail saves ~240 kg CO₂e.',
    categorySlug: 'transport.flight',
    potentialKg: 240,
    difficulty: 'MEDIUM',
    impact: 'HIGH',
  },
  {
    title: 'Two plant-based days per week',
    description: 'Meat is 34% of your food footprint. Two days off cuts ~180 kg/yr.',
    categorySlug: 'food.meat',
    potentialKg: 180,
    difficulty: 'EASY',
    impact: 'HIGH',
  },
  {
    title: 'Air-dry laundry',
    description: 'Your dryer is ~8% of home energy. Air-drying saves ~70 kg/yr.',
    categorySlug: 'home.electricity',
    potentialKg: 70,
    difficulty: 'EASY',
    impact: 'MEDIUM',
  },
  {
    title: 'Carpool twice a week',
    description: 'Halves your commute emissions on those days — ~95 kg/yr.',
    categorySlug: 'transport.car',
    potentialKg: 95,
    difficulty: 'MEDIUM',
    impact: 'MEDIUM',
  },
]

const GOALS = [
  {
    title: 'Cut weekly transport by 20%',
    type: 'WEEKLY',
    targetKg: 30,
    baselineKg: 38,
    currentKg: 23,
    endDate: addDays(NOW, 7),
  },
  {
    title: 'Two meatless days / week',
    type: 'WEEKLY',
    targetKg: 5,
    baselineKg: 14,
    currentKg: 6,
    endDate: addDays(NOW, 21),
  },
  {
    title: 'Reduce monthly footprint 15%',
    type: 'MONTHLY',
    targetKg: 120,
    baselineKg: 145,
    currentKg: 82,
    endDate: addDays(NOW, 14),
  },
]

function addDays(base: Date, n: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function seedDemoData(): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { ok: false, error: 'Not authenticated' }
  }
  const userId = session.user.id

  // Clean existing demo-able data for this user (cascade handles children).
  await db.scan.deleteMany({ where: { userId } })
  await db.recommendation.deleteMany({ where: { userId } })
  await db.goal.deleteMany({ where: { userId } })

  // Generate ~14 days of scans with 1-3 detections each.
  const scansToCreate: Array<{ scanDate: Date; scanType: string; dets: Template[] }> = []
  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    // 1-2 scans per day, some days skipped (realistic)
    if (Math.random() < 0.15 && dayOffset !== 0) continue
    const scansToday = dayOffset === 0 ? 1 : (Math.random() < 0.6 ? 1 : 2)
    for (let s = 0; s < scansToday; s++) {
      const scanDate = addDays(NOW, -dayOffset)
      scanDate.setHours(8 + s * 6 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60))
      const scanType = randomFrom(SCAN_TYPES)
      // 1-3 detections per scan
      const detCount = 1 + Math.floor(Math.random() * 3)
      const dets: Template[] = []
      for (let d = 0; d < detCount; d++) {
        dets.push(randomFrom(ACTIVITIES))
      }
      scansToCreate.push({ scanDate, scanType, dets })
    }
  }

  // Create scans + their detections.
  for (const { scanDate, scanType, dets } of scansToCreate) {
    const scan = await db.scan.create({
      data: {
        userId,
        type: scanType,
        status: 'COMPLETED',
        inputText: scanType === 'TEXT' ? dets.map((d) => d.label).join(', ') : null,
        startedAt: scanDate,
        completedAt: new Date(scanDate.getTime() + 2000),
        durationMs: 2000,
        aiModel: 'gemini-2.5-flash',
        promptVersion: 'parse-v1',
      },
    })
    await db.detection.createMany({
      data: dets.map((d, idx) => ({
        scanId: scan.id,
        label: d.label,
        categorySlug: d.categorySlug,
        amount: d.amount,
        unit: d.unit,
        co2eKg: d.co2eKg,
        confidence: 0.85 + Math.random() * 0.13,
        status: Math.random() < 0.9 ? 'CONFIRMED' : 'EDITED',
        sourceSnippet: d.label,
        aiMetadata: { index: idx },
      })),
    })
  }

  // Recommendations
  await db.recommendation.createMany({
    data: RECOMMENDATIONS.map((r, i) => ({
      userId,
      title: r.title,
      description: r.description,
      categorySlug: r.categorySlug,
      potentialKg: r.potentialKg,
      difficulty: r.difficulty,
      impact: r.impact,
      status: i === 0 ? 'ACCEPTED' : 'SUGGESTED',
      aiGenerated: true,
    })),
  })

  // Goals + a progress snapshot each
  for (const g of GOALS) {
    const progressPct = Math.min(100, Math.round((g.currentKg / g.targetKg) * 100))
    const goal = await db.goal.create({
      data: {
        userId,
        title: g.title,
        type: g.type,
        status: 'ACTIVE',
        targetKg: g.targetKg,
        baselineKg: g.baselineKg,
        currentKg: g.currentKg,
        startDate: addDays(NOW, -7),
        endDate: g.endDate,
        negotiatedWithAi: true,
        aiReasoning: 'Negotiated based on your recent activity patterns.',
      },
    })
    await db.goalProgress.create({
      data: {
        goalId: goal.id,
        periodStart: addDays(NOW, -7),
        periodEnd: g.endDate,
        periodKg: g.currentKg,
        reductionKg: Math.max(0, g.baselineKg - g.currentKg),
        cumulativeKg: g.currentKg,
        progressPct,
        onTrack: progressPct >= 50,
      },
    })
  }

  // Ensure onboarding is marked done so the dashboard shell is clean.
  await db.user.update({
    where: { id: userId },
    data: { onboardingDone: true, baselineAnnualKg: 7400 },
  })

  return { ok: true }
}

/** Clear all the user's tracking data (for the "reset" affordance). */
export async function clearDashboardData(): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { ok: false, error: 'Not authenticated' }
  }
  const userId = session.user.id
  await db.scan.deleteMany({ where: { userId } })
  await db.recommendation.deleteMany({ where: { userId } })
  await db.goal.deleteMany({ where: { userId } })
  return { ok: true }
}
