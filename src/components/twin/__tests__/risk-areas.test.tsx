/// <reference types="vitest/globals" />
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { RiskAreas } from '@/components/twin/risk-areas'
import type { TwinData } from '@/lib/services/twin.service'

function makeRiskAreas(): TwinData['riskAreas'] {
  return [
    {
      dimension: 'Home',
      label: 'Home is 35% of your footprint',
      annualKg: 2275,
      severity: 'HIGH',
      reason: 'Home energy is a fixed daily draw.',
    },
    {
      dimension: 'Transport',
      label: 'Transport is 22% of your footprint',
      annualKg: 1430,
      severity: 'MEDIUM',
      reason: 'Transport is often the largest single source.',
    },
    {
      dimension: 'Diet',
      label: 'Diet is 10% of your footprint',
      annualKg: 650,
      severity: 'LOW',
      reason: 'Animal-based foods carry high footprint.',
    },
  ]
}

describe('RiskAreas', () => {
  it('renders the section title and subtitle', () => {
    render(<RiskAreas riskAreas={makeRiskAreas()} />)
    expect(screen.getByText('Risk Areas')).toBeInTheDocument()
    expect(screen.getByText('Where your footprint is most concentrated')).toBeInTheDocument()
  })

  it('renders all risk area labels', () => {
    render(<RiskAreas riskAreas={makeRiskAreas()} />)
    expect(screen.getByText('Home is 35% of your footprint')).toBeInTheDocument()
    expect(screen.getByText('Transport is 22% of your footprint')).toBeInTheDocument()
    expect(screen.getByText('Diet is 10% of your footprint')).toBeInTheDocument()
  })

  it('renders severity badges for each risk', () => {
    render(<RiskAreas riskAreas={makeRiskAreas()} />)
    expect(screen.getByText('HIGH')).toBeInTheDocument()
    expect(screen.getByText('MEDIUM')).toBeInTheDocument()
    expect(screen.getByText('LOW')).toBeInTheDocument()
  })

  it('renders reason text for each risk', () => {
    render(<RiskAreas riskAreas={makeRiskAreas()} />)
    expect(screen.getByText('Home energy is a fixed daily draw.')).toBeInTheDocument()
    expect(screen.getByText('Transport is often the largest single source.')).toBeInTheDocument()
    expect(screen.getByText('Animal-based foods carry high footprint.')).toBeInTheDocument()
  })

  it('renders formatted CO2e values', () => {
    render(<RiskAreas riskAreas={makeRiskAreas()} />)
    // 2275 kg → 2.3t, 1430 → 1.4t, 650 → 650kg
    expect(screen.getByText('2.3t')).toBeInTheDocument()
    expect(screen.getByText('1.4t')).toBeInTheDocument()
    expect(screen.getByText('650kg')).toBeInTheDocument()
  })

  it('shows empty state when riskAreas is empty', () => {
    render(<RiskAreas riskAreas={[]} />)
    expect(screen.getByText('No risk areas identified.')).toBeInTheDocument()
  })

  it('renders bar indicators for each risk', () => {
    const { container } = render(<RiskAreas riskAreas={makeRiskAreas()} />)
    // Each risk has a bar div with class containing h-full
    const bars = container.querySelectorAll('.h-full.rounded-full')
    expect(bars.length).toBe(3)
  })
})
