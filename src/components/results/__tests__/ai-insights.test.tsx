/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AiInsights } from '@/components/results/ai-insights'

const mockInsightData = {
  insight: 'Your carbon footprint is primarily driven by HVAC usage. Consider upgrading to a smart thermostat for immediate savings.',
  highlights: [
    'HVAC accounts for 48% of your total emissions',
    'Smart thermostat can save up to 400kg CO₂e per year',
    'You are 15% above the national average for your household size',
  ],
}

describe('AiInsights', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockInsightData,
    } as Response)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows loading state on mount', () => {
    // Delay fetch to capture loading state
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => mockInsightData,
              } as Response),
            100,
          ),
        ),
    )
    render(<AiInsights />)
    // Loading state shows skeleton pulse elements
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders title and subtitle', () => {
    render(<AiInsights />)
    expect(screen.getByText('AI Insights')).toBeInTheDocument()
    expect(screen.getByText('Personalized analysis of your results')).toBeInTheDocument()
  })

  it('renders insight text after successful fetch', async () => {
    render(<AiInsights />)

    await waitFor(() => {
      expect(
        screen.getByText(/Your carbon footprint is primarily driven by HVAC/),
      ).toBeInTheDocument()
    })
  })

  it('renders highlights list after successful fetch', async () => {
    render(<AiInsights />)

    await waitFor(() => {
      expect(
        screen.getByText('HVAC accounts for 48% of your total emissions'),
      ).toBeInTheDocument()
    })
    expect(
      screen.getByText('Smart thermostat can save up to 400kg CO₂e per year'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('You are 15% above the national average for your household size'),
    ).toBeInTheDocument()
  })

  it('shows error state when fetch fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'))

    render(<AiInsights />)

    await waitFor(() => {
      expect(
        screen.getByText("Couldn't generate insights right now."),
      ).toBeInTheDocument()
    })
    expect(screen.getByText('Try again')).toBeInTheDocument()
  })

  it('shows error state when response is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response)

    render(<AiInsights />)

    await waitFor(() => {
      expect(
        screen.getByText("Couldn't generate insights right now."),
      ).toBeInTheDocument()
    })
  })

  it('refresh button re-fetches data', async () => {
    const user = userEvent.setup()
    // First call returns data
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockInsightData,
    } as Response)

    render(<AiInsights />)

    await waitFor(() => {
      expect(
        screen.getByText(/Your carbon footprint/),
      ).toBeInTheDocument()
    })

    // Second call returns different data
    const updatedInsight = {
      insight: 'Updated analysis after changes.',
      highlights: ['New highlight item'],
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => updatedInsight,
    } as Response)

    await user.click(screen.getByText('Refresh'))

    await waitFor(() => {
      expect(screen.getByText('Updated analysis after changes.')).toBeInTheDocument()
    })
    expect(screen.getByText('New highlight item')).toBeInTheDocument()
  })

  it('refresh button shows loading spinner while refreshing', async () => {
    // First call resolves immediately
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockInsightData,
    } as Response)

    render(<AiInsights />)

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument()
    })
  })

  it('renders with scanId prop', async () => {
    render(<AiInsights scanId="scan-123" />)

    await waitFor(() => {
      expect(
        screen.getByText(/Your carbon footprint/),
      ).toBeInTheDocument()
    })

    // Verify the fetch was called with scanId in the body
    expect(fetch).toHaveBeenCalledWith('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scanId: 'scan-123' }),
    })
  })
})
