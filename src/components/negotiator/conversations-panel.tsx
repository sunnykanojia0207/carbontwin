'use client'

import * as React from 'react'
import { MessageSquare, Plus, Trash2, Clock, MoreHorizontal } from 'lucide-react'

import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// ============================================================================
// ConversationsPanel — sidebar list of past negotiator sessions.
//
// Delete UX:
//   • Each row has a ··· (MoreHorizontal) button always visible on hover/focus
//   • Clicking it opens a Dropdown with "Delete" — no button-in-button,
//     works on touch, keyboard-accessible, discoverable.
//   • Optimistic removal: the item disappears immediately from the list.
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
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

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
    async (id: string) => {
      // Optimistic removal
      setConversations((prev) => prev.filter((c) => c.id !== id))
      setDeletingId(id)
      if (activeId === id) onNew()
      try {
        await fetch(`/api/negotiator/${id}`, { method: 'DELETE' })
        onDelete(id)
      } catch {
        // silently fail — already removed from UI
      } finally {
        setDeletingId(null)
      }
    },
    [activeId, onNew, onDelete],
  )

  // Group by recency
  const grouped = React.useMemo(() => {
    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const thisWeek = new Date(today)
    thisWeek.setDate(today.getDate() - 7)

    const buckets: Record<string, ConversationSummary[]> = {
      Today: [],
      Yesterday: [],
      'This week': [],
      Earlier: [],
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

          {/* New conversation row */}
          <button
            onClick={onNew}
            className={cn(
              'mb-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left',
              'text-muted-foreground transition-colors',
              'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )}
          >
            <span className="flex size-6 items-center justify-center rounded-md border bg-background">
              <Plus className="size-3.5" />
            </span>
            <span className="text-xs font-medium">New conversation</span>
          </button>

          {/* Divider */}
          <div className="my-1.5 border-t" />

          {/* Conversation list */}
          {loading ? (
            <div className="space-y-1 pt-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="flex size-9 items-center justify-center rounded-xl bg-muted">
                <MessageSquare className="size-4 text-muted-foreground/40" />
              </div>
              <p className="text-xs text-muted-foreground">No past conversations</p>
              <p className="text-[11px] text-muted-foreground/60">
                Start a new chat above
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {grouped.map(([label, items]) => (
                <div key={label}>
                  <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                    {label}
                  </p>
                  <div className="space-y-0.5">
                    {items.map((conv) => (
                      <ConversationRow
                        key={conv.id}
                        conv={conv}
                        isActive={conv.id === activeId}
                        isDeleting={deletingId === conv.id}
                        onSelect={onSelect}
                        onDelete={handleDelete}
                      />
                    ))}
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

// ============================================================================
// ConversationRow — individual conversation item.
// Uses a div + onClick instead of button-in-button to keep valid HTML.
// The ··· menu button is the only interactive child.
// ============================================================================
function ConversationRow({
  conv,
  isActive,
  isDeleting,
  onSelect,
  onDelete,
}: {
  conv: ConversationSummary
  isActive: boolean
  isDeleting: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(conv.id)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(conv.id)}
      className={cn(
        'group flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left',
        'transition-colors select-none',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
        isDeleting && 'pointer-events-none opacity-40',
      )}
    >
      {/* Icon */}
      <MessageSquare className="mt-0.5 size-3.5 shrink-0 opacity-50" />

      {/* Text */}
      <div className="min-w-0 flex-1">
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

      {/* ··· menu — visible on hover/focus, always visible when active */}
      <DropdownMenu>
        <DropdownMenuTrigger
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded-md',
            'text-muted-foreground/50 transition-all',
            'hover:bg-background/80 hover:text-foreground',
            // Always show on active, show on group hover otherwise
            isActive
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100 focus:opacity-100',
          )}
          aria-label="Conversation options"
        >
          <MoreHorizontal className="size-3.5" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="right"
          align="start"
          className="w-40"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
            onSelect={() => onDelete(conv.id)}
          >
            <Trash2 className="size-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
