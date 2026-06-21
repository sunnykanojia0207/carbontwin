import { getSession } from '@/lib/auth'
import { getSettingsData } from '@/lib/services/settings.service'
import { SettingsTabs } from '@/components/settings/settings-tabs'

// ============================================================================
// /settings — Settings page with tabbed sections.
// Server Component: fetches all settings data, then delegates to SettingsTabs
// (client component) for the tabbed layout.
//
// Tabs: Profile, Preferences, Theme, Notifications, Privacy & AI,
//       Connected Accounts, API Status
// ============================================================================

export const metadata = {
  title: 'Settings',
}

export default async function SettingsPage() {
  const session = await getSession()
  const data = await getSettingsData(session!.user!.id)

  if (!data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground text-sm">Unable to load settings.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your account, preferences, and data.
        </p>
      </div>

      <SettingsTabs data={data} />
    </div>
  )
}
