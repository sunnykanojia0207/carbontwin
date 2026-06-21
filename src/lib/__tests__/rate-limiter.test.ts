/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================================================
// Tests for AI rate limiter.
//
// Tests the token bucket algorithm in checkRateLimit:
//   • First request is always allowed
//   • Burst consumption exhausts tokens
//   • Tokens refill over time
// ============================================================================

import { checkRateLimit, getRateLimitStatus } from '@/lib/ai/rate-limiter'

// Known config: 'detect' function has capacity=10, refillPerHour=20

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows the first request', () => {
    const result = checkRateLimit('user-1', 'detect')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(9) // 10 - 1
    expect(result.limit).toBe(10)
  })

  it('allows up to capacity requests', () => {
    // Consume all 10 tokens for 'detect' (capacity=10)
    for (let i = 0; i < 10; i++) {
      const result = checkRateLimit('user-2', 'detect')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(9 - i)
    }
  })

  it('blocks requests after capacity is exhausted', () => {
    // Consume all 10 tokens
    for (let i = 0; i < 10; i++) {
      checkRateLimit('user-3', 'detect')
    }

    // 11th request should be blocked
    const result = checkRateLimit('user-3', 'detect')
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    // There should be a positive reset time
    expect(result.resetInMs).toBeGreaterThan(0)
  })

  it('refills tokens over time', () => {
    // Consume all tokens
    for (let i = 0; i < 10; i++) {
      checkRateLimit('user-4', 'detect')
    }

    // Verify blocked
    expect(checkRateLimit('user-4', 'detect').allowed).toBe(false)

    // Advance time by 30 minutes (refillPerHour=20 for detect)
    // 30 min = 0.5 hours → 10 tokens refilled
    vi.advanceTimersByTime(30 * 60 * 1000)

    const result = checkRateLimit('user-4', 'detect')
    expect(result.allowed).toBe(true)
    // Should have refilled ~10 tokens, consumed 1, so ~9 left
    // But capacity is 10 so tokens min(config.capacity, ...)
    expect(result.remaining).toBeGreaterThanOrEqual(8)
  })

  it('uses default config for unknown function keys', () => {
    const result = checkRateLimit('user-5', 'unknown-function')
    expect(result.allowed).toBe(true)
    // Default capacity: 10
    expect(result.remaining).toBe(9)
    expect(result.limit).toBe(10)
  })

  it('tracks different users independently', () => {
    // Exhaust user-A
    for (let i = 0; i < 10; i++) {
      checkRateLimit('user-A', 'detect')
    }
    expect(checkRateLimit('user-A', 'detect').allowed).toBe(false)

    // User-B should still have full capacity
    const result = checkRateLimit('user-B', 'detect')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(9)
  })

  it('tracks different functions independently', () => {
    // Exhaust 'detect'
    for (let i = 0; i < 10; i++) {
      checkRateLimit('user-6', 'detect')
    }
    expect(checkRateLimit('user-6', 'detect').allowed).toBe(false)

    // 'insights' has a separate bucket (capacity=5)
    const result = checkRateLimit('user-6', 'insights')
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })
})

describe('getRateLimitStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns full capacity when no requests have been made', () => {
    const status = getRateLimitStatus('new-user', 'detect')
    expect(status.remaining).toBe(10) // default capacity
    expect(status.limit).toBe(10)
  })

  it('returns remaining tokens after consumption', () => {
    checkRateLimit('user-status', 'detect')
    checkRateLimit('user-status', 'detect')
    checkRateLimit('user-status', 'detect')

    const status = getRateLimitStatus('user-status', 'detect')
    expect(status.remaining).toBe(7)
    expect(status.limit).toBe(10)
  })
})
