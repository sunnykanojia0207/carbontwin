'use client'

import ReactMarkdown from 'react-markdown'
import { motion } from 'framer-motion'
import { Sparkles, User, RefreshCw, AlertTriangle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { ActionPlanCard } from '@/components/negotiator/action-plan-card'
import { parseActionPlans, type ActionPlan } from '@/lib/ai/negotiator-prompt'

// ============================================================================
// ChatMessage — redesigned premium message bubble.
//
// Design principles (Linear/Stripe-inspired):
//   • User messages: compact, dark bubble right-aligned, no avatar — clean
//   • Assistant messages: spacious, left-aligned, subtle Sparkles icon, white
//     bg with soft border
//   • Rich text via react-markdown (bold, links, lists, paragraphs)
//   • Streaming indicator: three animated dots instead of a cursor blink
//   • Action plans rendered as rich cards between messages
// ============================================================================

export type ChatMessageData = {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  model?: string
}

// ---------------------------------------------------------------------------
// Streaming dots — a bouncing three-dot animation
// ---------------------------------------------------------------------------
function StreamingDots() {
  return (
    <span className="ml-1 inline-flex items-center gap-0.5" aria-label="AI is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-current"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.6s' }}
        />
      ))}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Markdown renderer — safe subset for chat messages
// ---------------------------------------------------------------------------
function MessageContent({ text }: { text: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-1 last:mb-0 leading-relaxed">{children}</p>,
        ul: ({ children }) => <ul className="mb-1 list-disc pl-4 last:mb-0 space-y-0.5">{children}</ul>,
        ol: ({ children }) => <ol className="mb-1 list-decimal pl-4 last:mb-0 space-y-0.5">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-primary transition-colors"
          >
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code className="rounded-md bg-muted px-1.5 py-0.5 text-[0.85em] font-mono">
            {children}
          </code>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  )
}

// ============================================================================
// Main component
// ============================================================================
export function ChatMessage({
  message,
  onAcceptPlan,
  onRetry,
}: {
  message: ChatMessageData
  onAcceptPlan?: (plan: ActionPlan) => void
  onRetry?: () => void
}) {
  const isUser = message.role === 'user'
  const isFallback = message.model === 'fallback'

  // Parse action plans from assistant messages
  const { plans, cleanText } = isUser
    ? { plans: [] as ActionPlan[], cleanText: message.content }
    : parseActionPlans(message.content)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}
    >
      {/* Avatar column — non-user only */}
      {!isUser && (
        <span
          className={cn(
            'mt-1 flex size-8 shrink-0 items-center justify-center rounded-full ring-1',
            isFallback
              ? 'bg-amber-100 text-amber-600 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800'
              : 'bg-primary/10 text-primary ring-border',
          )}
        >
          {isFallback ? <AlertTriangle className="size-4" /> : <Sparkles className="size-4" />}
        </span>
      )}

      {/* Bubble column */}
      <div className={cn('flex max-w-[80%] flex-col gap-1.5', isUser && 'items-end')}>
        {/* Clean text content */}
        {cleanText && (
          <div
            className={cn(
              'w-fit text-sm leading-relaxed',
              isUser
                ? // User bubble — dark pill, right-aligned
                  'rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-primary-foreground shadow-sm'
                : // Assistant bubble — white/soft, left-aligned, with border
                  'max-w-none rounded-2xl rounded-tl-md border bg-card px-4 py-3 shadow-xs',
              isFallback && !isUser && 'border-amber-200 dark:border-amber-800',
            )}
          >
            {isUser ? (
              <p className="leading-relaxed">{cleanText}</p>
            ) : (
              <MessageContent text={cleanText} />
            )}

            {/* Streaming indicator */}
            {message.streaming && <StreamingDots />}
          </div>
        )}

        {/* Streaming-only state (no text yet, waiting for first token) */}
        {message.streaming && !cleanText && (
          <div className="flex items-center rounded-2xl rounded-tl-md border bg-card px-4 py-3 shadow-xs">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="size-3.5 animate-pulse" />
              <span>Thinking</span>
              <StreamingDots />
            </div>
          </div>
        )}

        {/* Fallback badge + retry button */}
        {isFallback && !message.streaming && onRetry && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
              <AlertTriangle className="size-3" />
              Offline
            </span>
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <RefreshCw className="size-3" />
              Retry with AI
            </button>
          </div>
        )}

        {/* Action plans */}
        {plans.map((plan, i) => (
          <ActionPlanCard key={i} plan={plan} onAccept={onAcceptPlan} />
        ))}
      </div>
    </motion.div>
  )
}
