/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { CarbonOverview } from '@/components/results/carbon-overview'
import type { ResultsData } from '@/lib/services/results.service'

const makeKpis = (overrides: Partial<ResultsData['kpis']> = {}): ResultsData['kpis'] => ({
  totalCo2eKg: 2500,
  totalCostUsd: 850,
  applianceCount: 12,
  totalKwh: 6250,
  potentialSavingsKg: 500,
  potentialSavingsUsd: 180,
  ...overrides,
})

describe('CarbonOverview', () => {
  it('renders all 4 KPI cards', () => {
    render(<CarbonOverview kpis={makeKpis()} />)
    expect(screen.getByText('Annual Carbon')).toBeInTheDocument()
    expect(screen.getByText('Annual Cost')).toBeInTheDocument()
    expect(screen.getByText('Energy Use')).toBeInTheDocument()
    expect(screen.getByText('Potential Savings')).toBeInTheDocument()
  })

  it('displays formatted carbon value', () => {
    render(<CarbonOverview kpis={makeKpis({ totalCo2eKg: 2500 })} />)
    // 2500kg = 2.5t
    expect(screen.getByText('2.5t')).toBeInTheDocument()
  })

  it('displays formatted cost value', () => {
    render(<CarbonOverview kpis={makeKpis({ totalCostUsd: 850 })} />)
    expect(screen.getByText('$850')).toBeInTheDocument()
  })

  it('displays energy use with locale formatting', () => {
    render(<CarbonOverview kpis={makeKpis({ totalKwh: 6250 })} />)
    expect(screen.getByText('6,250')).toBeInTheDocument()
  })

  it('displays potential savings in CO2e and cost', () => {
    render(<CarbonOverview kpis={makeKpis({ potentialSavingsKg: 500, potentialSavingsUsd: 180 })} />)
    expect(screen.getByText('500kg')).toBeInTheDocument()
    expect(screen.getByText('$180/yr saveable')).toBeInTheDocument()
  })

  it('shows correct subtitles', () => {
    render(<CarbonOverview kpis={makeKpis()} />)
    expect(screen.getByText('CO₂e per year')).toBeInTheDocument()
    expect(screen.getByText('Electricity per year')).toBeInTheDocument()
    expect(screen.getByText('kWh per year')).toBeInTheDocument()
  })

  it('renders small values correctly', () => {
    render(<CarbonOverview kpis={makeKpis({ totalCo2eKg: 50, totalKwh: 100 })} />)
    // formatCo2e(50) returns "50.0kg"
    expect(screen.getByText('50.0kg')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('renders zero values', () => {
    render(
      <CarbonOverview
        kpis={makeKpis({
          totalCo2eKg: 0,
          totalCostUsd: 0,
          totalKwh: 0,
          potentialSavingsKg: 0,
          potentialSavingsUsd: 0,
        })}
      />,
    )
    // formatCo2e(0) returns "0.0kg" - appears in Annual Carbon AND Potential Savings
    const zeroKgElements = screen.getAllByText('0.0kg')
    expect(zeroKgElements.length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('$0')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
