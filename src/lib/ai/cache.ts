// ============================================================================
// TTL cache — in-memory, keyed by a hash of the input.
//
// Used for AI responses that are expensive to compute and stable for the
// same input (e.g. goal suggestions for a given twin snapshot, insights
// for a given scan). The negotiator is NOT cached (it's conversational).
//
// Entries expire after their TTL. Memory is bounded by MAX_ENTRIES with a
// simple LRU-ish eviction (oldest-inserted entry dropped when full).
// ============================================================================

type CacheEntry<T> = {
  value: T
  expiresAt: number // epoch ms
  insertedAt: number
}

const MAX_ENTRIES = 200

const store = new Map<string, CacheEntry<unknown>>()

// Default TTLs per function (ms)
export const CACHE_TTL = {
  detect: 0, // never cache (images vary)
  insights: 10 * 60 * 1000, // 10 min
  'twin-recommendations': 15 * 60 * 1000, // 15 min
  'goal-suggestions': 10 * 60 * 1000, // 10 min
  negotiator: 0, // never cache (conversational)
} as const

/**
 * Generate a cache key from a function name + serializable input.
 * Uses a simple FNV-1a hash for compactness.
 */
export function cacheKey(functionKey: string, input: unknown): string {
  const json = JSON.stringify(input)
  let hash = 0x811c9dc5
  for (let i = 0; i < json.length; i++) {
    hash ^= json.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return `${functionKey}:${(hash >>> 0).toString(36)}`
}

/**
 * Get a cached value if present and not expired.
 * Returns undefined on miss.
 */
export function getCached<T>(key: string): T | undefined {
  const entry = store.get(key) as CacheEntry<T> | undefined
  if (!entry) return undefined
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    return undefined
  }
  return entry.value
}

/**
 * Set a cached value with a TTL.
 * Evicts the oldest entry if the store is full.
 */
export function setCached<T>(key: string, value: T, ttlMs: number): void {
  if (ttlMs <= 0) return // caching disabled for this function

  // Evict if at capacity (oldest by insertion order)
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value
    if (oldest) store.delete(oldest)
  }

  store.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
    insertedAt: Date.now(),
  })
}

/**
 * Invalidate all cached entries for a function (e.g. when the user's data
 * changes and stale caches should be purged).
 */
export function invalidateFunction(functionKey: string): void {
  const prefix = `${functionKey}:`
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}

/**
 * Clear the entire cache (for testing / admin).
 */
export function clearCache(): void {
  store.clear()
}
