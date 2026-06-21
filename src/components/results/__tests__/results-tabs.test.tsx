/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Mock framer-motion (used by page-tabs)
vi.mock('framer-motion', () => ({
  motion: {
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { layoutId: _li, transition: _t, ...rest } = props
      return <span {...rest}>{children}</span>
    },
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial: _i, animate: _a, exit: _e, transition: _t, ...rest } = props
      return <div {...rest}>{children}</div>
    },
  },
  LayoutGroup: ({ children }: React.PropsWithChildren) => <>{children}</>,
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// Mock recharts (used by impact-breakdown and trend-chart which are rendered in tabs)
vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div data-testid="composed-chart">{children}</div>,
  Area: () => null,
  Line: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ children }: { children: React.ReactNode }) => <div data-testid="bar">{children}</div>,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  Legend: () => null,
}))

// Mock next/link (used by savings-opportunities)
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) =>
    <a href={href} {...props}>{children}</a>,
}))

import { ResultsTabs } from '@/components/results/results-tabs'
import type { ResultsData } from '@/lib/services/results.service'

function makeFullResultsData(): ResultsData {
  return {
    isEmpty: false,
    scan: {
      id: 'scan-1',
      roomType: 'Living Room',
      summary: '5 appliances detected',
      createdAt: new Date(),
      aiModel: 'gpt-4',
    },
    appliances: [
      {
        id: 'app-1',
        name: 'HVAC',
        type: 'HVAC',
        watts: 3500,
        hoursPerDay: 8,
        daysPerWeek: 7,
        confidence: 0.95,
        notes: '',
        carbon: { annualKwh: 10192, annualCo2eKg: 4076.8, monthlyCo2eKg: 339.7, dailyCo2eKg: 11.17 },
        cost: { annualUsd: 1528.8, monthlyUsd: 127.4, dailyUsd: 4.19 },
        suggestions: [],
      },
    ],
    kpis: {
      totalCo2eKg: 4076.8,
      totalCostUsd: 1528.8,
      applianceCount: 1,
      totalKwh: 10192,
      potentialSavingsKg: 400,
      potentialSavingsUsd: 150,
    },
    impactBreakdown: [
      { type: 'HVAC', name: 'HVAC', kg: 4076.8, share: 100, color: '#0ea5e9', cost: 1528.8 },
    ],
    topEmitters: [
      {
        id: 'app-1', name: 'HVAC', type: 'HVAC', watts: 3500, hoursPerDay: 8, daysPerWeek: 7,
        confidence: 0.95, notes: '',
        carbon: { annualKwh: 10192, annualCo2eKg: 4076.8, monthlyCo2eKg: 339.7, dailyCo2eKg: 11.17 },
        cost: { annualUsd: 1528.8, monthlyUsd: 127.4, dailyUsd: 4.19 },
        suggestions: [],
      },
    ],
    savingsOpportunities: [
      {
        applianceName: 'HVAC',
        applianceType: 'HVAC',
        title: 'Upgrade thermostat',
        description: 'Install smart thermostat',
        difficulty: 'EASY',
        co2eKgPerYear: 400,
        usdPerYear: 150,
      },
    ],
    trend: [
      { week: '2026-01-01', current: 78.4, optimized: null },
      { week: '2026-01-08', current: 78.4, optimized: 70.7 },
    ],
  }
}

describe('ResultsTabs', () => {
  beforeEach(() => {
    // Mock fetch for AiInsights tab
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ insight: 'Test insight', highlights: ['Highlight 1'] }),
    } as Response)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders all tab buttons', () => {
    render(<ResultsTabs data={makeFullResultsData()} />)
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Appliances')).toBeInTheDocument()
    expect(screen.getByText('Impact')).toBeInTheDocument()
    expect(screen.getByText('Savings')).toBeInTheDocument()
    // "AI Insights" appears twice (tab trigger + card title), use getAllByText
    const aiInsightsElements = screen.getAllByText('AI Insights')
    expect(aiInsightsElements.length).toBeGreaterThanOrEqual(1)
  })

  it('shows badge count for appliances tab', () => {
    render(<ResultsTabs data={makeFullResultsData()} />)
    // The badge shows the appliance count (1)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders overview content by default', () => {
    render(<ResultsTabs data={makeFullResultsData()} />)
    expect(screen.getByText('Annual Carbon')).toBeInTheDocument()
    expect(screen.getByText('Annual Cost')).toBeInTheDocument()
  })

  it('renders without crashing with empty data', () => {
    const emptyData: ResultsData = {
      isEmpty: true,
      scan: null,
      appliances: [],
      kpis: { totalCo2eKg: 0, totalCostUsd: 0, applianceCount: 0, totalKwh: 0, potentialSavingsKg: 0, potentialSavingsUsd: 0 },
      impactBreakdown: [],
      topEmitters: [],
      savingsOpportunities: [],
      trend: [],
    }
    render(<ResultsTabs data={emptyData} />)
    expect(screen.getByText('Overview')).toBeInTheDocument()
    // "0.0kg" appears in multiple places (carbon cards + impact center), use getAllByText
    const kgElements = screen.getAllByText('0.0kg')
    expect(kgElements.length).toBeGreaterThanOrEqual(1)
  })

  it('renders with scanId for AI Insights', async () => {
    render(<ResultsTabs data={makeFullResultsData()} scanId="scan-123" />)

    // AiInsights component should load and show data
    await waitFor(() => {
      expect(screen.getByText('Test insight')).toBeInTheDocument()
    })
  })

  it('renders appliance count in badge', () => {
    const data = makeFullResultsData()
    data.appliances = [
      ...data.appliances,
      {
        id: 'app-2', name: 'Fridge', type: 'REFRIGERATION', watts: 500, hoursPerDay: 24, daysPerWeek: 7,
        confidence: 0.9, notes: '',
        carbon: { annualKwh: 4368, annualCo2eKg: 1747.2, monthlyCo2eKg: 145.6, dailyCo2eKg: 4.79 },
        cost: { annualUsd: 655.2, monthlyUsd: 54.6, dailyUsd: 1.79 },
        suggestions: [],
      },
    ]
    render(<ResultsTabs data={data} />)
    const badgeElements = screen.getAllByText('2')
    expect(badgeElements.length).toBeGreaterThanOrEqual(1)
  })
})
