import { GoogleGenerativeAI } from '@google/generative-ai'
import { AI_CONFIGURED, GEMINI_TEXT_MODEL, GEMINI_VISION_MODEL } from './env'

// ============================================================================
// Gemini client singleton — wraps @google/generative-ai.
//
// GEMINI_API_KEY is read from process.env. We expose a singleton so the
// client is created once per process.
//
// All methods are wrapped with:
//   - timeout (so a hung request doesn't block the route handler)
//   - structured error normalization (AiError)
// ============================================================================

export type AiError = {
  code: 'RATE_LIMITED' | 'TIMEOUT' | 'API_ERROR' | 'PARSE_ERROR' | 'NOT_CONFIGURED' | 'UNKNOWN'
  message: string
  retryable: boolean
}

export type AiResult<T> =
  | { ok: true; data: T; cached: boolean; model: string }
  | { ok: false; error: AiError }

// Singleton client
let genAI: GoogleGenerativeAI | null = null

function getClient(): GoogleGenerativeAI {
  if (!AI_CONFIGURED) {
    throw {
      code: 'NOT_CONFIGURED',
      message: 'AI is not configured (GEMINI_API_KEY not set)',
      retryable: false,
    } as AiError
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  }
  return genAI
}

const DEFAULT_TIMEOUT_MS = 30_000
const VISION_TIMEOUT_MS = 45_000

/**
 * Call the Gemini text model with a timeout.
 * Returns the raw content string.
 */
export async function callTextModel(
  messages: Array<{ role: string; content: string }>,
  opts: { timeoutMs?: number; temperature?: number } = {},
): Promise<string> {
  const client = getClient()
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const model = client.getGenerativeModel({ model: GEMINI_TEXT_MODEL })

  // Separate system messages from the conversation
  const systemParts = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n')

  const history = messages
    .filter((m) => m.role !== 'system')
    .slice(0, -1) // all but the last message
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  const lastMessage = messages.filter((m) => m.role !== 'system').slice(-1)[0]
  const userPrompt = systemParts
    ? `${systemParts}\n\n${lastMessage?.content ?? ''}`
    : (lastMessage?.content ?? '')

  const chat = model.startChat({ history })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const result = await chat.sendMessage(userPrompt)
    return result.response.text()
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Call the Gemini vision model with an image + text prompt.
 * Returns the raw content string.
 */
export async function callVisionModel(
  textPrompt: string,
  base64Image: string,
  mimeType: string,
  opts: { timeoutMs?: number } = {},
): Promise<string> {
  const client = getClient()
  const timeoutMs = opts.timeoutMs ?? VISION_TIMEOUT_MS
  const model = client.getGenerativeModel({ model: GEMINI_VISION_MODEL })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const result = await model.generateContent([
      textPrompt,
      {
        inlineData: {
          mimeType,
          data: base64Image,
        },
      },
    ])
    return result.response.text()
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Wrap an async AI operation with standardized error handling.
 * Catches known failure modes and returns a typed AiResult.
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  functionKey: string,
): Promise<AiResult<T>> {
  try {
    const data = await fn()
    return {
      ok: true,
      data,
      cached: false,
      model: GEMINI_TEXT_MODEL,
    }
  } catch (err) {
    const error = err as AiError & { name?: string; message?: string }

    // Already-normalized AiError
    if (error.code && typeof error.code === 'string') {
      return { ok: false, error }
    }

    // Abort/timeout
    if (error.name === 'AbortError' || /timeout/i.test(error.message ?? '')) {
      return {
        ok: false,
        error: {
          code: 'TIMEOUT',
          message: `The AI request timed out for ${functionKey}.`,
          retryable: true,
        },
      }
    }

    // API errors from the SDK
    if (/API request failed|quota|permission/i.test(error.message ?? '')) {
      return {
        ok: false,
        error: {
          code: 'API_ERROR',
          message: error.message ?? 'The AI service returned an error.',
          retryable: true,
        },
      }
    }

    return {
      ok: false,
      error: {
        code: 'UNKNOWN',
        message: error.message ?? 'An unknown error occurred.',
        retryable: false,
      },
    }
  }
}

export { GEMINI_TEXT_MODEL, GEMINI_VISION_MODEL }
