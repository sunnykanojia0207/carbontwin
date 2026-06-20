'use client'

import {
  LayoutDashboard,
  BarChart3,
  Activity,
  Target,
} from 'lucide-react'

import { PageTabs, type TabItem } from '@/components/shared/page-tabs'
import { KpiRow } from '@/components/dashboard/kpi-row'
import { CarbonScore } from '@/components/dashboard/carbon-score'
import { CarbonTrend } from '@/components/dashboard/carbon-trend'
import { CategoryDonut } from '@/components/dashboard/category-donut'
import { RecentScans } from '@/components/dashboard/recent-scans'
import { RecentRecommendations } from '@/components/dashboard/recent-recommendations'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { GoalsProgress } from '@/components/dashboard/goals-progress'
import { ForecastSnapshot } from '@/components/dashboard/forecast-snapshot'
import type { DashboardData } from '@/lib/services/dashboard.service'

// ============================================================================
// DashboardTabs — tabbed layout for the Dashboard home page.
//
// Tabs:
//   Overview  → KPI row, carbon score, carbon trend (current dashboard content)
//   Analytics → category donut, forecast snapshot
//   Activity  → recent scans, recommendations, quick actions
//   Goals     → goals progress
// ============================================================================

interface DashboardTabsProps {
  data: DashboardData
}

export function DashboardTabs({ data }: DashboardTabsProps) {
  const tabs: TabItem[] = [
    {
      value: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      content: (
        <div className="space-y-4">
          {/* KPI row */}
          <KpiRow kpis={data.kpis} />

          {/* Score + Trend */}
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <CarbonScore score={data.score} />
            </div>
            <div className="lg:col-span-8">
              <CarbonTrend trend={data.trend} weekKg={data.kpis.weekKg} />
            </div>
          </div>
        </div>
      ),
    },
    {
      value: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      content: (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <CategoryDonut
              categories={data.categories}
              weekKg={data.kpis.weekKg}
            />
          </div>
          <div className="lg:col-span-8">
            <ForecastSnapshot forecast={data.forecast} />
          </div>
        </div>
      ),
    },
    {
      value: 'activity',
      label: 'Activity',
      icon: Activity,
      badge: data.recentScans.length,
      content: (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <RecentScans scans={data.recentScans} />
            </div>
            <div className="lg:col-span-4">
              <QuickActions />
            </div>
            <div className="lg:col-span-4">
              <GoalsProgress goals={data.goals} />
            </div>
          </div>
          <RecentRecommendations recs={data.recentRecommendations} />
        </div>
      ),
    },
    {
      value: 'goals',
      label: 'Goals',
      icon: Target,
      content: (
        <GoalsProgress goals={data.goals} />
      ),
    },
  ]

  return (
    <PageTabs
      tabs={tabs}
      defaultTab="overview"
      paramKey="dt"
      variant="primary"
    />
  )
}
