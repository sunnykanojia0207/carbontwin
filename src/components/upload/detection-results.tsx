'use client'

import { motion } from 'framer-motion'
import {
  Snowflake,
  Refrigerator,
  WashingMachine,
  ChefHat,
  Monitor,
  Lightbulb,
  Droplets,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import type { DetectionResult } from '@/lib/ai/detect-appliances'
import type { ApplianceCarbon } from '@/lib/emissions/appliance-calc'

// ============================================================================
// DetectionResults — the success state. Shows detected appliances with
// confidence scores, estimated wattage, and carbon impact. Animated entrance.
// ============================================================================

const TYPE_ICONS: Record<string, LucideIcon> = {
  HVAC: Snowflake,
  REFRIGERATION: Refrigerator,
  LAUNDRY: WashingMachine,
  KITCHEN: ChefHat,
  ELECTRONICS: Monitor,
  LIGHTING: Lightbulb,
  WATER_HEATING: Droplets,
  OTHER: Zap,
}

const CONFIDENCE_COLORS = [
  'text-red-500',
  'text-amber-500',
  'text-sky-500',
  'text-emerald-500',
  'text-emerald-500',
]

function confidenceColor(c: number) {
  const idx = Math.min(4, Math.floor(c * 5))
  return CONFIDENCE_COLORS[idx]
}

function confidenceLabel(c: number) {
  if (c >= 0.85) return 'High'
  if (c >= 0.65) return 'Medium'
  return 'Low'
}

export type DetectedApplianceWithCarbon = {
  name: string
  type: string
  estimatedWatts: number
  estimatedHoursPerDay: number
  confidence: number
  notes: string
  carbon: ApplianceCarbon
}

export function DetectionResults({
  result,
}: {
  result: {
    scanId: string
    roomType: string
    summary: string
    appliances: DetectedApplianceWithCarbon[]
    totalAnnualCo2eKg: number
  }
}) {
  const { roomType, summary, appliances, totalAnnualCo2eKg } = result

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl border border-primary/30 bg-primary/5 p-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {roomType}
            </p>
            <p className="mt-1 text-sm leading-relaxed">{summary}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">
              Est. annual impact
            </p>
            <p className="text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCo2e(totalAnnualCo2eKg)}
            </p>
            <p className="text-muted-foreground text-[10px]">CO₂e / year</p>
          </div>
        </div>
      </motion.div>

      {/* Appliance cards */}
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          {appliances.length} appliance{appliances.length !== 1 && 's'} detected
        </p>
        {appliances.map((appliance, i) => {
          const Icon = TYPE_ICONS[appliance.type] ?? Zap
          const c = appliance.confidence
          return (
            <motion.div
              key={`${appliance.name}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
              className="group flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-primary/30"
            >
              {/* Icon */}
              <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                <Icon className="size-5" />
              </span>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{appliance.name}</p>
                  <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase">
                    {appliance.type}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="tabular-nums">{appliance.estimatedWatts}W</span>
                  <span>·</span>
                  <span className="tabular-nums">{appliance.estimatedHoursPerDay}h/day</span>
                  <span>·</span>
                  <span className="tabular-nums">
                    {appliance.carbon.annualKwh} kWh/yr
                  </span>
                </div>
                {appliance.notes && (
                  <p className="text-muted-foreground mt-0.5 truncate text-xs italic">
                    {appliance.notes}
                  </p>
                )}
              </div>

              {/* Carbon impact */}
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCo2e(appliance.carbon.annualCo2eKg)}
                </p>
                <p className="text-muted-foreground text-[9px]">CO₂e/yr</p>
              </div>

              {/* Confidence */}
              <div className="flex flex-col items-center shrink-0">
                <ConfidenceRing value={c} />
                <span
                  className={cn(
                    'mt-1 text-[9px] font-medium',
                    confidenceColor(c),
                  )}
                >
                  {confidenceLabel(c)}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// Small circular confidence indicator
function ConfidenceRing({ value }: { value: number }) {
  const r = 14
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - value)
  const colorClass = confidenceColor(value)
  return (
    <div className="relative size-9">
      <svg viewBox="0 0 36 36" className="size-full -rotate-90">
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          strokeWidth="3"
          className="stroke-muted"
        />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          className={colorClass.replace('text-', 'stroke-')}
          style={{ strokeDasharray: circ, strokeDashoffset: offset }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('text-[10px] font-semibold tabular-nums', colorClass)}>
          {Math.round(value * 100)}
        </span>
      </div>
    </div>
  )
}
