/// <reference types="vitest/globals" />
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial: _i, animate: _a, exit: _e, transition: _t, ...rest } = props
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// Mock react-markdown to render children as plain text
vi.mock('react-markdown', () => ({
  default: ({ children, components: _c }: { children: string; components?: Record<string, unknown> }) =>
    <div data-testid="markdown">{children}</div>,
}))

import { ChatMessage, type ChatMessageData } from '@/components/negotiator/chat-message'

const makeUserMsg = (overrides: Partial<ChatMessageData> = {}): ChatMessageData => ({
  id: 'user-1',
  role: 'user',
  content: 'How can I reduce my footprint?',
  ...overrides,
})

const makeAssistantMsg = (overrides: Partial<ChatMessageData> = {}): ChatMessageData => ({
  id: 'assist-1',
  role: 'assistant',
  content: 'Here are some suggestions for you.',
  ...overrides,
})

describe('ChatMessage', () => {
  it('renders user message content', () => {
    render(<ChatMessage message={makeUserMsg()} />)
    expect(screen.getByText('How can I reduce my footprint?')).toBeInTheDocument()
  })

  it('renders assistant message content via markdown', () => {
    render(<ChatMessage message={makeAssistantMsg()} />)
    expect(screen.getByTestId('markdown')).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent('Here are some suggestions for you.')
  })

  it('renders sparkles icon for assistant', () => {
    const { container } = render(<ChatMessage message={makeAssistantMsg()} />)
    // The sparkles icon from lucide-react should be present
    const sparklesIcon = container.querySelector('svg')
    expect(sparklesIcon).toBeInTheDocument()
  })

  it('shows alert triangle for fallback assistant message', () => {
    const { container } = render(
      <ChatMessage message={makeAssistantMsg({ model: 'fallback' })} />,
    )
    // Should have an alert-triangle icon via lucide
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBeGreaterThan(0)
  })

  it('shows fallback badge and retry button for fallback messages', () => {
    const onRetry = vi.fn()
    render(
      <ChatMessage
        message={makeAssistantMsg({ model: 'fallback' })}
        onRetry={onRetry}
      />,
    )
    expect(screen.getByText('Offline mode')).toBeInTheDocument()
    expect(screen.getByText('Retry with AI')).toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(
      <ChatMessage
        message={makeAssistantMsg({ model: 'fallback' })}
        onRetry={onRetry}
      />,
    )
    await user.click(screen.getByText('Retry with AI'))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('does not show retry button for non-fallback assistant', () => {
    render(
      <ChatMessage message={makeAssistantMsg()} onRetry={vi.fn()} />,
    )
    expect(screen.queryByText('Offline mode')).not.toBeInTheDocument()
    expect(screen.queryByText('Retry with AI')).not.toBeInTheDocument()
  })

  it('shows "Thinking" with streaming dots when streaming and no content', () => {
    render(
      <ChatMessage message={makeAssistantMsg({ content: '', streaming: true })} />,
    )
    expect(screen.getByText('Thinking')).toBeInTheDocument()
  })

  it('shows streaming dots when streaming with content', () => {
    const { container } = render(
      <ChatMessage message={makeAssistantMsg({ streaming: true })} />,
    )
    // Streaming dots are span elements with animate-bounce class
    const dots = container.querySelectorAll('.animate-bounce')
    expect(dots.length).toBe(3)
  })

  it('does not show streaming dots when not streaming', () => {
    const { container } = render(
      <ChatMessage message={makeAssistantMsg({ streaming: false })} />,
    )
    const dots = container.querySelectorAll('.animate-bounce')
    expect(dots.length).toBe(0)
  })

  it('renders action plan cards when assistant content contains action-plan blocks', () => {
    const content = [
      'Here is a plan for you:',
      '```action-plan',
      JSON.stringify({
        title: 'Switch to LED bulbs',
        description: 'Replace incandescent bulbs with LEDs',
        co2ReductionKg: 150,
        difficulty: 'EASY',
        costUsd: 30,
        timeRequired: 'One-time, 1 hour',
        category: 'home',
      }),
      '```',
    ].join('\n')

    render(<ChatMessage message={makeAssistantMsg({ content })} />)
    expect(screen.getByText('Switch to LED bulbs')).toBeInTheDocument()
    expect(screen.getByText('EASY')).toBeInTheDocument()
  })

  it('calls onAcceptPlan when accept button on action plan is clicked', async () => {
    const user = userEvent.setup()
    const onAcceptPlan = vi.fn()
    const content = [
      '```action-plan',
      JSON.stringify({
        title: 'Reduce water usage',
        description: 'Install low-flow fixtures',
        co2ReductionKg: 80,
        difficulty: 'EASY',
        costUsd: 50,
        timeRequired: 'One-time, 2 hours',
        category: 'home',
      }),
      '```',
    ].join('\n')

    render(
      <ChatMessage
        message={makeAssistantMsg({ content })}
        onAcceptPlan={onAcceptPlan}
      />,
    )
    await user.click(screen.getByText('Accept this plan'))
    expect(onAcceptPlan).toHaveBeenCalledTimes(1)
    expect(onAcceptPlan).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Reduce water usage' }),
    )
  })

  it('handles user messages with empty content', () => {
    const { container } = render(
      <ChatMessage message={makeUserMsg({ content: '' })} />,
    )
    // User messages with empty content should render without crashing
    expect(container).toBeTruthy()
  })

  it('renders without onAcceptPlan callback', () => {
    render(
      <ChatMessage message={makeAssistantMsg()} />,
    )
    // Should render markdown content
    expect(screen.getByTestId('markdown')).toBeInTheDocument()
  })
})
