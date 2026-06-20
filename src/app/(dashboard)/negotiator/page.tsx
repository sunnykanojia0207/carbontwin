import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { NegotiatorClient } from '@/components/negotiator/negotiator-client'
import type { ChatMessageData } from '@/components/negotiator/chat-message'

// ============================================================================
// /negotiator — AI Carbon Negotiator page.
// Loads the user's most recent NEGOTIATOR conversation (if any) for context
// memory, then hands off to the client component which manages session
// switching (past conversations, new conversations, delete).
// ============================================================================

export const metadata = {
  title: 'AI Negotiator',
}

export default async function NegotiatorPage() {
  const session = await getServerSession(authOptions)
  const userId = session!.user!.id

  // Load the most recent negotiator conversation for context memory
  const conversation = await db.aIConversation.findFirst({
    where: { userId, deletedAt: null, type: 'NEGOTIATOR' },
    select: {
      id: true,
      messages: {
        where: { deletedAt: null },
        select: { id: true, role: true, content: true },
        orderBy: { createdAt: 'asc' },
        take: 20, // last 20 messages for context
      },
    },
    orderBy: { lastMessageAt: 'desc' },
  })

  const initialMessages: ChatMessageData[] = (conversation?.messages ?? []).map((m) => ({
    id: m.id,
    role: m.role === 'USER' ? 'user' : 'assistant',
    content: m.content,
  }))

  return (
    <NegotiatorClient
      initialMessages={initialMessages}
      initialConversationId={conversation?.id}
    />
  )
}
