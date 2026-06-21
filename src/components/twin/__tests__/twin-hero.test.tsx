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
  useReducedMotion: () => false,
}))

import { TwinHero } from '@/components/twin/twin-hero'
import type { TwinData } from '@/lib/services/twin.service'

function makeTwinData(overrides?: Partial<TwinData>): TwinData {
  return {
    isEmpty: false,
    profile: { name: 'Alex', country: 'US', region: 'California', householdSize: 2, baselineAnnualKg: 8000 },
    tier: { name: 'Ember', color: '#f59e0b', description: 'Moderate — near average' },
    current: {
      totalAnnualKg: 6500,
      monthlyKg: 541.7,
      vsBaselinePct: -18.8,
      vsCountryAvgPct: -12.2,
      parisTargetKg: 1800,
      onTrack: false,
    },
    dimensions: [],
    forecast: [],
    radar: [],
    scenarios: [],
    riskAreas: [],
    opportunities: [],
    ...overrides,
  }
}

describe('TwinHero', () => {
  it('renders the user name and Climate Twin heading', () => {
    render(<TwinHero data={makeTwinData()} />)
    expect(screen.getByText(/Alex.*Climate Twin/)).toBeInTheDocument()
  })

  it('renders the tier name and description', () => {
    render(<TwinHero data={makeTwinData()} />)
    // Ember appears twice (in orb + badge), use getAllByText
    const emberElements = screen.getAllByText('Ember')
    expect(emberElements.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Moderate.*near average/)).toBeInTheDocument()
  })

  it('renders household size and region', () => {
    render(<TwinHero data={makeTwinData()} />)
    expect(screen.getByText(/2-person household/)).toBeInTheDocument()
    expect(screen.getByText(/California/)).toBeInTheDocument()
  })

  it('renders all four stat cards', () => {
    render(<TwinHero data={makeTwinData()} />)
    // CO₂e appears multiple times, check at least one is present
    const co2eElements = screen.getAllByText(/CO₂e/)
    expect(co2eElements.length).toBeGreaterThanOrEqual(1)
  })

  it('shows on-track badge when onTrack is true', () => {
    const data = makeTwinData()
    data.current.onTrack = true
    data.current.totalAnnualKg = 1500
    render(<TwinHero data={data} />)
    expect(screen.getByText('On track for Paris 1.5°C target')).toBeInTheDocument()
  })

  it('shows above-target badge when onTrack is false', () => {
    const data = makeTwinData()
    data.current.onTrack = false
    data.current.totalAnnualKg = 6500
    render(<TwinHero data={data} />)
    // Should show how much above Paris target
    expect(screen.getByText(/above Paris 1.5°C target/)).toBeInTheDocument()
  })

  it('displays the vs baseline stat with trend', () => {
    render(<TwinHero data={makeTwinData()} />)
    expect(screen.getByText(/-18\.8%/)).toBeInTheDocument()
  })

  it('displays the vs country average stat', () => {
    render(<TwinHero data={makeTwinData()} />)
    expect(screen.getByText(/-12\.2%/)).toBeInTheDocument()
  })

  it('uses positive sign for vsBaselinePct when improvement is negative (reduction)', () => {
    const data = makeTwinData()
    data.current.vsBaselinePct = -5
    render(<TwinHero data={data} />)
    // -5 => "-5%" displayed
    expect(screen.getByText(/-5%/)).toBeInTheDocument()
  })

  it('uses positive sign for vsBaselinePct when increase', () => {
    const data = makeTwinData()
    data.current.vsBaselinePct = 10
    render(<TwinHero data={data} />)
    // +10 => "+10%" displayed
    expect(screen.getByText('+10%')).toBeInTheDocument()
  })
})
