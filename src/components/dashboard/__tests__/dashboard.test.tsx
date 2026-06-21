/// <reference types="vitest/globals" />
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// ============================================================================
// Dashboard page tests
// ============================================================================

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock framer-motion to render children directly
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial: _i, animate: _a, exit: _e, transition: _t, variants: _v, ...rest } = props
      return <div {...rest}>{children}</div>
    },
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial: _i, animate: _a, ...rest } = props
      return <span {...rest}>{children}</span>
    },
    p: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      return <p {...props}>{children}</p>
    },
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}))

function makeDashboardData() {
  return {
    isEmpty: false,
    kpis: {
      weekKg: 48,
      lastWeekKg: 52,
      weekDeltaPct: -7.7,
      monthKg: 208,
      streakDays: 5,
      activitiesLogged: 14,
      treesEquivalent: 2.3,
      reductionKg: 4,
    },
    score: {
      value: 72,
      label: 'Good',
      trend: 'up' as const,
      deltaPct: 3.5,
      targetKg: 17.5,
      currentKg: 48,
    },
    trend: [],
    categories: [],
    recentScans: [],
    recentRecommendations: [],
    goals: [],
    forecast: {
      points: [],
      projectedAnnualKg: 2500,
      targetAnnualKg: 1800,
      confidence: 75,
      willHitTarget: false,
    },
  }
}

describe('Dashboard Hero', () => {
  it('renders without crashing', async () => {
    // Dynamic import to avoid page-level deps
    const { DashboardHero } = await import('@/components/dashboard/dashboard-hero')
    const { container } = render(
      <DashboardHero data={makeDashboardData()} firstName="Alex" date="Jun 21, 2026" />,
    )
    expect(container).toBeTruthy()
  })

  it('displays time-based greeting', async () => {
    const { DashboardHero } = await import('@/components/dashboard/dashboard-hero')
    render(<DashboardHero data={makeDashboardData()} firstName="Alex" date="Jun 21, 2026" />)
    // Should show "Good morning", "Good afternoon", or "Good evening"
    const greeting = screen.getByText(/Good (morning|afternoon|evening)/i)
    expect(greeting).toBeInTheDocument()
  })
})

function makeKpis() {
  return {
    weekKg: 48,
    lastWeekKg: 52,
    weekDeltaPct: -7.7,
    monthKg: 208,
    streakDays: 5,
    activitiesLogged: 14,
    treesEquivalent: 2.3,
    reductionKg: 4,
  }
}

describe('Dashboard KPIs', () => {
  it('renders KPI row with metrics', async () => {
    const { KpiRow } = await import('@/components/dashboard/kpi-row')
    render(<KpiRow kpis={makeKpis()} />)
    expect(screen.getByText('48.0kg')).toBeInTheDocument()
    expect(screen.getByText('208kg')).toBeInTheDocument()
  })

  it('displays correct unit labels', async () => {
    const { KpiRow } = await import('@/components/dashboard/kpi-row')
    render(<KpiRow kpis={makeKpis()} />)
    expect(screen.getByText(/this week/i)).toBeInTheDocument()
    expect(screen.getByText(/this month/i)).toBeInTheDocument()
  })
})

describe('Empty State', () => {
  it('renders with default message', async () => {
    const { EmptyState } = await import('@/components/dashboard/empty-state')
    const { Sparkles } = await import('lucide-react')
    render(<EmptyState icon={Sparkles} title="No data yet" body="Start tracking your carbon footprint." />)
    expect(screen.getByText(/no data yet/i)).toBeInTheDocument()
  })

  it('renders with custom title', async () => {
    const { EmptyState } = await import('@/components/dashboard/empty-state')
    const { Sparkles } = await import('lucide-react')
    render(<EmptyState icon={Sparkles} title="Custom Title" body="Description text" />)
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })

  it('renders with custom description', async () => {
    const { EmptyState } = await import('@/components/dashboard/empty-state')
    const { Sparkles } = await import('lucide-react')
    render(<EmptyState icon={Sparkles} title="Title" body="Custom description text" />)
    expect(screen.getByText('Custom description text')).toBeInTheDocument()
  })
})

describe('Section Card', () => {
  it('renders title and children', async () => {
    const { SectionCard } = await import('@/components/dashboard/section-card')
    render(
      <SectionCard title="Test Card">
        <p>Child content</p>
      </SectionCard>,
    )
    expect(screen.getByText('Test Card')).toBeInTheDocument()
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('renders with action', async () => {
    const { SectionCard } = await import('@/components/dashboard/section-card')
    render(
      <SectionCard title="Card" action={<button>Action</button>}>
        <p>Content</p>
      </SectionCard>,
    )
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
  })
})
