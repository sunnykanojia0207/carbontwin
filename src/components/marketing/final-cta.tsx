import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/marketing/motion/reveal'

// ============================================================================
// Final CTA — bold conversion band. Emerald radial + grid backdrop, large
// type, dual CTA. No fake scarcity, no countdown.
// ============================================================================

export function FinalCTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="bg-radial-brand pointer-events-none absolute inset-0" />
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />

          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl lg:leading-[1.1]">
              Your footprint on{' '}
              <span className="text-gradient-brand">one Dashboard.</span>
            </h2>
            <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
              Your footprint is already happening. CarbonTwin makes it something
              you can read, predict, and shape — in the time it takes to make
              coffee.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-8 text-base">
                <Link href="/register">
                  Create your Climate Twin
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-8 text-base"
              >
                <Link href="/login">I already have an account</Link>
              </Button>
            </div>
            <p className="text-muted-foreground mt-6 text-xs">
              Free to start · No credit card · Delete your data anytime
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
