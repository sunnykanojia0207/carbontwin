/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial: _i, animate: _a, transition: _t, ...rest } = props
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

import { ActionPlanCard } from '@/components/negotiator/action-plan-card'
import type { ActionPlan } from '@/lib/ai/negotiator-prompt'

const makePlan = (overrides: Partial<ActionPlan> = {}): ActionPlan => ({
  title: 'Switch to LED bulbs',
  description: 'Replace all incandescent bulbs with energy-efficient LEDs',
  co2ReductionKg: 150,
  difficulty: 'EASY',
  costUsd: 30,
  timeRequired: 'One-time, 1 hour',
  category: 'home',
  ...overrides,
})

describe('ActionPlanCard', () => {
  it('renders plan title and description', () => {
    render(<ActionPlanCard plan={makePlan()} />)
    expect(screen.getByText('Switch to LED bulbs')).toBeInTheDocument()
    expect(
      screen.getByText('Replace all incandescent bulbs with energy-efficient LEDs'),
    ).toBeInTheDocument()
  })

  it('renders stat cells for reduction, cost, time, and difficulty', () => {
    render(<ActionPlanCard plan={makePlan()} />)
    expect(screen.getByText('Reduction')).toBeInTheDocument()
    expect(screen.getByText('Cost')).toBeInTheDocument()
    expect(screen.getByText('Time')).toBeInTheDocument()
    expect(screen.getByText('Difficulty')).toBeInTheDocument()
  })

  it('displays formatted CO2 reduction', () => {
    render(<ActionPlanCard plan={makePlan({ co2ReductionKg: 150 })} />)
    expect(screen.getByText('−150kg')).toBeInTheDocument()
  })

  it('displays formatted cost', () => {
    render(<ActionPlanCard plan={makePlan({ costUsd: 30 })} />)
    expect(screen.getByText('$30')).toBeInTheDocument()
  })

  it('displays "Free" when cost is 0', () => {
    render(<ActionPlanCard plan={makePlan({ costUsd: 0 })} />)
    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('displays difficulty badge', () => {
    render(<ActionPlanCard plan={makePlan({ difficulty: 'EASY' })} />)
    expect(screen.getByText('EASY')).toBeInTheDocument()
  })

  it('displays difficulty as text in stat cell', () => {
    render(<ActionPlanCard plan={makePlan({ difficulty: 'EASY' })} />)
    expect(screen.getByText('Quick win')).toBeInTheDocument()
  })

  it('displays MEDIUM difficulty as "Moderate"', () => {
    render(<ActionPlanCard plan={makePlan({ difficulty: 'MEDIUM' })} />)
    expect(screen.getByText('Moderate')).toBeInTheDocument()
  })

  it('displays HARD difficulty as "High effort"', () => {
    render(<ActionPlanCard plan={makePlan({ difficulty: 'HARD' })} />)
    expect(screen.getByText('High effort')).toBeInTheDocument()
  })

  it('shows accept button when onAccept is provided', () => {
    render(<ActionPlanCard plan={makePlan()} onAccept={vi.fn()} />)
    expect(screen.getByText('Accept this plan')).toBeInTheDocument()
  })

  it('does not show accept button when onAccept is not provided', () => {
    render(<ActionPlanCard plan={makePlan()} />)
    expect(screen.queryByText('Accept this plan')).not.toBeInTheDocument()
  })

  it('calls onAccept when accept button is clicked', async () => {
    const user = userEvent.setup()
    const onAccept = vi.fn()
    render(<ActionPlanCard plan={makePlan()} onAccept={onAccept} />)
    await user.click(screen.getByText('Accept this plan'))
    expect(onAccept).toHaveBeenCalledTimes(1)
    expect(onAccept).toHaveBeenCalledWith(expect.objectContaining({ title: 'Switch to LED bulbs' }))
  })

  it('shows "Accepted!" state after clicking accept', async () => {
    const user = userEvent.setup()
    render(<ActionPlanCard plan={makePlan()} onAccept={vi.fn()} />)
    await user.click(screen.getByText('Accept this plan'))
    expect(screen.getByText('Accepted!')).toBeInTheDocument()
  })

  it('renders category in the difficulty stat subtitle', () => {
    render(<ActionPlanCard plan={makePlan({ category: 'home' })} />)
    expect(screen.getByText('home')).toBeInTheDocument()
  })

  it('renders time info from timeRequired', () => {
    render(
      <ActionPlanCard plan={makePlan({ timeRequired: 'One-time, 2 hours' })} />,
    )
    expect(screen.getByText('One-time')).toBeInTheDocument()
  })

  it('applies correct accent bar color for home category', () => {
    const { container } = render(
      <ActionPlanCard plan={makePlan({ category: 'home' })} />,
    )
    const accentBar = container.querySelector('.h-0\\.5.w-full') ?? container.querySelector('[class*="h-0"][class*="w-full"]')
    expect(accentBar).toBeInTheDocument()
  })

  it('does not crash with empty description', () => {
    render(<ActionPlanCard plan={makePlan({ description: '' })} />)
    expect(screen.getByText('Switch to LED bulbs')).toBeInTheDocument()
  })
})
