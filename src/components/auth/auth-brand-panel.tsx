import { Leaf, Sparkles, Target } from 'lucide-react'

import { Logo } from '@/components/shared/logo'

// ============================================================================
// Brand panel — the left half of the auth split-screen.
// Hidden on mobile (single-column form takes over). Uses the emerald radial
// + grid utilities from globals.css for a premium SaaS feel.
// ============================================================================

const VALUE_PROPS = [
  {
    icon: Leaf,
    title: 'Understand',
    body: 'See where your emissions actually come from — in plain language.',
  },
  {
    icon: Sparkles,
    title: 'Track',
    body: 'Log by photo, voice, or a sentence. AI does the data entry.',
  },
  {
    icon: Target,
    title: 'Reduce',
    body: 'Get a personal Climate Twin and goals you will actually keep.',
  },
]

export function AuthBrandPanel() {
  return (
    <div className="bg-radial-brand relative hidden overflow-hidden bg-background lg:flex lg:flex-col lg:justify-between lg:p-10">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-40" />

      {/* Top — logo */}
      <div className="relative">
        <Logo className="text-foreground" href="/" />
      </div>

      {/* Center — headline + value props */}
      <div className="relative max-w-md">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight">
          Understand your footprint.
          <br />
          <span className="text-gradient-brand">Decide what to change.</span>
        </h2>
        <p className="text-muted-foreground mt-3 text-base">
          CarbonTwin turns abstract carbon data into a personal companion that
          helps you track, predict, and reduce — without the guilt.
        </p>

        <ul className="mt-8 space-y-4">
          {VALUE_PROPS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                <Icon className="size-4" />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-muted-foreground text-sm">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom — testimonial */}
      <figure className="relative max-w-md">
        <blockquote className="text-sm leading-relaxed">
          &ldquo;I finally understand my own footprint. The Climate Twin made
          it click — and I cut a flight without feeling deprived.&rdquo;
        </blockquote>
        <figcaption className="text-muted-foreground mt-3 flex items-center gap-3 text-xs">
          <span className="bg-primary/15 text-primary flex size-7 items-center justify-center rounded-full text-[11px] font-semibold">
            MK
          </span>
          <span>
            <strong className="text-foreground font-medium">Maya K.</strong> ·
            early tester
          </span>
        </figcaption>
      </figure>
    </div>
  )
}
