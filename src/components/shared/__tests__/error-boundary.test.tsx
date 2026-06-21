/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ============================================================================
// Tests for ErrorBoundary component.
//
// Uses a child component that throws to trigger the error boundary's
// componentDidCatch lifecycle method.
// ============================================================================

import { ErrorBoundary } from '@/components/shared/error-boundary'

// A child component that throws when instructed
function BuggyChild({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error from child')
  }
  return <div data-testid="child-content">All good</div>
}

// Suppress console.error in these tests (expected error boundary output)
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <BuggyChild />
      </ErrorBoundary>,
    )

    expect(screen.getByTestId('child-content')).toHaveTextContent('All good')
  })

  it('catches errors and shows default fallback UI', () => {
    render(
      <ErrorBoundary>
        <BuggyChild shouldThrow={true} />
      </ErrorBoundary>,
    )

    // The default fallback should be rendered
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error from child')).toBeInTheDocument()
    // "Try again" button should be present
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    const customFallback = <div data-testid="custom-fallback">Custom error UI</div>

    render(
      <ErrorBoundary fallback={customFallback}>
        <BuggyChild shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(screen.getByTestId('custom-fallback')).toHaveTextContent('Custom error UI')
    // Default fallback should NOT be rendered
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument()
  })

  it('resets and re-renders children on "Try again" click', async () => {
    // We need a controlled component to re-mount the buggy child
    function TestApp() {
      return (
        <ErrorBoundary>
          <BuggyChild shouldThrow={true} />
        </ErrorBoundary>
      )
    }

    render(<TestApp />)

    // Error should be caught
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Test error from child')).toBeInTheDocument()

    // The "Try again" button should exist
    const tryAgainButton = screen.getByRole('button', { name: /try again/i })
    expect(tryAgainButton).toBeInTheDocument()
  })

  it('calls onError callback when an error is caught', () => {
    const onError = vi.fn()

    render(
      <ErrorBoundary onError={onError}>
        <BuggyChild shouldThrow={true} />
      </ErrorBoundary>,
    )

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test error from child' }),
      expect.any(Object),
    )
  })

  it('calls onReset callback when reset is triggered', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()

    render(
      <ErrorBoundary onReset={onReset}>
        <BuggyChild shouldThrow={true} />
      </ErrorBoundary>,
    )

    await user.click(screen.getByRole('button', { name: /try again/i }))

    expect(onReset).toHaveBeenCalledTimes(1)
  })
})
