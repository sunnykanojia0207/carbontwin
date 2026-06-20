'use client'

import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// ============================================================================
// Password input with show/have toggle. Forwards a ref so it works inside
// react-hook-form's <FormField> / <FormControl> (which uses Slot).
// ============================================================================

export const PasswordField = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<'input'>
>(function PasswordField({ className, ...props }, ref) {
  const [show, setShow] = React.useState(false)
  return (
    <div className="relative">
      <Input
        ref={ref}
        type={show ? 'text' : 'password'}
        className={cn('pr-10', className)}
        autoComplete="current-password"
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
        onClick={() => setShow((s) => !s)}
        className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center pr-3 transition-colors"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
})
