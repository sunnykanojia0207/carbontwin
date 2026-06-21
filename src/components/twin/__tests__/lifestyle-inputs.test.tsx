/// <reference types="vitest/globals" />
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { LifestyleInputs } from '@/components/twin/lifestyle-inputs'
import type { TwinData } from '@/lib/services/twin.service'

function makeDimensions(): TwinData['dimensions'] {
  return [
    { key: 'home', label: 'Home', annualKg: 2275, share: 35, color: '#f59e0b', icon: 'Home', detail: '2-person household · California grid' },
    { key: 'appliances', label: 'Appliances', annualKg: 1365, share: 21, color: '#8b5cf6', icon: 'Zap', detail: '8 appliances tracked' },
    { key: 'transport', label: 'Transport', annualKg: 975, share: 15, color: '#0ea5e9', icon: 'Car', detail: '5 trips logged (30d)' },
    { key: 'lifestyle', label: 'Lifestyle', annualKg: 650, share: 10, color: '#ec4899', icon: 'ShoppingBag', detail: 'Shopping + digital footprint' },
    { key: 'diet', label: 'Diet', annualKg: 325, share: 5, color: '#10b981', icon: 'UtensilsCrossed', detail: 'Food & beverage emissions' },
  ]
}

describe('LifestyleInputs', () => {
  it('renders the section title and subtitle', () => {
    render(<LifestyleInputs dimensions={makeDimensions()} />)
    expect(screen.getByText('Lifestyle Inputs')).toBeInTheDocument()
    expect(screen.getByText('The 5 dimensions shaping your Climate Twin')).toBeInTheDocument()
  })

  it('renders all five dimension labels', () => {
    render(<LifestyleInputs dimensions={makeDimensions()} />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Appliances')).toBeInTheDocument()
    expect(screen.getByText('Transport')).toBeInTheDocument()
    expect(screen.getByText('Lifestyle')).toBeInTheDocument()
    expect(screen.getByText('Diet')).toBeInTheDocument()
  })

  it('displays formatted CO2e for each dimension', () => {
    render(<LifestyleInputs dimensions={makeDimensions()} />)
    expect(screen.getByText('2.3t')).toBeInTheDocument()
    expect(screen.getByText('1.4t')).toBeInTheDocument()
  })

  it('displays share percentages', () => {
    render(<LifestyleInputs dimensions={makeDimensions()} />)
    expect(screen.getByText('35%')).toBeInTheDocument()
    expect(screen.getByText('21%')).toBeInTheDocument()
    expect(screen.getByText('15%')).toBeInTheDocument()
    expect(screen.getByText('10%')).toBeInTheDocument()
    expect(screen.getByText('5%')).toBeInTheDocument()
  })

  it('displays dimension detail text', () => {
    render(<LifestyleInputs dimensions={makeDimensions()} />)
    expect(screen.getByText(/2-person household/)).toBeInTheDocument()
    expect(screen.getByText(/8 appliances tracked/)).toBeInTheDocument()
    expect(screen.getByText(/Shopping \+ digital footprint/)).toBeInTheDocument()
  })

  it('handles empty dimensions gracefully', () => {
    render(<LifestyleInputs dimensions={[]} />)
    expect(screen.getByText('Lifestyle Inputs')).toBeInTheDocument()
  })

  it('falls back to Home icon for unknown icon names', () => {
    const dims = makeDimensions()
    dims[0] = { ...dims[0], icon: 'NonExistent' as 'Home' }
    render(<LifestyleInputs dimensions={dims} />)
    // Should still render without error, using the Home icon as fallback
    expect(screen.getByText('Home')).toBeInTheDocument()
  })
})
