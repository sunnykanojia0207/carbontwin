'use client'

import * as React from 'react'
import { MessageSquare, Plus, Trash2, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// ============================================================================
// ConversationsPanel — sidebar list of past negotiator sessions.
// Redesigned to match the app sidebar aesthetic (bg-sidebar, tight rows,
// subtle active state, hover-reveal delete).
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
  const diff = Date.now() - new Date(dateStr).getTime()
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
      // silently fail — sidebar is non-critical
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
      } catch { /* silently fail */ }
    },
    [activeId, onNew],
  )

  // Group by recency
  const grouped = React.useMemo(() => {
    const now = new Date()
    const today = new Date(now); today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
    const thisWeek = new Date(today); thisWeek.setDate(today.getDate() - 7)

    const buckets: Record<string, ConversationSummary[]> = {
      Today: [], Yesterday: [], 'This week': [], Earlier: [],
    }
    for (const c of conversations) {
      const d = new Date(c.lastMessageAt)
      if (d >= today) buckets['Today'].push(c)
      else if (d >= yesterday) buckets['Yesterday'].push(c)
      else if (d >= thisWeek) buckets['This week'].push(c)
      else buckets['Earlier'].push(c)
    }
    return Object.entries(buckets).filter(([, items]) => items.length > 0)
  }, [conversations])

  return (
    <div className={cn('flex flex-col', className)}>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* "New conversation" button at top of list */}
          <button
            onClick={onNew}
            className={cn(
              'group mb-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left',
              'text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )}
          >
            <span className="flex size-6 items-center justify-center rounded-md border bg-background">
              <Plus className="size-3.5" />
            </span>
            <span className="text-xs font-medium">New conversation</span>
          </button>

          {loading ? (
            <div className="space-y-1 px-1 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="flex size-9 items-center justify-center rounded-xl bg-muted">
                <MessageSquare className="size-4 text-muted-foreground/50" />
              </div>
              <p className="text-xs text-muted-foreground">No past conversations</p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {grouped.map(([label, items]) => (
                <div key={label}>
                  <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                    {label}
                  </p>
                  <div className="space-y-0.5">
                    {items.map((conv) => {
                      const isActive = conv.id === activeId
                      return (
                        <button
                          key={conv.id}
                          onClick={() => onSelect(conv.id)}
                          className={cn(
                            'group relative flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition-colors',
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                              : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                          )}
                        >
                          <MessageSquare className="mt-0.5 size-3.5 shrink-0 opacity-50" />
                          <div className="min-w-0 flex-1 pr-5">
                            <p className="truncate text-xs font-medium leading-snug">
                              {conv.title || 'New conversation'}
                            </p>
                            <div className="mt-0.5 flex items-center gap-1">
                              <Clock className="size-2.5 shrink-0 opacity-40" />
                              <span className="text-[10px] leading-none opacity-50">
                                {timeAgo(conv.lastMessageAt)}
                              </span>
                            </div>
                          </div>
                          {/* Delete — hover-reveal */}
                          <button
                            onClick={(e) => handleDelete(e, conv.id)}
                            className={cn(
                              'absolute right-1.5 top-1/2 -translate-y-1/2',
                              'flex size-6 items-center justify-center rounded-md',
                              'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                              'text-muted-foreground/40 transition-all',
                              'hover:bg-destructive/10 hover:text-destructive',
                            )}
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
        </div>
      </ScrollArea>
    </div>
  )
}
