import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'

import { authOptions } from '@/lib/auth'
import { AI_CONFIGURED, GEMINI_TEXT_MODEL } from '@/lib/ai/env'
import { getRateLimitStatus } from '@/lib/ai/rate-limiter'
import { LAST_QUOTA_ERROR } from '@/lib/ai'

// ============================================================================
// GET /api/ai-status — returns the AI layer status for the Settings page:
//   - whether AI is configured
//   - the active model
//   - per-function rate-limit remaining for the current user
//   - whether a quota exhaustion has been detected recently
// ============================================================================

const FUNCTIONS = ['detect', 'insights', 'twin-recommendations', 'negotiator', 'goal-suggestions'] as const

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limits = FUNCTIONS.map((fn) => ({
    function: fn,
    ...getRateLimitStatus(session.user.id, fn),
  }))

  // Check if a quota error was hit recently (within last 5 minutes)
  const lastQuota = LAST_QUOTA_ERROR[session.user.id]
  const quotaExhausted = lastQuota ? (Date.now() - lastQuota) < 300_000 : false

  return NextResponse.json({
    configured: AI_CONFIGURED,
    model: GEMINI_TEXT_MODEL,
    quotaExhausted,
    limits,
  })
}
