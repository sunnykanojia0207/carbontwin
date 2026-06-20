import { Reveal } from '@/components/marketing/motion/reveal'
import { SectionHeading } from '@/components/marketing/section-heading'
import { DetectorVisual } from '@/components/marketing/visuals/detector-visual'
import { TwinOrb } from '@/components/marketing/visuals/twin-orb'
import { SimulatorVisual } from '@/components/marketing/visuals/simulator-visual'
import { NegotiatorVisual } from '@/components/marketing/visuals/negotiator-visual'
import { GoalsVisual } from '@/components/marketing/visuals/goals-visual'
import { ForecastVisual } from '@/components/marketing/visuals/forecast-visual'

// ============================================================================
// Feature Highlights — the deep dive. Six alternating rows, each pairing a
// custom generative visual with editorial copy. The core of the page.
// ============================================================================

const FEATURES = [
  {
    id: 'detector',
    eyebrow: 'Invisible Carbon Detector',
    title: 'Log a week in a sentence. Or a photo.',
    body: 'Point your camera at a receipt, describe your day in plain language, or paste a list. CarbonTwin\'s AI extracts the activities, looks up regional emission factors, and computes the carbon — no spreadsheet, no manual entry, no guesswork.',
    bullets: [
      'Photo · voice · text · receipt · CSV inputs',
      'Function-calling AI with confidence scores',
      'Review-and-confirm gate before anything counts',
    ],
    visual: <DetectorVisual />,
  },
  {
    id: 'twin',
    eyebrow: 'Digital Climate Twin',
    title: 'A persona for your footprint — not a number.',
    body: 'Your Climate Twin is a generative model of your carbon profile. It takes a shape that reflects your composition, shifts color as your footprint grows or shrinks, and writes itself a plain-language persona you can actually relate to.',
    bullets: [
      'Composition radar across 6 categories',
      'Tiered avatar that evolves month over month',
      'Compare to your country average and the Paris target',
    ],
    visual: <TwinOrb />,
  },
  {
    id: 'simulator',
    eyebrow: 'What-If Simulator',
    title: 'See the impact before you commit.',
    body: 'Slide a lever — cut a flight, switch to plant-based days, go secondhand — and watch your projected footprint, your confidence band, and your Climate Twin all re-render live. Curiosity becomes a decision.',
    bullets: [
      'Sliders, not binary toggles — partial commitments welcome',
      '12-month forecast with confidence intervals',
      'Real-world translators (trees, flights, phone charges)',
    ],
    visual: <SimulatorVisual />,
  },
  {
    id: 'negotiator',
    eyebrow: 'AI Carbon Negotiator',
    title: 'A friend who bargains for ambition you can keep.',
    body: 'The negotiator studies your data, proposes a lever tuned to you, and lets you counter. Never an ultimatum, always a range. It converges on a concrete commitment in under three turns — then turns it into a goal.',
    bullets: [
      'Proposes levers ranked by your impact-to-effort ratio',
      'Accept, counter, or decline — your call',
      'Auto-creates a structured goal when you commit',
    ],
    visual: <NegotiatorVisual />,
  },
  {
    id: 'goals',
    eyebrow: 'Sustainability Goals',
    title: 'Commitments that recover, never fail.',
    body: 'Tiered goals — weekly, monthly, annual — with progress rings and a logging streak. Behind pace shows amber, never red. Most goals miss the first time; CarbonTwin offers to adjust the target or extend the timeline instead of marking you a failure.',
    bullets: [
      'Weekly / monthly / annual / one-time goals',
      'Streaks and achievements, not leaderboards',
      'Graceful recovery: retry at 80% after a miss',
    ],
    visual: <GoalsVisual />,
  },
  {
    id: 'forecast',
    eyebrow: 'Carbon Forecasting',
    title: 'See your trajectory months ahead.',
    body: 'A lightweight model projects your footprint 12 months out using your recent history, with a confidence band and a Paris-aligned target line. You see where you\'re headed early enough to change it.',
    bullets: [
      'Exponential smoothing on rolling history',
      'Confidence band widens honestly with uncertainty',
      'Target line calibrated to a 1.5°C-aligned path',
    ],
    visual: <ForecastVisual />,
  },
] as const

export function FeatureHighlights() {
  return (
    <section id="features" className="relative scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <SectionHeading
          eyebrow="Feature highlights"
          title={
            <>
              Six capabilities,{' '}
              <span className="text-gradient-brand">one Dashboard.</span>
            </>
          }
          subtitle="Each is built to make the next one smarter — detect more, and the Twin sharpens; sharpen the Twin, and the simulator finds better levers; commit to a lever, and the forecast bends. Your Dashboard ties the loop together."
        />

        <div className="mt-20 space-y-24 lg:space-y-32">
          {FEATURES.map((f, i) => (
            <div
              key={f.id}
              id={f.id}
              className="scroll-mt-24 lg:grid lg:grid-cols-2 lg:items-center lg:gap-16"
            >
              {/* Visual — alternate side */}
              <Reveal
                className={i % 2 === 1 ? 'lg:order-2' : ''}
                y={24}
              >
                {f.visual}
              </Reveal>

              {/* Copy */}
              <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
                <Reveal>
                  <p className="text-primary text-xs font-semibold uppercase tracking-[0.2em]">
                    {f.eyebrow}
                  </p>
                </Reveal>
                <Reveal delay={0.05}>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl lg:text-[2rem] lg:leading-[1.15]">
                    {f.title}
                  </h3>
                </Reveal>
                <Reveal delay={0.1}>
                  <p className="text-muted-foreground mt-4 text-base leading-relaxed">
                    {f.body}
                  </p>
                </Reveal>
                <Reveal delay={0.15}>
                  <ul className="mt-6 space-y-2.5">
                    {f.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3">
                        <span className="bg-primary/15 text-primary mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                          <svg viewBox="0 0 12 12" className="size-3" fill="none">
                            <path
                              d="M2 6.5L4.5 9L10 3"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span className="text-sm leading-relaxed">{b}</span>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
