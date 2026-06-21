import type { TwinData } from '@/lib/services/twin.service'

// ============================================================================
// AI Carbon Negotiator — prompt construction + action plan schema.
//
// The negotiator is a personalized sustainability advisor that:
//   - Remembers the user's footprint profile (context memory)
//   - Respects lifestyle constraints (household, region, appliances)
//   - Is budget-aware (asks about / considers upfront costs)
//   - Proposes structured action plans with CO₂ reduction, difficulty, cost, time
//
// Action plans are embedded in the response as fenced JSON blocks:
//   ```action-plan
//   { "title": "...", "co2ReductionKg": 240, ... }
//   ```
// The frontend parses these out of the streamed text and renders them as cards.
// ============================================================================

export const PROMPT_VERSION = 'negotiator-v1'

const SYSTEM_PROMPT = `You are CarbonTwin's AI Carbon Negotiator — a personalized sustainability advisor. Your job is to help the user find realistic, actionable reductions they'll actually keep.

PERSONALITY:
- Warm, plain-spoken, lightly witty — like a knowledgeable friend, not a lecturer
- Never moralize or guilt-trip; always frame as opportunity
- Propose a RANGE, never an ultimatum
- Converge on a concrete commitment in under 3 back-and-forth turns
- Acknowledge the user's constraints (budget, time, lifestyle) before recommending

WHAT YOU KNOW ABOUT THE USER (their "carbon passport"):
{{USER_CONTEXT}}

HOW TO RESPOND:
1. Conversational text first — 2-4 sentences, encouraging and specific
2. If proposing a concrete action, embed it as an action plan block (see format below)
3. If the user mentions budget or time constraints, tailor your recommendation
4. Always offer a range ("cut 1-2 flights", "2-3 plant-based days") not a binary
5. End with a gentle question to move toward commitment

ACTION PLAN FORMAT:
When you propose a specific, actionable commitment, include a fenced JSON block:
\`\`\`action-plan
{
  "title": "Switch one short-haul flight to rail",
  "description": "Replace one of your ~6 annual flights with a train journey.",
  "co2ReductionKg": 240,
  "difficulty": "EASY",
  "costUsd": 0,
  "timeRequired": "One-time, 2 hours to book",
  "category": "transport"
}
\`\`\`

Field rules:
- co2ReductionKg: estimated ANNUAL kg CO₂e saved (number)
- difficulty: one of EASY | MEDIUM | HARD
- costUsd: upfront cost in USD (0 if free)
- timeRequired: human-readable time commitment
- category: one of home | appliances | transport | lifestyle | diet

Only include an action-plan block when you're proposing a SPECIFIC commitment the user can accept. For exploratory questions, just converse. Maximum ONE action plan per message.

LIFESTYLE CONSTRAINTS TO RESPECT:
- If the user says they can't afford upfront costs, recommend EASY/free actions
- If they travel for work, don't push flight cuts — suggest offsets or rail for personal trips
- If they have dietary restrictions, respect them
- If they rent (can't modify home), suggest portable/timer-based fixes
- Never more than 3 recommendations per conversation — avoid overwhelm`

/**
 * Build the system prompt with the user's carbon passport injected.
 */
export function buildSystemPrompt(twinData: TwinData): string {
  const dimSummary = twinData.dimensions
    .map((d) => `  ${d.label}: ${d.annualKg} kg/yr (${d.share}%)`)
    .join('\n')

  const userContext = `Profile:
  Name: ${twinData.profile.name}
  Region: ${twinData.profile.region ?? 'global'}
  Household: ${twinData.profile.householdSize} person(s)
  Baseline: ${twinData.profile.baselineAnnualKg ?? 'unknown'} kg/yr

Current state:
  Total annual footprint: ${twinData.current.totalAnnualKg} kg CO₂e
  Tier: ${twinData.tier.name} (${twinData.tier.description})
  vs country average: ${twinData.current.vsCountryAvgPct > 0 ? '+' : ''}${twinData.current.vsCountryAvgPct}%
  Paris 1.5°C target: ${twinData.current.parisTargetKg} kg/yr
  ${twinData.current.onTrack ? '(on track for Paris)' : `(currently ${twinData.current.totalAnnualKg - twinData.current.parisTargetKg} kg above target)`}

Dimension breakdown:
${dimSummary}

Top risk areas:
${twinData.riskAreas.map((r) => `  - ${r.label} [${r.severity}]`).join('\n')}

Known opportunities:
${twinData.opportunities.map((o) => `  - ${o.title} (−${o.potentialKg} kg, ${o.difficulty})`).join('\n')}`

  return SYSTEM_PROMPT.replace('{{USER_CONTEXT}}', userContext)
}

// --- Action plan parsing (used by the frontend) ---

export type ActionPlan = {
  title: string
  description: string
  co2ReductionKg: number
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  costUsd: number
  timeRequired: string
  category: string
}

/**
 * Extract action plan JSON blocks from a text response.
 * Returns the array of parsed plans + the text with blocks removed.
 */
export function parseActionPlans(text: string): {
  plans: ActionPlan[]
  cleanText: string
} {
  const plans: ActionPlan[] = []
  const regex = /```action-plan\s*\n([\s\S]*?)```/g
  let match
  let cleanText = text

  while ((match = regex.exec(text)) !== null) {
    try {
      const plan = JSON.parse(match[1].trim())
      if (plan.title && typeof plan.co2ReductionKg === 'number') {
        plans.push({
          title: String(plan.title),
          description: String(plan.description ?? ''),
          co2ReductionKg: Number(plan.co2ReductionKg),
          difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(plan.difficulty)
            ? plan.difficulty
            : 'MEDIUM',
          costUsd: Number(plan.costUsd ?? 0),
          timeRequired: String(plan.timeRequired ?? 'Variable'),
          category: String(plan.category ?? 'other'),
        })
      }
    } catch {
      // Skip malformed blocks
    }
    cleanText = cleanText.replace(match[0], '')
  }

  // Trim extra whitespace left behind
  cleanText = cleanText.replace(/\n{3,}/g, '\n\n').trim()

  return { plans, cleanText }
}
