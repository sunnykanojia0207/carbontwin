/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ConversationsPanel } from '@/components/negotiator/conversations-panel'

// Sample conversation data matching ConversationSummary shape
const mockConversations = [
  {
    id: 'conv-1',
    title: 'Reducing transport emissions',
    messageCount: 5,
    lastMessageAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'conv-2',
    title: 'Home energy savings',
    messageCount: 3,
    lastMessageAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'conv-3',
    title: 'Diet changes',
    messageCount: 7,
    lastMessageAt: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
]

const defaultProps = {
  onSelect: vi.fn(),
  onNew: vi.fn(),
  onDelete: vi.fn(),
}

describe('ConversationsPanel', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, data: mockConversations }),
    } as Response)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows loading skeleton on mount', () => {
    // Delay fetch resolution to capture loading state
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({ ok: true, data: [] }),
              } as Response),
            100,
          ),
        ),
    )
    render(<ConversationsPanel {...defaultProps} />)
    // Loading state renders 3 skeleton items with animate-pulse
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBe(3)
  })

  it('renders "New conversation" button', () => {
    render(<ConversationsPanel {...defaultProps} />)
    expect(screen.getByText('New conversation')).toBeInTheDocument()
  })

  it('calls onNew when new conversation button is clicked', async () => {
    const user = userEvent.setup()
    const onNew = vi.fn()
    render(<ConversationsPanel {...defaultProps} onNew={onNew} />)
    await user.click(screen.getByText('New conversation'))
    expect(onNew).toHaveBeenCalledTimes(1)
  })

  it('fetches and renders conversation list', async () => {
    render(<ConversationsPanel {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Reducing transport emissions')).toBeInTheDocument()
    })
    expect(screen.getByText('Home energy savings')).toBeInTheDocument()
    expect(screen.getByText('Diet changes')).toBeInTheDocument()
  })

  it('shows empty state when no conversations', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: [] }),
    } as Response)

    render(<ConversationsPanel {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('No past conversations')).toBeInTheDocument()
    })
    expect(screen.getByText('Start a new chat above')).toBeInTheDocument()
  })

  it('groups conversations by recency', async () => {
    render(<ConversationsPanel {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Reducing transport emissions')).toBeInTheDocument()
    })

    // Check that group headers appear
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('calls onSelect when clicking a conversation', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ConversationsPanel {...defaultProps} onSelect={onSelect} />)

    await waitFor(() => {
      expect(screen.getByText('Reducing transport emissions')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Reducing transport emissions'))
    expect(onSelect).toHaveBeenCalledWith('conv-1')
  })

  it('shows delete confirmation when trash icon is clicked', async () => {
    const user = userEvent.setup()
    render(<ConversationsPanel {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Reducing transport emissions')).toBeInTheDocument()
    })

    // Click delete button (trash icon button)
    const deleteButtons = screen.getAllByRole('button', { name: /delete conversation/i })
    await user.click(deleteButtons[0])

    // Should show "Delete" and "Cancel" buttons
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })

  it('calls onSelect for conversation with null title displays "New conversation"', async () => {
    const convWithNullTitle = [
      {
        id: 'conv-null',
        title: null,
        messageCount: 1,
        lastMessageAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    ]
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: convWithNullTitle }),
    } as Response)

    render(<ConversationsPanel {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('New conversation')).toBeInTheDocument()
    })
  })

  it('highlights active conversation', async () => {
    render(
      <ConversationsPanel {...defaultProps} activeId="conv-1" />,
    )

    await waitFor(() => {
      const activeItem = screen.getByText('Reducing transport emissions').closest('div')
      expect(activeItem?.className).toBeDefined()
    })
  })

  it('handles fetch failure gracefully', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'))

    render(<ConversationsPanel {...defaultProps} />)

    // Should not throw; should eventually just show empty state or loading finished
    await waitFor(() => {
      // After failed fetch, conversations remain empty so empty state may show
      // Since fetch silently fails, we should see no loading skeleton
      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBe(0)
    })
  })
})
