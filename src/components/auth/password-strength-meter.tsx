'use client'

import { Check, X } from 'lucide-react'

import { scorePassword } from '@/lib/validations/auth'
import { cn } from '@/lib/utils'

// ============================================================================
// Live password strength meter — 4-segment bar + checklist.
// Pure derivation from the password string; re-renders as the user types.
// ============================================================================

const STRENGTH_COLORS = [
  'bg-destructive/70',
  'bg-destructive/70',
  'bg-amber-500',
  'bg-primary',
  'bg-primary',
]

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { score, label, checks } = scorePassword(password)
  const items: { label: string; ok: boolean }[] = [
    { label: '8+ characters', ok: checks.length },
    { label: 'Lowercase', ok: checks.lowercase },
    { label: 'Uppercase', ok: checks.uppercase },
    { label: 'Number', ok: checks.number },
    { label: 'Symbol', ok: checks.symbol },
  ]

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex h-1.5 flex-1 gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                'h-full flex-1 rounded-full transition-colors',
                i < score ? STRENGTH_COLORS[score] : 'bg-border',
              )}
            />
          ))}
        </div>
        {password.length > 0 && (
          <span
            className={cn(
              'text-xs font-medium tabular-nums',
              score <= 1
                ? 'text-destructive'
                : score === 2
                  ? 'text-amber-600 dark:text-amber-500'
                  : 'text-primary',
            )}
          >
            {label}
          </span>
        )}
      </div>
      {password.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {items.map((item) => (
            <span
              key={item.label}
              className={cn(
                'flex items-center gap-1 text-xs',
                item.ok
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/60',
              )}
            >
              {item.ok ? (
                <Check className="size-3 text-primary" />
              ) : (
                <X className="size-3" />
              )}
              {item.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
