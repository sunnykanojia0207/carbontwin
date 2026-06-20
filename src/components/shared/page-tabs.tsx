'use client'

import * as React from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { motion, LayoutGroup } from 'framer-motion'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// ============================================================================
// PageTabs — reusable, accessible, URL-synced tab system.
//
// Features:
//   - URL-synced: tab state persisted in search params (default: ?tab=...)
//   - Variants: primary (underlined), secondary (filled), pills
//   - Layout: horizontal (scrollable on mobile) or vertical (sidebar-style)
//   - Accessible: full keyboard nav, ARIA attributes via Radix Tabs
//   - Animated indicator: subtle framer-motion layout animation
//   - Dark mode: uses CSS variables from shadcn/ui
// ============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TabItem {
  /** Unique value for the tab (used as the URL param value and for matching) */
  value: string
  /** Human-readable label */
  label: string
  /** Optional icon component shown before the label */
  icon?: React.ComponentType<{ className?: string }>
  /** Optional badge (count, status) shown after the label */
  badge?: string | number
  /** Disable this tab (clicking / keyboard does nothing) */
  disabled?: boolean
  /** Content rendered when this tab is active */
  content: React.ReactNode
}

export interface PageTabsProps {
  /** Ordered list of tab items */
  tabs: TabItem[]
  /** Default tab value when none is selected via URL */
  defaultTab?: string
  /** URL search param key used for persistence (default: 'tab') */
  paramKey?: string
  /**
   * Visual style variant:
   * - 'primary'   → underlined active state (default)
   * - 'secondary' → filled background active state
   * - 'pills'     → pill-shaped buttons
   */
  variant?: 'primary' | 'secondary' | 'pills'
  /**
   * Layout direction:
   * - 'horizontal' → tabs row above content (default)
   * - 'vertical'   → tabs sidebar on the left
   */
  layout?: 'horizontal' | 'vertical'
  /** Optional className override for the wrapper */
  className?: string
}

// ---------------------------------------------------------------------------
// Variant styles
// ---------------------------------------------------------------------------

const VARIANT_STYLES: Record<string, { list: string; trigger: string; active: string }> = {
  primary: {
    list:
      'bg-transparent border-b border-border h-auto w-full justify-start gap-0 rounded-none p-0',
    trigger:
      'relative rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-none hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none',
    active: '',
  },
  secondary: {
    list:
      'bg-muted/50 border border-border inline-flex h-10 w-full items-center justify-start gap-1 rounded-lg p-1',
    trigger:
      'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
    active: '',
  },
  pills: {
    list:
      'bg-transparent flex-wrap gap-2 h-auto w-full rounded-none p-0',
    trigger:
      'rounded-full border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm',
    active: '',
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PageTabs({
  tabs,
  defaultTab,
  paramKey = 'tab',
  variant = 'primary',
  layout = 'horizontal',
  className,
}: PageTabsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Use a ref to avoid recreating handleValueChange when tabs array changes
  const tabsRef = React.useRef(tabs)
  tabsRef.current = tabs

  // Determine the active tab from URL or default
  const activeTab = searchParams.get(paramKey) || defaultTab || tabs[0]?.value || ''

  const handleValueChange = React.useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      const firstTabValue = tabsRef.current[0]?.value || ''
      if (value === (defaultTab || firstTabValue)) {
        params.delete(paramKey)
      } else {
        params.set(paramKey, value)
      }
      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams, paramKey, defaultTab],
  )

  const styles = VARIANT_STYLES[variant] ?? VARIANT_STYLES.primary

  const isVertical = layout === 'vertical'

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleValueChange}
      className={cn(
        'w-full',
        isVertical && 'flex flex-row gap-6',
        className,
      )}
    >
      {/* Tab List */}
      {isVertical ? (
        <TabsList
          className={cn(
            'flex-col items-stretch gap-1',
            'bg-transparent h-auto w-48 shrink-0 rounded-none p-0',
          )}
        >
          <LayoutGroup id={`page-tabs-${paramKey}`}>
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.value
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  disabled={tab.disabled}
                  className={cn(
                    'relative flex items-center justify-start gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all',
                    'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                    isActive && 'bg-accent text-foreground',
                    tab.disabled && 'cursor-not-allowed opacity-50',
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId={`indicator-${paramKey}`}
                      className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  {Icon && <Icon className="size-4 shrink-0" />}
                  <span className="truncate">{tab.label}</span>
                  {tab.badge !== undefined && (
                    <Badge
                      variant={isActive ? 'default' : 'secondary'}
                      className="ml-auto text-[10px]"
                    >
                      {tab.badge}
                    </Badge>
                  )}
                </TabsTrigger>
              )
            })}
          </LayoutGroup>
        </TabsList>
      ) : (
        <ScrollArea className="w-full">
          <TabsList className={cn(styles.list)}>
            <LayoutGroup id={`page-tabs-${paramKey}`}>
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.value
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    disabled={tab.disabled}
                    className={cn(
                      styles.trigger,
                      'relative',
                      tab.disabled && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    {Icon && <Icon className="size-4 shrink-0" />}
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <Badge
                        variant={isActive ? 'default' : 'secondary'}
                        className="ml-0.5 text-[10px]"
                      >
                        {tab.badge}
                      </Badge>
                    )}
                    {variant === 'primary' && isActive && (
                      <motion.span
                        layoutId={`indicator-${paramKey}`}
                        className="absolute -bottom-[1px] left-0 right-0 h-0.5 bg-primary"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                  </TabsTrigger>
                )
              })}
            </LayoutGroup>
          </TabsList>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      )}

      {/* Tab Content Panels — forceMount keeps all panels in the DOM,
          hidden/shown via CSS to avoid costly React mount/unmount cycles.
          This preserves chart state (Recharts SVG, Framer Motion) when switching tabs. */}
      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          forceMount
          className={cn(
            'mt-4 focus-visible:outline-none',
            isVertical && 'mt-0 flex-1',
            // Hide inactive panels via CSS (they stay rendered in DOM)
            activeTab !== tab.value && 'hidden',
          )}
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
