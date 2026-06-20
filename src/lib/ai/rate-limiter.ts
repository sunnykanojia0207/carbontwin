// ============================================================================
// Rate limiter — in-memory token bucket, per user + per function.
//
// Each AI function has its own bucket capacity and refill rate, so a user
// can't exhaust their negotiator budget by spamming goal-suggestions.
//
// Buckets are keyed by `${userId}:${functionKey}`. Memory is bounded by the
// number of active users × functions; stale entries are GC'd on access.
//
// On a multi-instance deploy (Vercel), this per-instance limiter is a first
// line of defense — for true distributed limiting, swap in Upstash Redis.
// ============================================================================

type Bucket = {
  tokens: number
  lastRefill: number // epoch ms
}

type RateLimitConfig = {
  capacity: number // max tokens (burst)
  refillPerHour: number // tokens added per hour
}

// Per-function limits. Tuned for a free-tier SaaS.
const FUNCTION_LIMITS: Record<string, RateLimitConfig> = {
  detect: { capacity: 10, refillPerHour: 20 }, // 20 scans/hour
  insights: { capacity: 5, refillPerHour: 10 }, // 10 insights/hour
  'twin-recommendations': { capacity: 10, refillPerHour: 20 },
  negotiator: { capacity: 30, refillPerHour: 60 }, // 60 msgs/hour
  'goal-suggestions': { capacity: 10, refillPerHour: 20 },
}

const DEFAULT_LIMIT: RateLimitConfig = { capacity: 10, refillPerHour: 20 }

// In-memory store. Keyed by `${userId}:${functionKey}`.
const buckets = new Map<string, Bucket>()

// GC: drop buckets not touched in the last hour (keeps memory bounded).
const STALE_MS = 60 * 60 * 1000
let lastGc = Date.now()

function gc() {
  const now = Date.now()
  if (now - lastGc < 5 * 60 * 1000) return // every 5 min
  lastGc = now
  for (const [key, b] of buckets) {
    if (now - b.lastRefill > STALE_MS) buckets.delete(key)
  }
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetInMs: number // ms until the next token refills
  limit: number
}

/**
 * Check whether a request is allowed under the rate limit.
 * Consumes 1 token if allowed.
 *
 * @param userId       the authenticated user id
 * @param functionKey  one of the keys in FUNCTION_LIMITS
 */
export function checkRateLimit(
  userId: string,
  functionKey: string,
): RateLimitResult {
  gc()

  const config = FUNCTION_LIMITS[functionKey] ?? DEFAULT_LIMIT
  const key = `${userId}:${functionKey}`
  const now = Date.now()
  const refillPerMs = config.refillPerHour / (60 * 60 * 1000)

  let bucket = buckets.get(key)
  if (!bucket) {
    bucket = { tokens: config.capacity, lastRefill: now }
    buckets.set(key, bucket)
  }

  // Refill tokens based on elapsed time
  const elapsed = now - bucket.lastRefill
  const refilled = elapsed * refillPerMs
  bucket.tokens = Math.min(config.capacity, bucket.tokens + refilled)
  bucket.lastRefill = now

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return {
      allowed: true,
      remaining: Math.floor(bucket.tokens),
      resetInMs: bucket.tokens >= 1 ? 0 : Math.ceil((1 - bucket.tokens) / refillPerMs),
      limit: config.capacity,
    }
  }

  // Not enough tokens — compute when the next one will be available
  const resetInMs = Math.ceil((1 - bucket.tokens) / refillPerMs)
  return {
    allowed: false,
    remaining: 0,
    resetInMs,
    limit: config.capacity,
  }
}

/**
 * Get the current rate limit status for a user+function without consuming.
 */
export function getRateLimitStatus(
  userId: string,
  functionKey: string,
): { remaining: number; limit: number } {
  const config = FUNCTION_LIMITS[functionKey] ?? DEFAULT_LIMIT
  const key = `${userId}:${functionKey}`
  const bucket = buckets.get(key)
  return {
    remaining: bucket ? Math.floor(bucket.tokens) : config.capacity,
    limit: config.capacity,
  }
}
