import Link from 'next/link'
import { ScanLine, SlidersHorizontal, Handshake, UsersRound, ArrowRight } from 'lucide-react'

import { SectionCard } from '@/components/dashboard/section-card'

// ============================================================================
// Quick Actions — the "what do I do next" launcher. Four entry points to the
// product's core flows, always one tap away from the dashboard.
// ============================================================================

const ACTIONS = [
  {
    href: '/upload',
    icon: ScanLine,
    label: 'Upload & Detect',
    desc: 'Snap a room photo',
  },
  {
    href: '/simulator',
    icon: SlidersHorizontal,
    label: 'Run simulation',
    desc: 'Model a change',
  },
  {
    href: '/negotiator',
    icon: Handshake,
    label: 'Ask the negotiator',
    desc: 'Find a goal',
  },
  {
    href: '/twin',
    icon: UsersRound,
    label: 'View your Twin',
    desc: 'Your persona',
  },
] as const

export function QuickActions() {
  return (
    <SectionCard title="Quick Actions" subtitle="Jump to a flow" bodyClassName="pt-0">
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map(({ href, icon: Icon, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="hover:border-primary/40 hover:bg-accent/40 group flex flex-col gap-2 rounded-lg border p-3 transition-colors"
          >
            <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg transition-transform group-hover:scale-110">
              <Icon className="size-4.5" />
            </span>
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-muted-foreground text-xs">{desc}</p>
            </div>
            <ArrowRight className="text-muted-foreground/40 group-hover:text-primary mt-auto size-3.5 transition-colors" />
          </Link>
        ))}
      </div>
    </SectionCard>
  )
}
