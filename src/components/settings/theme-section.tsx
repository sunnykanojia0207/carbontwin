'use client'

import * as React from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'

import { SettingsSection } from '@/components/settings/settings-section'
import { cn } from '@/lib/utils'

// ============================================================================
// ThemeSection — light/dark/system theme toggle using next-themes.
// Updates the DOM immediately AND persists to the Settings table via the
// parent's updateTheme action (passed as a callback).
// ============================================================================

const THEMES = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

export function ThemeSection({
  savedTheme,
  onThemeChange,
}: {
  savedTheme: string
  onThemeChange: (theme: 'LIGHT' | 'DARK' | 'SYSTEM') => Promise<{ ok: boolean }>
}) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  // Map the saved DB theme to next-themes value
  const currentTheme = React.useMemo(() => {
    const dbTheme = savedTheme.toLowerCase()
    return dbTheme === 'system' ? 'system' : dbTheme === 'dark' ? 'dark' : 'light'
  }, [savedTheme])

  const handleSelect = async (value: string) => {
    setTheme(value) // immediate DOM update
    const dbValue = value.toUpperCase() as 'LIGHT' | 'DARK' | 'SYSTEM'
    await onThemeChange(dbValue) // persist to DB
  }

  return (
    <SettingsSection
      icon={Sun}
      title="Theme"
      description="Choose your preferred appearance"
    >
      <div className="grid grid-cols-3 gap-2">
        {THEMES.map(({ value, label, icon: Icon }) => {
          const isActive = mounted && (theme === value || (!theme && value === currentTheme))
          return (
            <button
              key={value}
              onClick={() => handleSelect(value)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors',
                isActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40 hover:bg-accent/30',
              )}
            >
              <Icon
                className={cn(
                  'size-5 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              />
              <span
                className={cn(
                  'text-xs font-medium',
                  isActive ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
      <p className="text-muted-foreground mt-3 text-center text-[11px]">
        System follows your OS preference automatically.
      </p>
    </SettingsSection>
  )
}
