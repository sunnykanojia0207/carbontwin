import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// ============================================================================
// SectionCard — consistent header (title + optional action + subtitle) wrapper
// for every dashboard section. Ensures uniform spacing & hierarchy.
// ============================================================================

export function SectionCard({
  title,
  subtitle,
  action,
  className,
  bodyClassName,
  children,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
  bodyClassName?: string
  children: React.ReactNode
}) {
  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
        <div className="space-y-0.5">
          <CardTitle className="text-sm font-semibold tracking-tight">
            {title}
          </CardTitle>
          {subtitle && (
            <p className="text-muted-foreground text-xs">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </CardHeader>
      <CardContent className={cn('pt-0', bodyClassName)}>{children}</CardContent>
    </Card>
  )
}
