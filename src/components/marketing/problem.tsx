import { Reveal, Stagger, StaggerItem } from '@/components/marketing/motion/reveal'

// ============================================================================
// Problem — editorial, stark. Three friction points individuals face with
// carbon today. No fake stats — these are structural truths stated plainly.
// ============================================================================

const PROBLEMS = [
  {
    n: '01',
    title: 'It\'s invisible.',
    body: 'Your phone, your lunch, your commute, your cloud storage — each silently emits. Nothing in your day tells you how much, or where it\'s concentrated.',
  },
  {
    n: '02',
    title: 'It\'s abstract.',
    body: 'A number like 7.4 tonnes means nothing on its own. Without a relatable shape, it can\'t guide a single decision you make today.',
  },
  {
    n: '03',
    title: 'It feels hopeless.',
    body: 'Even when you try, the advice is generic — "drive less, eat plants" — with no sense of what actually moves your number, or what\'s realistic for you.',
  },
]

export function Problem() {
  return (
    <section className="relative border-y bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <Reveal>
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.2em]">
            The problem
          </p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            Carbon is the most important number in your life — and the least
            <span className="text-muted-foreground"> understood.</span>
          </h2>
        </Reveal>

        <Stagger className="mt-14 grid gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-3" stagger={0.1}>
          {PROBLEMS.map((p) => (
            <StaggerItem key={p.n} className="bg-background p-7">
              <span className="text-gradient-brand font-mono text-sm font-semibold">
                {p.n}
              </span>
              <h3 className="mt-4 text-xl font-semibold tracking-tight">
                {p.title}
              </h3>
              <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                {p.body}
              </p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  )
}
