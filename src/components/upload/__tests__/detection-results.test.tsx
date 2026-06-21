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

import { DetectionResults } from '@/components/upload/detection-results'

const mockResult = {
  scanId: 'scan-123',
  roomType: 'Living Room',
  summary: 'Found 3 appliances in the living room.',
  totalAnnualCo2eKg: 4076.8,
  appliances: [
    {
      name: 'HVAC Unit',
      type: 'HVAC',
      estimatedWatts: 3500,
      estimatedHoursPerDay: 8,
      confidence: 0.95,
      notes: 'Central AC system',
      carbon: { annualKwh: 10192, annualCo2eKg: 4076.8, monthlyCo2eKg: 339.7, dailyCo2eKg: 11.17 },
    },
    {
      name: 'LED TV',
      type: 'ELECTRONICS',
      estimatedWatts: 120,
      estimatedHoursPerDay: 4,
      confidence: 0.82,
      notes: '',
      carbon: { annualKwh: 249.6, annualCo2eKg: 99.8, monthlyCo2eKg: 8.3, dailyCo2eKg: 0.27 },
    },
    {
      name: 'Ceiling Fan',
      type: 'OTHER',
      estimatedWatts: 75,
      estimatedHoursPerDay: 6,
      confidence: 0.65,
      notes: 'Unknown brand',
      carbon: { annualKwh: 234, annualCo2eKg: 93.6, monthlyCo2eKg: 7.8, dailyCo2eKg: 0.26 },
    },
  ],
}

describe('DetectionResults', () => {
  it('renders room type', () => {
    render(<DetectionResults result={mockResult} />)
    expect(screen.getByText('Living Room')).toBeInTheDocument()
  })

  it('renders summary text', () => {
    render(<DetectionResults result={mockResult} />)
    expect(screen.getByText('Found 3 appliances in the living room.')).toBeInTheDocument()
  })

  it('displays total annual impact', () => {
    render(<DetectionResults result={mockResult} />)
    // 4.1t appears twice (summary + appliance), use getAllByText
    const impactElements = screen.getAllByText('4.1t')
    expect(impactElements.length).toBeGreaterThanOrEqual(1)
  })

  it('shows appliance count', () => {
    render(<DetectionResults result={mockResult} />)
    expect(screen.getByText('3 appliances detected')).toBeInTheDocument()
  })

  it('renders all appliance names', () => {
    render(<DetectionResults result={mockResult} />)
    expect(screen.getByText('HVAC Unit')).toBeInTheDocument()
    expect(screen.getByText('LED TV')).toBeInTheDocument()
    expect(screen.getByText('Ceiling Fan')).toBeInTheDocument()
  })

  it('displays appliance wattage and hours', () => {
    render(<DetectionResults result={mockResult} />)
    expect(screen.getByText('3500W')).toBeInTheDocument()
    expect(screen.getByText('8h/day')).toBeInTheDocument()
  })

  it('displays appliance type badges', () => {
    render(<DetectionResults result={mockResult} />)
    expect(screen.getByText('HVAC')).toBeInTheDocument()
    expect(screen.getByText('ELECTRONICS')).toBeInTheDocument()
    expect(screen.getByText('OTHER')).toBeInTheDocument()
  })

  it('shows notes when present', () => {
    render(<DetectionResults result={mockResult} />)
    expect(screen.getByText('Central AC system')).toBeInTheDocument()
  })

  it('shows confidence labels', () => {
    render(<DetectionResults result={mockResult} />)
    // 0.95 → High, 0.82 → Medium (0.65 <= c < 0.85), 0.65 → Medium
    expect(screen.getByText('High')).toBeInTheDocument()
    const mediumElements = screen.getAllByText('Medium')
    expect(mediumElements.length).toBe(2)
  })

  it('renders with single appliance using singular label', () => {
    const singleResult = { ...mockResult, appliances: [mockResult.appliances[0]] }
    render(<DetectionResults result={singleResult} />)
    expect(screen.getByText('1 appliance detected')).toBeInTheDocument()
  })

  it('renders with no appliances', () => {
    const emptyResult = { ...mockResult, appliances: [], totalAnnualCo2eKg: 0 }
    render(<DetectionResults result={emptyResult} />)
    expect(screen.getByText('0 appliances detected')).toBeInTheDocument()
  })
})
