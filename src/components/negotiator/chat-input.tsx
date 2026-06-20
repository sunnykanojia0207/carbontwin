'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

// ============================================================================
// ChatInput — premium input bar.
//
// Design:
//   • Taller, comfortable textarea with soft inner shadow on focus
//   • Send button fades/slides in only when text is entered
//   • Keyboard shortcut hint ("⌘↵") visible when text exists
//   • 4-row max height, auto-resize
//   • Loading shimmer when disabled
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

  // Re-focus when disabled changes from true → false
  React.useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus()
    }
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

  // Auto-resize up to 120px (~4 rows)
  const handleInput = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  const hasText = value.trim().length > 0

  return (
    <div className="border-t bg-background/80 backdrop-blur-xl">
      <div className="relative mx-auto flex max-w-4xl items-end gap-2 px-3 py-2 sm:px-4">
        {/* Textarea */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              handleInput()
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              'w-full resize-none rounded-2xl border bg-card px-4 py-3 text-sm leading-relaxed',
              'placeholder:text-muted-foreground/60',
              'shadow-xs transition-shadow duration-200',
              'focus-visible:border-primary/40 focus-visible:shadow-sm focus-visible:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-40',
              'max-h-[120px]',
            )}
          />
        </div>

        {/* Send button — appears on text */}
        <AnimatePresence mode="wait">
          {disabled ? (
            <motion.div
              key="loading"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <span className="bg-muted text-muted-foreground flex size-11 shrink-0 items-center justify-center rounded-xl">
                <Loader2 className="size-5 animate-spin" />
              </span>
            </motion.div>
          ) : hasText ? (
            <motion.button
              key="send"
              initial={{ scale: 0.8, opacity: 0, x: 8 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.8, opacity: 0, x: 8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              onClick={handleSubmit}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex size-11 shrink-0 items-center justify-center rounded-xl shadow-xs transition-colors"
              aria-label="Send message"
            >
              <Send className="size-5" />
            </motion.button>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex size-11 shrink-0 items-center justify-center"
            >
              <span className="text-muted-foreground/30 text-xs">↵</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom hint — hidden on mobile to save space */}
      <div className="mx-auto hidden max-w-4xl items-center justify-between px-4 pb-1.5 sm:flex">
        <p className="text-muted-foreground/40 text-[10px] tracking-wide">
          Shift + Enter for new line
        </p>
        {hasText && (
          <p className="text-muted-foreground/40 text-[10px] tracking-wide">
            <kbd className="font-sans font-medium">Enter</kbd> to send
          </p>
        )}
      </div>
    </div>
  )
}
