'use client'

import * as React from 'react'
import { MessageSquare, Plus, Trash2, Clock, PanelLeftClose } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// ============================================================================
// ConversationsPanel — sidebar listing negotiator sessions.
//
// Redesign highlights:
//   • Cleaner typography scale (smaller group headers, tighter rows)
//   • More subtle active state (inset shadow + background)
//   • Delete button appears on row hover with a smooth fade
//   • Better empty state with icon + message
//   • "New conversation" button always visible at top
// ============================================================================

interface ConversationSummary {
  id: string
  title: string
  messageCount: number
  lastMessageAt: string
  createdAt: string
}

interface ConversationsPanelProps {
  activeId?: string
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onClose?: () => void
  className?: string
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ConversationsPanel({
  activeId,
  onSelect,
  onNew,
  onDelete,
  onClose,
  className,
}: ConversationsPanelProps) {
  const [conversations, setConversations] = React.useState<ConversationSummary[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchConversations = React.useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/negotiator/conversations')
      if (!res.ok) return
      const json = await res.json()
      if (json.ok) setConversations(json.data)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const handleDelete = React.useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.stopPropagation()
      try {
        const res = await fetch(`/api/negotiator/${id}`, { method: 'DELETE' })
        if (!res.ok) return
        setConversations((prev) => prev.filter((c) => c.id !== id))
        if (activeId === id) onNew()
      } catch {
        // silently fail
      }
    },
    [activeId, onNew],
  )

  // Group conversations by recency
  const grouped = React.useMemo(() => {
    const groups: { label: string; items: ConversationSummary[] }[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const thisWeek = new Date(today)
    thisWeek.setDate(thisWeek.getDate() - 7)

    const todayItems: ConversationSummary[] = []
    const yesterdayItems: ConversationSummary[] = []
    const weekItems: ConversationSummary[] = []
    const olderItems: ConversationSummary[] = []

    for (const c of conversations) {
      const d = new Date(c.lastMessageAt)
      if (d >= today) todayItems.push(c)
      else if (d >= yesterday) yesterdayItems.push(c)
      else if (d >= thisWeek) weekItems.push(c)
      else olderItems.push(c)
    }

    if (todayItems.length) groups.push({ label: 'Today', items: todayItems })
    if (yesterdayItems.length) groups.push({ label: 'Yesterday', items: yesterdayItems })
    if (weekItems.length) groups.push({ label: 'This week', items: weekItems })
    if (olderItems.length) groups.push({ label: 'Earlier', items: olderItems })

    return groups
  }, [conversations])

  return (
    <div className={cn('flex h-full flex-col border-r bg-card', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2.5">
        <h2 className="text-xs font-semibold tracking-tight">Conversations</h2>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="size-7" onClick={onNew} title="New conversation">
            <Plus className="size-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" className="size-7" onClick={onClose} title="Close sidebar">
              <PanelLeftClose className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="space-y-2 px-4 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-muted h-10 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="bg-muted mb-2 flex size-10 items-center justify-center rounded-xl">
              <MessageSquare className="text-muted-foreground/50 size-4" />
            </div>
            <p className="text-muted-foreground text-[11px] font-medium">No conversations yet</p>
          </div>
        ) : (
          <div className="space-y-3 px-1.5 py-2">
            {grouped.map((group) => (
              <div key={group.label}>
                <p className="text-muted-foreground/60 mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((conv) => {
                    const isActive = conv.id === activeId
                    return (
                      <button
                        key={conv.id}
                        onClick={() => onSelect(conv.id)}
                        className={cn(
                          'group relative flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all duration-150',
                          isActive
                            ? 'bg-accent/80 text-accent-foreground shadow-xs'
                            : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground',
                        )}
                      >
                        <MessageSquare className="mt-0.5 size-3.5 shrink-0 opacity-60" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium leading-snug">
                            {conv.title || 'New conversation'}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <Clock className="size-2.5 shrink-0 opacity-50" />
                            <span className="text-muted-foreground/60 text-[10px] leading-none">
                              {timeAgo(conv.lastMessageAt)}
                            </span>
                            {conv.messageCount > 0 && (
                              <span className="text-muted-foreground/40 text-[10px] leading-none">
                                · {conv.messageCount}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDelete(e, conv.id)}
                          className={cn(
                            'absolute right-2 top-1/2 -translate-y-1/2',
                            'flex size-6 items-center justify-center rounded-md',
                            'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                            'text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10',
                            'transition-all duration-150',
                          )}
                          title="Delete conversation"
                          aria-label={`Delete ${conv.title || 'conversation'}`}
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
