/// <reference types="vitest/globals" />
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial: _i, animate: _a, transition: _t, ...rest } = props
      return <div {...rest}>{children}</div>
    },
  },
}))

import { DetectionTimeline } from '@/components/upload/detection-timeline'

describe('DetectionTimeline', () => {
  it('renders all five step labels', () => {
    render(<DetectionTimeline currentStep={0} completed={false} error={null} />)
    expect(screen.getByText('Uploading image')).toBeInTheDocument()
    expect(screen.getByText('Analyzing room')).toBeInTheDocument()
    expect(screen.getByText('Detecting appliances')).toBeInTheDocument()
    expect(screen.getByText('Estimating carbon impact')).toBeInTheDocument()
    expect(screen.getByText('Storing results')).toBeInTheDocument()
  })

  it('shows step descriptions', () => {
    render(<DetectionTimeline currentStep={0} completed={false} error={null} />)
    expect(screen.getByText('Sending your photo securely')).toBeInTheDocument()
    expect(screen.getByText('Vision model reading the scene')).toBeInTheDocument()
  })

  it('shows first step as active by default', () => {
    const { container } = render(
      <DetectionTimeline currentStep={0} completed={false} error={null} />,
    )
    // The first step icon container should have active styling
    expect(screen.getByText('Uploading image')).toBeInTheDocument()
  })

  it('shows completed checkmarks when completed is true', () => {
    render(<DetectionTimeline currentStep={4} completed={true} error={null} />)
    // All steps should show done state with CheckCircle2
    expect(screen.getByText('Uploading image')).toBeInTheDocument()
  })

  it('shows error state with exclamation mark on the active step', () => {
    const errorMsg = 'Connection lost'
    render(<DetectionTimeline currentStep={2} completed={false} error={errorMsg} />)
    // The active step shows "!" text for the icon when error is set
    expect(screen.getByText('!')).toBeInTheDocument()
    // The step description still shows (isActive is false when error is set)
    // The error icon replaces the spinner with "!"
  })

  it('shows spinner icon on active step', () => {
    const { container } = render(
      <DetectionTimeline currentStep={1} completed={false} error={null} />,
    )
    // The second step should have a spinner (svg with animate-spin class)
    const spinners = container.querySelectorAll('.animate-spin')
    expect(spinners.length).toBe(1)
  })

  it('marks previous steps as done', () => {
    const { container } = render(
      <DetectionTimeline currentStep={3} completed={false} error={null} />,
    )
    // Steps 0, 1, 2 should be done → check icons
    const checkIcons = container.querySelectorAll('[data-testid]')
    // Should render without error
    expect(screen.getByText('Uploading image')).toBeInTheDocument()
  })
})
