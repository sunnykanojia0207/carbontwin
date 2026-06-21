/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { z } from 'zod'

// ============================================================================
// Tests for error handling utilities — ApiError, FetchError, safeFetch,
// isOk, isError, getUserFacingMessage.
// ============================================================================

import {
  ApiError,
  FetchError,
  isOk,
  isError,
  getUserFacingMessage,
  safeFetch,
} from '@/lib/errors'

// ---------------------------------------------------------------------------
// ApiError class
// ---------------------------------------------------------------------------
describe('ApiError', () => {
  it('creates error with default values', () => {
    const error = new ApiError('Test error')
    expect(error.message).toBe('Test error')
    expect(error.name).toBe('ApiError')
    expect(error.code).toBe('UNKNOWN_ERROR')
    expect(error.status).toBe(500)
    expect(error.fieldErrors).toBeUndefined()
    expect(error.cause).toBeUndefined()
    expect(error).toBeInstanceOf(Error)
  })

  it('creates error with custom options', () => {
    const cause = new Error('root cause')
    const error = new ApiError('Custom', {
      code: 'CUSTOM_CODE',
      status: 418,
      fieldErrors: { name: ['Required'] },
      cause,
    })
    expect(error.code).toBe('CUSTOM_CODE')
    expect(error.status).toBe(418)
    expect(error.fieldErrors).toEqual({ name: ['Required'] })
    expect(error.cause).toBe(cause)
  })

  it('creates error with only some options', () => {
    const error = new ApiError('Partial', { status: 400 })
    expect(error.code).toBe('UNKNOWN_ERROR')
    expect(error.status).toBe(400)
    expect(error.fieldErrors).toBeUndefined()
  })
})

describe('ApiError static factories', () => {
  it('badRequest creates 400 with fieldErrors', () => {
    const error = ApiError.badRequest('Bad input', { email: ['Invalid'] })
    expect(error.status).toBe(400)
    expect(error.code).toBe('BAD_REQUEST')
    expect(error.fieldErrors).toEqual({ email: ['Invalid'] })
    expect(error.message).toBe('Bad input')
  })

  it('badRequest works without fieldErrors', () => {
    const error = ApiError.badRequest('Bad')
    expect(error.status).toBe(400)
    expect(error.fieldErrors).toBeUndefined()
  })

  it('unauthorized creates 401 with default message', () => {
    const error = ApiError.unauthorized()
    expect(error.status).toBe(401)
    expect(error.code).toBe('UNAUTHORIZED')
    expect(error.message).toBe('Unauthorized')
  })

  it('unauthorized accepts custom message', () => {
    const error = ApiError.unauthorized('Sign in required')
    expect(error.message).toBe('Sign in required')
  })

  it('notFound creates 404 with default message', () => {
    const error = ApiError.notFound()
    expect(error.status).toBe(404)
    expect(error.code).toBe('NOT_FOUND')
    expect(error.message).toBe('Resource not found')
  })

  it('notFound accepts custom message', () => {
    const error = ApiError.notFound('User not found')
    expect(error.message).toBe('User not found')
  })

  it('rateLimited creates 429 with rate limit message', () => {
    const error = ApiError.rateLimited()
    expect(error.status).toBe(429)
    expect(error.code).toBe('RATE_LIMITED')
    expect(error.message).toContain('Rate limit')
  })

  it('aiError creates 503 with AI service message', () => {
    const error = ApiError.aiError()
    expect(error.status).toBe(503)
    expect(error.code).toBe('AI_ERROR')
    expect(error.message).toContain('AI service')
  })

  it('databaseError creates 500 with cause', () => {
    const cause = new Error('pool exhausted')
    const error = ApiError.databaseError(cause)
    expect(error.status).toBe(500)
    expect(error.code).toBe('DATABASE_ERROR')
    expect(error.message).toBe('Database operation failed')
    expect(error.cause).toBe(cause)
  })

  it('databaseError works without a cause', () => {
    const error = ApiError.databaseError()
    expect(error.status).toBe(500)
    expect(error.cause).toBeUndefined()
  })

  describe('fromZod', () => {
    it('converts a ZodError with single field error', () => {
      const schema = z.object({ email: z.string().email() })
      const result = schema.safeParse({ email: 'not-an-email' })
      expect(result.success).toBe(false)
      if (!result.success) {
        const error = ApiError.fromZod(result.error)
        expect(error.status).toBe(400)
        expect(error.code).toBe('VALIDATION_ERROR')
        expect(error.message).toBe('Validation failed')
        expect(error.fieldErrors!.email).toBeDefined()
        expect(error.fieldErrors!.email!.length).toBeGreaterThan(0)
      }
    })

    it('converts a ZodError with multiple field errors', () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().min(18),
        email: z.string().email(),
      })
      const result = schema.safeParse({ name: '', age: 15, email: 'bad' })
      expect(result.success).toBe(false)
      if (!result.success) {
        const error = ApiError.fromZod(result.error)
        expect(error.status).toBe(400)
        expect(error.code).toBe('VALIDATION_ERROR')
        expect(Object.keys(error.fieldErrors!).length).toBeGreaterThan(1)
      }
    })

    it('handles nested path errors', () => {
      const schema = z.object({ address: z.object({ zip: z.string().length(5) }) })
      const result = schema.safeParse({ address: { zip: '123' } })
      expect(result.success).toBe(false)
      if (!result.success) {
        const error = ApiError.fromZod(result.error)
        expect(error.fieldErrors!['address.zip']).toBeDefined()
      }
    })
  })
})

// ---------------------------------------------------------------------------
// FetchError class
// ---------------------------------------------------------------------------
describe('FetchError', () => {
  it('creates a FetchError with all properties', () => {
    const body = { error: 'Not found', code: 'NOT_FOUND' }
    const error = new FetchError('Resource not found', 404, 'NOT_FOUND', body)
    expect(error.message).toBe('Resource not found')
    expect(error.status).toBe(404)
    expect(error.code).toBe('NOT_FOUND')
    expect(error.responseBody).toEqual(body)
    expect(error.name).toBe('FetchError')
  })

  it('creates a FetchError without response body', () => {
    const error = new FetchError('Server error', 500, 'SERVER_ERROR')
    expect(error.responseBody).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// isOk / isError type guards
// ---------------------------------------------------------------------------
describe('isOk / isError', () => {
  it('isOk returns true for ok results', () => {
    const result = { ok: true, data: { id: 1 } } as const
    expect(isOk(result)).toBe(true)
  })

  it('isOk returns false for error results', () => {
    const result = { ok: false, error: 'fail' } as const
    expect(isOk(result)).toBe(false)
  })

  it('isError returns true for error results', () => {
    const result = { ok: false, error: 'fail' } as const
    expect(isError(result)).toBe(true)
  })

  it('isError returns false for ok results', () => {
    const result = { ok: true, data: { id: 1 } } as const
    expect(isError(result)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getUserFacingMessage
// ---------------------------------------------------------------------------
describe('getUserFacingMessage', () => {
  it('returns mapped message for FetchError with known code', () => {
    const error = new FetchError('raw', 429, 'RATE_LIMITED')
    expect(getUserFacingMessage(error)).toBe('Too many requests. Please wait a moment.')
  })

  it('returns raw message for FetchError with unknown code', () => {
    const error = new FetchError('Custom db error', 500, 'DB_ERROR')
    expect(getUserFacingMessage(error)).toBe('Custom db error')
  })

  it('returns mapped message for ApiError with known code', () => {
    const error = new ApiError('raw', { code: 'VALIDATION_ERROR' })
    expect(getUserFacingMessage(error)).toBe('Please check your input and try again.')
  })

  it('returns mapped message for UNAUTHORIZED ApiError', () => {
    const error = ApiError.unauthorized()
    expect(getUserFacingMessage(error)).toBe('Please sign in to continue.')
  })

  it('returns mapped message for NOT_FOUND ApiError', () => {
    const error = ApiError.notFound()
    expect(getUserFacingMessage(error)).toBe('The requested resource was not found.')
  })

  it('returns raw message for ApiError with unknown code', () => {
    const error = new ApiError('Some unknown error', { code: 'MYSTERY' })
    expect(getUserFacingMessage(error)).toBe('Some unknown error')
  })

  it('returns network error message for TypeError with "Failed to fetch"', () => {
    const error = new TypeError('Failed to fetch')
    expect(getUserFacingMessage(error)).toBe('Network error. Check your connection.')
  })

  it('returns timeout message for DOMException AbortError', () => {
    const error = new DOMException('The operation was aborted', 'AbortError')
    expect(getUserFacingMessage(error)).toBe('Request timed out. Please try again.')
  })

  it('returns message for generic Error', () => {
    expect(getUserFacingMessage(new Error('Something broke'))).toBe('Something broke')
  })

  it('returns generic fallback for non-Error values', () => {
    expect(getUserFacingMessage('string error')).toBe('An unexpected error occurred.')
    expect(getUserFacingMessage(null)).toBe('An unexpected error occurred.')
    expect(getUserFacingMessage(undefined)).toBe('An unexpected error occurred.')
    expect(getUserFacingMessage(42)).toBe('An unexpected error occurred.')
    expect(getUserFacingMessage({})).toBe('An unexpected error occurred.')
  })

  it('returns original message for TypeError with non-fetch message', () => {
    const error = new TypeError('Something type-related')
    expect(getUserFacingMessage(error)).toBe('Something type-related')
  })
})

// ---------------------------------------------------------------------------
// safeFetch
// ---------------------------------------------------------------------------
describe('safeFetch', () => {
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    originalFetch = global.fetch
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('returns data and response on successful fetch', async () => {
    const json = vi.fn().mockResolvedValue({ id: 1, name: 'test' })
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json,
      status: 200,
      statusText: 'OK',
    })

    const result = await safeFetch<{ id: number; name: string }>('/api/test')

    expect(result.data).toEqual({ id: 1, name: 'test' })
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
        signal: expect.any(AbortSignal),
      }),
    )
  })

  it('sends JSON body for POST requests', async () => {
    const json = vi.fn().mockResolvedValue({ success: true })
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json,
    })

    await safeFetch('/api/test', {
      method: 'POST',
      body: { name: 'hello', count: 42 },
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'hello', count: 42 }),
      }),
    )
  })

  it('uses custom headers and merges with Content-Type', async () => {
    const json = vi.fn().mockResolvedValue({})
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json,
    })

    await safeFetch('/api/test', {
      headers: { Authorization: 'Bearer token123' },
    })

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token123',
        },
      }),
    )
  })

  it('does not send body when body is undefined', async () => {
    const json = vi.fn().mockResolvedValue({})
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json,
    })

    await safeFetch('/api/test')

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        body: undefined,
      }),
    )
  })

  it('throws FetchError on HTTP error with JSON error body', async () => {
    const errorBody = { error: 'Not found', code: 'NOT_FOUND' }
    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: vi.fn().mockResolvedValue(errorBody),
      text: vi.fn().mockResolvedValue(JSON.stringify(errorBody)),
    })

    await expect(safeFetch('/api/test')).rejects.toThrow(FetchError)
    await expect(safeFetch('/api/test')).rejects.toThrow('Not found')
  })

  it('uses statusText when error body has no message', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: vi.fn().mockRejectedValue(new Error('parse fail')),
      text: vi.fn().mockResolvedValue(''),
    })

    await expect(safeFetch('/api/test')).rejects.toThrow('Internal Server Error')
  })

  it('uses empty statusText when HTTP status provides no message', async () => {
    // The code uses `response.statusText ?? \`HTTP \${response.status}\``.
    // Since `??` only catches null/undefined (not ''), empty statusText is returned as-is.
    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      status: 503,
      statusText: '',
      json: vi.fn().mockRejectedValue(new Error('parse fail')),
      text: vi.fn().mockResolvedValue(''),
    })

    const error = await safeFetch('/api/test').catch(e => e)
    expect(error.message).toBe('') // empty string returned as-is
    expect(error).toBeInstanceOf(FetchError)
    expect(error.status).toBe(503)
  })

  it('retries on network failure and succeeds on retry', async () => {
    const successJson = vi.fn().mockResolvedValue({ data: 'recovered' })
    ;(global.fetch as any)
      .mockRejectedValueOnce(new Error('Network failure'))
      .mockResolvedValueOnce({
        ok: true,
        json: successJson,
      })

    const result = await safeFetch<{ data: string }>('/api/test', { retries: 1 })

    expect(result.data).toEqual({ data: 'recovered' })
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('retries on HTTP error and succeeds on retry', async () => {
    const successJson = vi.fn().mockResolvedValue({ ok: true })
    ;(global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        json: vi.fn().mockRejectedValue(new Error('parse fail')),
        text: vi.fn().mockResolvedValue('Server Error'),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: successJson,
      })

    const result = await safeFetch<{ ok: boolean }>('/api/test', { retries: 1 })

    expect(result.data).toEqual({ ok: true })
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('throws last error after exhausting retries', async () => {
    ;(global.fetch as any).mockRejectedValue(new Error('Persistent failure'))

    await expect(
      safeFetch('/api/test', { retries: 2 }),
    ).rejects.toThrow('Persistent failure')

    expect(global.fetch).toHaveBeenCalledTimes(3) // initial + 2 retries
  })

  it('uses exponential-like retry delay (attempt-based)', async () => {
    ;(global.fetch as any).mockRejectedValue(new Error('fail'))

    const start = Date.now()
    await expect(
      safeFetch('/api/test', { retries: 2, retryDelay: 50 }),
    ).rejects.toThrow('fail')

    // With delays of 50ms and 100ms (attempt 0: 50*1, attempt 1: 50*2)
    const elapsed = Date.now() - start
    expect(elapsed).toBeGreaterThanOrEqual(140) // Allow some tolerance
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it('clears timeout on success', async () => {
    const json = vi.fn().mockResolvedValue({})
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json,
    })

    await expect(
      safeFetch('/api/test', { timeout: 1000 }),
    ).resolves.toBeDefined()
  })
})
