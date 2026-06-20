import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/marketing/motion/reveal'
import { CarbonPulse } from '@/components/marketing/visuals/carbon-pulse'

// ============================================================================
// Hero — large editorial type, emerald radial + grid backdrop, animated
// product visual. Dual CTA. Trust line cites methodology, NOT user counts.
// ============================================================================

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-radial-brand pointer-events-none absolute inset-0" />
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid lg:grid-cols-12 lg:items-center lg:gap-12 lg:pb-32 lg:pt-28">
        {/* Copy */}
        <div className="lg:col-span-6">
          <Reveal>
            <span className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium">
              <span className="size-1.5 rounded-full bg-primary" />
              AI-powered personal carbon intelligence
            </span>
          </Reveal>

          <Reveal delay={0.05}>
            <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[4.25rem] lg:leading-[1.02]">
              Your footprint,
              <br />
              <span className="text-gradient-brand">finally legible.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="text-muted-foreground mt-6 max-w-xl text-lg leading-relaxed">
              CarbonTwin turns invisible daily emissions into a personal model
              you can read, predict, and negotiate with. Snap a receipt, meet
              your Climate Twin, and let AI find the reductions you&apos;ll
              actually keep.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-7 text-base">
                <Link href="/register">
                  Meet your Climate Twin
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-7 text-base"
              >
                <Link href="#how">See how it works</Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-muted-foreground mt-6 text-sm">
              Free to start. No card. Numbers backed by{' '}
              <span className="text-foreground font-medium">
                EPA, DEFRA &amp; IPCC
              </span>{' '}
              emission factors.
            </p>
          </Reveal>
        </div>

        {/* Visual */}
        <Reveal delay={0.2} className="lg:col-span-6">
          <CarbonPulse />
        </Reveal>
      </div>
    </section>
  )
}
