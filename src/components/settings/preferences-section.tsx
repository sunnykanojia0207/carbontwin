'use client'

import * as React from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Switch } from '@/components/ui/switch'
import { SettingsSection, SettingsRow } from '@/components/settings/settings-section'
import { updatePreferences } from '@/lib/settings-actions'
import type { SettingsData } from '@/lib/services/settings.service'

// ============================================================================
// PreferencesSection — plain language, reduced motion, high contrast.
// Each toggle saves immediately (optimistic UX, no save button needed).
// ============================================================================

export function PreferencesSection({
  settings,
}: {
  settings: SettingsData['settings']
}) {
  const router = useRouter()
  const [prefs, setPrefs] = React.useState({
    plainLanguage: settings.plainLanguage,
    reducedMotion: settings.reducedMotion,
    highContrast: settings.highContrast,
  })

  const handleToggle = async (key: keyof typeof prefs, value: boolean) => {
    const newPrefs = { ...prefs, [key]: value }
    setPrefs(newPrefs) // optimistic
    const res = await updatePreferences(newPrefs)
    if (res.ok) {
      toast.success('Preferences updated')
      router.refresh()
    } else {
      setPrefs(prefs) // revert
      toast.error('Failed to update')
    }
  }

  return (
    <SettingsSection
      icon={SlidersHorizontal}
      title="Preferences"
      description="Display and accessibility"
    >
      <div className="divide-y">
        <SettingsRow
          label="Plain language mode"
          description="Simplify AI insights to short, jargon-free sentences."
        >
          <Switch
            checked={prefs.plainLanguage}
            onCheckedChange={(v) => handleToggle('plainLanguage', v)}
          />
        </SettingsRow>
        <SettingsRow
          label="Reduced motion"
          description="Disable animations and count-ups."
        >
          <Switch
            checked={prefs.reducedMotion}
            onCheckedChange={(v) => handleToggle('reducedMotion', v)}
          />
        </SettingsRow>
        <SettingsRow
          label="High contrast"
          description="Increase text contrast for readability."
        >
          <Switch
            checked={prefs.highContrast}
            onCheckedChange={(v) => handleToggle('highContrast', v)}
          />
        </SettingsRow>
      </div>
    </SettingsSection>
  )
}
