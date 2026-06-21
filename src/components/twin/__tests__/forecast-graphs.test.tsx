/// <reference types="vitest/globals" />
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial: _i, animate: _a, transition: _t, exit: _e, ...rest } = props
      return <div {...rest}>{children}</div>
    },
  },
}))

vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => null,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  ReferenceLine: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  Legend: () => null,
}))

import { ForecastGraphs } from '@/components/twin/forecast-graphs'
import type { TwinData } from '@/lib/services/twin.service'

function makeForecast(): TwinData['forecast'] {
  return [
    { year: 1, label: '+1yr', current: 6000, optimized: 5000, aggressive: 4000 },
    { year: 3, label: '+3yr', current: 5500, optimized: 4000, aggressive: 3000 },
    { year: 5, label: '+5yr', current: 5000, optimized: 3500, aggressive: 2000 },
  ]
}

describe('ForecastGraphs', () => {
  it('renders the section title and subtitle', () => {
    render(<ForecastGraphs forecast={makeForecast()} parisTargetKg={1800} currentKg={6500} />)
    expect(screen.getByText('Carbon Forecast')).toBeInTheDocument()
    expect(screen.getByText('1 / 3 / 5-year trajectory projections')).toBeInTheDocument()
  })

  it('renders the 5-yr potential reduction value', () => {
    render(<ForecastGraphs forecast={makeForecast()} parisTargetKg={1800} currentKg={6500} />)
    // 5-yr optimized = 3500, reductionKg = 6500 - 3500 = 3000 → 3.0t
    expect(screen.getByText(/3\.0t/)).toBeInTheDocument()
  })

  it('renders the chart element', () => {
    const { container } = render(
      <ForecastGraphs forecast={makeForecast()} parisTargetKg={1800} currentKg={6500} />,
    )
    expect(container.querySelector('[data-testid="area-chart"]')).toBeInTheDocument()
  })

  it('renders three forecast cards for 1yr, 3yr, 5yr', () => {
    render(<ForecastGraphs forecast={makeForecast()} parisTargetKg={1800} currentKg={6500} />)
    expect(screen.getByText('+1yr')).toBeInTheDocument()
    expect(screen.getByText('+3yr')).toBeInTheDocument()
    expect(screen.getByText('+5yr')).toBeInTheDocument()
  })

  it('displays optimized values in forecast cards', () => {
    render(<ForecastGraphs forecast={makeForecast()} parisTargetKg={1800} currentKg={6500} />)
    // 5yr optimized = 3500 → 3.5t
    expect(screen.getByText('3.5t')).toBeInTheDocument()
  })

  it('renders legend labels', () => {
    render(<ForecastGraphs forecast={makeForecast()} parisTargetKg={1800} currentKg={6500} />)
    expect(screen.getByText('Current trajectory')).toBeInTheDocument()
    expect(screen.getByText('With recommendations')).toBeInTheDocument()
    expect(screen.getByText('Aggressive action')).toBeInTheDocument()
  })

  it('handles zero currentKg without division error', () => {
    render(<ForecastGraphs forecast={makeForecast()} parisTargetKg={1800} currentKg={0} />)
    expect(screen.getByText('Carbon Forecast')).toBeInTheDocument()
  })

  it('handles empty forecast array', () => {
    render(<ForecastGraphs forecast={[]} parisTargetKg={1800} currentKg={6500} />)
    expect(screen.getByText('Carbon Forecast')).toBeInTheDocument()
  })
})
