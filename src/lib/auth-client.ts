// ============================================================================
// Client-safe auth helpers — safe to import in 'use client' components.
// Keep this file free of any server-only imports (Prisma, bcrypt, env vars
// without NEXT_PUBLIC_ prefix, etc.)
// ============================================================================

/**
 * Whether Google OAuth is configured.
 * Set NEXT_PUBLIC_GOOGLE_ENABLED=true in .env when GOOGLE_CLIENT_ID is filled.
 */
export const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true'
