'use client'

import { Link2, Mail, Chrome, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SettingsSection } from '@/components/settings/settings-section'
import type { SettingsData } from '@/lib/services/settings.service'

// ============================================================================
// ConnectedAccountsSection — shows linked OAuth providers (Google) and the
// credentials provider. Allows linking more accounts (future phase).
// ============================================================================

const PROVIDER_META: Record<string, { icon: typeof Mail; label: string; color: string }> = {
  google: { icon: Chrome, label: 'Google', color: '#4285F4' },
  credentials: { icon: Mail, label: 'Email & Password', color: 'var(--primary)' },
}

export function ConnectedAccountsSection({
  accounts,
  email,
  hasPassword,
}: {
  accounts: SettingsData['accounts']
  email: string
  hasPassword: boolean
}) {
  // Build the list of connected providers
  const connected: Array<{
    provider: string
    label: string
    icon: typeof Mail
    color: string
    detail: string
  }> = []

  // Credentials (email + password) is implicit if the user has a hashedPassword
  if (hasPassword) {
    connected.push({
      provider: 'credentials',
      label: 'Email & Password',
      icon: Mail,
      color: 'var(--primary)',
      detail: email,
    })
  }

  // OAuth accounts from the DB
  for (const acc of accounts) {
    const meta = PROVIDER_META[acc.provider]
    if (meta && acc.provider !== 'credentials') {
      connected.push({
        provider: acc.provider,
        label: meta.label,
        icon: meta.icon,
        color: meta.color,
        detail: `Connected ${new Date(acc.connectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      })
    }
  }

  // Available providers not yet connected
  const available = [
    { provider: 'google', label: 'Google', icon: Chrome, color: '#4285F4' },
  ].filter((p) => !connected.some((c) => c.provider === p.provider))

  return (
    <SettingsSection
      icon={Link2}
      title="Connected Accounts"
      description="Sign-in methods and linked providers"
    >
      <div className="space-y-2">
        {/* Connected */}
        {connected.map((acc) => (
          <div
            key={acc.provider}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            <span
              className="flex size-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${acc.color}15`, color: acc.color }}
            >
              <acc.icon className="size-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{acc.label}</p>
              <p className="text-muted-foreground truncate text-xs">{acc.detail}</p>
            </div>
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium">
              Connected
            </span>
          </div>
        ))}

        {/* Available to connect */}
        {available.map((acc) => (
          <div
            key={acc.provider}
            className="flex items-center gap-3 rounded-lg border border-dashed p-3"
          >
            <span
              className="flex size-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${acc.color}15`, color: acc.color }}
            >
              <acc.icon className="size-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{acc.label}</p>
              <p className="text-muted-foreground text-xs">Not connected</p>
            </div>
            <Button variant="outline" size="sm" disabled>
              <Plus className="size-3.5" />
              Connect
            </Button>
          </div>
        ))}

        {connected.length === 0 && available.length === 0 && (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No accounts connected.
          </p>
        )}
      </div>

      <p className="text-muted-foreground mt-3 text-[11px]">
        Linking accounts lets you sign in with either method. Your data stays
        synced across all linked providers.
      </p>
    </SettingsSection>
  )
}
