import { z } from 'zod'

import { checkRateLimit } from './rate-limiter'
import {
  getCached,
  setCached,
  cacheKey,
  CACHE_TTL,
} from './cache'
import {
  callTextModel,
  callVisionModel,
  withErrorHandling,
  type AiResult,
  type AiError,
} from './gemini-client'
import { AI_CONFIGURED } from './env'

// Global quota-error tracker: userId → timestamp of last quota exhaustion.
// Used by /api/ai-status to surface quota issues in Settings.
export const LAST_QUOTA_ERROR: Record<string, number> = {}

// ============================================================================
// Unified AI facade — the single entry point for all 5 AI functions.
//
// Each function:
//   1. Checks the rate limit (per user + function)
//   2. Checks the cache (for cacheable functions)
//   3. Calls the Gemini model (with timeout + error handling)
//   4. Parses + validates the structured response (Zod)
//   5. Falls back to a deterministic response on any failure
//
// The route handlers call these functions and never touch the SDK directly.
// ============================================================================

// --- Helper: extract JSON from a model response (handles markdown fences) ---
function extractJson(raw: string): string {
  let text = raw.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
  }
  const first = text.indexOf('{')
  const last = text.lastIndexOf('}')
  if (first !== -1 && last !== -1) {
    text = text.slice(first, last + 1)
  }
  return text
}

function extractJsonArray(raw: string): string {
  let text = raw.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
  }
  const first = text.indexOf('[')
  const last = text.lastIndexOf(']')
  if (first !== -1 && last !== -1) {
    text = text.slice(first, last + 1)
  }
  return text
}

// ============================================================================
// 1. APPLIANCE DETECTION (vision)
// ============================================================================

const applianceSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['HVAC', 'REFRIGERATION', 'LAUNDRY', 'KITCHEN', 'ELECTRONICS', 'LIGHTING', 'WATER_HEATING', 'OTHER']),
  estimatedWatts: z.number().min(1).max(20000),
  estimatedHoursPerDay: z.number().min(0).max(24),
  confidence: z.number().min(0).max(1),
  notes: z.string().optional().default(''),
})
const detectionResultSchema = z.object({
  appliances: z.array(applianceSchema).min(0).max(20),
  roomType: z.string().default('unknown'),
  summary: z.string().default(''),
})

export type DetectedAppliance = z.infer<typeof applianceSchema>
export type DetectionResult = z.infer<typeof detectionResultSchema>

const DETECTION_PROMPT = `You are an expert at analyzing room photos to identify electrical appliances and estimate their energy usage.

Analyze this image and identify ALL visible electrical appliances. For each appliance, provide:
- name: a short, human-readable label (e.g. "Refrigerator", "Air Conditioner", "LED Lamp")
- type: one of these exact values: HVAC, REFRIGERATION, LAUNDRY, KITCHEN, ELECTRONICS, LIGHTING, WATER_HEATING, OTHER
- estimatedWatts: estimated power rating in watts (integer). If unknown, estimate based on the appliance type.
- estimatedHoursPerDay: estimated average daily usage in hours (number, can be decimal). Refrigerators run 24h; lights 4-6h; microwaves 0.2-0.5h.
- confidence: your confidence in this detection, 0.0 to 1.0
- notes: optional brief note

Also provide:
- roomType: the type of room (e.g. "kitchen", "living room", "bedroom", "office")
- summary: a one-sentence description of the room and its energy profile

Respond with ONLY a JSON object, no markdown formatting:
{"appliances":[{"name":"...","type":"...","estimatedWatts":0,"estimatedHoursPerDay":0,"confidence":0.9,"notes":"..."}],"roomType":"...","summary":"..."}`

function getDetectionFallback(): DetectionResult {
  const isConfigured = AI_CONFIGURED
  return {
    appliances: [
      {
        name: 'Unidentified appliance',
        type: 'OTHER',
        estimatedWatts: 100,
        estimatedHoursPerDay: 4,
        confidence: 0.3,
        notes: isConfigured
          ? 'AI quota exhausted — generic estimate. Edit details or try again later.'
          : 'AI not configured — generic estimate. Add a GEMINI_API_KEY in Settings to enable AI detection.',
      },
    ],
    roomType: 'Room',
    summary: isConfigured
      ? 'AI detection quota exceeded. The result below is a placeholder — tap "Edit" to describe your room and appliances manually.'
      : 'AI detection is not configured. Set your GEMINI_API_KEY in Vercel environment variables to enable automatic detection.',
  }
}

export async function detectAppliances(
  userId: string,
  base64Image: string,
  mimeType: string,
): Promise<AiResult<DetectionResult>> {
  // Rate limit
  const rl = checkRateLimit(userId, 'detect')
  if (!rl.allowed) {
    return {
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Rate limit reached. Try again in ${Math.ceil(rl.resetInMs / 1000)}s.`,
        retryable: true,
      },
    }
  }

  // Not cached (images vary)
  const result = await withErrorHandling(async () => {
    const raw = await callVisionModel(DETECTION_PROMPT, base64Image, mimeType)
    const parsed = detectionResultSchema.safeParse(JSON.parse(extractJson(raw)))
    if (!parsed.success) {
      throw { code: 'PARSE_ERROR', message: 'Detection response did not match schema', retryable: true } as AiError
    }
    return parsed.data
  }, 'detect')

  // Fallback on failure
  if (!result.ok) {
    return {
      ok: true,
      data: getDetectionFallback(),
      cached: false,
      model: 'fallback',
    }
  }
  return result
}

// ============================================================================
// 2. CARBON INSIGHTS (text)
// ============================================================================

const insightsSchema = z.object({
  insight: z.string(),
  highlights: z.array(z.string()).default([]),
})
export type InsightsResult = z.infer<typeof insightsSchema>

export async function generateInsights(
  userId: string,
  context: { roomType: string; totalKg: number; totalCost: number; applianceCount: number; potentialSavingsKg: number; appliancesSummary: string; topSavings: string },
): Promise<AiResult<InsightsResult>> {
  // Cache (10 min)
  const key = cacheKey('insights', context)
  const cached = getCached<InsightsResult>(key)
  if (cached) {
    return { ok: true, data: cached, cached: true, model: 'gemini-2.5-flash' }
  }

  // Rate limit
  const rl = checkRateLimit(userId, 'insights')
  if (!rl.allowed) {
    return {
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Rate limit reached. Try again in ${Math.ceil(rl.resetInMs / 1000)}s.`,
        retryable: true,
      },
    }
  }

  const prompt = `You are a sustainability coach analyzing a user's home appliance energy audit. Write a concise, encouraging insight (2-3 sentences) plus 3 bullet-point highlights.

DATA:
Room: ${context.roomType}
Total annual footprint: ${context.totalKg} kg CO₂e
Total annual cost: $${context.totalCost}
Appliances detected: ${context.applianceCount}
Potential savings: ${context.potentialSavingsKg} kg CO₂e

APPLIANCES:
${context.appliancesSummary}

TOP SAVINGS OPPORTUNITIES:
${context.topSavings}

Respond with ONLY a JSON object (no markdown):
{"insight":"2-3 sentence narrative","highlights":["bullet 1","bullet 2","bullet 3"]}`

  const result = await withErrorHandling(async () => {
    const raw = await callTextModel([{ role: 'user', content: prompt }])
    const parsed = insightsSchema.safeParse(JSON.parse(extractJson(raw)))
    if (!parsed.success) {
      throw { code: 'PARSE_ERROR', message: 'Insights response did not match schema', retryable: true } as AiError
    }
    return parsed.data
  }, 'insights')

  if (result.ok) {
    setCached(key, result.data, CACHE_TTL.insights)
  } else {
    // Deterministic fallback
    return {
      ok: true,
      data: {
        insight: `Your ${context.roomType} has ${context.applianceCount} appliances producing ${context.totalKg} kg of CO₂e annually — costing about $${context.totalCost}/year. Your biggest opportunity could save ${context.potentialSavingsKg} kg and reduce your bill.`,
        highlights: [
          `${context.applianceCount} appliances detected in your ${context.roomType}`,
          `Total annual cost: $${context.totalCost}`,
          `${context.potentialSavingsKg} kg CO₂e saveable with top recommendations`,
        ],
      },
      cached: false,
      model: 'fallback',
    }
  }
  return result
}

// ============================================================================
// 3. TWIN RECOMMENDATIONS (text)
// ============================================================================

const twinRecsSchema = z.object({
  summary: z.string(),
  outlook: z.string(),
  recommendations: z.array(z.string()).default([]),
  riskAssessment: z.string(),
})
export type TwinRecommendationsResult = z.infer<typeof twinRecsSchema>

export async function generateTwinRecommendations(
  userId: string,
  context: { name: string; region: string | null; household: number; totalKg: number; tierName: string; tierDesc: string; vsAvgPct: number; parisTarget: number; dimSummary: string; riskSummary: string; oppSummary: string; forecastCurrent: number; forecastOptimized: number; forecastAggressive: number },
): Promise<AiResult<TwinRecommendationsResult>> {
  const key = cacheKey('twin-recommendations', context)
  const cached = getCached<TwinRecommendationsResult>(key)
  if (cached) {
    return { ok: true, data: cached, cached: true, model: 'gemini-2.5-flash' }
  }

  const rl = checkRateLimit(userId, 'twin-recommendations')
  if (!rl.allowed) {
    return {
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Rate limit reached. Try again in ${Math.ceil(rl.resetInMs / 1000)}s.`,
        retryable: true,
      },
    }
  }

  const prompt = `You are a sustainability AI analyzing a user's "Climate Twin". Write a concise analysis.

USER PROFILE:
Name: ${context.name}
Region: ${context.region ?? 'global'}
Household: ${context.household} person(s)
Current annual footprint: ${context.totalKg} kg CO₂e
Tier: ${context.tierName} (${context.tierDesc})
vs country average: ${context.vsAvgPct > 0 ? '+' : ''}${context.vsAvgPct}%
Paris 1.5°C target: ${context.parisTarget} kg/yr

DIMENSION BREAKDOWN:
${context.dimSummary}

5-YEAR FORECAST:
- Current trajectory: ${context.forecastCurrent} kg/yr
- With recommendations: ${context.forecastOptimized} kg/yr
- Aggressive reduction: ${context.forecastAggressive} kg/yr

RISK AREAS:
${context.riskSummary}

TOP OPPORTUNITIES:
${context.oppSummary}

Respond with ONLY a JSON object (no markdown):
{"summary":"2-3 sentence overview","outlook":"2-3 sentence 5-year outlook","recommendations":["3 actionable recommendations"],"riskAssessment":"1-2 sentence assessment"}`

  const result = await withErrorHandling(async () => {
    const raw = await callTextModel([{ role: 'user', content: prompt }])
    const parsed = twinRecsSchema.safeParse(JSON.parse(extractJson(raw)))
    if (!parsed.success) {
      throw { code: 'PARSE_ERROR', message: 'Twin recommendations did not match schema', retryable: true } as AiError
    }
    return parsed.data
  }, 'twin-recommendations')

  if (result.ok) {
    setCached(key, result.data, CACHE_TTL['twin-recommendations'])
  } else {
    // Deterministic fallback
    return {
      ok: true,
      data: {
        summary: `Your Climate Twin is "${context.tierName}" — ${context.tierDesc.toLowerCase()}. Your annual footprint of ${context.totalKg} kg is ${context.vsAvgPct > 0 ? 'above' : 'below'} your country average by ${Math.abs(context.vsAvgPct)}%.`,
        outlook: `On your current trajectory, you'll reach ${context.forecastCurrent} kg in 5 years. Acting on recommendations could bring you to ${context.forecastOptimized} kg, and aggressive action to ${context.forecastAggressive} kg.`,
        recommendations: [
          'Focus on your highest-emission dimension first for the biggest impact.',
          'Look for EASY wins — they compound and build momentum.',
          'Set a weekly goal to create a tracking habit.',
        ],
        riskAssessment: context.riskSummary || 'No major risk areas identified.',
      },
      cached: false,
      model: 'fallback',
    }
  }
  return result
}

// ============================================================================
// 4. NEGOTIATOR CHAT (text, streaming via word-chunks)
// ============================================================================

/**
 * Generate personalized local fallback advice when Gemini is unavailable.
 * Uses the user's actual footprint data to create meaningful recommendations.
 */
function generateLocalFallbackAdvice(
  context: { totalKg: number; dimensions: Array<{ label: string; annualKg: number; share: number }>; opportunities: Array<{ title: string; potentialKg: number; difficulty: string }>; tier: { name: string } },
  userMessage: string,
): string {
  const { totalKg, dimensions, opportunities, tier } = context

  // Find the user's highest emission dimension
  const sorted = [...dimensions].sort((a, b) => b.annualKg - a.annualKg)
  const topDim = sorted[0]
  const topDimLabel = topDim?.label?.toLowerCase() ?? 'home energy'

  // Pick the best opportunity
  const topOpp = opportunities?.[0]
  const savings = topOpp?.potentialKg ?? Math.round(totalKg * 0.1)
  const difficultyLabels: Record<string, string> = { EASY: 'Easy', MEDIUM: 'Medium', HARD: 'Challenging' }
  const difficulty = difficultyLabels[topOpp?.difficulty ?? 'EASY'] ?? 'Easy'
  const savingsTons = (savings / 1000).toFixed(1)
  const savingsPercent = totalKg > 0 ? Math.round((savings / totalKg) * 100) : 10

  // Cost savings estimate (~$0.15 per kWh, ~0.4 kg CO₂e per kWh)
  const costSavings = Math.round(savings * 0.15 / 0.4)

  // Generate 3 personalized recommendations based on the top dimensions
  const recommendations = sorted.slice(0, 3).map((dim, i) => {
    const dimReduction = Math.round(dim.annualKg * 0.15)
    const dimCost = Math.round(dimReduction * 0.15 / 0.4)
    const difficultyLevel = i === 0 ? 'Medium' : i === 1 ? 'Easy' : 'Easy'
    return `**${i + 1}. Focus on ${dim.label}** — your largest category at ${dim.annualKg.toLocaleString()} kg/yr (${dim.share}% of your footprint)\n   - Cut by 15% → save ~${dimReduction.toLocaleString()} kg CO₂e/yr\n   - Estimated cost savings: ~$${dimCost}/yr\n   - Difficulty: ${difficultyLevel}`
  })

  const messageLower = userMessage.toLowerCase()

  // Detect intent from user's message for more relevant responses
  const intentInfo = messageLower.includes('transport') || messageLower.includes('car') || messageLower.includes('drive') || messageLower.includes('flight')
    ? dimensions.find(d => d.label?.toLowerCase().includes('transport'))
      ? `Your transport footprint is **${dimensions.find(d => d.label?.toLowerCase().includes('transport'))!.annualKg.toLocaleString()} kg/yr**. Consider carpooling, public transit, or replacing one short-haul flight with rail.`
      : ''
    : messageLower.includes('food') || messageLower.includes('diet') || messageLower.includes('eat') || messageLower.includes('meat')
    ? 'For diet: even 2 plant-based days per week saves ~180 kg CO₂e/yr. Start with meals you already enjoy.'
    : messageLower.includes('home') || messageLower.includes('energy') || messageLower.includes('electric')
    ? `Your home energy footprint is significant. LED upgrades pay back in months, and smart power strips eliminate standby waste (up to 10% of your bill).`
    : messageLower.includes('goal') || messageLower.includes('target')
    ? `Given your ${tier.name} tier, a realistic first goal is reducing your ${topDimLabel} by 10-15%. That's ~${savings.toLocaleString()} kg CO₂e/yr.`
    : ''

  return `**AI is temporarily unavailable.** Here are personalized recommendations based on your climate profile:

${recommendations.join('\n\n')}

**Top opportunity: ${topOpp?.title ?? `Reduce your ${topDimLabel}`}**
- **CO₂ reduction:** ${savingsTons} tonnes/yr (${savingsPercent}% of your footprint)
- **Cost impact:** ~$${costSavings}/yr saved
- **Difficulty:** ${difficulty}

${intentInfo ? `\n**About your question:** ${intentInfo}` : `\n**Tip:** Your ${topDimLabel} is your biggest lever. Even a 10% cut there saves ~${Math.round(totalKg * 0.1).toLocaleString()} kg/yr.`}

---

*Want to try again? Tap retry below to reach the live AI — or keep exploring your Dashboard and Climate Twin for more insights.*`
}

export async function generateNegotiatorResponse(
  userId: string,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  context?: { totalKg: number; dimensions: Array<{ label: string; annualKg: number; share: number }>; opportunities: Array<{ title: string; potentialKg: number; difficulty: string }>; tier: { name: string } },
): Promise<AiResult<string>> {
  // NOT cached (conversational)
  const rl = checkRateLimit(userId, 'negotiator')
  if (!rl.allowed) {
    return {
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Rate limit reached. Try again in ${Math.ceil(rl.resetInMs / 1000)}s.`,
        retryable: true,
      },
    }
  }

  const result = await withErrorHandling(async () => {
    const raw = await callTextModel(messages, { timeoutMs: 30_000 })
    if (!raw) {
      throw { code: 'PARSE_ERROR', message: 'Empty response from negotiator', retryable: true } as AiError
    }
    return raw
  }, 'negotiator')

  if (!result.ok) {
    // Track quota exhaustion
    const isQuota = result.error.code === 'API_ERROR' && /quota|exhausted|RESOURCE_EXHAUSTED/i.test(result.error.message)
    if (isQuota) {
      LAST_QUOTA_ERROR[userId] = Date.now()
    }

    // Generate personalized fallback using user's footprint data
    if (context && context.dimensions && context.dimensions.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
      return {
        ok: true,
        data: generateLocalFallbackAdvice(context, lastUserMessage?.content ?? ''),
        cached: false,
        model: 'fallback',
      }
    }

    // Static fallback as a last resort (no context available)
    return {
      ok: true,
      data: "I'm having trouble connecting right now. Based on your footprint, I'd suggest starting with your highest-emission category — even a small reduction there compounds. What dimension would you like to explore?",
      cached: false,
      model: 'fallback',
    }
  }
  return result
}

// ============================================================================
// 5. GOAL SUGGESTIONS (text)
// ============================================================================

const goalSuggestionSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  targetKg: z.number().min(1),
  type: z.enum(['WEEKLY', 'MONTHLY', 'ANNUAL', 'ONE_TIME']),
  category: z.string(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  potentialImpact: z.string(),
  rationale: z.string(),
})
const goalSuggestionsSchema = z.array(goalSuggestionSchema).min(1).max(5)
export type GoalSuggestion = z.infer<typeof goalSuggestionSchema>

export async function generateGoalSuggestions(
  userId: string,
  context: { totalKg: number; tierName: string; dimSummary: string; parisTarget: number },
): Promise<AiResult<GoalSuggestion[]>> {
  const key = cacheKey('goal-suggestions', context)
  const cached = getCached<GoalSuggestion[]>(key)
  if (cached) {
    return { ok: true, data: cached, cached: true, model: 'gemini-2.5-flash' }
  }

  const rl = checkRateLimit(userId, 'goal-suggestions')
  if (!rl.allowed) {
    return {
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Rate limit reached. Try again in ${Math.ceil(rl.resetInMs / 1000)}s.`,
        retryable: true,
      },
    }
  }

  const prompt = `You are a sustainability advisor suggesting personalized carbon reduction goals.

USER PROFILE:
Annual footprint: ${context.totalKg} kg CO₂e
Tier: ${context.tierName}
Dimensions: ${context.dimSummary}
Paris target: ${context.parisTarget} kg/yr

Suggest 3 realistic, personalized goals. Each should target a specific dimension, be achievable in the timeframe, and have a concrete kg target.

Respond with ONLY a JSON array (no markdown):
[{"title":"...","description":"...","targetKg":50,"type":"WEEKLY","category":"transport","difficulty":"EASY","potentialImpact":"...","rationale":"..."}]`

  const result = await withErrorHandling(async () => {
    const raw = await callTextModel([{ role: 'user', content: prompt }])
    const parsed = goalSuggestionsSchema.safeParse(JSON.parse(extractJsonArray(raw)))
    if (!parsed.success) {
      throw { code: 'PARSE_ERROR', message: 'Goal suggestions did not match schema', retryable: true } as AiError
    }
    return parsed.data
  }, 'goal-suggestions')

  if (result.ok) {
    setCached(key, result.data, CACHE_TTL['goal-suggestions'])
  } else {
    // Deterministic fallback
    return {
      ok: true,
      data: [
        {
          title: 'Reduce your biggest dimension by 10%',
          description: 'Cut your largest emission source by 10% over the next month.',
          targetKg: Math.round(context.totalKg * 0.1 * 10) / 10,
          type: 'MONTHLY',
          category: 'home',
          difficulty: 'MEDIUM',
          potentialImpact: `${Math.round(context.totalKg * 0.1)} kg CO₂e saved per year`,
          rationale: 'Targeting your largest dimension gives the biggest absolute reduction.',
        },
        {
          title: 'Two plant-based days per week',
          description: 'Cut meat from your diet 2 days a week.',
          targetKg: 15,
          type: 'WEEKLY',
          category: 'diet',
          difficulty: 'EASY',
          potentialImpact: '~180 kg CO₂e saved per year',
          rationale: 'Food is a consistent, controllable part of your footprint.',
        },
        {
          title: 'Log activities daily for 2 weeks',
          description: 'Build a logging habit by tracking every day for 14 days.',
          targetKg: 5,
          type: 'WEEKLY',
          category: 'lifestyle',
          difficulty: 'EASY',
          potentialImpact: 'Builds the awareness needed for bigger reductions',
          rationale: 'Consistent tracking is the foundation of every successful reduction.',
        },
      ],
      cached: false,
      model: 'fallback',
    }
  }
  return result
}

// ============================================================================
// FORECAST GENERATION (text — uses twin data to project scenarios)
// ============================================================================

const forecastSchema = z.object({
  projection: z.string(),
  confidence: z.number().min(0).max(1),
  keyDriver: z.string(),
  recommendation: z.string(),
})
export type ForecastResult = z.infer<typeof forecastSchema>

export async function generateForecast(
  userId: string,
  context: { totalKg: number; parisTarget: number; dimSummary: string; trend: string },
): Promise<AiResult<ForecastResult>> {
  const key = cacheKey('forecast', context)
  const cached = getCached<ForecastResult>(key)
  if (cached) {
    return { ok: true, data: cached, cached: true, model: 'gemini-2.5-flash' }
  }

  const rl = checkRateLimit(userId, 'insights') // reuse insights budget
  if (!rl.allowed) {
    return {
      ok: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Rate limit reached. Try again in ${Math.ceil(rl.resetInMs / 1000)}s.`,
        retryable: true,
      },
    }
  }

  const prompt = `You are a carbon forecasting analyst. Given a user's data, project their trajectory and identify the key driver.

CURRENT: ${context.totalKg} kg CO₂e/yr
PARIS TARGET: ${context.parisTarget} kg/yr
DIMENSIONS: ${context.dimSummary}
RECENT TREND: ${context.trend}

Respond with ONLY a JSON object:
{"projection":"1-2 sentence forecast of where they're headed","confidence":0.85,"keyDriver":"the single biggest factor","recommendation":"one actionable suggestion"}`

  const result = await withErrorHandling(async () => {
    const raw = await callTextModel([{ role: 'user', content: prompt }])
    const parsed = forecastSchema.safeParse(JSON.parse(extractJson(raw)))
    if (!parsed.success) {
      throw { code: 'PARSE_ERROR', message: 'Forecast did not match schema', retryable: true } as AiError
    }
    return parsed.data
  }, 'insights')

  if (result.ok) {
    setCached(key, result.data, CACHE_TTL.insights)
  } else {
    // Deterministic fallback
    const gap = context.totalKg - context.parisTarget
    return {
      ok: true,
      data: {
        projection: gap > 0
          ? `At your current rate, you'll remain ${gap} kg above the Paris 1.5°C target without intervention.`
          : `You're on track — ${Math.abs(gap)} kg below the Paris 1.5°C target.`,
        confidence: 0.7,
        keyDriver: 'Your largest emission dimension is the primary driver of your trajectory.',
        recommendation: 'Focus reduction efforts on your highest-emission category for the biggest impact.',
      },
      cached: false,
      model: 'fallback',
    }
  }
  return result
}

// Re-export for convenience
export { AI_CONFIGURED }
export type { AiResult, AiError }
