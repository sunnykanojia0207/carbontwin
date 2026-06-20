'use client'

import * as React from 'react'
import { User, Loader2, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SettingsSection, SettingsRow } from '@/components/settings/settings-section'
import { updateProfile } from '@/lib/settings-actions'
import type { SettingsData } from '@/lib/services/settings.service'

// ============================================================================
// ProfileSection — name, email (read-only), avatar initials, household,
// region, units, currency.
// ============================================================================

export function ProfileSection({ user }: { user: SettingsData['user'] }) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [name, setName] = React.useState(user.name ?? '')
  const [country, setCountry] = React.useState(user.country ?? '')
  const [region, setRegion] = React.useState(user.region ?? '')
  const [city, setCity] = React.useState(user.city ?? '')
  const [householdSize, setHouseholdSize] = React.useState(String(user.householdSize))
  const [unitSystem, setUnitSystem] = React.useState(user.unitSystem)
  const [currency, setCurrency] = React.useState(user.currency)

  const initials = (name || user.email)
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleSave = async () => {
    setLoading(true)
    const res = await updateProfile({
      name,
      country,
      region,
      city,
      householdSize: parseInt(householdSize) || 1,
      unitSystem: unitSystem as 'METRIC' | 'IMPERIAL',
      currency,
    })
    setLoading(false)
    if (res.ok) {
      toast.success('Profile updated')
      router.refresh()
    } else {
      toast.error(res.error ?? 'Failed to update profile')
    }
  }

  const hasChanges =
    name !== (user.name ?? '') ||
    country !== (user.country ?? '') ||
    region !== (user.region ?? '') ||
    city !== (user.city ?? '') ||
    householdSize !== String(user.householdSize) ||
    unitSystem !== user.unitSystem ||
    currency !== user.currency

  return (
    <SettingsSection
      icon={User}
      title="Profile"
      description="Your account and carbon context"
    >
      <div className="space-y-4">
        {/* Avatar + email */}
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{user.email}</p>
            <p className="text-muted-foreground text-xs">
              Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              {user.plan !== 'FREE' && ` · ${user.plan} plan`}
            </p>
          </div>
        </div>

        {/* Form fields */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="household">Household size</Label>
            <Input
              id="household"
              type="number"
              min="1"
              max="20"
              value={householdSize}
              onChange={(e) => setHouseholdSize(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="San Francisco" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="region">Region / State</Label>
            <Input id="region" value={region} onChange={(e) => setRegion(e.target.value)} placeholder="California" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="country">Country (ISO code)</Label>
            <Input id="country" value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} placeholder="US" maxLength={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} placeholder="USD" maxLength={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Unit system</Label>
            <Select value={unitSystem} onValueChange={setUnitSystem}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="METRIC">Metric (kg, km)</SelectItem>
                <SelectItem value="IMPERIAL">Imperial (lb, mi)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end gap-2 border-t pt-3">
          {hasChanges && (
            <span className="text-muted-foreground text-xs">Unsaved changes</span>
          )}
          <Button onClick={handleSave} disabled={loading || !hasChanges} size="sm">
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : hasChanges ? (
              <Check className="size-4" />
            ) : null}
            Save changes
          </Button>
        </div>
      </div>
    </SettingsSection>
  )
}
