import { Reveal } from '@/components/marketing/motion/reveal'
import { cn } from '@/lib/utils'

// ============================================================================
// Shared section heading — eyebrow, title, optional subtitle. Centered by
// default. Used across Problem/Solution/Features/AI/Tech/FAQ sections for
// consistent visual hierarchy.
// ============================================================================

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className,
}: {
  eyebrow?: string
  title: React.ReactNode
  subtitle?: React.ReactNode
  align?: 'center' | 'left'
  className?: string
}) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' ? 'mx-auto text-center' : 'text-left',
        className,
      )}
    >
      {eyebrow && (
        <Reveal>
          <p className="text-primary mb-3 text-xs font-semibold uppercase tracking-[0.2em]">
            {eyebrow}
          </p>
        </Reveal>
      )}
      <Reveal delay={0.05}>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
          {title}
        </h2>
      </Reveal>
      {subtitle && (
        <Reveal delay={0.1}>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            {subtitle}
          </p>
        </Reveal>
      )}
    </div>
  )
}
