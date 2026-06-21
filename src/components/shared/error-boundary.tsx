'use client'

import * as React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ============================================================================
// ErrorBoundary — catches render errors in child component trees.
//
// Features:
//   • Graceful fallback UI instead of white screen
//   • Optional onReset callback for custom recovery logic
//   • Logs errors to console for debugging
//   • Accessible with proper ARIA attributes
// ============================================================================

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught error:', error.message, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <DefaultFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      )
    }

    return this.props.children
  }
}

// ============================================================================
// Default fallback UI
// ============================================================================

function DefaultFallback({
  error,
  onReset,
}: {
  error: Error | null
  onReset: () => void
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" />
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">Something went wrong</h3>
        <p className="max-w-sm text-xs text-muted-foreground">
          {error?.message ?? 'An unexpected error occurred while rendering this section.'}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="gap-1.5"
      >
        <RefreshCw className="size-3.5" />
        Try again
      </Button>
    </div>
  )
}
