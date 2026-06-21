import { Stagger, StaggerItem } from '@/components/marketing/motion/reveal'
import { SectionHeading } from '@/components/marketing/section-heading'

// ============================================================================
// How It Works — three numbered steps on a vertical timeline (desktop) /
// stacked cards (mobile). Concrete, time-bound, no fluff.
// ============================================================================

const STEPS = [
  {
    n: '01',
    title: 'Meet your Twin',
    duration: '~60 seconds',
    body: 'A short wizard estimates your baseline footprint from your location, household, transport, and diet — then forms your Climate Twin on the spot. Skippable; we refine from real data as you log.',
  },
  {
    n: '02',
    title: 'Log your life',
    duration: 'a few seconds, a few times a week',
    body: 'Snap a receipt, speak a sentence, paste a list. The Invisible Carbon Detector parses it, attaches confidence scores, and shows you a review screen before anything hits your log.',
  },
  {
    n: '03',
    title: 'Explore your Dashboard',
    duration: 'daily check-in',
    body: 'Every scan, every goal, every simulated lever converges on your Dashboard. Your Twin evolves, your forecast updates, and weekly insights surface the one lever worth pulling next — all in one place.',
  },
  {
    n: '04',
    title: 'Reduce with help',
    duration: 'ongoing',
    body: 'Run what-if scenarios on your real data, negotiate a commitment with the AI, set goals that recover after a miss, and watch your forecast bend. Your Twin evolves, your streak grows, and the loop tightens.',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="relative border-y bg-muted/20 scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <SectionHeading
          eyebrow="How it works"
          title={
            <>
              From curious to committed in{' '}
              <span className="text-gradient-brand">four moves.</span>
            </>
          }
          subtitle="No onboarding marathon. No data-science degree. The first value lands in under five minutes."
        />

        <div className="relative mt-16">
          {/* Vertical timeline line (desktop) */}
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-border to-transparent lg:block" />

          <Stagger className="space-y-8 lg:space-y-0" stagger={0.12}>
            {STEPS.map((s, i) => (
              <StaggerItem
                key={s.n}
                className={
                  i % 2 === 0
                    ? 'lg:grid lg:grid-cols-2 lg:items-center lg:gap-16'
                    : 'lg:grid lg:grid-cols-2 lg:items-center lg:gap-16'
                }
              >
                <div
                  className={
                    i % 2 === 0
                      ? 'lg:col-start-1 lg:pr-16 lg:text-right'
                      : 'lg:col-start-2 lg:pl-16'
                  }
                >
                  <div className="rounded-2xl border bg-card/70 p-7 backdrop-blur">
                    <div
                      className={
                        i % 2 === 0
                          ? 'flex items-center gap-3 lg:flex-row-reverse'
                          : 'flex items-center gap-3'
                      }
                    >
                      <span className="text-gradient-brand font-mono text-3xl font-bold tabular-nums">
                        {s.n}
                      </span>
                      <div className={i % 2 === 0 ? 'lg:text-right' : ''}>
                        <h3 className="text-lg font-semibold tracking-tight">
                          {s.title}
                        </h3>
                        <p className="text-muted-foreground font-mono text-xs">
                          {s.duration}
                        </p>
                      </div>
                    </div>
                    <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                      {s.body}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  )
}
