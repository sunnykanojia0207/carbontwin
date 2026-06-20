'use client'

import * as React from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { requestPasswordReset } from '@/lib/auth.actions'
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '@/lib/validations/auth'

// ============================================================================
// Forgot password form — requests a reset link.
// Anti-enumeration: the server always returns success, so the success state
// shows regardless of whether the email exists.
// ============================================================================

export function ForgotPasswordForm() {
  const [formError, setFormError] = React.useState<string | null>(null)
  const [sentTo, setSentTo] = React.useState<string | null>(null)

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  const isSubmitting = form.formState.isSubmitting

  const onSubmit = async (values: ForgotPasswordInput) => {
    setFormError(null)
    const res = await requestPasswordReset(values)
    if (!res.ok) {
      if (res.fieldErrors?.email?.length) {
        form.setError('email', { message: res.fieldErrors.email[0] })
      }
      setFormError(res.error)
      return
    }
    setSentTo(values.email)
  }

  // Success state — replaces the form.
  if (sentTo) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center">
          <span className="bg-primary/10 text-primary mb-4 flex size-12 items-center justify-center rounded-full">
            <CheckCircle2 className="size-6" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Check your inbox
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            If an account exists for{' '}
            <strong className="text-foreground">{sentTo}</strong>, we&apos;ve
            sent a reset link. It expires in 15 minutes.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">
            <ArrowLeft className="size-4" />
            Back to login
          </Link>
        </Button>
        <p className="text-muted-foreground text-center text-xs">
          Didn&apos;t get it? Check spam, or{' '}
          <button
            type="button"
            onClick={() => setSentTo(null)}
            className="text-primary hover:underline font-medium"
          >
            try another email
          </button>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          Reset your password
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {formError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                    <Input
                    type="email"
                    placeholder="you@domain.com"
                    autoComplete="email"
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Send reset link
          </Button>
        </form>
      </Form>

      <p className="text-muted-foreground text-center text-sm">
        Remembered it?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Back to login
        </Link>
      </p>
    </div>
  )
}
