import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'

import { authOptions } from '@/lib/auth'
import { getTwinData } from '@/lib/services/twin.service'
import { generateGoalSuggestions } from '@/lib/ai'

// ============================================================================
// POST /api/goal-suggestions — generates personalized goal suggestions via
// the unified AI facade (rate-limited, cached, fallback).
//
// Body: (none — uses the authenticated user's twin data)
// Returns: { suggestions, cached?, model? }
// ============================================================================

export const maxDuration = 30

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const twinData = await getTwinData(session.user.id)

  if (twinData.isEmpty) {
    return NextResponse.json({
      suggestions: [],
      message: 'Log activities and upload room photos to get personalized goal suggestions.',
    })
  }

  const dimSummary = twinData.dimensions
    .map((d) => `${d.label}: ${d.annualKg} kg (${d.share}%)`)
    .join(', ')

  const result = await generateGoalSuggestions(session.user.id, {
    totalKg: twinData.current.totalAnnualKg,
    tierName: twinData.tier.name,
    dimSummary,
    parisTarget: twinData.current.parisTargetKg,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  return NextResponse.json({
    suggestions: result.data,
    cached: result.cached,
    model: result.model,
  })
}
