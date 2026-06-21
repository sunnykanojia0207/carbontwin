/// <reference types="vitest/globals" />
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial: _i, animate: _a, transition: _t, ...rest } = props
      return <button {...rest}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

import { SuggestedPrompts } from '@/components/negotiator/suggested-prompts'

describe('SuggestedPrompts', () => {
  it('renders all 4 prompt cards', () => {
    render(<SuggestedPrompts onPromptClick={vi.fn()} />)
    expect(screen.getByText('Transport')).toBeInTheDocument()
    expect(screen.getByText('Home energy')).toBeInTheDocument()
    expect(screen.getByText('Diet')).toBeInTheDocument()
    expect(screen.getByText('Travel')).toBeInTheDocument()
  })

  it('each prompt shows its description text', () => {
    render(<SuggestedPrompts onPromptClick={vi.fn()} />)
    expect(
      screen.getByText(/How can I reduce my transport footprint/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/What's the cheapest way to cut my home energy/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/I want to eat more sustainably/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/I fly a lot for work/),
    ).toBeInTheDocument()
  })

  it('calls onPromptClick with prompt text when clicked', async () => {
    const user = userEvent.setup()
    const onPromptClick = vi.fn()
    render(<SuggestedPrompts onPromptClick={onPromptClick} />)

    await user.click(screen.getByText(/How can I reduce my transport footprint/))
    expect(onPromptClick).toHaveBeenCalledWith(
      'How can I reduce my transport footprint without giving up my car?',
    )
  })

  it('calls onPromptClick for each prompt type', async () => {
    const user = userEvent.setup()
    const onPromptClick = vi.fn()
    render(<SuggestedPrompts onPromptClick={onPromptClick} />)

    await user.click(screen.getByText(/What's the cheapest way/))
    expect(onPromptClick).toHaveBeenCalledWith(
      expect.stringContaining("What's the cheapest way"),
    )

    await user.click(screen.getByText(/I want to eat more sustainably/))
    expect(onPromptClick).toHaveBeenCalledWith(
      expect.stringContaining('I want to eat more sustainably'),
    )

    await user.click(screen.getByText(/I fly a lot for work/))
    expect(onPromptClick).toHaveBeenCalledWith(
      expect.stringContaining('I fly a lot for work'),
    )
  })

  it('accepts className prop', () => {
    const { container } = render(
      <SuggestedPrompts onPromptClick={vi.fn()} className="extra-class" />,
    )
    const grid = container.firstChild as HTMLElement
    expect(grid.className).toContain('extra-class')
  })

  it('applies grid layout classes', () => {
    const { container } = render(<SuggestedPrompts onPromptClick={vi.fn()} />)
    const grid = container.firstChild as HTMLElement
    expect(grid.className).toContain('grid')
  })
})
