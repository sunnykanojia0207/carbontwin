import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getTwinData } from '@/lib/services/twin.service'
import { generateTwinRecommendations } from '@/lib/ai'

// ============================================================================
// POST /api/twin-recommendations — generates an AI narrative of the user's
// Climate Twin via the unified AI facade (rate-limited, cached, fallback).
//
// Body: (none — uses the authenticated user's twin data)
// Returns: { summary, outlook, recommendations, riskAssessment, cached?, model? }
// ============================================================================

export const maxDuration = 30

export async function POST() {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await getTwinData(session.user.id)

  if (data.isEmpty) {
    return NextResponse.json({
      summary: 'Your Climate Twin is still forming. Log activities and upload room photos to bring it to life.',
      outlook: 'Once we have your data, we\'ll project your 1, 3, and 5-year carbon trajectory.',
      recommendations: [],
      riskAssessment: 'No risk areas identified yet — start logging to get your assessment.',
    })
  }

  const dimSummary = data.dimensions
    .map((d) => `${d.label}: ${d.annualKg} kg (${d.share}%)`)
    .join(', ')

  const riskSummary = data.riskAreas
    .map((r) => `${r.label} [${r.severity}]`)
    .join('; ')

  const oppSummary = data.opportunities
    .map((o) => `${o.title} (−${o.potentialKg} kg, ${o.difficulty})`)
    .join('; ')

  const result = await generateTwinRecommendations(session.user.id, {
    name: data.profile.name,
    region: data.profile.region,
    household: data.profile.householdSize,
    totalKg: data.current.totalAnnualKg,
    tierName: data.tier.name,
    tierDesc: data.tier.description,
    vsAvgPct: data.current.vsCountryAvgPct,
    parisTarget: data.current.parisTargetKg,
    dimSummary,
    riskSummary,
    oppSummary,
    forecastCurrent: data.forecast[2]?.current ?? data.current.totalAnnualKg,
    forecastOptimized: data.forecast[2]?.optimized ?? data.current.totalAnnualKg,
    forecastAggressive: data.forecast[2]?.aggressive ?? data.current.totalAnnualKg,
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
