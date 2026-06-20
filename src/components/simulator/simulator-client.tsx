'use client'

import * as React from 'react'
import { SlidersHorizontal, RotateCcw, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/dashboard/section-card'
import { ScenarioCards } from '@/components/simulator/scenario-cards'
import { SimulationSummary } from '@/components/simulator/simulation-summary'
import { BeforeAfterChart } from '@/components/simulator/before-after-chart'
import { SavingsTimeline } from '@/components/simulator/savings-timeline'
import { ScenarioComparison } from '@/components/simulator/scenario-comparison'
import {
  SCENARIOS,
  runSimulation,
  type ScenarioKey,
} from '@/lib/simulator/scenarios'
import type { TwinDimension } from '@/lib/services/twin.service'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import { formatCost } from '@/lib/emissions/appliance-suggestions'

// ============================================================================
// SimulatorClient — the orchestrating client component. Manages which
// scenarios are active, recomputes the simulation on every toggle, and
// renders the summary KPIs + 3 charts + per-scenario detail.
// ============================================================================

export function SimulatorClient({
  dimensions,
}: {
  dimensions: TwinDimension[]
}) {
  const [active, setActive] = React.useState<ScenarioKey[]>(['remote'])

  const toggle = React.useCallback((key: ScenarioKey) => {
    setActive((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }, [])

  const reset = React.useCallback(() => setActive([]), [])

  // Compute the simulation memoized on active scenarios.
  const result = React.useMemo(
    () => runSimulation(dimensions, active),
    [dimensions, active],
  )

  const hasActive = active.length > 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <SlidersHorizontal className="text-primary size-6" />
            What-If Simulator
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Model the impact of future decisions before you commit. Toggle
            scenarios to see your projected savings.
          </p>
        </div>
        {hasActive && (
          <Button onClick={reset} variant="ghost" size="sm">
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
        )}
      </div>

      {/* Scenario selection */}
      <SectionCard
        title="Scenarios"
        subtitle={`${active.length} of ${SCENARIOS.length} active · click to toggle`}
        bodyClassName="pt-0"
      >
        <ScenarioCards
          scenarios={SCENARIOS}
          active={active}
          onToggle={toggle}
        />
      </SectionCard>

      {/* Outputs */}
      {hasActive ? (
        <>
          {/* Summary KPIs */}
          <div className="mt-4">
            <SimulationSummary result={result} />
          </div>

          {/* Charts row 1: Before/After + Scenario Comparison */}
          <div className="mt-4 grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <BeforeAfterChart data={result.comparison} />
            </div>
            <div className="lg:col-span-5">
              <ScenarioComparison scenarios={result.perScenario} />
            </div>
          </div>

          {/* Chart row 2: Savings Timeline (full width) */}
          <div className="mt-4">
            <SavingsTimeline
              timeline={result.timeline}
              paybackYears={result.blendedPaybackYears}
            />
          </div>

          {/* Per-scenario detail */}
          <div className="mt-4">
            <SectionCard
              title="Scenario Details"
              subtitle="Per-scenario breakdown"
              bodyClassName="pt-0"
            >
              <div className="space-y-2">
                {result.perScenario.map((s) => (
                  <div
                    key={s.scenario.key}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <span
                      className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${s.scenario.color}20`,
                        color: s.scenario.color,
                      }}
                    >
                      <Sparkles className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{s.scenario.title}</p>
                      <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                        {s.scenario.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        <span className="text-muted-foreground">
                          Carbon:{' '}
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            −{formatCo2e(s.carbonSavedKg)}
                          </span>
                        </span>
                        <span className="text-muted-foreground">
                          Cost:{' '}
                          <span className="font-semibold text-sky-600 dark:text-sky-400 tabular-nums">
                            +{formatCost(s.costSavedUsd)}/yr
                          </span>
                        </span>
                        <span className="text-muted-foreground">
                          Payback:{' '}
                          <span className="font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                            {s.paybackYears > 0 ? `${s.paybackYears} yrs` : 'Immediate'}
                          </span>
                        </span>
                        <span className="text-muted-foreground">
                          10-yr net:{' '}
                          <span className="font-semibold tabular-nums">
                            ${s.net10yrUsd.toLocaleString()}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </>
      ) : (
        /* Empty state — no scenarios selected */
        <div className="mt-4">
          <SectionCard
            title="Simulation Results"
            subtitle="Select a scenario above to see projections"
            bodyClassName="pt-0"
          >
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="bg-muted text-muted-foreground mb-3 flex size-14 items-center justify-center rounded-full">
                <SlidersHorizontal className="size-7" />
              </span>
              <p className="text-sm font-medium">No scenarios active</p>
              <p className="text-muted-foreground mt-1 max-w-xs text-xs leading-relaxed">
                Toggle one or more scenarios above to model their combined
                impact on your carbon and cost footprint.
              </p>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  )
}
