'use client'

import * as React from 'react'
import { Plus, Minus } from 'lucide-react'

import { Reveal } from '@/components/marketing/motion/reveal'
import { SectionHeading } from '@/components/marketing/section-heading'
import { cn } from '@/lib/utils'

// ============================================================================
// FAQ — accessible accordion. Single-open, animated chevron + height. Answers
// are substantive, not marketing filler.
// ============================================================================

const FAQS = [
  {
    q: 'How does CarbonTwin know my carbon footprint is accurate?',
    a: 'Every kilogram of CO₂e is computed by a deterministic emission-factor lookup — never by the AI. We source factors from the EPA (US), DEFRA (UK), and IPCC (global), each tagged with its version and region. The AI only parses your input, writes narratives, and recommends levers. The math is auditable and the same for everyone in your region.',
  },
  {
    q: 'What does the Invisible Carbon Detector actually do?',
    a: 'You give it a photo (a receipt, a meal, a utility bill), a voice clip, or a sentence ("flew LHR→JFK economy, ate a burger"). The AI uses function calling to extract structured activities — category, amount, unit — with a confidence score. You see a review screen and confirm before anything is added to your log. The original image is discarded after parsing.',
  },
  {
    q: 'Is my Climate Twin just a vanity avatar?',
    a: 'No — it\'s a real model. Its shape is your composition across six categories (transport, food, home, shopping, digital, travel). Its tier and color shift as your footprint changes. Its persona text is AI-written from your actual stats. It exists to make a 7.4-tonne number legible and to give you something to nudge, not to gamify.',
  },
  {
    q: 'How is the AI Negotiator different from a chatbot?',
    a: 'It has a job: converge on one concrete, realistic commitment in under three turns. It proposes a lever ranked by your impact-to-effort ratio, you accept or counter, and when you agree it creates a structured goal automatically. It never gives ultimatums, never moralizes, and always offers a range rather than a binary.',
  },
  {
    q: 'Do I need to give up my lifestyle to use this?',
    a: 'No. The whole point of the simulator and negotiator is finding reductions that fit your life. Cut one flight, not all travel. Plant-based two days, not vegan forever. Partial commitments are first-class — sliders, not toggles. The product is designed for people who want to do something, not everything.',
  },
  {
    q: 'What happens to my data? Can I delete it?',
    a: 'Your data is yours. Export it as CSV or PDF anytime from Settings. Delete your account and everything cascades — full personal-data erasure in one transaction, no retention period. Images used for detection are processed and discarded; we don\'t store your photos. You can opt out of AI features entirely and the product still works (deterministically).',
  },
  {
    q: 'Which AI model does it use, and can I trust it?',
    a: 'We use Google Gemini for natural-language parsing, insights, and the negotiator. The specific model is disclosed on every AI surface, and every output is stamped with a prompt version for auditability. AI output that becomes data always passes through a Zod schema first; malformed output is retried once, then falls back to a deterministic default. The AI never decides your carbon math.',
  },
  {
    q: 'Is it free?',
    a: 'A generous free tier covers personal use indefinitely — logging, your Climate Twin, the simulator, weekly insights, and a daily AI budget. Pro adds higher AI limits, advanced forecasting, and PDF reports. No card required to start, and the free tier is not a trial — it\'s a real product.',
  },
]

export function FAQ() {
  const [open, setOpen] = React.useState<number | null>(0)

  return (
    <section id="faq" className="relative scroll-mt-20">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:py-28">
        <SectionHeading
          eyebrow="Questions"
          title={
            <>
              The things people{' '}
              <span className="text-gradient-brand">actually ask.</span>
            </>
          }
        />

        <div className="mt-12 space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i
            return (
              <Reveal key={i} delay={i * 0.04}>
                <div
                  className={cn(
                    'overflow-hidden rounded-xl border bg-card/40 transition-colors',
                    isOpen && 'border-primary/40 bg-card/70',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-medium sm:text-base">
                      {item.q}
                    </span>
                    <span
                      className={cn(
                        'text-muted-foreground shrink-0 transition-transform',
                        isOpen && 'rotate-180 text-primary',
                      )}
                    >
                      {isOpen ? (
                        <Minus className="size-4" />
                      ) : (
                        <Plus className="size-4" />
                      )}
                    </span>
                  </button>
                  <div
                    className={cn(
                      'grid transition-all duration-300 ease-out',
                      isOpen
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0',
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="text-muted-foreground px-5 pb-5 text-sm leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
