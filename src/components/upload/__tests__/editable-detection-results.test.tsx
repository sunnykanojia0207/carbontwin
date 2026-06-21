/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial: _i, animate: _a, transition: _t, ...rest } = props
      return <div {...rest}>{children}</div>
    },
  },
}))

import { EditableDetectionResults } from '@/components/upload/editable-detection-results'

const mockResult = {
  scanId: 'scan-123',
  roomType: 'Living Room',
  summary: 'Found appliances in the living room.',
  totalAnnualCo2eKg: 4076.8,
  appliances: [
    {
      name: 'HVAC Unit',
      type: 'HVAC',
      estimatedWatts: 3500,
      estimatedHoursPerDay: 8,
      confidence: 0.95,
      notes: 'Central AC',
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
  ],
}

describe('EditableDetectionResults', () => {
  const onSaved = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders room type and summary', () => {
    render(<EditableDetectionResults result={mockResult} scanId="scan-123" />)
    expect(screen.getByText('Living Room')).toBeInTheDocument()
    expect(screen.getByText('Found appliances in the living room.')).toBeInTheDocument()
  })

  it('shows appliance count', () => {
    render(<EditableDetectionResults result={mockResult} scanId="scan-123" />)
    expect(screen.getByText('2 appliances')).toBeInTheDocument()
  })

  it('shows appliance names in view mode', () => {
    render(<EditableDetectionResults result={mockResult} scanId="scan-123" />)
    expect(screen.getByText('HVAC Unit')).toBeInTheDocument()
    expect(screen.getByText('LED TV')).toBeInTheDocument()
  })

  it('shows Edit button in view mode', () => {
    render(<EditableDetectionResults result={mockResult} scanId="scan-123" />)
    expect(screen.getByText('Edit')).toBeInTheDocument()
  })

  it('switches to edit mode when Edit is clicked', async () => {
    const user = userEvent.setup()
    render(<EditableDetectionResults result={mockResult} scanId="scan-123" />)
    await user.click(screen.getByText('Edit'))
    // Should show Save and Cancel buttons
    expect(screen.getByText('Save')).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('shows input fields in edit mode', async () => {
    const user = userEvent.setup()
    render(<EditableDetectionResults result={mockResult} scanId="scan-123" />)
    await user.click(screen.getByText('Edit'))
    // Should have text inputs for names
    const textInputs = screen.getAllByRole('textbox')
    expect(textInputs.length).toBe(2)
    expect(textInputs[0]).toHaveValue('HVAC Unit')
  })

  it('shows type dropdowns in edit mode', async () => {
    const user = userEvent.setup()
    render(<EditableDetectionResults result={mockResult} scanId="scan-123" />)
    await user.click(screen.getByText('Edit'))
    // Should have select elements
    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBe(2)
  })

  it('shows delete buttons in edit mode', async () => {
    const user = userEvent.setup()
    render(<EditableDetectionResults result={mockResult} scanId="scan-123" />)
    await user.click(screen.getByText('Edit'))
    const deleteButtons = screen.getAllByLabelText('Delete appliance')
    expect(deleteButtons.length).toBe(2)
  })

  it('can delete an appliance in edit mode', async () => {
    const user = userEvent.setup()
    render(<EditableDetectionResults result={mockResult} scanId="scan-123" />)
    await user.click(screen.getByText('Edit'))
    await user.click(screen.getAllByLabelText('Delete appliance')[0])
    // Should now show 1 appliance
    expect(screen.getByText('1 appliance')).toBeInTheDocument()
  })

  it('shows Add appliance button in edit mode', async () => {
    const user = userEvent.setup()
    render(<EditableDetectionResults result={mockResult} scanId="scan-123" />)
    await user.click(screen.getByText('Edit'))
    expect(screen.getByText('Add appliance')).toBeInTheDocument()
  })

  it('can add a new appliance in edit mode', async () => {
    const user = userEvent.setup()
    render(<EditableDetectionResults result={mockResult} scanId="scan-123" />)
    await user.click(screen.getByText('Edit'))
    await user.click(screen.getByText('Add appliance'))
    // Should now show 3 appliances
    expect(screen.getByText('3 appliances')).toBeInTheDocument()
  })

  it('shows empty state when all appliances deleted in edit mode', async () => {
    const user = userEvent.setup()
    render(<EditableDetectionResults result={mockResult} scanId="scan-123" />)
    await user.click(screen.getByText('Edit'))
    const deleteButtons = screen.getAllByLabelText('Delete appliance')
    // Delete both appliances
    await user.click(deleteButtons[0])
    await user.click(deleteButtons[1])
    // Should show empty state
    expect(screen.getByText('No appliances yet')).toBeInTheDocument()
    expect(screen.getByText('Add your first appliance')).toBeInTheDocument()
  })

  it('cancels editing and restores original items', async () => {
    const user = userEvent.setup()
    render(<EditableDetectionResults result={mockResult} scanId="scan-123" />)
    await user.click(screen.getByText('Edit'))
    // Delete an appliance
    await user.click(screen.getAllByLabelText('Delete appliance')[0])
    expect(screen.getByText('1 appliance')).toBeInTheDocument()
    // Cancel
    await user.click(screen.getByText('Cancel'))
    // Should restore to original 2
    expect(screen.getByText('2 appliances')).toBeInTheDocument()
    // Should be back in view mode
    expect(screen.getByText('Edit')).toBeInTheDocument()
  })

  it('disables Save button when no appliances', async () => {
    const user = userEvent.setup()
    render(<EditableDetectionResults result={mockResult} scanId="scan-123" />)
    await user.click(screen.getByText('Edit'))
    // Delete all
    await user.click(screen.getAllByLabelText('Delete appliance')[0])
    await user.click(screen.getAllByLabelText('Delete appliance')[0])
    // Save should be disabled
    expect(screen.getByText('Save')).toBeDisabled()
  })

  it('displays computed total carbon', () => {
    render(<EditableDetectionResults result={mockResult} scanId="scan-123" />)
    // Total should be displayed
    expect(screen.getByText(/CO₂e \/ year/)).toBeInTheDocument()
  })

  it('calls onSaved after successful save', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response)

    const user = userEvent.setup()
    render(
      <EditableDetectionResults
        result={mockResult}
        scanId="scan-123"
        onSaved={onSaved}
      />,
    )
    await user.click(screen.getByText('Edit'))
    await user.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledTimes(1)
    })

    vi.restoreAllMocks()
  })

  it('shows error on failed save', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))

    const user = userEvent.setup()
    render(
      <EditableDetectionResults
        result={mockResult}
        scanId="scan-123"
        onSaved={onSaved}
      />,
    )
    await user.click(screen.getByText('Edit'))
    await user.click(screen.getByText('Save'))

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })

    vi.restoreAllMocks()
  })

  it('displays single appliance with singular label', () => {
    const singleResult = { ...mockResult, appliances: [mockResult.appliances[0]] }
    render(<EditableDetectionResults result={singleResult} scanId="scan-123" />)
    expect(screen.getByText('1 appliance')).toBeInTheDocument()
  })
})
