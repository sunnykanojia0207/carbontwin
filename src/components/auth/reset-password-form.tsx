'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PasswordField } from '@/components/auth/password-field'
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter'
import { resetPassword } from '@/lib/auth.actions'
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@/lib/validations/auth'

// ============================================================================
// Reset password form — consumes the token from the URL query string.
// ============================================================================

export function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') ?? ''

  const [formError, setFormError] = React.useState<string | null>(
    token ? null : 'Missing reset token. Please request a new link.',
  )
  const [done, setDone] = React.useState(false)

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: '', confirmPassword: '' },
  })

  const password = form.watch('password')
  const isSubmitting = form.formState.isSubmitting
  const disabled = !token || isSubmitting || done

  const onSubmit = async (values: ResetPasswordInput) => {
    setFormError(null)
    const res = await resetPassword(values)
    if (!res.ok) {
      if (res.fieldErrors?.password?.length) {
        form.setError('password', { message: res.fieldErrors.password[0] })
      }
      if (res.fieldErrors?.confirmPassword?.length) {
        form.setError('confirmPassword', {
          message: res.fieldErrors.confirmPassword[0],
        })
      }
      setFormError(res.error)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center">
          <span className="bg-primary/10 text-primary mb-4 flex size-12 items-center justify-center rounded-full">
            <CheckCircle2 className="size-6" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            Password updated
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Your password has been changed. Sign in with your new password.
          </p>
        </div>
        <Button
          className="w-full"
          onClick={() => router.push('/login?reset=1')}
        >
          Continue to login
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          Set a new password
        </h1>
        <p className="text-muted-foreground text-sm">
          Choose a strong password you don&apos;t use elsewhere.
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                    <PasswordField
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <PasswordStrengthMeter password={password} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <PasswordField
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full"
            disabled={disabled}
          >
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            Update password
          </Button>
        </form>
      </Form>

      <p className="text-muted-foreground text-center text-sm">
        <Link
          href="/login"
          className="text-primary hover:underline font-medium"
        >
          Back to login
        </Link>
      </p>
    </div>
  )
}
