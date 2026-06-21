// ============================================================================
// Dashboard formatting helpers — shared across all section components.
// ============================================================================

/** Format kg with adaptive precision and unit. */
export function formatKg(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`
  if (kg >= 100) return `${Math.round(kg)}kg`
  return `${kg.toFixed(1)}kg`
}

/** Relative time ("2h ago", "3d ago"). Accepts Date or ISO string (serialized from server). */
export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  return `${weeks}w ago`
}

/** Short date label for chart axes (e.g. "Mon 12"). */
export function shortDate(iso: string): string {
  const d = new Date(iso)
  const day = d.toLocaleDateString('en-US', { weekday: 'short' })
  return `${day} ${d.getDate()}`
}

/** Humanize a scan type enum. */
export function scanTypeLabel(type: string): string {
  return type.charAt(0) + type.slice(1).toLowerCase()
}
