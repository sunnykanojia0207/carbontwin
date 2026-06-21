'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

// ============================================================================
// ChatInput — redesigned to match app design system.
//
// Visual:
//   • Clean rounded-xl container with border matching app input style
//   • Primary-colored circular send button (like modern chat apps)
//   • Auto-resize textarea up to ~5 rows
//   • Keyboard hint in footer
// ============================================================================

export function ChatInput({
  onSend,
  disabled,
  placeholder = 'Ask your AI negotiator anything…',
}: {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}) {
  const [value, setValue] = React.useState('')
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  React.useEffect(() => {
    if (!disabled) textareaRef.current?.focus()
  }, [disabled])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    // Auto-resize
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }

  const hasText = value.trim().length > 0

  return (
    <div className="shrink-0 border-t bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6">
        {/* Input row */}
        <div className={cn(
          'flex items-end gap-2 rounded-xl border bg-card px-3 py-2 transition-shadow',
          'focus-within:border-primary/40 focus-within:shadow-sm',
          disabled && 'opacity-60',
        )}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            aria-label="Message input"
            className={cn(
              'flex-1 resize-none bg-transparent py-1.5 text-sm leading-relaxed',
              'placeholder:text-muted-foreground/50',
              'focus-visible:outline-none',
              'max-h-[140px] scrollbar-thin',
              'disabled:cursor-not-allowed',
            )}
          />

          {/* Send / loading button */}
          <AnimatePresence mode="wait">
            {disabled ? (
              <motion.div
                key="loading"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted"
              >
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </motion.div>
            ) : (
              <motion.button
                key="send"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: hasText ? 1 : 0.35 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.12 }}
                onClick={handleSubmit}
                disabled={!hasText}
                aria-label="Send message"
                className={cn(
                  'mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                  hasText
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                    : 'bg-muted text-muted-foreground cursor-default',
                )}
              >
                <ArrowUp className="size-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Footer hint */}
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground/40">
          <kbd className="font-sans">Enter</kbd> to send
          {' · '}
          <kbd className="font-sans">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  )
}
