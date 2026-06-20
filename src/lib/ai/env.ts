// ============================================================================
// Secure environment variable validation for the AI layer.
//
// All API keys and secrets are read server-side only (never exposed to the
// client). This module validates them at startup and throws a clear error
// if missing, rather than failing silently at runtime.
//
// GEMINI_API_KEY is read by the Google Generative AI SDK.
// ============================================================================

const REQUIRED_ENV = ['DATABASE_URL', 'AUTH_SECRET'] as const
const AI_ENV = ['GEMINI_API_KEY'] as const

type EnvStatus = {
  name: string
  set: boolean
  preview: string
}

function mask(value: string | undefined): string {
  if (!value) return '<not set>'
  if (value.length <= 8) return '****'
  return `${value.slice(0, 4)}…${value.slice(-4)}`
}

/**
 * Validate that all required environment variables are set.
 * Throws on missing critical vars; logs warnings for AI vars.
 */
export function validateEnv(): {
  ok: boolean
  required: EnvStatus[]
  ai: EnvStatus[]
} {
  const required: EnvStatus[] = REQUIRED_ENV.map((name) => ({
    name,
    set: !!process.env[name],
    preview: mask(process.env[name]),
  }))

  const ai: EnvStatus[] = AI_ENV.map((name) => ({
    name,
    set: !!process.env[name],
    preview: mask(process.env[name]),
  }))

  const missingRequired = required.filter((e) => !e.set)
  if (missingRequired.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingRequired.map((e) => e.name).join(', ')}. ` +
        `Copy .env.example to .env and fill in the values.`,
    )
  }

  // AI vars are optional (the app degrades gracefully to deterministic mode)
  const missingAi = ai.filter((e) => !e.set)
  if (missingAi.length > 0) {
    console.warn(
      `[ai] AI environment variables not set: ${missingAi.map((e) => e.name).join(', ')}. ` +
        `AI features will use deterministic fallbacks.`,
    )
  }

  return { ok: true, required, ai }
}

/**
 * The Gemini model identifier to use for text tasks.
 */
export const GEMINI_TEXT_MODEL = 'gemini-2.0-flash' as const

/**
 * The Gemini model identifier for vision tasks (image understanding).
 */
export const GEMINI_VISION_MODEL = 'gemini-2.0-flash' as const

/**
 * Whether the AI layer is configured (GEMINI_API_KEY is set).
 * When false, all AI functions return deterministic fallbacks.
 */
export const AI_CONFIGURED = !!process.env.GEMINI_API_KEY

// Validate on module load (server-side only)
if (typeof window === 'undefined') {
  validateEnv()
}
