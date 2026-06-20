'use client'

import * as React from 'react'
import {
  Eye,
  Monitor,
  BarChart3,
  PiggyBank,
  Sparkles,
} from 'lucide-react'

import { PageTabs, type TabItem } from '@/components/shared/page-tabs'
import { CarbonOverview } from '@/components/results/carbon-overview'
import { DetectedAppliances } from '@/components/results/detected-appliances'
import { ImpactBreakdown } from '@/components/results/impact-breakdown'
import { TopEmitters } from '@/components/results/top-emitters'
import { TrendChart } from '@/components/results/trend-chart'
import { SavingsOpportunities } from '@/components/results/savings-opportunities'
import { AiInsights } from '@/components/results/ai-insights'
import type { ResultsData } from '@/lib/services/results.service'

// ============================================================================
// ResultsTabs — tabbed layout for the Results page.
//
// Tabs:
//   Overview    → carbon KPI cards, summary
//   Appliances  → detected appliance list (accordion)
//   Impact      → breakdown pie chart, top emitters
//   Savings     → savings opportunities list
//   AI Insights → AI-generated narrative
// ============================================================================

interface ResultsTabsProps {
  data: ResultsData
  scanId?: string
}

export function ResultsTabs({ data, scanId }: ResultsTabsProps) {
  const tabs: TabItem[] = React.useMemo(
    () => [
      {
        value: 'overview',
        label: 'Overview',
        icon: Eye,
        content: (
          <div className="space-y-4">
            <CarbonOverview kpis={data.kpis} />
          </div>
        ),
      },
      {
        value: 'appliances',
        label: 'Appliances',
        icon: Monitor,
        badge: data.appliances.length,
        content: (
          <DetectedAppliances appliances={data.appliances} />
        ),
      },
      {
        value: 'impact',
        label: 'Impact',
        icon: BarChart3,
        content: (
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <ImpactBreakdown
                breakdown={data.impactBreakdown}
                totalCo2eKg={data.kpis.totalCo2eKg}
                totalCostUsd={data.kpis.totalCostUsd}
              />
            </div>
            <div className="lg:col-span-8">
              <TopEmitters emitters={data.topEmitters} />
            </div>
          </div>
        ),
      },
      {
        value: 'savings',
        label: 'Savings',
        icon: PiggyBank,
        content: (
          <div className="space-y-4">
            <TrendChart
              trend={data.trend}
              potentialSavingsKg={data.kpis.potentialSavingsKg}
            />
            <SavingsOpportunities opportunities={data.savingsOpportunities} />
          </div>
        ),
      },
      {
        value: 'insights',
        label: 'AI Insights',
        icon: Sparkles,
        content: <AiInsights scanId={scanId} />,
      },
    ],
    [data, scanId],
  )

  return (
    <PageTabs
      tabs={tabs}
      defaultTab="overview"
      paramKey="rt"
      variant="primary"
    />
  )
}
