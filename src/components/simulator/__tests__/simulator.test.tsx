/// <reference types="vitest/globals" />
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// ============================================================================
// Simulator component tests
// ============================================================================

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/simulator',
}))

describe('Scenario Cards', () => {
  it('renders scenario cards with title and savings', async () => {
    const { ScenarioCards } = await import('@/components/simulator/scenario-cards')
    const scenarios = [
      {
        key: 'led' as const,
        title: 'Upgrade All Lighting to LED',
        shortTitle: 'LED Upgrade',
        description: 'Replace all bulbs with LEDs',
        icon: 'Lightbulb',
        color: '#eab308',
        category: 'appliances',
        reductionPct: 0.2,
        upfrontCostUsd: 200,
        annualSavingsUsd: 180,
        implementationTime: '1 day',
        difficulty: 'EASY' as const,
      },
      {
        key: 'solar' as const,
        title: 'Install Solar Panels',
        shortTitle: 'Solar Panels',
        description: 'Install 3kW solar',
        icon: 'Sun',
        color: '#f59e0b',
        category: 'home',
        reductionPct: 0.75,
        upfrontCostUsd: 12000,
        annualSavingsUsd: 1400,
        implementationTime: '2-4 months',
        difficulty: 'HARD' as const,
      },
    ]
    render(<ScenarioCards scenarios={scenarios} active={['led']} onToggle={vi.fn()} />)
    expect(screen.getByText('LED Upgrade')).toBeInTheDocument()
    expect(screen.getByText('Solar Panels')).toBeInTheDocument()
  })
})

describe('Simulation Summary', () => {
  it('renders total reduction', async () => {
    const { SimulationSummary } = await import('@/components/simulator/simulation-summary')
    render(
      <SimulationSummary
        result={{
          beforeKg: 2500,
          afterKg: 2000,
          totalCarbonSavedKg: 500,
          totalCostSavedUsd: 1800,
          totalUpfrontUsd: 200,
          blendedPaybackYears: 0.1,
          reductionPct: 20,
          perScenario: [],
          timeline: [],
          comparison: [],
        }}
      />,
    )
    expect(screen.getByText(/500/)).toBeInTheDocument()
  })
})

describe('Before After Chart', () => {
  it('renders without crashing', async () => {
    const { BeforeAfterChart } = await import('@/components/simulator/before-after-chart')
    const { container } = render(
      <BeforeAfterChart
        data={[
          { label: 'Transport', before: 1200, after: 800, color: '#0ea5e9' },
          { label: 'Home', before: 800, after: 600, color: '#f59e0b' },
        ]}
      />,
    )
    expect(container).toBeTruthy()
  })
})

describe('Savings Timeline', () => {
  it('renders timeline data', async () => {
    const { SavingsTimeline } = await import('@/components/simulator/savings-timeline')
    const data = [
      { year: 2026, kg: 2500 },
      { year: 2027, kg: 2300 },
      { year: 2028, kg: 2100 },
    ]
    const { container } = render(<SavingsTimeline data={data} />)
    expect(container).toBeTruthy()
  })
})
