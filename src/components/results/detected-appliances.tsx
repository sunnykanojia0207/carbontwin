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

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { SectionCard } from '@/components/dashboard/section-card'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import { formatCost } from '@/lib/emissions/appliance-suggestions'
import type { ResultsData } from '@/lib/services/results.service'

// ============================================================================
// Detected Appliances — expandable list. Each appliance shows:
//   - Estimated Usage (watts, hours/day, kWh/yr)
//   - Carbon Impact (kg CO₂e/yr)
//   - Cost Impact ($/yr)
//   - Improvement Suggestions (top 3, with savings)
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

const DIFFICULTY_STYLES: Record<string, string> = {
  EASY: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  MEDIUM: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  HARD: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
}

export function DetectedAppliances({
  appliances,
}: {
  appliances: ResultsData['appliances']
}) {
  return (
    <SectionCard
      title="Detected Appliances"
      subtitle={`${appliances.length} device${appliances.length !== 1 ? 's' : ''} found · click to expand details`}
      bodyClassName="pt-0"
    >
      <Accordion type="single" collapsible className="w-full">
        {appliances.map((appliance, i) => {
          const Icon = TYPE_ICONS[appliance.type] ?? Zap
          return (
            <AccordionItem key={appliance.id} value={`item-${i}`}>
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex flex-1 items-center gap-3 pr-4 text-left">
                  <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{appliance.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {appliance.watts}W · {appliance.hoursPerDay}h/day ·{' '}
                      {appliance.carbon.annualKwh} kWh/yr
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatCo2e(appliance.carbon.annualCo2eKg)}
                      </p>
                      <p className="text-muted-foreground text-[9px]">CO₂e/yr</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-sky-600 dark:text-sky-400 tabular-nums">
                        {formatCost(appliance.cost.annualUsd)}
                      </p>
                      <p className="text-muted-foreground text-[9px]">/yr</p>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  {/* Estimated Usage */}
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-wide">
                      Estimated Usage
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Power</span>
                        <span className="font-medium tabular-nums">{appliance.watts}W</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Daily use</span>
                        <span className="font-medium tabular-nums">{appliance.hoursPerDay}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Weekly</span>
                        <span className="font-medium tabular-nums">{appliance.daysPerWeek}d</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="text-muted-foreground">Annual</span>
                        <span className="font-medium tabular-nums">{appliance.carbon.annualKwh} kWh</span>
                      </div>
                    </div>
                  </div>

                  {/* Carbon + Cost Impact */}
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-wide">
                      Impact
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CO₂e/yr</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {formatCo2e(appliance.carbon.annualCo2eKg)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CO₂e/month</span>
                        <span className="font-medium tabular-nums">{appliance.carbon.monthlyCo2eKg}kg</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span className="text-muted-foreground">Cost/yr</span>
                        <span className="font-medium text-sky-600 dark:text-sky-400 tabular-nums">
                          {formatCost(appliance.cost.annualUsd)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cost/month</span>
                        <span className="font-medium tabular-nums">${appliance.cost.monthlyUsd}</span>
                      </div>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-wide">
                      Detection
                    </p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type</span>
                        <Badge variant="outline" className="text-[9px]">{appliance.type}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className="font-medium tabular-nums">{Math.round(appliance.confidence * 100)}%</span>
                      </div>
                      {appliance.notes && (
                        <p className="text-muted-foreground mt-1.5 border-t pt-1.5 text-[11px] italic leading-relaxed">
                          {appliance.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Improvement Suggestions */}
                <div className="mt-3">
                  <p className="text-muted-foreground mb-2 text-[10px] font-semibold uppercase tracking-wide">
                    Improvement Suggestions
                  </p>
                  <div className="space-y-2">
                    {appliance.suggestions.map((s, j) => (
                      <div
                        key={j}
                        className="flex items-start gap-3 rounded-lg border p-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium">{s.suggestion.title}</p>
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${DIFFICULTY_STYLES[s.suggestion.difficulty] ?? ''}`}
                            >
                              {s.suggestion.difficulty}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mt-0.5 text-[11px] leading-relaxed">
                            {s.suggestion.description}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            −{formatCo2e(s.savings.co2eKgPerYear)}
                          </p>
                          <p className="text-muted-foreground text-[9px]">
                            +${s.savings.usdPerYear}/yr
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </SectionCard>
  )
}
