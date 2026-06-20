import { Reveal, Stagger, StaggerItem } from '@/components/marketing/motion/reveal'
import { SectionHeading } from '@/components/marketing/section-heading'

// ============================================================================
// Technology — the stack as elegant cards. No vendor logos (would need asset
// licensing); instead, named layers with a one-line rationale each. This reads
// as engineering credibility, not a logo wall.
// ============================================================================

const LAYERS = [
  {
    layer: 'Frontend',
    stack: ['Next.js 16 · App Router', 'TypeScript', 'Tailwind CSS 4', 'shadcn/ui', 'Recharts', 'Framer Motion'],
    note: 'Server Components by default; client islands only where interactivity demands.',
  },
  {
    layer: 'Backend',
    stack: ['Route Handlers', 'Server Actions', 'Zod validation', 'Edge middleware'],
    note: 'Mutations via progressive-enhancement actions; AI via streaming route handlers.',
  },
  {
    layer: 'Data',
    stack: ['PostgreSQL', 'Prisma ORM', 'Soft-delete + audit fields', 'UUID primary keys'],
    note: 'Schema portable to SQLite for dev; identical file deploys to Postgres on Vercel.',
  },
  {
    layer: 'AI',
    stack: ['Gemini API', 'Function calling', 'Structured JSON output', 'Prompt versioning'],
    note: 'Deterministic math layer for emissions; AI annotates, explains, and recommends.',
  },
  {
    layer: 'Auth',
    stack: ['NextAuth / Auth.js', 'Credentials + Google OAuth', 'JWT sessions', 'Edge-gated routes'],
    note: 'Soft-deleted users blocked from re-auth; anti-enumeration on every flow.',
  },
  {
    layer: 'Deploy',
    stack: ['Vercel', 'Edge + Node runtimes', 'Preview DB branches', 'Cron for rollups'],
    note: 'No Docker. No long-running processes. Serverless-native end to end.',
  },
]

export function Technology() {
  return (
    <section id="tech" className="relative border-y bg-muted/20 scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <SectionHeading
          eyebrow="Built on"
          title={
            <>
              A stack chosen for{' '}
              <span className="text-gradient-brand">longevity</span>, not novelty.
            </>
          }
          subtitle="Boring, proven layers where it counts. Modern primitives where they earn their place. Nothing you'd be embarrassed to inherit in 2027."
        />

        <Stagger className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
          {LAYERS.map((l) => (
            <StaggerItem key={l.layer}>
              <div className="h-full rounded-xl border bg-card/60 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide">
                    {l.layer}
                  </h3>
                  <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 font-mono text-[10px]">
                    layer
                  </span>
                </div>
                <ul className="mt-4 space-y-1.5">
                  {l.stack.map((s) => (
                    <li
                      key={s}
                      className="text-muted-foreground flex items-center gap-2 text-xs"
                    >
                      <span className="bg-primary/60 size-1 rounded-full" />
                      <span className="text-foreground/90">{s}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground mt-4 border-t pt-3 text-xs leading-relaxed">
                  {l.note}
                </p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal delay={0.15}>
          <p className="text-muted-foreground mt-10 text-center text-sm">
            Open schema, open methodology, your data exportable anytime.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
