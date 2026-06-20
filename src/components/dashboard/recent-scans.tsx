import Link from 'next/link'
import { Camera, Mic, Type, Receipt, ChevronRight, Inbox } from 'lucide-react'

import { SectionCard } from '@/components/dashboard/section-card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { formatKg, timeAgo, scanTypeLabel } from '@/components/dashboard/format'
import type { DashboardData } from '@/lib/services/dashboard.service'

// ============================================================================
// Recent Scans — compact list of the latest uploads/detections with type
// icon, detection count, total kg, and relative time.
// ============================================================================

const SCAN_ICONS = {
  PHOTO: Camera,
  VOICE: Mic,
  TEXT: Type,
  RECEIPT: Receipt,
  CSV: Receipt,
} as const

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  PROCESSING: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  PENDING: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  FAILED: 'bg-red-500/15 text-red-600 dark:text-red-400',
  CANCELLED: 'bg-muted text-muted-foreground',
}

export function RecentScans({ scans }: { scans: DashboardData['recentScans'] }) {
  return (
    <SectionCard
      title="Recent Scans"
      subtitle="Your latest logs"
      action={
        <Link
          href="/upload"
          className="text-primary hover:underline text-xs font-medium"
        >
          View all
        </Link>
      }
      bodyClassName="pt-0"
    >
      {scans.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No scans yet"
          body="Log your first activity to see it here."
          ctaLabel="Upload & Detect"
          ctaHref="/upload"
        />
      ) : (
        <ul className="-mx-2 max-h-72 space-y-0.5 overflow-y-auto scrollbar-thin">
          {scans.map((scan) => {
            const Icon = SCAN_ICONS[scan.type as keyof typeof SCAN_ICONS] ?? Type
            return (
              <li key={scan.id}>
                <Link
                  href="/upload"
                  className="hover:bg-accent flex items-center gap-3 rounded-lg px-2 py-2 transition-colors"
                >
                  <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {scanTypeLabel(scan.type)} scan
                      </span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                          STATUS_COLORS[scan.status] ?? STATUS_COLORS.COMPLETED
                        }`}
                      >
                        {scan.status.toLowerCase()}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {scan.detectionCount} item{scan.detectionCount !== 1 && 's'} ·{' '}
                      {timeAgo(scan.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatKg(scan.totalKg)}
                    </p>
                    <p className="text-muted-foreground text-[10px]">CO₂e</p>
                  </div>
                  <ChevronRight className="text-muted-foreground/50 size-4 shrink-0" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </SectionCard>
  )
}
