'use client'

import * as React from 'react'
import { Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SettingsSection, SettingsRow } from '@/components/settings/settings-section'
import { updateNotifications } from '@/lib/settings-actions'
import type { SettingsData } from '@/lib/services/settings.service'

// ============================================================================
// NotificationsSection — email digest frequency, push, insights, goal
// reminders. Each toggle saves immediately.
// ============================================================================

export function NotificationsSection({
  settings,
}: {
  settings: SettingsData['settings']
}) {
  const router = useRouter()
  const [prefs, setPrefs] = React.useState<{
    emailDigest: 'OFF' | 'WEEKLY' | 'MONTHLY'
    pushEnabled: boolean
    insightNotifications: boolean
    goalReminders: boolean
  }>({
    emailDigest: (settings.emailDigest as 'OFF' | 'WEEKLY' | 'MONTHLY') ?? 'WEEKLY',
    pushEnabled: settings.pushEnabled,
    insightNotifications: settings.insightNotifications,
    goalReminders: settings.goalReminders,
  })

  const handleUpdate = async (updates: Partial<typeof prefs>) => {
    const newPrefs = { ...prefs, ...updates }
    setPrefs(newPrefs) // optimistic
    const res = await updateNotifications(newPrefs)
    if (res.ok) {
      toast.success('Notification settings updated')
      router.refresh()
    } else {
      setPrefs(prefs) // revert
      toast.error('Failed to update')
    }
  }

  return (
    <SettingsSection
      icon={Bell}
      title="Notifications"
      description="How and when we reach you"
    >
      <div className="divide-y">
        <SettingsRow
          label="Email digest"
          description="A periodic summary of your footprint and progress."
        >
          <Select
            value={prefs.emailDigest}
            onValueChange={(v) => handleUpdate({ emailDigest: v as 'OFF' | 'WEEKLY' | 'MONTHLY' })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OFF">Off</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow
          label="Push notifications"
          description="Real-time alerts for milestones and insights."
        >
          <Switch
            checked={prefs.pushEnabled}
            onCheckedChange={(v) => handleUpdate({ pushEnabled: v })}
          />
        </SettingsRow>
        <SettingsRow
          label="Insight notifications"
          description="Get notified when a new weekly AI insight is ready."
        >
          <Switch
            checked={prefs.insightNotifications}
            onCheckedChange={(v) => handleUpdate({ insightNotifications: v })}
          />
        </SettingsRow>
        <SettingsRow
          label="Goal reminders"
          description="Gentle nudges when a goal is behind pace or nearing its end."
        >
          <Switch
            checked={prefs.goalReminders}
            onCheckedChange={(v) => handleUpdate({ goalReminders: v })}
          />
        </SettingsRow>
      </div>
    </SettingsSection>
  )
}
