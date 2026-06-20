'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Handshake, Sparkles, AlertCircle, PanelLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'

import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChatMessage, type ChatMessageData } from '@/components/negotiator/chat-message'
import { SuggestedPrompts } from '@/components/negotiator/suggested-prompts'
import { ChatInput } from '@/components/negotiator/chat-input'
import { ConversationsPanel } from '@/components/negotiator/conversations-panel'
import type { ActionPlan } from '@/lib/ai/negotiator-prompt'

// ============================================================================
// NegotiatorClient — AI Carbon Negotiator chat orchestrator.
//
// Design aligned with app patterns (dashboard, goals, twin, results):
//   • Page header: text-2xl font-semibold tracking-tight + subtitle
//   • Empty state: Card with border-primary/30 bg-primary/5
//   • Consistent button variants and spacing
//   • Chat layout: full-height with scrollable messages + fixed input
//   • Sidebar for conversation history (unique to this page)
// ============================================================================

type StreamFrame =
  | { type: 'token'; value: string }
  | { type: 'done'; conversationId: string; model?: string }
  | { type: 'error'; message: string }

/** Build a human-readable fallback indicator for the retry badge. */
function getFallbackLabel(model?: string): string | null {
  if (model === 'fallback') return 'Offline mode — personalized local advice'
  return null
}

export function NegotiatorClient({
  initialMessages = [],
  initialConversationId,
}: {
  initialMessages?: ChatMessageData[]
  initialConversationId?: string
}) {
  const router = useRouter()
  const [messages, setMessages] = React.useState<ChatMessageData[]>(initialMessages)
  const [conversationId, setConversationId] = React.useState<string | undefined>(
    initialConversationId,
  )
  const [streaming, setStreaming] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [loadingSession, setLoadingSession] = React.useState(false)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // =========================================================================
  // Load a conversation's messages from the server
  // =========================================================================
  const loadConversation = React.useCallback(
    async (id: string) => {
      setLoadingSession(true)
      setError(null)
      try {
        const res = await fetch(`/api/negotiator/${id}`)
        if (!res.ok) throw new Error('Failed to load conversation')
        const json = await res.json()
        if (!json.ok) throw new Error(json.error ?? 'Unknown error')

        setMessages(json.data.messages)
        setConversationId(id)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load conversation')
      } finally {
        setLoadingSession(false)
      }
    },
    [router],
  )

  // =========================================================================
  // Start a new conversation
  // =========================================================================
  const startNewConversation = React.useCallback(() => {
    setMessages([])
    setConversationId(undefined)
    setError(null)
    setSidebarOpen(false)
    router.refresh()
  }, [router])

  // =========================================================================
  // Delete a conversation
  // =========================================================================
  const deleteConversation = React.useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/negotiator/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to delete')
        if (conversationId === id) startNewConversation()
        toast.success('Conversation deleted')
      } catch {
        toast.error('Failed to delete conversation')
      }
    },
    [conversationId, startNewConversation],
  )

  // =========================================================================
  // Send a message (the core chat loop)
  // =========================================================================
  const sendMessage = React.useCallback(
    async (text: string) => {
      setError(null)

      // Optimistic: add user message + empty assistant message
      const userMsg: ChatMessageData = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
      }
      const assistantMsg: ChatMessageData = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        streaming: true,
        model: undefined,
      }
      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setStreaming(true)

      try {
        const res = await fetch('/api/negotiator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, conversationId }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          const errorMsg =
            err.error?.includes('Rate limit') || err.error?.includes('quota')
              ? 'AI service quota reached. Your messages still use Gemini when quota resets. Try again later.'
              : err.error || `Error ${res.status}`
          throw new Error(errorMsg)
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const jsonStr = line.slice(6)
            try {
              const frame: StreamFrame = JSON.parse(jsonStr)
              if (frame.type === 'token') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, content: m.content + frame.value }
                      : m,
                  ),
                )
              } else if (frame.type === 'done') {
                setConversationId(frame.conversationId)
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, streaming: false, model: frame.model }
                      : m,
                  ),
                )
                router.refresh()
              } else if (frame.type === 'error') {
                throw new Error(frame.message)
              }
            } catch {
              // skip malformed frames
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong'
        setError(msg)
        setMessages((prev) =>
          prev.filter((m) => m.id !== assistantMsg.id || m.content.length > 0),
        )
      } finally {
        setStreaming(false)
        setMessages((prev) =>
          prev.map((m) => ({ ...m, streaming: false })),
        )
      }
    },
    [conversationId, router],
  )

  const handleAcceptPlan = React.useCallback((plan: ActionPlan) => {
    toast.success('Action plan accepted!', {
      description: `${plan.title} — we'll track this as a goal.`,
    })
  }, [])

  /** Find the last user message for retry */
  const getLastUserMessage = React.useCallback((): string | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') return messages[i].content
    }
    return null
  }, [messages])

  const handleRetry = React.useCallback(() => {
    const lastMsg = getLastUserMessage()
    if (lastMsg) sendMessage(lastMsg)
  }, [getLastUserMessage, sendMessage])

  const handleSuggestedPrompt = React.useCallback(
    (prompt: string) => {
      sendMessage(prompt)
    },
    [sendMessage],
  )

  const isEmpty = messages.length === 0

  // =========================================================================
  // Render
  // =========================================================================
  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-7xl flex-col sm:flex-row">
      {/* ====================================================================
          Mobile header bar
          ==================================================================== */}
      <div className="flex items-center gap-2 border-b bg-card px-3 py-1.5 sm:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label="Toggle conversations"
        >
          <PanelLeft className="size-4" />
        </Button>
        <span className="text-xs font-medium text-muted-foreground truncate">
          AI Negotiator
        </span>
      </div>

      {/* ====================================================================
          Sidebar — desktop always visible, mobile as animated sheet
          ==================================================================== */}

      {/* Desktop sidebar */}
      <div className="hidden sm:flex sm:w-64 sm:shrink-0">
        <ConversationsPanel
          className="w-full"
          activeId={conversationId}
          onSelect={loadConversation}
          onNew={startNewConversation}
          onDelete={deleteConversation}
        />
      </div>

      {/* Mobile sidebar — animated overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-background/60 fixed inset-0 z-40 backdrop-blur-sm sm:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              key="sidebar"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r bg-card sm:hidden"
            >
              <ConversationsPanel
                className="h-full"
                activeId={conversationId}
                onSelect={(id) => {
                  loadConversation(id)
                  setSidebarOpen(false)
                }}
                onNew={() => {
                  startNewConversation()
                  setSidebarOpen(false)
                }}
                onDelete={deleteConversation}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ====================================================================
          Main chat area
          ==================================================================== */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Desktop page header — matches app's page header pattern */}
        <div className="hidden items-center justify-between border-b bg-card px-6 py-4 sm:flex">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              AI Carbon Negotiator
            </h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              Your personalized sustainability advisor
            </p>
          </div>
          <Button
            variant="outline"
            size="default"
            onClick={startNewConversation}
          >
            <Sparkles className="size-4" />
            New conversation
          </Button>
        </div>

        {/* Error alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="px-4 pt-2 sm:px-6"
            >
              <Alert variant="destructive" className="flex items-center gap-2 py-2.5">
                <AlertCircle className="size-4 shrink-0" />
                <AlertDescription className="flex-1 text-xs">{error}</AlertDescription>
                <button
                  onClick={() => setError(null)}
                  className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Dismiss error"
                >
                  Dismiss
                </button>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages / Loading / Empty state */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto scrollbar-thin px-4 py-4 sm:px-6"
        >
          {loadingSession ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="text-muted-foreground size-5 animate-spin" />
                <p className="text-muted-foreground/60 text-xs">Loading conversation…</p>
              </div>
            </div>
          ) : isEmpty ? (
            /* Empty state — matches app Card pattern (goals, twin, results, dashboard) */
            <div className="flex h-full items-center justify-center">
              <Card className="w-full max-w-lg border-primary/30 bg-primary/5">
                <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
                  <span className="bg-primary/15 text-primary flex size-14 items-center justify-center rounded-full">
                    <Handshake className="size-7" />
                  </span>
                  <div className="max-w-md space-y-2">
                    <h2 className="text-xl font-semibold tracking-tight">
                      Let&apos;s find reductions you&apos;ll keep
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      I know your footprint profile. Tell me what you&apos;re
                      considering, or ask about any dimension. I&apos;ll negotiate a
                      realistic commitment — never an ultimatum.
                    </p>
                  </div>
                  <SuggestedPrompts onPromptClick={handleSuggestedPrompt} />
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              <div className="mx-auto max-w-3xl space-y-4">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} onAcceptPlan={handleAcceptPlan} onRetry={handleRetry} />
                ))}
              </div>
              <div className="h-2" />
            </>
          )}
        </div>

        {/* Chat input */}
        <ChatInput onSend={sendMessage} disabled={streaming || loadingSession} />
      </div>
    </div>
  )
}
