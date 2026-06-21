/// <reference types="vitest/globals" />
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock recharts
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: ({ children }: { children: React.ReactNode }) => <div data-testid="bar">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  Legend: () => null,
}))

import { TopEmitters } from '@/components/results/top-emitters'
import type { ResultsData } from '@/lib/services/results.service'

const mockEmitters: ResultsData['topEmitters'] = [
  {
    id: 'app-1',
    name: 'Central HVAC System',
    type: 'HVAC',
    watts: 3500,
    hoursPerDay: 8,
    daysPerWeek: 7,
    confidence: 0.95,
    notes: 'Main heating/cooling system',
    carbon: { annualKwh: 10192, annualCo2eKg: 4076.8, monthlyCo2eKg: 339.7, dailyCo2eKg: 11.17 },
    cost: { annualUsd: 1528.8, monthlyUsd: 127.4, dailyUsd: 4.19 },
    suggestions: [
      {
        suggestion: { title: 'Upgrade thermostat', description: 'Install smart thermostat', difficulty: 'EASY', type: 'thermostat' },
        savings: { co2eKgPerYear: 400, usdPerYear: 150, kwhPerYear: 1000 },
      },
    ],
  },
  {
    id: 'app-2',
    name: 'Old Refrigerator',
    type: 'REFRIGERATION',
    watts: 500,
    hoursPerDay: 24,
    daysPerWeek: 7,
    confidence: 0.88,
    notes: 'Kitchen refrigerator',
    carbon: { annualKwh: 4368, annualCo2eKg: 1747.2, monthlyCo2eKg: 145.6, dailyCo2eKg: 4.79 },
    cost: { annualUsd: 655.2, monthlyUsd: 54.6, dailyUsd: 1.79 },
    suggestions: [],
  },
  {
    id: 'app-3',
    name: 'LongNamedApplianceThatShouldBeTruncated',
    type: 'ELECTRONICS',
    watts: 200,
    hoursPerDay: 10,
    daysPerWeek: 7,
    confidence: 0.75,
    notes: '',
    carbon: { annualKwh: 728, annualCo2eKg: 291.2, monthlyCo2eKg: 24.3, dailyCo2eKg: 0.8 },
    cost: { annualUsd: 109.2, monthlyUsd: 9.1, dailyUsd: 0.3 },
    suggestions: [],
  },
]

describe('TopEmitters', () => {
  it('renders title and subtitle', () => {
    render(<TopEmitters emitters={mockEmitters} />)
    expect(screen.getByText('Top Emitters')).toBeInTheDocument()
    expect(screen.getByText('Ranked by annual CO₂e')).toBeInTheDocument()
  })

  it('renders bar chart when data exists', () => {
    const { container } = render(<TopEmitters emitters={mockEmitters} />)
    expect(container.querySelector('[data-testid="bar-chart"]')).toBeInTheDocument()
  })

  it('shows empty state when no emitters', () => {
    render(<TopEmitters emitters={[]} />)
    expect(
      screen.getByText('No appliances detected yet.'),
    ).toBeInTheDocument()
  })

  it('renders bar cells for each emitter', () => {
    const { container } = render(<TopEmitters emitters={mockEmitters} />)
    const cells = container.querySelectorAll('[data-testid="cell"]')
    expect(cells.length).toBe(3)
  })

  it('renders with single emitter', () => {
    const { container } = render(<TopEmitters emitters={[mockEmitters[0]]} />)
    const cells = container.querySelectorAll('[data-testid="cell"]')
    expect(cells.length).toBe(1)
  })
})
