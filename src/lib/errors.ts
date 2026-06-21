// ============================================================================
// Error handling utilities — reusable patterns for the entire app.
//
// Provides:
//   ApiResult<T>       — typed return value for server actions & API routes
//   ApiError           — structured error class
//   safeFetch<T>       — typed fetch wrapper for client calls
//   SafeParseError     — error for Zod validation failures
// ============================================================================

import type { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export type ApiResultOk<T> = { ok: true; data: T }
export type ApiResultError = {
  ok: false
  error: string
  fieldErrors?: Record<string, string[]>
  code?: string
  status?: number
}

export type ApiResult<T> = ApiResultOk<T> | ApiResultError

export function isOk<T>(result: ApiResult<T>): result is ApiResultOk<T> {
  return result.ok === true
}

export function isError<T>(result: ApiResult<T>): result is ApiResultError {
  return result.ok === false
}

// ============================================================================
// ApiError — structured error with code and status
// ============================================================================

export class ApiError extends Error {
  public readonly code: string
  public readonly status: number
  public readonly fieldErrors?: Record<string, string[]>

  constructor(
    message: string,
    options?: {
      code?: string
      status?: number
      fieldErrors?: Record<string, string[]>
      cause?: unknown
    },
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = options?.code ?? 'UNKNOWN_ERROR'
    this.status = options?.status ?? 500
    this.fieldErrors = options?.fieldErrors
    if (options?.cause) this.cause = options.cause
  }

  static badRequest(message: string, fieldErrors?: Record<string, string[]>) {
    return new ApiError(message, { code: 'BAD_REQUEST', status: 400, fieldErrors })
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(message, { code: 'UNAUTHORIZED', status: 401 })
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(message, { code: 'NOT_FOUND', status: 404 })
  }

  static rateLimited(message = 'Rate limit exceeded. Try again later.') {
    return new ApiError(message, { code: 'RATE_LIMITED', status: 429 })
  }

  static aiError(message = 'AI service unavailable. Using fallback.') {
    return new ApiError(message, { code: 'AI_ERROR', status: 503 })
  }

  static databaseError(cause?: unknown) {
    return new ApiError('Database operation failed', {
      code: 'DATABASE_ERROR',
      status: 500,
      cause,
    })
  }

  static fromZod(error: z.ZodError) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of error.issues) {
      const path = issue.path.join('.')
      if (!fieldErrors[path]) fieldErrors[path] = []
      fieldErrors[path].push(issue.message)
    }
    return new ApiError('Validation failed', {
      code: 'VALIDATION_ERROR',
      status: 400,
      fieldErrors,
    })
  }
}

// ============================================================================
// safeFetch — typed fetch wrapper for client-side API calls
// ============================================================================

export interface SafeFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  timeout?: number
  retries?: number
  retryDelay?: number
}

export class FetchError extends Error {
  public readonly status: number
  public readonly code: string
  public readonly responseBody?: unknown

  constructor(message: string, status: number, code: string, responseBody?: unknown) {
    super(message)
    this.name = 'FetchError'
    this.status = status
    this.code = code
    this.responseBody = responseBody
  }
}

export async function safeFetch<T>(
  url: string,
  options?: SafeFetchOptions,
): Promise<{ data: T; response: Response }> {
  const {
    body,
    timeout = 30_000,
    retries = 0,
    retryDelay = 500,
    ...fetchOptions
  } = options ?? {}

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  const doFetch = async (): Promise<Response> => {
    return fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  }

  try {
    let lastError: Error | null = null
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await doFetch()
        clearTimeout(timeoutId)

        if (!response.ok) {
          let errorBody: unknown
          try {
            errorBody = await response.json()
          } catch {
            errorBody = await response.text().catch(() => undefined)
          }

          const errorMessage =
            (errorBody as Record<string, unknown>)?.error as string ??
            response.statusText ??
            `HTTP ${response.status}`
          const errorCode =
            (errorBody as Record<string, unknown>)?.code as string ?? 'HTTP_ERROR'

          throw new FetchError(errorMessage, response.status, errorCode, errorBody)
        }

        const data = (await response.json()) as T
        return { data, response }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, retryDelay * (attempt + 1)))
        }
      }
    }
    throw lastError!
  } finally {
    clearTimeout(timeoutId)
  }
}

// ============================================================================
// getUserFacingErrorMessage — never expose raw errors to users
// ============================================================================

const USER_FACING_MESSAGES: Record<string, string> = {
  TIMEOUT: 'Request timed out. Please try again.',
  NETWORK_ERROR: 'Network error. Check your connection.',
  RATE_LIMITED: 'Too many requests. Please wait a moment.',
  AI_ERROR: 'AI service temporarily unavailable. Using local fallback.',
  DATABASE_ERROR: 'Something went wrong. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNAUTHORIZED: 'Please sign in to continue.',
  NOT_FOUND: 'The requested resource was not found.',
  BAD_REQUEST: 'Invalid request. Please try again.',
}

export function getUserFacingMessage(error: unknown): string {
  if (error instanceof FetchError) {
    return USER_FACING_MESSAGES[error.code] ?? error.message
  }
  if (error instanceof ApiError) {
    return USER_FACING_MESSAGES[error.code] ?? error.message
  }
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return USER_FACING_MESSAGES.NETWORK_ERROR
  }
  if (error instanceof DOMException && error.name === 'AbortError') {
    return USER_FACING_MESSAGES.TIMEOUT
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred.'
}
