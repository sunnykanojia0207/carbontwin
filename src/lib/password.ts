import bcrypt from 'bcryptjs'

// ============================================================================
// Password hashing — bcryptjs (pure JS, serverless/edge-safe).
// Cost factor 10 ≈ ~60ms on a modern CPU: strong yet fast enough for auth.
// ============================================================================

const SALT_ROUNDS = 10

/** Hash a plaintext password. Returns "<hash>". */
export async function hashPassword(plaintext: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS)
  return bcrypt.hash(plaintext, salt)
}

/**
 * Verify a plaintext password against a stored hash.
 * Returns false (never throws) on malformed hash / mismatch — so callers
 * can treat all failure modes uniformly as "invalid credentials".
 */
export async function verifyPassword(
  plaintext: string,
  hash: string | null | undefined,
): Promise<boolean> {
  if (!hash) return false
  try {
    return await bcrypt.compare(plaintext, hash)
  } catch {
    return false
  }
}

/** Generate a URL-safe opaque token for email verification / password reset. */
export function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
