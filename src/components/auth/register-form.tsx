'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, AlertCircle } from 'lucide-react'

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
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter'
import { googleEnabled } from '@/lib/auth-client'
import { registerUser } from '@/lib/auth.actions'
import {
  registerSchema,
  type RegisterInput,
} from '@/lib/validations/auth'

// ============================================================================
// Register form — creates the user via a server action, then signs them in
// via NextAuth credentials and routes to onboarding.
// ============================================================================

export function RegisterForm() {
  const router = useRouter()

  // NOTE: "already authenticated" redirect is handled server-side in the
  // register page (via getServerSession) to avoid racing with the
  // post-registration router.push('/onboarding') below.

  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  const password = useWatch({ control: form.control, name: 'password' })
  const isSubmitting = form.formState.isSubmitting

  const onSubmit = async (values: RegisterInput) => {
    setFormError(null)
    const res = await registerUser(values)
    if (!res.ok) {
      if (res.fieldErrors) {
        // Map server-side field errors back into the form.
        for (const [field, messages] of Object.entries(res.fieldErrors)) {
          if (messages.length)
            form.setError(field as keyof RegisterInput, {
              message: messages[0],
            })
        }
      }
      setFormError(res.error)
      return
    }

    // Auto sign-in after registration.
    const signInRes = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    })
    if (!signInRes || signInRes.error) {
      // Account was created but auto sign-in failed — send to login.
      router.push('/login?registered=1')
      return
    }
    router.push('/onboarding')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your Climate Twin
        </h1>
        <p className="text-muted-foreground text-sm">
          60 seconds to understand your footprint.
        </p>
      </div>

      {formError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {googleEnabled && (
        <>
          <OAuthButtons callbackUrl="/onboarding" disabled={isSubmitting} />
          <div className="relative">
            <div className="bg-border absolute inset-0 top-1/2 h-px" />
            <div className="relative mx-auto w-fit">
              <span className="text-muted-foreground bg-background px-3 text-xs">
                or sign up with email
              </span>
            </div>
          </div>
        </>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                    <Input
                    placeholder="Your name"
                    autoComplete="name"
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordField
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    disabled={isSubmitting}
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
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <PasswordField
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
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
            Create account
          </Button>
        </form>
      </Form>

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-primary hover:underline font-medium"
        >
          Log in
        </Link>
      </p>
    </div>
  )
}
