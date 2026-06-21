/// <reference types="vitest/globals" />
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock recharts for chart components
vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: { children: React.ReactNode }) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  Legend: () => null,
}))

import { ImpactBreakdown } from '@/components/results/impact-breakdown'
import type { ResultsData } from '@/lib/services/results.service'

const makeBreakdown = (): ResultsData['impactBreakdown'] => [
  { type: 'HVAC', name: 'HVAC', kg: 1200, share: 48, color: '#0ea5e9', cost: 240 },
  { type: 'KITCHEN', name: 'Kitchen', kg: 600, share: 24, color: '#f59e0b', cost: 120 },
  { type: 'ELECTRONICS', name: 'Electronics', kg: 400, share: 16, color: '#6366f1', cost: 80 },
]

describe('ImpactBreakdown', () => {
  it('renders title and subtitle', () => {
    render(
      <ImpactBreakdown
        breakdown={makeBreakdown()}
        totalCo2eKg={2200}
        totalCostUsd={440}
      />,
    )
    expect(screen.getByText('Impact Breakdown')).toBeInTheDocument()
    expect(screen.getByText('CO₂e by appliance type')).toBeInTheDocument()
  })

  it('renders legend items for each breakdown entry', () => {
    render(
      <ImpactBreakdown
        breakdown={makeBreakdown()}
        totalCo2eKg={2200}
        totalCostUsd={440}
      />,
    )
    expect(screen.getByText('HVAC')).toBeInTheDocument()
    expect(screen.getByText('Kitchen')).toBeInTheDocument()
    expect(screen.getByText('Electronics')).toBeInTheDocument()
  })

  it('displays formatted values in legend', () => {
    render(
      <ImpactBreakdown
        breakdown={makeBreakdown()}
        totalCo2eKg={2200}
        totalCostUsd={440}
      />,
    )
    // 1200kg = 1.2t
    expect(screen.getByText('1.2t')).toBeInTheDocument()
    expect(screen.getByText('48%')).toBeInTheDocument()
  })

  it('displays total CO2e in center', () => {
    render(
      <ImpactBreakdown
        breakdown={makeBreakdown()}
        totalCo2eKg={2200}
        totalCostUsd={440}
      />,
    )
    // 2200kg = 2.2t
    expect(screen.getByText('2.2t')).toBeInTheDocument()
    // "total" label next to center value
    expect(screen.getByText('total')).toBeInTheDocument()
  })

  it('displays total cost', () => {
    render(
      <ImpactBreakdown
        breakdown={makeBreakdown()}
        totalCo2eKg={2200}
        totalCostUsd={440}
      />,
    )
    expect(screen.getByText('Total cost')).toBeInTheDocument()
    expect(screen.getByText('$440/yr')).toBeInTheDocument()
  })

  it('shows "No data" fallback when breakdown is empty', () => {
    render(
      <ImpactBreakdown
        breakdown={[]}
        totalCo2eKg={0}
        totalCostUsd={0}
      />,
    )
    expect(screen.getByText('No data available.')).toBeInTheDocument()
  })

  it('renders with a single breakdown entry', () => {
    const singleBreakdown: ResultsData['impactBreakdown'] = [
      { type: 'OTHER', name: 'Other', kg: 100, share: 100, color: '#94a3b8', cost: 15 },
    ]
    render(
      <ImpactBreakdown
        breakdown={singleBreakdown}
        totalCo2eKg={100}
        totalCostUsd={15}
      />,
    )
    expect(screen.getByText('Other')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('renders chart container with pie chart', () => {
    const { container } = render(
      <ImpactBreakdown
        breakdown={makeBreakdown()}
        totalCo2eKg={2200}
        totalCostUsd={440}
      />,
    )
    expect(container.querySelector('[data-testid="pie-chart"]')).toBeInTheDocument()
  })
})
