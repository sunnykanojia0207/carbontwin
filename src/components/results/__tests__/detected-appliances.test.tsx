/// <reference types="vitest/globals" />
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import { DetectedAppliances } from '@/components/results/detected-appliances'
import type { ResultsData } from '@/lib/services/results.service'

const mockAppliances: ResultsData['appliances'] = [
  {
    id: 'app-1',
    name: 'Central AC',
    type: 'HVAC',
    watts: 3500,
    hoursPerDay: 8,
    daysPerWeek: 7,
    confidence: 0.95,
    notes: 'Main cooling system',
    carbon: { annualKwh: 10192, annualCo2eKg: 4076.8, monthlyCo2eKg: 339.7, dailyCo2eKg: 11.17 },
    cost: { annualUsd: 1528.8, monthlyUsd: 127.4, dailyUsd: 4.19 },
    suggestions: [
      {
        suggestion: { title: 'Upgrade thermostat', description: 'Install a smart thermostat to optimize cooling', difficulty: 'EASY', type: 'thermostat' },
        savings: { co2eKgPerYear: 400, usdPerYear: 150, kwhPerYear: 1000 },
      },
    ],
  },
  {
    id: 'app-2',
    name: 'Kitchen Oven',
    type: 'KITCHEN',
    watts: 2400,
    hoursPerDay: 1.5,
    daysPerWeek: 7,
    confidence: 0.82,
    notes: '',
    carbon: { annualKwh: 1310.4, annualCo2eKg: 524.2, monthlyCo2eKg: 43.7, dailyCo2eKg: 1.44 },
    cost: { annualUsd: 196.6, monthlyUsd: 16.4, dailyUsd: 0.54 },
    suggestions: [
      {
        suggestion: { title: 'Use convection mode', description: 'Convection cooking reduces energy by up to 20%', difficulty: 'EASY', type: 'usage' },
        savings: { co2eKgPerYear: 105, usdPerYear: 39, kwhPerYear: 262 },
      },
    ],
  },
]

describe('DetectedAppliances', () => {
  it('renders title and subtitle with count', () => {
    render(<DetectedAppliances appliances={mockAppliances} />)
    expect(screen.getByText('Detected Appliances')).toBeInTheDocument()
    expect(screen.getByText('2 devices found · click to expand details')).toBeInTheDocument()
  })

  it('renders singular subtitle for 1 appliance', () => {
    render(<DetectedAppliances appliances={[mockAppliances[0]]} />)
    expect(screen.getByText('1 device found · click to expand details')).toBeInTheDocument()
  })

  it('renders appliance names', () => {
    render(<DetectedAppliances appliances={mockAppliances} />)
    expect(screen.getByText('Central AC')).toBeInTheDocument()
    expect(screen.getByText('Kitchen Oven')).toBeInTheDocument()
  })

  it('renders appliance stats (watts, hours, kWh)', () => {
    render(<DetectedAppliances appliances={mockAppliances} />)
    expect(screen.getByText(/3500W/)).toBeInTheDocument()
    expect(screen.getByText(/8h\/day/)).toBeInTheDocument()
    expect(screen.getByText(/10192 kWh\/yr/)).toBeInTheDocument()
  })

  it('renders carbon impact values', () => {
    render(<DetectedAppliances appliances={mockAppliances} />)
    // 4076.8kg = 4.1t
    expect(screen.getByText('4.1t')).toBeInTheDocument()
    // formatCost(1528.8) returns "$1.5k" (since >= 1000)
    expect(screen.getByText('$1.5k')).toBeInTheDocument()
  })

  it('renders accordion sections', () => {
    const { container } = render(<DetectedAppliances appliances={mockAppliances} />)
    // Accordion should render trigger elements
    const accordionTriggers = container.querySelectorAll('[data-radix-collection-item]')
    expect(accordionTriggers.length).toBeGreaterThan(0)
  })

  it('renders accordion trigger for each appliance', () => {
    const { container } = render(<DetectedAppliances appliances={mockAppliances} />)
    // Each appliance renders a trigger button. Radix collection items = triggers.
    const triggers = container.querySelectorAll('[data-radix-collection-item]')
    expect(triggers.length).toBe(2)
  })

  it('renders without crashing', () => {
    const { container } = render(<DetectedAppliances appliances={mockAppliances} />)
    expect(container).toBeTruthy()
  })
})
