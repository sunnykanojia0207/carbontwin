'use client'

import * as React from 'react'
import { MessageSquare, Plus, Trash2, Clock, Loader2 } from 'lucide-react'

import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// ============================================================================
// ConversationsPanel — sidebar list of past negotiator sessions.
//
// Row layout (grid):
//   [icon] [title+time — flex-1 min-w-0 truncate] [trash — shrink-0]
//
// Delete UX:
//   • Trash icon always visible on the right — no hover required
//   • Click trash → shows "Delete / ✕" inline confirm in place of the icon
//   • Confirm → optimistic removal + API call
// ============================================================================

interface ConversationSummary {
  id: string
  title: string | null
  messageCount: number
  lastMessageAt: string | null
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

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
  const [confirmingId, setConfirmingId] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

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

  const handleDeleteConfirm = React.useCallback(
    async (id: string) => {
      setConfirmingId(null)
      setDeletingId(id)
      // Optimistic removal
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (activeId === id) onNew()
      try {
        await fetch(`/api/negotiator/${id}`, { method: 'DELETE' })
        onDelete(id)
      } catch {
        // already removed from UI
      } finally {
        setDeletingId(null)
      }
    },
    [activeId, onNew, onDelete],
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
      const raw = c.lastMessageAt ?? c.createdAt
      const d = raw ? new Date(raw) : null
      // skip if invalid date
      if (!d || isNaN(d.getTime())) { buckets['Earlier'].push(c); continue }
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

          {/* New conversation */}
          <button
            onClick={onNew}
            className="mb-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md border bg-background">
              <Plus className="size-3.5" />
            </span>
            <span className="text-xs font-medium">New conversation</span>
          </button>

          <div className="my-1.5 border-t" />

          {/* List */}
          {loading ? (
            <div className="space-y-1 pt-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="flex size-9 items-center justify-center rounded-xl bg-muted">
                <MessageSquare className="size-4 text-muted-foreground/40" />
              </div>
              <p className="text-xs text-muted-foreground">No past conversations</p>
              <p className="text-[11px] text-muted-foreground/60">Start a new chat above</p>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {grouped.map(([label, items]) => (
                <div key={label}>
                  <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                    {label}
                  </p>
                  <div className="space-y-0.5">
                    {items.map((conv) => {
                      const isActive = conv.id === activeId
                      const isConfirming = confirmingId === conv.id
                      const isDeleting = deletingId === conv.id

                      return (
                        <div
                          key={conv.id}
                          className={cn(
                            // grid: icon(fixed) | text(shrinks) | action(fixed)
                            'grid w-full rounded-lg px-2 py-2 transition-colors',
                            'grid-cols-[1.25rem_1fr_auto] items-center gap-2',
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                              : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground',
                            isDeleting && 'pointer-events-none opacity-40',
                          )}
                        >
                          {/* Col 1 — icon */}
                          <MessageSquare className="size-3.5 shrink-0 opacity-50" />

                          {/* Col 2 — title + time, clicks to open */}
                          <button
                            onClick={() => { setConfirmingId(null); onSelect(conv.id) }}
                            className="min-w-0 text-left"
                          >
                            <p className="truncate text-xs font-medium leading-snug">
                              {conv.title || 'New conversation'}
                            </p>
                            <div className="mt-0.5 flex items-center gap-1">
                              <Clock className="size-2.5 shrink-0 opacity-40" />
                              <span className="text-[10px] leading-none opacity-50">
                              {timeAgo(conv.lastMessageAt ?? conv.createdAt)}
                              </span>
                            </div>
                          </button>

                          {/* Col 3 — action (always visible, never overflows) */}
                          {isDeleting ? (
                            <Loader2 className="size-3.5 animate-spin text-muted-foreground/40" />
                          ) : isConfirming ? (
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => handleDeleteConfirm(conv.id)}
                                className="rounded px-1.5 py-1 text-[10px] font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setConfirmingId(null)}
                                className="rounded px-1 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmingId(conv.id) }}
                              title="Delete conversation"
                              aria-label="Delete conversation"
                              className="flex size-6 items-center justify-center rounded-md text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
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
