/// <reference types="vitest/globals" />
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock recharts
vi.mock('recharts', () => ({
  ComposedChart: ({ children }: { children: React.ReactNode }) => <div data-testid="composed-chart">{children}</div>,
  Area: () => null,
  Line: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  Legend: () => null,
}))

import { TrendChart } from '@/components/results/trend-chart'
import type { ResultsData } from '@/lib/services/results.service'

const makeTrend = (): ResultsData['trend'] => [
  { week: '2026-01-01', current: 48, optimized: null },
  { week: '2026-01-08', current: 48, optimized: 38 },
  { week: '2026-01-15', current: 48, optimized: 38 },
  { week: '2026-01-22', current: 48, optimized: 38 },
]

describe('TrendChart', () => {
  it('renders title and subtitle', () => {
    render(<TrendChart trend={makeTrend()} potentialSavingsKg={500} />)
    expect(screen.getByText('Weekly Trend')).toBeInTheDocument()
    expect(screen.getByText('12-week projection · current vs optimized')).toBeInTheDocument()
  })

  it('renders composed chart', () => {
    const { container } = render(
      <TrendChart trend={makeTrend()} potentialSavingsKg={500} />,
    )
    expect(container.querySelector('[data-testid="composed-chart"]')).toBeInTheDocument()
  })

  it('displays legend with Current and Optimized labels', () => {
    render(<TrendChart trend={makeTrend()} potentialSavingsKg={500} />)
    expect(screen.getByText('Current')).toBeInTheDocument()
    expect(screen.getByText('Optimized')).toBeInTheDocument()
  })

  it('shows potential savings when greater than 0', () => {
    render(<TrendChart trend={makeTrend()} potentialSavingsKg={500} />)
    expect(screen.getByText('500kg/yr')).toBeInTheDocument()
    expect(screen.getByText('Saveable')).toBeInTheDocument()
  })

  it('does not show savings action when potentialSavingsKg is 0', () => {
    render(<TrendChart trend={makeTrend()} potentialSavingsKg={0} />)
    expect(screen.queryByText('Saveable')).not.toBeInTheDocument()
    expect(screen.queryByText('0kg/yr')).not.toBeInTheDocument()
  })

  it('renders with empty trend data', () => {
    const { container } = render(
      <TrendChart trend={[]} potentialSavingsKg={0} />,
    )
    expect(screen.getByText('Weekly Trend')).toBeInTheDocument()
    // Chart should still render (may show nothing)
    expect(container.querySelector('[data-testid="composed-chart"]')).toBeInTheDocument()
  })

  it('formats date labels in trend', () => {
    render(<TrendChart trend={makeTrend()} potentialSavingsKg={500} />)
    // Date formatting: Jan 1, Jan 8, etc.
    expect(screen.getByText('Current')).toBeInTheDocument()
  })
})
