import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

// ============================================================================
// GET /api/negotiator/[id] — load messages for a conversation.
// DELETE /api/negotiator/[id] — soft-delete a conversation.
// ============================================================================

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership
  const conversation = await db.aIConversation.findFirst({
    where: { id, userId: session.user.id, deletedAt: null, type: 'NEGOTIATOR' },
    select: { id: true, title: true, createdAt: true },
  })

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  const messages = await db.aIMessage.findMany({
    where: { conversationId: id, deletedAt: null },
    select: { id: true, role: true, content: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({
    ok: true,
    data: {
      conversation,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role === 'USER' ? 'user' : 'assistant',
        content: m.content,
      })),
    },
  })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership
  const conversation = await db.aIConversation.findFirst({
    where: { id, userId: session.user.id, deletedAt: null, type: 'NEGOTIATOR' },
    select: { id: true },
  })

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  await db.aIConversation.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
