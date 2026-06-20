'use client'

import {
  LayoutDashboard,
  Grid3x3,
  TrendingUp,
  Radar,
  AlertTriangle,
} from 'lucide-react'

import { PageTabs, type TabItem } from '@/components/shared/page-tabs'
import { TwinHero } from '@/components/twin/twin-hero'
import { LifestyleInputs } from '@/components/twin/lifestyle-inputs'
import { ForecastGraphs } from '@/components/twin/forecast-graphs'
import { CategoryComparison } from '@/components/twin/category-comparison'
import { ScenarioForecast } from '@/components/twin/scenario-forecast'
import { RiskAreas } from '@/components/twin/risk-areas'
import { AiRecommendations } from '@/components/twin/ai-recommendations'
import type { TwinData } from '@/lib/services/twin.service'

// ============================================================================
// TwinTabs — tabbed layout for the Climate Twin page.
//
// Tabs:
//   Overview      → hero section with tier, summary stats
//   Dimensions    → 5 dimension cards (home, appliances, transport, lifestyle, diet)
//   Forecast      → 1/3/5 year forecast graphs + scenario forecast
//   Comparison    → radar chart, category comparison
//   Risks & Opportunities → risk areas + AI recommendations
// ============================================================================

interface TwinTabsProps {
  data: TwinData
}

export function TwinTabs({ data }: TwinTabsProps) {
  const tabs: TabItem[] = [
    {
      value: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      content: (
        <div className="space-y-4">
          <TwinHero data={data} />
          <LifestyleInputs dimensions={data.dimensions} />
        </div>
      ),
    },
    {
      value: 'dimensions',
      label: 'Dimensions',
      icon: Grid3x3,
      content: (
        <div className="space-y-4">
          <LifestyleInputs dimensions={data.dimensions} />
        </div>
      ),
    },
    {
      value: 'forecast',
      label: 'Forecast',
      icon: TrendingUp,
      content: (
        <div className="space-y-4">
          <ForecastGraphs
            forecast={data.forecast}
            parisTargetKg={data.current.parisTargetKg}
            currentKg={data.current.totalAnnualKg}
          />
        </div>
      ),
    },
    {
      value: 'comparison',
      label: 'Comparison',
      icon: Radar,
      content: (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <CategoryComparison
              radar={data.radar}
              dimensions={data.dimensions}
            />
          </div>
          <div className="lg:col-span-7">
            <ScenarioForecast
              scenarios={data.scenarios}
              parisTargetKg={data.current.parisTargetKg}
            />
          </div>
        </div>
      ),
    },
    {
      value: 'risks',
      label: 'Risks & Opportunities',
      icon: AlertTriangle,
      content: (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <RiskAreas riskAreas={data.riskAreas} />
            </div>
            <div className="lg:col-span-6">
              <ScenarioForecast
                scenarios={data.scenarios}
                parisTargetKg={data.current.parisTargetKg}
              />
            </div>
          </div>
          <AiRecommendations opportunities={data.opportunities} />
        </div>
      ),
    },
  ]

  return (
    <PageTabs
      tabs={tabs}
      defaultTab="overview"
      paramKey="tt"
      variant="primary"
    />
  )
}
