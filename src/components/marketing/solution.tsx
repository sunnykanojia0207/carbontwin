import {
  ScanLine,
  UsersRound,
  SlidersHorizontal,
  Handshake,
  Target,
  TrendingUp,
} from 'lucide-react'

import { Reveal, Stagger, StaggerItem } from '@/components/marketing/motion/reveal'
import { SectionHeading } from '@/components/marketing/section-heading'

// ============================================================================
// Solution — reframes the problem as a system. Introduces the 6 capabilities
// as one cohesive loop: Detect → Twin → Simulate → Negotiate → Commit →
// Forecast. Establishes that CarbonTwin is a *system*, not a feature list.
// ============================================================================

const CAPABILITIES = [
  { icon: ScanLine, name: 'Invisible Carbon Detector', desc: 'AI extracts activities from photos, voice, or text.' },
  { icon: UsersRound, name: 'Digital Climate Twin', desc: 'A personal carbon persona that evolves with you.' },
  { icon: SlidersHorizontal, name: 'What-If Simulator', desc: 'Model lifestyle changes before committing.' },
  { icon: Handshake, name: 'AI Carbon Negotiator', desc: 'Find reductions you will actually keep.' },
  { icon: Target, name: 'Sustainability Goals', desc: 'Tiered commitments with streaks, not guilt.' },
  { icon: TrendingUp, name: 'Carbon Forecasting', desc: 'See your trajectory months ahead.' },
]

export function Solution() {
  return (
    <section id="solution" className="relative overflow-hidden scroll-mt-20">
      <div className="bg-radial-brand pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <SectionHeading
          eyebrow="The solution"
          title={
            <>
              One system that turns emissions into{' '}
              <span className="text-gradient-brand">agency.</span>
            </>
          }
          subtitle="Six capabilities that work as a loop — detect your real footprint, model the changes, negotiate commitments you'll keep, and watch the forecast bend."
        />

        <Stagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
          {CAPABILITIES.map(({ icon: Icon, name, desc }) => (
            <StaggerItem key={name}>
              <div className="group hover:border-primary/40 hover:bg-accent/40 h-full rounded-xl border bg-card/60 p-6 transition-colors">
                <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-lg transition-transform group-hover:scale-110">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold tracking-tight">
                  {name}
                </h3>
                <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                  {desc}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.2}>
          <p className="text-muted-foreground mt-10 text-center text-sm">
            Each capability is strong alone — together, they form a feedback
            loop that compounds.{' '}
            <span className="text-foreground font-medium">
              Your Dashboard is where it all converges.
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  )
}
