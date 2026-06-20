import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'

import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { getTwinData } from '@/lib/services/twin.service'
import { buildSystemPrompt, PROMPT_VERSION } from '@/lib/ai/negotiator-prompt'
import { generateNegotiatorResponse } from '@/lib/ai'

// ============================================================================
// POST /api/negotiator — streaming chat with the AI Carbon Negotiator.
//
// Uses the unified AI facade (rate-limited, error-handled, fallback-enabled).
// The facade returns the complete response (non-streaming from the SDK for
// reliability); we send it as SSE word-chunks for a typing effect.
//
// Body: { message: string, conversationId?: string }
// Returns: text/event-stream
// ============================================================================

export const maxDuration = 60

type HistoryMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  // --- Parse body ---
  let body: { message?: string; conversationId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { message, conversationId } = body
  if (!message || !message.trim()) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 })
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: 'Message too long (max 2000 chars).' }, { status: 413 })
  }

  // --- Load the user's twin data for context ---
  const twinData = await getTwinData(userId)
  const systemPrompt = buildSystemPrompt(twinData)

  // --- Load or create the conversation ---
  let conversation = conversationId
    ? await db.aIConversation.findFirst({
        where: { id: conversationId, userId, deletedAt: null, type: 'NEGOTIATOR' },
        select: { id: true },
      })
    : null

  if (!conversation) {
    conversation = await db.aIConversation.create({
      data: {
        userId,
        type: 'NEGOTIATOR',
        title: message.slice(0, 60),
        outcome: 'PENDING',
      },
      select: { id: true },
    })
  }

  // --- Load conversation history (last 12 messages for context) ---
  const history = await db.aIMessage.findMany({
    where: { conversationId: conversation.id, deletedAt: null },
    select: { role: true, content: true },
    orderBy: { createdAt: 'desc' },
    take: 12,
  })
  const historyMessages: HistoryMessage[] = [
    ...history.reverse().map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ]

  // --- Persist the user's message ---
  await db.aIMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'USER',
      content: message,
    },
  })

  // --- Build the LLM message array ---
  const messages: HistoryMessage[] = [
    { role: 'system', content: systemPrompt },
    ...historyMessages,
    { role: 'user', content: message },
  ]

  // --- Build AI context from twin data (used for personalized fallbacks) ---
  const aiContext = {
    totalKg: twinData.current.totalAnnualKg,
    dimensions: twinData.dimensions.map(d => ({
      label: d.label,
      annualKg: d.annualKg,
      share: d.share,
    })),
    opportunities: twinData.opportunities.map(o => ({
      title: o.title,
      potentialKg: o.potentialKg,
      difficulty: o.difficulty,
    })),
    tier: { name: twinData.tier.name },
  }

  // --- Call the unified AI facade ---
  const aiResult = await generateNegotiatorResponse(userId, messages, aiContext)

  // --- Handle rate limit / hard error ---
  if (!aiResult.ok) {
    const status = aiResult.error.code === 'RATE_LIMITED' ? 429 : 500
    return NextResponse.json(
      { error: aiResult.error.message },
      { status },
    )
  }

  const fullResponse = aiResult.data

  // --- Persist the assistant's response ---
  await db.aIMessage.create({
    data: {
      conversationId: conversation.id,
      role: 'ASSISTANT',
      content: fullResponse,
      model: aiResult.model,
      promptVersion: PROMPT_VERSION,
    },
  })

  await db.aIConversation.update({
    where: { id: conversation.id },
    data: {
      messageCount: { increment: 2 },
      lastMessageAt: new Date(),
    },
  })

  // --- Stream the response as SSE word-chunks ---
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const words = fullResponse.split(/(\s+)/)
        for (const word of words) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'token', value: word })}\n\n`,
            ),
          )
          await new Promise((r) => setTimeout(r, 15))
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'done',
              conversationId: conversation!.id,
              model: aiResult.model,
            })}\n\n`,
          ),
        )
      } catch {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: 'Stream interrupted' })}\n\n`,
          ),
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
