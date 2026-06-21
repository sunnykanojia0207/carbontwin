/// <reference types="vitest/globals" />
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// ============================================================================
// Authentication flow integration tests
// ============================================================================

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/login',
}))

vi.mock('@/lib/auth.actions', () => ({
  registerUser: vi.fn().mockResolvedValue({ ok: true, data: { id: 'user-1' } }),
  resetPassword: vi.fn(),
}))

describe('Login Form', () => {
  it('renders email and password fields', async () => {
    const { LoginForm } = await import('@/components/auth/login-form')
    render(<LoginForm />)
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
  })

  it('renders sign in button', async () => {
    const { LoginForm } = await import('@/components/auth/login-form')
    render(<LoginForm />)
    const button = screen.getByRole('button', { name: /sign in/i })
    expect(button).toBeInTheDocument()
  })
})

describe('Register Form', () => {
  it('renders all registration fields', async () => {
    const { RegisterForm } = await import('@/components/auth/register-form')
    render(<RegisterForm />)
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('renders create account button', async () => {
    const { RegisterForm } = await import('@/components/auth/register-form')
    render(<RegisterForm />)
    const button = screen.getByRole('button', { name: /create account/i })
    expect(button).toBeInTheDocument()
  })

  it('renders login link', async () => {
    const { RegisterForm } = await import('@/components/auth/register-form')
    render(<RegisterForm />)
    expect(screen.getByText(/log in/i)).toBeInTheDocument()
  })
})

describe('Forgot Password Form', () => {
  it('renders email input and reset button', async () => {
    const { ForgotPasswordForm } = await import('@/components/auth/forgot-password-form')
    render(<ForgotPasswordForm />)
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    const button = screen.getByRole('button', { name: /reset|send/i })
    expect(button).toBeInTheDocument()
  })
})

describe('Sign Out Button', () => {
  it('renders sign out trigger', async () => {
    const { SignOutButton } = await import('@/components/auth/sign-out-button')
    render(<SignOutButton />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })
})

describe('Password Strength Meter', () => {
  it('shows weak for short passwords', async () => {
    const { PasswordStrengthMeter } = await import('@/components/auth/password-strength-meter')
    render(<PasswordStrengthMeter password="abc" />)
    expect(screen.getByText(/weak/i)).toBeInTheDocument()
  })

  it('shows strong for complex passwords', async () => {
    const { PasswordStrengthMeter } = await import('@/components/auth/password-strength-meter')
    render(<PasswordStrengthMeter password="Abcd@12345!" />)
    expect(screen.getByText(/strong/i)).toBeInTheDocument()
  })

  it('shows empty for empty password', async () => {
    const { PasswordStrengthMeter } = await import('@/components/auth/password-strength-meter')
    const { container } = render(<PasswordStrengthMeter password="" />)
    expect(container).toBeTruthy()
  })
})
