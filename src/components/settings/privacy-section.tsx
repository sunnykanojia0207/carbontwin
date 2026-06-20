'use client'

import * as React from 'react'
import { Shield, AlertTriangle, Loader2, Download, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { signOut } from 'next-auth/react'

import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { SettingsSection, SettingsRow } from '@/components/settings/settings-section'
import { updatePrivacy, deleteAccount } from '@/lib/settings-actions'
import type { SettingsData } from '@/lib/services/settings.service'

// ============================================================================
// PrivacySection — AI toggle, daily budget slider, public Twin sharing,
// plus the danger zone (export data, delete account).
// ============================================================================

export function PrivacySection({
  settings,
}: {
  settings: SettingsData['settings']
}) {
  const router = useRouter()
  const [prefs, setPrefs] = React.useState({
    aiEnabled: settings.aiEnabled,
    aiDailyBudget: settings.aiDailyBudget,
    shareTwinPublic: settings.shareTwinPublic,
  })
  const [deleting, setDeleting] = React.useState(false)
  const [confirmText, setConfirmText] = React.useState('')

  const handleUpdate = async (updates: Partial<typeof prefs>) => {
    const newPrefs = { ...prefs, ...updates }
    setPrefs(newPrefs)
    const res = await updatePrivacy(newPrefs)
    if (res.ok) {
      toast.success('Privacy settings updated')
      router.refresh()
    } else {
      setPrefs(prefs)
      toast.error('Failed to update')
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    const res = await deleteAccount()
    if (res.ok) {
      toast.success('Account deleted')
      await signOut({ callbackUrl: '/' })
    } else {
      setDeleting(false)
      toast.error('Failed to delete account')
    }
  }

  return (
    <SettingsSection
      icon={Shield}
      title="Privacy & AI"
      description="Control your data and AI features"
    >
      <div className="divide-y">
        <SettingsRow
          label="AI features"
          description="Enable AI insights, negotiator, and detection. Disabling falls back to deterministic mode."
        >
          <Switch
            checked={prefs.aiEnabled}
            onCheckedChange={(v) => handleUpdate({ aiEnabled: v })}
          />
        </SettingsRow>

        {/* AI daily budget slider */}
        <div className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">AI daily budget</p>
              <p className="text-muted-foreground text-xs">
                Max AI messages per day. Resets at midnight.
              </p>
            </div>
            <span className="bg-primary/10 text-primary rounded-md px-2.5 py-1 text-sm font-semibold tabular-nums">
              {prefs.aiDailyBudget}/day
            </span>
          </div>
          <Slider
            value={[prefs.aiDailyBudget]}
            onValueChange={([v]) => setPrefs((p) => ({ ...p, aiDailyBudget: v }))}
            onValueCommit={([v]) => handleUpdate({ aiDailyBudget: v })}
            min={0}
            max={50}
            step={5}
            className="mt-3"
          />
          <div className="text-muted-foreground mt-1 flex justify-between text-[10px]">
            <span>0 (off)</span>
            <span>20 (default)</span>
            <span>50 (power user)</span>
          </div>
        </div>

        <SettingsRow
          label="Share Climate Twin publicly"
          description="Allow others to view your Twin via a shareable link."
        >
          <Switch
            checked={prefs.shareTwinPublic}
            onCheckedChange={(v) => handleUpdate({ shareTwinPublic: v })}
          />
        </SettingsRow>
      </div>

      {/* Danger zone */}
      <div className="mt-4 space-y-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-destructive">
          <AlertTriangle className="size-3.5" />
          Danger zone
        </p>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Export your data</p>
            <p className="text-muted-foreground text-xs">
              Download all your activities, goals, and scans as CSV.
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="size-3.5" />
            Export
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-destructive/15 pt-3">
          <div>
            <p className="text-sm font-medium">Delete account</p>
            <p className="text-muted-foreground text-xs">
              Permanently erase all your data and your Climate Twin.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently erases your account, all scans, detections,
                  appliances, goals, and AI conversations. This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">
                  Type <strong className="text-foreground">DELETE MY TWIN</strong> to confirm
                </Label>
                <Input
                  id="confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE MY TWIN"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText('')}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={confirmText !== 'DELETE MY TWIN' || deleting}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {deleting && <Loader2 className="size-4 animate-spin" />}
                  Delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </SettingsSection>
  )
}
