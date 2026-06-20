'use client'

import * as React from 'react'
import {
  User,
  SlidersHorizontal,
  Palette,
  Bell,
  Shield,
  Link2,
  Activity,
} from 'lucide-react'

import { PageTabs, type TabItem } from '@/components/shared/page-tabs'
import { ProfileSection } from '@/components/settings/profile-section'
import { PreferencesSection } from '@/components/settings/preferences-section'
import { ThemeSection } from '@/components/settings/theme-section'
import { NotificationsSection } from '@/components/settings/notifications-section'
import { PrivacySection } from '@/components/settings/privacy-section'
import { ConnectedAccountsSection } from '@/components/settings/connected-accounts-section'
import { ApiStatusSection } from '@/components/settings/api-status-section'
import { updateTheme } from '@/lib/settings-actions'
import type { SettingsData } from '@/lib/services/settings.service'

// ============================================================================
// SettingsTabs — tabbed layout for the Settings page.
//
// Tabs:
//   Profile           → name, email, country, region, household
//   Preferences       → plain language, reduced motion, high contrast
//   Theme             → light / dark / system
//   Notifications     → email digest, push, insights, goals
//   Privacy & AI      → AI toggle, budget, share twin
//   Connected Accounts → OAuth accounts, password
//   API Status        → AI usage, daily budget
// ============================================================================

interface SettingsTabsProps {
  data: SettingsData
}

export function SettingsTabs({ data }: SettingsTabsProps) {
  const hasPassword = data.user.hasPassword

  const tabs: TabItem[] = React.useMemo(
    () => [
      {
        value: 'profile',
        label: 'Profile',
        icon: User,
        content: <ProfileSection user={data.user} />,
      },
      {
        value: 'preferences',
        label: 'Preferences',
        icon: SlidersHorizontal,
        content: <PreferencesSection settings={data.settings} />,
      },
      {
        value: 'theme',
        label: 'Theme',
        icon: Palette,
        content: (
          <ThemeSection
            savedTheme={data.settings.theme}
            onThemeChange={updateTheme}
          />
        ),
      },
      {
        value: 'notifications',
        label: 'Notifications',
        icon: Bell,
        content: <NotificationsSection settings={data.settings} />,
      },
      {
        value: 'privacy',
        label: 'Privacy & AI',
        icon: Shield,
        content: <PrivacySection settings={data.settings} />,
      },
      {
        value: 'accounts',
        label: 'Connected Accounts',
        icon: Link2,
        content: (
          <ConnectedAccountsSection
            accounts={data.accounts}
            email={data.user.email}
            hasPassword={hasPassword}
          />
        ),
      },
      {
        value: 'api',
        label: 'API Status',
        icon: Activity,
        content: (
          <ApiStatusSection
            aiUsage={data.aiUsage}
            aiEnabled={data.settings.aiEnabled}
          />
        ),
      },
    ],
    [data, hasPassword],
  )

  return (
    <PageTabs
      tabs={tabs}
      defaultTab="profile"
      paramKey="st"
      variant="secondary"
    />
  )
}
