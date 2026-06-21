import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

// ============================================================================
// GET /api/negotiator/conversations — list the user's negotiator sessions.
//
// Returns conversations sorted by most recent first, with last message
// preview and message count for each.
// ============================================================================

export async function GET() {
  const session = await getSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const conversations = await db.aIConversation.findMany({
    where: {
      userId: session.user.id,
      deletedAt: null,
      type: 'NEGOTIATOR',
    },
    select: {
      id: true,
      title: true,
      messageCount: true,
      lastMessageAt: true,
      createdAt: true,
    },
    orderBy: { lastMessageAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ ok: true, data: conversations })
}
