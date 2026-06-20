'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { OAuthButtons } from '@/components/auth/oauth-buttons'
import { PasswordField } from '@/components/auth/password-field'
import { googleEnabled } from '@/lib/auth-client'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'

// ============================================================================
// Login form — credentials sign-in via NextAuth.
// States: idle → loading → (success: redirect | error: inline alert).
// ============================================================================

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()

  const callbackUrl = params.get('callbackUrl') ?? '/dashboard'
  const registered = params.get('registered') === '1'
  const authError = params.get('error')

  // NOTE: "already authenticated" redirect is handled server-side in the
  // login page (via getServerSession) to avoid racing with the post-login
  // router.push(callbackUrl) below.

  const [formError, setFormError] = React.useState<string | null>(
    authError ? 'Sign-in failed. Please try again.' : null,
  )

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: LoginInput) => {
    setFormError(null)
    const res = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    })
    if (!res || res.error) {
      setFormError(
        'That email and password don\'t match. Try again or reset your password.',
      )
      return
    }
    // Successful sign-in — let NextAuth refresh the session, then route.
    // A small delay ensures the session cookie is committed before redirect.
    router.push(callbackUrl)
    router.refresh()
  }

  const isSubmitting = form.formState.isSubmitting

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-sm">
          Sign in to your CarbonTwin.
        </p>
      </div>

      {registered && (
        <Alert className="border-primary/30 bg-primary/5">
          <CheckCircle2 className="text-primary size-4" />
          <AlertDescription>
            Account created — sign in to continue.
          </AlertDescription>
        </Alert>
      )}

      {formError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {googleEnabled && (
        <>
          <OAuthButtons callbackUrl={callbackUrl} disabled={isSubmitting} />
          <div className="relative">
            <div className="bg-border absolute inset-0 top-1/2 h-px" />
            <div className="relative mx-auto w-fit">
              <span className="text-muted-foreground bg-background px-3 text-xs">
                or continue with email
              </span>
            </div>
          </div>
        </>
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-primary hover:underline text-xs font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <PasswordField
                    placeholder="Your password"
                    autoComplete="current-password"
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
            Sign in
          </Button>
        </form>
      </Form>

      <p className="text-muted-foreground text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="text-primary hover:underline font-medium"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
