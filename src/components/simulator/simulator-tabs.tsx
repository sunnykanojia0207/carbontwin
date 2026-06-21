'use client'

import * as React from 'react'
import {
  SlidersHorizontal,
  BarChart3,
  ChartLine,
  ArrowLeftRight,
} from 'lucide-react'

import { PageTabs, type TabItem } from '@/components/shared/page-tabs'
import { ScenarioCards } from '@/components/simulator/scenario-cards'
import { SimulationSummary } from '@/components/simulator/simulation-summary'
import { BeforeAfterChart } from '@/components/simulator/before-after-chart'
import { SavingsTimeline } from '@/components/simulator/savings-timeline'
import { ScenarioComparison } from '@/components/simulator/scenario-comparison'
import { SectionCard } from '@/components/dashboard/section-card'
import {
  SCENARIOS,
  runSimulation,
  type ScenarioKey,
} from '@/lib/simulator/scenarios'
import type { TwinDimension } from '@/lib/services/twin.service'

// ============================================================================
// SimulatorTabs — tabbed layout for the What-If Simulator page.
//
// Tabs:
//   Scenarios  → scenario toggle cards (always visible + interactive)
//   Results    → before/after comparison + KPI summary
//   Timeline   → 10-year projection chart
//   Comparison → side-by-side scenario comparison
// ============================================================================

interface SimulatorTabsProps {
  dimensions: TwinDimension[]
}

export function SimulatorTabs({ dimensions }: SimulatorTabsProps) {
  const [activeScenarios, setActiveScenarios] = React.useState<ScenarioKey[]>(['remote'])

  const toggle = React.useCallback((key: ScenarioKey) => {
    setActiveScenarios((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }, [])

  const result = React.useMemo(
    () => runSimulation(dimensions, activeScenarios),
    [dimensions, activeScenarios],
  )

  const hasActive = activeScenarios.length > 0
  const scenarioCountLabel = `${activeScenarios.length} of ${SCENARIOS.length} active`

  const tabs: TabItem[] = [
    {
      value: 'scenarios',
      label: 'Scenarios',
      icon: SlidersHorizontal,
      content: (
        <SectionCard
          title="Scenarios"
          subtitle={`${scenarioCountLabel} · click to toggle`}
          bodyClassName="pt-0"
        >
          <ScenarioCards
            scenarios={SCENARIOS}
            active={activeScenarios}
            onToggle={toggle}
          />
        </SectionCard>
      ),
    },
    {
      value: 'results',
      label: 'Results',
      icon: BarChart3,
      content: hasActive ? (
        <div className="space-y-4">
          <SimulationSummary result={result} />
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <BeforeAfterChart data={result.comparison} />
            </div>
            <div className="lg:col-span-5">
              <ScenarioComparison scenarios={result.perScenario} />
            </div>
          </div>
        </div>
      ) : (
        <EmptySimulationMessage />
      ),
    },
    {
      value: 'timeline',
      label: 'Timeline',
      icon: ChartLine,
      content: hasActive ? (
        <div className="space-y-4">
          <SavingsTimeline
            timeline={result.timeline}
            paybackYears={result.blendedPaybackYears}
          />
        </div>
      ) : (
        <EmptySimulationMessage />
      ),
    },
    {
      value: 'comparison',
      label: 'Comparison',
      icon: ArrowLeftRight,
      content: hasActive ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <BeforeAfterChart data={result.comparison} />
            </div>
            <div className="lg:col-span-5">
              <ScenarioComparison scenarios={result.perScenario} />
            </div>
          </div>
        </div>
      ) : (
        <EmptySimulationMessage />
      ),
    },
  ]

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
      </div>

      <PageTabs
        tabs={tabs}
        defaultTab="scenarios"
        paramKey="sim"
        variant="primary"
      />
    </div>
  )
}

function EmptySimulationMessage() {
  return (
    <SectionCard
      title="No Active Scenarios"
      subtitle="Select a scenario on the Scenarios tab to see projections"
      bodyClassName="pt-0"
    >
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="bg-muted text-muted-foreground mb-3 flex size-14 items-center justify-center rounded-full">
          <SlidersHorizontal className="size-7" />
        </span>
        <p className="text-sm font-medium">No scenarios selected</p>
        <p className="text-muted-foreground mt-1 max-w-xs text-xs leading-relaxed">
          Toggle one or more scenarios to model their combined impact on your
          carbon and cost footprint.
        </p>
      </div>
    </SectionCard>
  )
}
