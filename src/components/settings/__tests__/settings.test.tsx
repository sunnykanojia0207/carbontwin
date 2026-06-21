/// <reference types="vitest/globals" />
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// ============================================================================
// Settings component tests
// ============================================================================

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/settings',
}))

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}))

describe('Theme Section', () => {
  it('renders theme options', async () => {
    const { ThemeSection } = await import('@/components/settings/theme-section')
    render(<ThemeSection savedTheme="LIGHT" onThemeChange={vi.fn()} />)
    expect(screen.getByText(/theme/i)).toBeInTheDocument()
  })

  it('renders light/dark toggle', async () => {
    const { ThemeSection } = await import('@/components/settings/theme-section')
    const { container } = render(<ThemeSection savedTheme="LIGHT" onThemeChange={vi.fn()} />)
    // Should have some interactive element for theme switching
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})

describe('Notifications Section', () => {
  it('renders notification preferences', async () => {
    const { NotificationsSection } = await import('@/components/settings/notifications-section')
    render(
      <NotificationsSection
        settings={{
          theme: 'LIGHT',
          reducedMotion: false,
          plainLanguage: false,
          highContrast: false,
          emailDigest: 'WEEKLY',
          pushEnabled: true,
          insightNotifications: false,
          goalReminders: true,
          aiEnabled: true,
          aiDailyBudget: 20,
          shareTwinPublic: false,
          exportFormat: 'PDF',
        }}
      />,
    )
    expect(screen.getAllByText(/notification/i).length).toBeGreaterThan(0)
  })
})

describe('Profile Section', () => {
  it('renders profile form', async () => {
    const { ProfileSection } = await import('@/components/settings/profile-section')
    render(
      <ProfileSection
        user={{
          id: 'user-1',
          name: 'Alex',
          email: 'alex@example.com',
          image: null,
          plan: 'FREE',
          country: 'US',
          region: 'California',
          city: 'San Francisco',
          householdSize: 2,
          unitSystem: 'METRIC',
          currency: 'USD',
          baselineAnnualKg: null,
          createdAt: new Date('2026-01-01'),
          lastLoginAt: null,
          hasPassword: true,
        }}
      />,
    )
    // Should have some form of user input area
    expect(screen.getByText(/profile/i)).toBeInTheDocument()
  })
})
