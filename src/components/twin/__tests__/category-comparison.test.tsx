/// <reference types="vitest/globals" />
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('recharts', () => ({
  RadarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="radar-chart">{children}</div>,
  Radar: () => null,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  Legend: () => null,
}))

import { CategoryComparison } from '@/components/twin/category-comparison'
import type { TwinData } from '@/lib/services/twin.service'

function makeRadar(): TwinData['radar'] {
  return [
    { dimension: 'Home', value: 100, fullMark: 100 },
    { dimension: 'Appliances', value: 60, fullMark: 100 },
    { dimension: 'Transport', value: 45, fullMark: 100 },
    { dimension: 'Lifestyle', value: 30, fullMark: 100 },
    { dimension: 'Diet', value: 20, fullMark: 100 },
  ]
}

function makeDimensions(): TwinData['dimensions'] {
  return [
    { key: 'home', label: 'Home', annualKg: 2275, share: 35, color: '#f59e0b', icon: 'Home', detail: '2-person household' },
    { key: 'appliances', label: 'Appliances', annualKg: 1365, share: 21, color: '#8b5cf6', icon: 'Zap', detail: '8 appliances tracked' },
    { key: 'transport', label: 'Transport', annualKg: 975, share: 15, color: '#0ea5e9', icon: 'Car', detail: '5 trips logged' },
    { key: 'lifestyle', label: 'Lifestyle', annualKg: 650, share: 10, color: '#ec4899', icon: 'ShoppingBag', detail: 'Shopping + digital' },
    { key: 'diet', label: 'Diet', annualKg: 325, share: 5, color: '#10b981', icon: 'UtensilsCrossed', detail: 'Food & beverage' },
  ]
}

describe('CategoryComparison', () => {
  it('renders the section title and subtitle', () => {
    render(<CategoryComparison radar={makeRadar()} dimensions={makeDimensions()} />)
    expect(screen.getByText('Category Comparison')).toBeInTheDocument()
    expect(screen.getByText('Your footprint shape across 5 dimensions')).toBeInTheDocument()
  })

  it('renders the radar chart element', () => {
    const { container } = render(
      <CategoryComparison radar={makeRadar()} dimensions={makeDimensions()} />,
    )
    expect(container.querySelector('[data-testid="radar-chart"]')).toBeInTheDocument()
  })

  it('renders all five dimension labels', () => {
    render(<CategoryComparison radar={makeRadar()} dimensions={makeDimensions()} />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Appliances')).toBeInTheDocument()
    expect(screen.getByText('Transport')).toBeInTheDocument()
    expect(screen.getByText('Lifestyle')).toBeInTheDocument()
    expect(screen.getByText('Diet')).toBeInTheDocument()
  })

  it('displays formatted CO2e for each dimension', () => {
    render(<CategoryComparison radar={makeRadar()} dimensions={makeDimensions()} />)
    expect(screen.getByText('2.3t')).toBeInTheDocument() // 2275 → 2.3t
    expect(screen.getByText('1.4t')).toBeInTheDocument() // 1365 → 1.4t
  })

  it('displays share percentage for each dimension', () => {
    render(<CategoryComparison radar={makeRadar()} dimensions={makeDimensions()} />)
    expect(screen.getByText('35%')).toBeInTheDocument()
    expect(screen.getByText('21%')).toBeInTheDocument()
    expect(screen.getByText('15%')).toBeInTheDocument()
    expect(screen.getByText('10%')).toBeInTheDocument()
    expect(screen.getByText('5%')).toBeInTheDocument()
  })
})
