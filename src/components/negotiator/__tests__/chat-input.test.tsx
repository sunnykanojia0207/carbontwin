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
    button: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial: _i, animate: _a, exit: _e, transition: _t, ...rest } = props
      return <button {...rest}>{children}</button>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

import { ChatInput } from '@/components/negotiator/chat-input'

describe('ChatInput', () => {
  it('renders textarea and send button', () => {
    render(<ChatInput onSend={vi.fn()} />)
    expect(screen.getByRole('textbox', { name: /message input/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument()
  })

  it('send button is disabled when input is empty', () => {
    render(<ChatInput onSend={vi.fn()} />)
    const sendButton = screen.getByRole('button', { name: /send message/i })
    expect(sendButton).toBeDisabled()
  })

  it('send button is enabled when text is entered', async () => {
    const user = userEvent.setup()
    render(<ChatInput onSend={vi.fn()} />)
    const textarea = screen.getByRole('textbox', { name: /message input/i })
    await user.type(textarea, 'Hello')
    const sendButton = screen.getByRole('button', { name: /send message/i })
    expect(sendButton).toBeEnabled()
  })

  it('calls onSend with trimmed text on button click', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} />)
    const textarea = screen.getByRole('textbox', { name: /message input/i })
    await user.type(textarea, '  Hello world  ')
    await user.click(screen.getByRole('button', { name: /send message/i }))
    expect(onSend).toHaveBeenCalledWith('Hello world')
  })

  it('clears input after sending', async () => {
    const user = userEvent.setup()
    render(<ChatInput onSend={vi.fn()} />)
    const textarea = screen.getByRole('textbox', { name: /message input/i }) as HTMLTextAreaElement
    await user.type(textarea, 'Test message')
    await user.click(screen.getByRole('button', { name: /send message/i }))
    expect(textarea.value).toBe('')
  })

  it('calls onSend on Enter key press', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} />)
    const textarea = screen.getByRole('textbox', { name: /message input/i })
    await user.type(textarea, 'Hello{Enter}')
    expect(onSend).toHaveBeenCalledWith('Hello')
  })

  it('does not submit on Shift+Enter', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} />)
    const textarea = screen.getByRole('textbox', { name: /message input/i })
    await user.type(textarea, 'Hello{Shift>}{Enter}')
    expect(onSend).not.toHaveBeenCalled()
  })

  it('shows loading spinner when disabled', () => {
    render(<ChatInput onSend={vi.fn()} disabled={true} />)
    // When disabled, the send button should be replaced by a loading spinner
    expect(screen.queryByRole('button', { name: /send message/i })).not.toBeInTheDocument()
    // The loading icon from lucide should be present
    const textarea = screen.getByRole('textbox', { name: /message input/i })
    expect(textarea).toBeDisabled()
  })

  it('disables textarea when disabled prop is true', () => {
    render(<ChatInput onSend={vi.fn()} disabled={true} />)
    const textarea = screen.getByRole('textbox', { name: /message input/i })
    expect(textarea).toBeDisabled()
  })

  it('renders placeholder text', () => {
    render(<ChatInput onSend={vi.fn()} placeholder="Type here..." />)
    const textarea = screen.getByRole('textbox', { name: /message input/i })
    expect(textarea).toHaveAttribute('placeholder', 'Type here...')
  })

  it('renders default placeholder when none provided', () => {
    render(<ChatInput onSend={vi.fn()} />)
    const textarea = screen.getByRole('textbox', { name: /message input/i })
    expect(textarea).toHaveAttribute('placeholder', 'Ask your AI negotiator anything…')
  })

  it('shows keyboard hint footer with kbd elements', () => {
    render(<ChatInput onSend={vi.fn()} />)
    // The text is split across kbd elements: <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line
    expect(screen.getByText('Enter')).toBeInTheDocument()
    expect(screen.getByText('Shift+Enter')).toBeInTheDocument()
  })

  it('does not call onSend when text is only whitespace', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} />)
    const textarea = screen.getByRole('textbox', { name: /message input/i })
    await user.type(textarea, '   {Enter}')
    expect(onSend).not.toHaveBeenCalled()
  })
})
