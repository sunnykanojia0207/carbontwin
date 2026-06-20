import { z } from 'zod'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { GEMINI_VISION_MODEL } from './env'

// ============================================================================
// AI Appliance Detection — server-only.
// Sends a room photo to the Gemini vision model and parses the structured
// JSON response into typed appliance detections.
//
// The model identifies appliances, estimates wattage + daily usage, and
// returns a confidence score per detection. Carbon impact is computed
// separately (deterministic) in src/lib/emissions/appliance-calc.ts.
// ============================================================================

const PROMPT_VERSION = 'detect-appliances-v1'

const DETECTION_PROMPT = `You are an expert at analyzing room photos to identify electrical appliances and estimate their energy usage.

Analyze this image and identify ALL visible electrical appliances. For each appliance, provide:
- name: a short, human-readable label (e.g. "Refrigerator", "Air Conditioner", "LED Lamp")
- type: one of these exact values: HVAC, REFRIGERATION, LAUNDRY, KITCHEN, ELECTRONICS, LIGHTING, WATER_HEATING, OTHER
- estimatedWatts: estimated power rating in watts (integer). If unknown, estimate based on the appliance type.
- estimatedHoursPerDay: estimated average daily usage in hours (number, can be decimal). Refrigerators run 24h; lights 4-6h; microwaves 0.2-0.5h.
- confidence: your confidence in this detection, 0.0 to 1.0 (how sure are you this appliance is present and correctly identified)
- notes: optional brief note (e.g. "appears to be energy-efficient model" or "old model, likely higher consumption")

Also provide:
- roomType: the type of room (e.g. "kitchen", "living room", "bedroom", "office", "laundry room")
- summary: a one-sentence description of the room and its energy profile

Respond with ONLY a JSON object, no markdown formatting, no explanation:
{"appliances":[{"name":"...","type":"...","estimatedWatts":0,"estimatedHoursPerDay":0,"confidence":0.9,"notes":"..."}],"roomType":"...","summary":"..."}`

// --- Zod schema for the AI output ---
const applianceSchema = z.object({
  name: z.string().min(1),
  type: z.enum([
    'HVAC',
    'REFRIGERATION',
    'LAUNDRY',
    'KITCHEN',
    'ELECTRONICS',
    'LIGHTING',
    'WATER_HEATING',
    'OTHER',
  ]),
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

/**
 * Strip markdown code fences and extract the JSON object from a model response.
 */
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

/**
 * Run appliance detection on a room photo.
 *
 * @param base64Image  base64-encoded image data (without the data: prefix)
 * @param mimeType     e.g. "image/jpeg", "image/png"
 * @returns            structured detection result
 * @throws             on API failure or unparseable response
 */
export async function detectAppliances(
  base64Image: string,
  mimeType: string,
): Promise<{ result: DetectionResult; model: string; promptVersion: string }> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: GEMINI_VISION_MODEL })

  const result = await model.generateContent([
    DETECTION_PROMPT,
    {
      inlineData: {
        mimeType,
        data: base64Image,
      },
    },
  ])

  const raw = result.response.text()
  if (!raw) {
    throw new Error('The vision model returned an empty response.')
  }

  const jsonStr = extractJson(raw)
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error(
      'The vision model returned a response that could not be parsed as JSON.',
    )
  }

  const validation = detectionResultSchema.safeParse(parsed)
  if (!validation.success) {
    throw new Error(
      `The detection result did not match the expected schema: ${validation.error.issues[0]?.message ?? 'unknown'}`,
    )
  }

  return {
    result: validation.data,
    model: GEMINI_VISION_MODEL,
    promptVersion: PROMPT_VERSION,
  }
}
