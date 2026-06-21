import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getResultsData } from '@/lib/services/results.service'
import { generateInsights } from '@/lib/ai'

// ============================================================================
// POST /api/insights — generates an AI narrative of the user's appliance
// detection results via the unified AI facade (rate-limited, cached, fallback).
//
// Body: { scanId?: string }
// Returns: { insight, highlights, cached?, model? }
// ============================================================================

export const maxDuration = 30

export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { scanId?: string }
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const data = await getResultsData(session.user.id, body.scanId)

  if (data.isEmpty || data.appliances.length === 0) {
    return NextResponse.json({
      insight: 'No appliance data yet. Upload a room photo to get AI insights.',
      highlights: [],
    })
  }

  // Build context for the AI facade
  const applianceSummary = data.appliances
    .map((a) => `- ${a.name} (${a.type}): ${a.watts}W, ${a.hoursPerDay}h/day, ${a.carbon.annualCo2eKg} kg CO₂e/yr, $${a.cost.annualUsd}/yr`)
    .join('\n')

  const topSavings = data.savingsOpportunities
    .slice(0, 3)
    .map((s) => `- ${s.title}: saves ${s.co2eKgPerYear} kg CO₂e/yr ($${s.usdPerYear}/yr)`)
    .join('\n')

  const result = await generateInsights(session.user.id, {
    roomType: data.scan?.roomType ?? 'Room',
    totalKg: data.kpis.totalCo2eKg,
    totalCost: data.kpis.totalCostUsd,
    applianceCount: data.kpis.applianceCount,
    potentialSavingsKg: data.kpis.potentialSavingsKg,
    appliancesSummary: applianceSummary,
    topSavings,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  return NextResponse.json({
    ...result.data,
    cached: result.cached,
    model: result.model,
  })
}
