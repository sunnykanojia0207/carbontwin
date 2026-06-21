'use client'

import ReactMarkdown from 'react-markdown'
import { motion } from 'framer-motion'
import { Sparkles, RefreshCw, AlertTriangle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { ActionPlanCard } from '@/components/negotiator/action-plan-card'
import { parseActionPlans, type ActionPlan } from '@/lib/ai/negotiator-prompt'

// ============================================================================
// ChatMessage — redesigned to match app design system.
//
// User messages: right-aligned, primary-colored pill, no avatar.
// Assistant messages: left-aligned, card-style bubble with Sparkles icon.
// Streaming: animated dots.
// Rich markdown for assistant responses.
// ============================================================================

export type ChatMessageData = {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  model?: string
}

// ---------------------------------------------------------------------------
// Streaming dots
// ---------------------------------------------------------------------------
function StreamingDots() {
  return (
    <span className="ml-1 inline-flex items-end gap-[3px]" aria-label="AI is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block size-1.5 animate-bounce rounded-full bg-current opacity-60"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.75s' }}
        />
      ))}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Markdown renderer
// ---------------------------------------------------------------------------
function MessageContent({ text }: { text: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 leading-relaxed text-sm">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="mb-2 space-y-1 pl-4 last:mb-0 text-sm">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0 text-sm">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed marker:text-muted-foreground">{children}</li>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
          >
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code className="rounded bg-muted px-1.5 py-0.5 text-[0.8em] font-mono">
            {children}
          </code>
        ),
        h3: ({ children }) => (
          <h3 className="mb-1 mt-3 text-sm font-semibold first:mt-0">{children}</h3>
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

  const { plans, cleanText } = isUser
    ? { plans: [] as ActionPlan[], cleanText: message.content }
    : parseActionPlans(message.content)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'flex gap-3 py-2',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {/* Avatar — assistant only */}
      {!isUser && (
        <div
          className={cn(
            'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ring-1 ring-border',
            isFallback
              ? 'bg-amber-50 text-amber-600 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800'
              : 'bg-primary/10 text-primary',
          )}
        >
          {isFallback
            ? <AlertTriangle className="size-3.5" />
            : <Sparkles className="size-3.5" />
          }
        </div>
      )}

      {/* Bubble + extras */}
      <div className={cn('flex max-w-[82%] flex-col gap-2', isUser && 'items-end')}>
        {/* Main bubble */}
        {(cleanText || message.streaming) && (
          <div
            className={cn(
              'rounded-2xl px-4 py-3 text-sm leading-relaxed',
              isUser
                ? 'rounded-tr-sm bg-primary text-primary-foreground shadow-sm'
                : cn(
                    'rounded-tl-sm border bg-card shadow-xs',
                    isFallback
                      ? 'border-amber-200/60 dark:border-amber-800/60'
                      : 'border-border',
                  ),
            )}
          >
            {/* Content */}
            {cleanText ? (
              isUser ? (
                <p className="leading-relaxed">{cleanText}</p>
              ) : (
                <MessageContent text={cleanText} />
              )
            ) : null}

            {/* Waiting for first token */}
            {message.streaming && !cleanText && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="size-3.5 animate-pulse text-primary" />
                <span className="text-sm">Thinking</span>
                <StreamingDots />
              </div>
            )}

            {/* Still streaming with content */}
            {message.streaming && cleanText && <StreamingDots />}
          </div>
        )}

        {/* Fallback badge + retry */}
        {isFallback && !message.streaming && onRetry && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
              <AlertTriangle className="size-2.5" />
              Offline mode
            </span>
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <RefreshCw className="size-2.5" />
              Retry with AI
            </button>
          </div>
        )}

        {/* Action plan cards */}
        {plans.map((plan, i) => (
          <ActionPlanCard key={i} plan={plan} onAccept={onAcceptPlan} />
        ))}
      </div>
    </motion.div>
  )
}
