'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Handshake,
  Sparkles,
  AlertCircle,
  PanelLeft,
  Loader2,
  Plus,
  Car,
  Home,
  UtensilsCrossed,
  ShoppingBag,
  Plane,
} from 'lucide-react'
import { toast } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'

import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ChatMessage, type ChatMessageData } from '@/components/negotiator/chat-message'
import { SuggestedPrompts } from '@/components/negotiator/suggested-prompts'
import { ChatInput } from '@/components/negotiator/chat-input'
import { ConversationsPanel } from '@/components/negotiator/conversations-panel'
import type { ActionPlan } from '@/lib/ai/negotiator-prompt'

// ============================================================================
// NegotiatorClient — AI Carbon Negotiator chat orchestrator.
// Redesigned to match the app's design system:
//   • Same header pattern as all other dashboard pages
//   • Sidebar that matches the app sidebar aesthetic
//   • Clean two-column layout: sidebar | chat
//   • Full-height chat with sticky input bar
// ============================================================================

type StreamFrame =
  | { type: 'token'; value: string }
  | { type: 'done'; conversationId: string; model?: string }
  | { type: 'error'; message: string }

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
  const bottomRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
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

  const startNewConversation = React.useCallback(() => {
    setMessages([])
    setConversationId(undefined)
    setError(null)
    setSidebarOpen(false)
    router.refresh()
  }, [router])

  const deleteConversation = React.useCallback(
    async (id: string) => {
      // NOTE: The API DELETE is already called by ConversationsPanel.handleDeleteConfirm.
      // This callback only handles client-side side effects.
      if (conversationId === id) startNewConversation()
      toast.success('Conversation deleted')
    },
    [conversationId, startNewConversation],
  )

  // =========================================================================
  // Send a message
  // =========================================================================
  const sendMessage = React.useCallback(
    async (text: string) => {
      setError(null)
      const userMsg: ChatMessageData = { id: crypto.randomUUID(), role: 'user', content: text }
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
              ? 'AI quota reached. Try again later.'
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
            try {
              const frame: StreamFrame = JSON.parse(line.slice(6))
              if (frame.type === 'token') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id ? { ...m, content: m.content + frame.value } : m,
                  ),
                )
              } else if (frame.type === 'done') {
                setConversationId(frame.conversationId)
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id ? { ...m, streaming: false, model: frame.model } : m,
                  ),
                )
                router.refresh()
              } else if (frame.type === 'error') {
                throw new Error(frame.message)
              }
            } catch { /* skip malformed */ }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong'
        setError(msg)
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id || m.content.length > 0))
      } finally {
        setStreaming(false)
        setMessages((prev) => prev.map((m) => ({ ...m, streaming: false })))
      }
    },
    [conversationId, router],
  )

  const handleAcceptPlan = React.useCallback((plan: ActionPlan) => {
    toast.success('Action plan accepted!', { description: `${plan.title} — tracking as a goal.` })
  }, [])

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

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-[calc(100svh-4rem)] overflow-hidden">

      {/* ====================================================================
          Sidebar — desktop always visible
          ==================================================================== */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar lg:flex lg:flex-col">
        {/* Sidebar header */}
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
              <Handshake className="size-4 text-primary" />
            </span>
            <span className="text-sm font-semibold">Conversations</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={startNewConversation}
            title="New conversation"
          >
            <Plus className="size-4" />
          </Button>
        </div>
          {/* Sidebar content */}
        <ConversationsPanel
          className="flex-1 overflow-hidden"
          activeId={conversationId}
          onSelect={loadConversation}
          onNew={startNewConversation}
          onDelete={deleteConversation}
          refreshTrigger={conversationId}
        />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              key="mobile-sidebar"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r bg-sidebar lg:hidden flex flex-col"
            >
              <div className="flex h-14 items-center justify-between border-b px-4">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10">
                    <Handshake className="size-4 text-primary" />
                  </span>
                  <span className="text-sm font-semibold">Conversations</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={startNewConversation}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              <ConversationsPanel
                className="flex-1 overflow-hidden"
                activeId={conversationId}
                onSelect={(id) => { loadConversation(id); setSidebarOpen(false) }}
                onNew={() => { startNewConversation(); setSidebarOpen(false) }}
                onDelete={deleteConversation}
                onClose={() => setSidebarOpen(false)}
                refreshTrigger={conversationId}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ====================================================================
          Main chat column
          ==================================================================== */}
      <div className="flex flex-1 flex-col min-w-0 bg-background">

        {/* Page header — same pattern as all other pages */}
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile: sidebar toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="size-8 lg:hidden"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label="Toggle conversations"
            >
              <PanelLeft className="size-4" />
            </Button>
            <div>
              <h1 className="text-base font-semibold tracking-tight sm:text-lg">
                AI Carbon Negotiator
              </h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Personalized sustainability advisor
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={startNewConversation}
          >
            <Plus className="size-3.5" />
            New chat
          </Button>
        </header>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 overflow-hidden px-4 pt-2 sm:px-6"
            >
              <Alert variant="destructive" className="flex items-center gap-2 py-2.5">
                <AlertCircle className="size-4 shrink-0" />
                <AlertDescription className="flex-1 text-xs">{error}</AlertDescription>
                <button
                  onClick={() => setError(null)}
                  className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dismiss
                </button>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto scrollbar-thin"
        >
          {loadingSession ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Loading conversation…</p>
              </div>
            </div>
          ) : isEmpty ? (
            <EmptyState onPromptClick={sendMessage} />
          ) : (
            <div className="mx-auto max-w-3xl space-y-1 px-4 py-6 sm:px-6">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onAcceptPlan={handleAcceptPlan}
                  onRetry={handleRetry}
                />
              ))}
              <div ref={bottomRef} className="h-1" />
            </div>
          )}
        </div>

        {/* Input — only show when there's something to type into */}
        {!loadingSession && (
          <ChatInput onSend={sendMessage} disabled={streaming} />
        )}
      </div>
    </div>
  )
}

// ============================================================================
// EmptyState — shown when there are no messages yet.
// Matches the design pattern used across the app.
// ============================================================================
function EmptyState({ onPromptClick }: { onPromptClick: (p: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Hero */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="absolute -inset-3 rounded-full bg-primary/10 blur-xl" />
            <span className="relative flex size-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
              <Handshake className="size-8 text-primary" />
            </span>
          </div>
          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight">
              Let&apos;s find reductions you&apos;ll keep
            </h2>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
              I know your footprint profile. Tell me what you&apos;re considering,
              or pick a topic below — I&apos;ll negotiate a realistic commitment,
              never an ultimatum.
            </p>
          </div>

          {/* Capability pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { icon: Car, label: 'Transport' },
              { icon: Home, label: 'Home energy' },
              { icon: UtensilsCrossed, label: 'Diet' },
              { icon: ShoppingBag, label: 'Lifestyle' },
              { icon: Plane, label: 'Travel' },
            ].map((chip) => {
              const Icon = chip.icon
              return (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  <Icon className="size-3.5" />
                  {chip.label}
                </span>
              )
            })}
          </div>
        </div>

        {/* Suggested prompts */}
        <div className="space-y-3">
          <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
            Start with a question
          </p>
          <SuggestedPrompts onPromptClick={onPromptClick} />
        </div>
      </div>
    </div>
  )
}
