import { NextResponse } from 'next/server'

import { db } from '@/lib/db'

// ============================================================================
// GET /api/cron/weekly-insights
// Daily 03:00 — recompute weekly insight snapshots for active users.
// Called by Vercel Cron (see vercel.json).
//
// CRON_SECRET should be set to prevent external access. Vercel Cron sends
// it as the Authorization header.
// ============================================================================

export const maxDuration = 60

export async function GET(request: Request) {
  // Verify the cron secret
  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (process.env.CRON_SECRET && authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find users active in the last 7 days
    const activeUsers = await db.user.findMany({
      where: {
        deletedAt: null,
        scans: {
          some: {
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
      },
      select: { id: true },
    })

    // In a full implementation, this would call generateInsights() for each
    // user and store the result. For now, we log the count.
    console.log(`[cron] weekly-insights: ${activeUsers.length} active users`)

    return NextResponse.json({
      ok: true,
      processed: activeUsers.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[cron] weekly-insights error:', error)
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 },
    )
  }
}
