/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial: _i, animate: _a, exit: _e, transition: _t, ...rest } = props
      return <div {...rest}>{children}</div>
    },
    aside: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial: _i, animate: _a, exit: _e, transition: _t, ...rest } = props
      return <aside {...rest}>{children}</aside>
    },
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial: _i, animate: _a, exit: _e, transition: _t, variants: _v, ...rest } = props
      return <button {...rest}>{children}</button>
    },
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial: _i, animate: _a, ...rest } = props
      return <span {...rest}>{children}</span>
    },
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      return <p {...props}>{children}</p>
    },
  },
  LayoutGroup: ({ children }: React.PropsWithChildren) => <>{children}</>,
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

// Mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = vi.fn()

// Mock crypto.randomUUID for jsdom
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2, 10),
    },
    writable: true,
  })
}

import { NegotiatorClient } from '@/components/negotiator/negotiator-client'
import type { ChatMessageData } from '@/components/negotiator/chat-message'

const makeMessage = (overrides: Partial<ChatMessageData> = {}): ChatMessageData => ({
  id: overrides.id ?? 'msg-1',
  role: overrides.role ?? 'user',
  content: overrides.content ?? 'Test message',
  streaming: overrides.streaming,
  model: overrides.model,
})

describe('NegotiatorClient', () => {
  beforeEach(() => {
    // Mock fetch to avoid real API calls
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: [] }),
    } as Response)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders header with title', () => {
    render(<NegotiatorClient />)
    expect(screen.getByText('AI Carbon Negotiator')).toBeInTheDocument()
    expect(screen.getByText('Personalized sustainability advisor')).toBeInTheDocument()
  })

  it('renders empty state when no messages', () => {
    render(<NegotiatorClient />)
    expect(
      screen.getByText("Let's find reductions you'll keep"),
    ).toBeInTheDocument()
  })

  it('renders empty state capability pills', () => {
    render(<NegotiatorClient />)
    // "Transport" appears both in pills and SuggestedPrompts label
    expect(screen.getAllByText('Transport').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Home energy').length).toBeGreaterThanOrEqual(1)
    // "Diet" appears both in pills and SuggestedPrompts
    expect(screen.getAllByText('Diet').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Lifestyle')).toBeInTheDocument()
    // "Travel" appears both in pills and SuggestedPrompts
    expect(screen.getAllByText('Travel').length).toBeGreaterThanOrEqual(1)
  })

  it('renders suggested prompts in empty state', () => {
    render(<NegotiatorClient />)
    expect(screen.getByText('Start with a question')).toBeInTheDocument()
    // At least one of the prompt texts should be visible
    expect(
      screen.getByText(/How can I reduce my transport footprint/),
    ).toBeInTheDocument()
  })

  it('renders messages when initialMessages provided', () => {
    const messages = [
      makeMessage({ id: 'u1', content: 'Hello negotiator' }),
      makeMessage({ id: 'a1', role: 'assistant', content: 'Hi! How can I help?' }),
    ]
    render(<NegotiatorClient initialMessages={messages} />)
    expect(screen.getByText('Hello negotiator')).toBeInTheDocument()
    expect(screen.getByText('Hi! How can I help?')).toBeInTheDocument()
  })

  it('renders chat input when not loading', () => {
    render(<NegotiatorClient />)
    expect(
      screen.getByRole('textbox', { name: /message input/i }),
    ).toBeInTheDocument()
  })

  it('renders sidebar with conversations panel', () => {
    render(<NegotiatorClient />)
    expect(screen.getByText('Conversations')).toBeInTheDocument()
  })

  it('renders new chat button in header', () => {
    render(<NegotiatorClient />)
    expect(screen.getByText('New chat')).toBeInTheDocument()
  })

  it('renders mobile sidebar toggle button', () => {
    render(<NegotiatorClient />)
    expect(
      screen.getByRole('button', { name: /toggle conversations/i }),
    ).toBeInTheDocument()
  })

  it('sends message and shows user message', async () => {
    const user = userEvent.setup()

    // Mock the POST response for sending a message
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"type":"done","conversationId":"conv-1"}\n'))
        controller.close()
      },
    })

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options) => {
      if (options?.method === 'POST') {
        return {
          ok: true,
          body: mockStream,
          json: async () => ({}),
        } as Response
      }
      return {
        ok: true,
        json: async () => ({ ok: true, data: [] }),
      } as Response
    })

    render(<NegotiatorClient />)

    const textarea = screen.getByRole('textbox', { name: /message input/i })
    await user.type(textarea, 'Help me reduce my footprint')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    // After sending, the user message should appear in the chat
    await waitFor(() => {
      expect(screen.getByText('Help me reduce my footprint')).toBeInTheDocument()
    })
  })

  it('shows streaming message after sending', async () => {
    const user = userEvent.setup()

    // Stream that never completes (to see streaming state)
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"type":"token","value":"Let me think"}\n'))
        // Keep it open so streaming stays true
      },
    })

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options) => {
      if (options?.method === 'POST') {
        return {
          ok: true,
          body: mockStream,
          json: async () => ({}),
        } as Response
      }
      return {
        ok: true,
        json: async () => ({ ok: true, data: [] }),
      } as Response
    })

    render(<NegotiatorClient />)

    const textarea = screen.getByRole('textbox', { name: /message input/i })
    await user.type(textarea, 'Tell me about energy')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    await waitFor(() => {
      expect(screen.getByText('Let me think')).toBeInTheDocument()
    })
  })

  it('shows error banner when error occurs', async () => {
    const user = userEvent.setup()

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options) => {
      if (options?.method === 'POST') {
        return {
          ok: false,
          status: 500,
          json: async () => ({ error: 'Server error' }),
        } as Response
      }
      return {
        ok: true,
        json: async () => ({ ok: true, data: [] }),
      } as Response
    })

    render(<NegotiatorClient />)

    const textarea = screen.getByRole('textbox', { name: /message input/i })
    await user.type(textarea, 'Trigger an error')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    await waitFor(() => {
      expect(screen.getByText(/Server error/)).toBeInTheDocument()
    })
  })

  it('can dismiss error banner', async () => {
    const user = userEvent.setup()

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options) => {
      if (options?.method === 'POST') {
        return {
          ok: false,
          status: 500,
          json: async () => ({ error: 'Server error' }),
        } as Response
      }
      return {
        ok: true,
        json: async () => ({ ok: true, data: [] }),
      } as Response
    })

    render(<NegotiatorClient />)

    const textarea = screen.getByRole('textbox', { name: /message input/i })
    await user.type(textarea, 'Error')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    await waitFor(() => {
      expect(screen.getByText(/Server error/)).toBeInTheDocument()
    })

    await user.click(screen.getByText('Dismiss'))
    expect(screen.queryByText(/Server error/)).not.toBeInTheDocument()
  })

  it('renders with initial conversation ID', () => {
    render(<NegotiatorClient initialConversationId="existing-conv" />)
    // Should render without errors
    expect(screen.getByText('AI Carbon Negotiator')).toBeInTheDocument()
  })
})
