/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock framer-motion (used by page-tabs and child components)
vi.mock('framer-motion', () => ({
  motion: {
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { layoutId: _li, transition: _t, ...rest } = props
      return <span {...rest}>{children}</span>
    },
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial: _i, animate: _a, transition: _t, exit: _e, ...rest } = props
      return <div {...rest}>{children}</div>
    },
  },
  LayoutGroup: ({ children }: React.PropsWithChildren) => <>{children}</>,
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useReducedMotion: () => false,
}))

// Mock recharts (used by forecast-graphs, scenario-forecast, category-comparison)
vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ children }: { children: React.ReactNode }) => <div data-testid="bar">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  RadarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="radar-chart">{children}</div>,
  Radar: () => null,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  ReferenceLine: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  Legend: () => null,
}))

// Mock AiRecommendations to avoid API calls
vi.mock('@/components/twin/ai-recommendations', () => ({
  AiRecommendations: () => <div data-testid="ai-recommendations">AI Recommendations</div>,
}))

import { TwinTabs } from '@/components/twin/twin-tabs'
import type { TwinData } from '@/lib/services/twin.service'

function makeFullTwinData(): TwinData {
  return {
    isEmpty: false,
    profile: { name: 'Alex', country: 'US', region: 'California', householdSize: 2, baselineAnnualKg: 8000 },
    tier: { name: 'Ember', color: '#f59e0b', description: 'Moderate — near average' },
    current: {
      totalAnnualKg: 6500,
      monthlyKg: 541.7,
      vsBaselinePct: -18.8,
      vsCountryAvgPct: -12.2,
      parisTargetKg: 1800,
      onTrack: false,
    },
    dimensions: [
      { key: 'home', label: 'Home', annualKg: 2275, share: 35, color: '#f59e0b', icon: 'Home', detail: '2-person household' },
      { key: 'appliances', label: 'Appliances', annualKg: 1365, share: 21, color: '#8b5cf6', icon: 'Zap', detail: '8 appliances tracked' },
      { key: 'transport', label: 'Transport', annualKg: 975, share: 15, color: '#0ea5e9', icon: 'Car', detail: '5 trips logged' },
      { key: 'lifestyle', label: 'Lifestyle', annualKg: 650, share: 10, color: '#ec4899', icon: 'ShoppingBag', detail: 'Shopping + digital' },
      { key: 'diet', label: 'Diet', annualKg: 325, share: 5, color: '#10b981', icon: 'UtensilsCrossed', detail: 'Food & beverage' },
    ],
    forecast: [
      { year: 1, label: '+1yr', current: 6000, optimized: 5000, aggressive: 4000 },
      { year: 3, label: '+3yr', current: 5500, optimized: 4000, aggressive: 3000 },
      { year: 5, label: '+5yr', current: 5000, optimized: 3500, aggressive: 2000 },
    ],
    radar: [
      { dimension: 'Home', value: 100, fullMark: 100 },
      { dimension: 'Appliances', value: 60, fullMark: 100 },
      { dimension: 'Transport', value: 45, fullMark: 100 },
      { dimension: 'Lifestyle', value: 30, fullMark: 100 },
      { dimension: 'Diet', value: 20, fullMark: 100 },
    ],
    scenarios: [
      { label: 'Current', annualKg: 6500, reductionPct: 0, color: 'var(--primary)' },
      { label: 'Optimized', annualKg: 5000, reductionPct: 23, color: '#10b981' },
      { label: 'Aggressive', annualKg: 4000, reductionPct: 38, color: '#0ea5e9' },
      { label: 'Paris 1.5°C', annualKg: 1800, reductionPct: 72, color: '#f59e0b' },
    ],
    riskAreas: [
      { dimension: 'Home', label: 'Home is 35% of your footprint', annualKg: 2275, severity: 'HIGH', reason: 'Home energy is a fixed daily draw.' },
    ],
    opportunities: [
      { dimension: 'Home', title: 'Switch to green tariff', description: 'Switch to renewable plan', potentialKg: 500, difficulty: 'EASY', timeframe: '1 month' },
    ],
  }
}

describe('TwinTabs', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ insight: 'Test', highlights: [] }),
    } as Response)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders all five tab buttons', () => {
    render(<TwinTabs data={makeFullTwinData()} />)
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Dimensions')).toBeInTheDocument()
    expect(screen.getByText('Forecast')).toBeInTheDocument()
    expect(screen.getByText('Comparison')).toBeInTheDocument()
    expect(screen.getByText('Risks & Opportunities')).toBeInTheDocument()
  })

  it('renders overview content by default (hero and dimensions)', () => {
    render(<TwinTabs data={makeFullTwinData()} />)
    // TwinHero content
    expect(screen.getByText(/Alex/)).toBeInTheDocument()
    // LifestyleInputs content appears in both the inputs card and dimension card
    const lifestyleTitles = screen.getAllByText('Lifestyle Inputs')
    expect(lifestyleTitles.length).toBeGreaterThanOrEqual(2)
  })

  it('renders with minimal data', () => {
    const minimal: TwinData = {
      isEmpty: true,
      profile: { name: 'You', country: null, region: null, householdSize: 1, baselineAnnualKg: null },
      tier: { name: '—', color: 'var(--muted)', description: 'No data yet' },
      current: { totalAnnualKg: 0, monthlyKg: 0, vsBaselinePct: 0, vsCountryAvgPct: 0, parisTargetKg: 1800, onTrack: false },
      dimensions: [],
      forecast: [],
      radar: [],
      scenarios: [],
      riskAreas: [],
      opportunities: [],
    }
    render(<TwinTabs data={minimal} />)
    expect(screen.getByText('Overview')).toBeInTheDocument()
  })

  it('renders the comparison section with radar chart', () => {
    render(<TwinTabs data={makeFullTwinData()} />)
    // Hidden because it's not the active tab, but still in the DOM (forceMount)
    expect(screen.getByText('Category Comparison')).toBeInTheDocument()
  })

  it('renders the forecast section with chart elements', () => {
    render(<TwinTabs data={makeFullTwinData()} />)
    expect(screen.getByText('Carbon Forecast')).toBeInTheDocument()
  })
})
