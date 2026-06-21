/// <reference types="vitest/globals" />
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ children }: { children: React.ReactNode }) => <div data-testid="bar">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  ReferenceLine: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  Legend: () => null,
}))

import { ScenarioForecast } from '@/components/twin/scenario-forecast'
import type { TwinData } from '@/lib/services/twin.service'

function makeScenarios(): TwinData['scenarios'] {
  return [
    { label: 'Current', annualKg: 6500, reductionPct: 0, color: 'var(--primary)' },
    { label: 'Optimized', annualKg: 5000, reductionPct: 23, color: '#10b981' },
    { label: 'Aggressive', annualKg: 4000, reductionPct: 38, color: '#0ea5e9' },
    { label: 'Paris 1.5°C', annualKg: 1800, reductionPct: 72, color: '#f59e0b' },
  ]
}

describe('ScenarioForecast', () => {
  it('renders the section title and subtitle', () => {
    render(<ScenarioForecast scenarios={makeScenarios()} parisTargetKg={1800} />)
    expect(screen.getByText('Scenario Forecast')).toBeInTheDocument()
    expect(screen.getByText('What-if comparison of reduction paths')).toBeInTheDocument()
  })

  it('renders the chart element', () => {
    const { container } = render(
      <ScenarioForecast scenarios={makeScenarios()} parisTargetKg={1800} />,
    )
    expect(container.querySelector('[data-testid="bar-chart"]')).toBeInTheDocument()
  })

  it('renders all four scenario legend items', () => {
    render(<ScenarioForecast scenarios={makeScenarios()} parisTargetKg={1800} />)
    expect(screen.getByText('Current')).toBeInTheDocument()
    expect(screen.getByText('Optimized')).toBeInTheDocument()
    expect(screen.getByText('Aggressive')).toBeInTheDocument()
    expect(screen.getByText('Paris 1.5°C')).toBeInTheDocument()
  })

  it('displays formatted CO2e for each scenario', () => {
    render(<ScenarioForecast scenarios={makeScenarios()} parisTargetKg={1800} />)
    // 6500 → 6.5t, 5000 → 5.0t, 4000 → 4.0t, 1800 → 1.8t
    expect(screen.getByText('6.5t')).toBeInTheDocument()
    expect(screen.getByText('5.0t')).toBeInTheDocument()
    expect(screen.getByText('4.0t')).toBeInTheDocument()
    expect(screen.getByText('1.8t')).toBeInTheDocument()
  })

  it('shows reduction percentages for non-baseline scenarios', () => {
    render(<ScenarioForecast scenarios={makeScenarios()} parisTargetKg={1800} />)
    expect(screen.getByText('−23%')).toBeInTheDocument()
    expect(screen.getByText('−38%')).toBeInTheDocument()
    expect(screen.getByText('−72%')).toBeInTheDocument()
  })

  it('shows "baseline" text for the current scenario', () => {
    render(<ScenarioForecast scenarios={makeScenarios()} parisTargetKg={1800} />)
    expect(screen.getByText('baseline')).toBeInTheDocument()
  })

  it('handles empty scenarios array', () => {
    render(<ScenarioForecast scenarios={[]} parisTargetKg={1800} />)
    expect(screen.getByText('Scenario Forecast')).toBeInTheDocument()
  })
})
