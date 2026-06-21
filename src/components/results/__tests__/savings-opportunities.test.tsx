/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) =>
    <a href={href} {...props}>{children}</a>,
}))

import { SavingsOpportunities } from '@/components/results/savings-opportunities'
import type { ResultsData } from '@/lib/services/results.service'

const mockOpportunities: ResultsData['savingsOpportunities'] = [
  {
    applianceName: 'HVAC',
    applianceType: 'HVAC',
    title: 'Upgrade to smart thermostat',
    description: 'Replace manual thermostat with a programmable smart thermostat',
    difficulty: 'EASY',
    co2eKgPerYear: 200,
    usdPerYear: 45,
  },
  {
    applianceName: 'Refrigerator',
    applianceType: 'REFRIGERATION',
    title: 'Replace old refrigerator',
    description: 'Upgrade to an Energy Star certified refrigerator',
    difficulty: 'MEDIUM',
    co2eKgPerYear: 150,
    usdPerYear: 60,
  },
  {
    applianceName: 'Water Heater',
    applianceType: 'WATER_HEATING',
    title: 'Insulate water heater',
    description: 'Add insulation blanket to water heater',
    difficulty: 'HARD',
    co2eKgPerYear: 80,
    usdPerYear: 25,
  },
]

describe('SavingsOpportunities', () => {
  it('renders title and subtitle', () => {
    render(<SavingsOpportunities opportunities={mockOpportunities} />)
    expect(screen.getByText('Savings Opportunities')).toBeInTheDocument()
    expect(screen.getByText('Top actions to reduce your footprint')).toBeInTheDocument()
  })

  it('renders all opportunity titles', () => {
    render(<SavingsOpportunities opportunities={mockOpportunities} />)
    expect(screen.getByText('Upgrade to smart thermostat')).toBeInTheDocument()
    expect(screen.getByText('Replace old refrigerator')).toBeInTheDocument()
    expect(screen.getByText('Insulate water heater')).toBeInTheDocument()
  })

  it('renders difficulty badges', () => {
    render(<SavingsOpportunities opportunities={mockOpportunities} />)
    expect(screen.getByText('EASY')).toBeInTheDocument()
    expect(screen.getByText('MEDIUM')).toBeInTheDocument()
    expect(screen.getByText('HARD')).toBeInTheDocument()
  })

  it('displays savings values', () => {
    render(<SavingsOpportunities opportunities={mockOpportunities} />)
    // 200kg
    expect(screen.getByText('−200kg')).toBeInTheDocument()
    expect(screen.getByText('+$45/yr')).toBeInTheDocument()
  })

  it('shows appliance name in description', () => {
    render(<SavingsOpportunities opportunities={mockOpportunities} />)
    expect(screen.getByText(/For your hvac/)).toBeInTheDocument()
    expect(screen.getByText(/For your refrigerator/)).toBeInTheDocument()
  })

  it('shows empty state when no opportunities', () => {
    render(<SavingsOpportunities opportunities={[]} />)
    expect(
      screen.getByText('No opportunities detected yet.'),
    ).toBeInTheDocument()
  })

  it('has a link to simulator', () => {
    render(<SavingsOpportunities opportunities={mockOpportunities} />)
    const simulatorLink = screen.getByText('Simulate')
    expect(simulatorLink).toBeInTheDocument()
    expect(simulatorLink.closest('a')).toHaveAttribute('href', '/simulator')
  })

  it('renders description text for each opportunity', () => {
    render(<SavingsOpportunities opportunities={mockOpportunities} />)
    expect(
      screen.getByText('Replace manual thermostat with a programmable smart thermostat'),
    ).toBeInTheDocument()
  })
})
