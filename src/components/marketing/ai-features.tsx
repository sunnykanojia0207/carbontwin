import { Brain, MessageSquare, Sparkles, ShieldCheck, Cpu, GitBranch } from 'lucide-react'

import { Reveal, Stagger, StaggerItem } from '@/components/marketing/motion/reveal'
import { SectionHeading } from '@/components/marketing/section-heading'

// ============================================================================
// AI Features — the intelligence layer. Four capabilities + a transparency
// callout. No fake benchmarks — the trust comes from naming the model family,
// the deterministic math layer, and the audit trail.
// ============================================================================

const AI_CAPS = [
  {
    icon: MessageSquare,
    title: 'Natural-language logging',
    body: 'Describe your day in a sentence. Function-calling extracts structured activities with confidence scores you can audit.',
  },
  {
    icon: Brain,
    title: 'Negotiated commitments',
    body: 'A conversational agent bargains between ambition and feasibility, converging on a goal you\'ll actually keep in under three turns.',
  },
  {
    icon: Sparkles,
    title: 'Weekly insight narratives',
    body: 'Instead of dumping a chart, the AI writes a two-sentence story of your week — the trend, the cause, and the one lever worth pulling.',
  },
  {
    icon: Cpu,
    title: 'Deterministic where it matters',
    body: 'Every kilogram is computed by audited emission factors. The AI explains and recommends; the math decides. Never the other way around.',
  },
]

export function AIFeatures() {
  return (
    <section id="ai" className="relative overflow-hidden scroll-mt-20">
      <div className="bg-radial-brand pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <SectionHeading
          eyebrow="AI, done honestly"
          title={
            <>
              AI that explains itself —{' '}
              <span className="text-gradient-brand">and stays auditable.</span>
            </>
          }
          subtitle="Large-language-model intelligence for the fuzzy parts (parsing, narrative, negotiation). Deterministic, factor-based math for the parts that have to be right."
        />

        <Stagger className="mt-14 grid gap-4 sm:grid-cols-2" stagger={0.08}>
          {AI_CAPS.map(({ icon: Icon, title, body }) => (
            <StaggerItem key={title}>
              <div className="hover:border-primary/40 h-full rounded-xl border bg-card/60 p-6 transition-colors">
                <div className="flex items-start gap-4">
                  <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight">
                      {title}
                    </h3>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                      {body}
                    </p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Transparency callout — replaces fake reviews/testimonials */}
        <Reveal delay={0.2}>
          <div className="mt-10 grid gap-4 rounded-2xl border bg-card/40 p-6 sm:grid-cols-3 sm:p-8">
            <div className="flex items-start gap-3">
              <ShieldCheck className="text-primary mt-0.5 size-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Audited factors</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  EPA, DEFRA, and IPCC emission factors, each traceable to its
                  source and version.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <GitBranch className="text-primary mt-0.5 size-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Versioned prompts</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Every AI output is stamped with a prompt version, so changes
                  are reviewable and reversible.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Cpu className="text-primary mt-0.5 size-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Model-transparent</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  The model family is disclosed on every AI surface. You can
                  opt out of AI entirely and still use the product.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
