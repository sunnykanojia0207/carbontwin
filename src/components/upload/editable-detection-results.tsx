'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  Snowflake,
  Refrigerator,
  WashingMachine,
  ChefHat,
  Monitor,
  Lightbulb,
  Droplets,
  Zap,
  Pencil,
  Check,
  X,
  Trash2,
  Plus,
  RotateCcw,
  Loader2,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { estimateApplianceCarbon } from '@/lib/emissions/appliance-calc'
import { formatCo2e } from '@/lib/emissions/appliance-calc'
import { cn } from '@/lib/utils'
import type { DetectedApplianceWithCarbon } from '@/components/upload/detection-results'

// ============================================================================
// EditableDetectionResults — wraps detection results with inline editing.
//
// Allows the user to:
//   • Edit appliance name, type, wattage, and hours per day
//   • Delete appliances
//   • Add new appliances
//   • See real-time carbon updates as they edit
//   • Save changes to the backend
// ============================================================================

const TYPE_ICONS: Record<string, LucideIcon> = {
  HVAC: Snowflake,
  REFRIGERATION: Refrigerator,
  LAUNDRY: WashingMachine,
  KITCHEN: ChefHat,
  ELECTRONICS: Monitor,
  LIGHTING: Lightbulb,
  WATER_HEATING: Droplets,
  OTHER: Zap,
}

const APPLIANCE_TYPES = [
  'HVAC',
  'REFRIGERATION',
  'LAUNDRY',
  'KITCHEN',
  'ELECTRONICS',
  'LIGHTING',
  'WATER_HEATING',
  'OTHER',
] as const

type EditableAppliance = {
  id: string
  name: string
  type: string
  estimatedWatts: number
  estimatedHoursPerDay: number
  confidence: number
  notes: string
}

function computeCarbon(a: EditableAppliance) {
  return estimateApplianceCarbon(a.estimatedWatts, a.estimatedHoursPerDay, 7)
}

export function EditableDetectionResults({
  result,
  scanId,
  onSaved,
}: {
  result: {
    scanId: string
    roomType: string
    summary: string
    appliances: DetectedApplianceWithCarbon[]
    totalAnnualCo2eKg: number
  }
  scanId: string
  onSaved?: () => void
}) {
  const [editing, setEditing] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Initialize editable appliances from props
  const [items, setItems] = React.useState<EditableAppliance[]>(() =>
    result.appliances.map((a, i) => ({
      id: `app-${i}`,
      name: a.name,
      type: a.type,
      estimatedWatts: a.estimatedWatts,
      estimatedHoursPerDay: a.estimatedHoursPerDay,
      confidence: a.confidence,
      notes: a.notes,
    })),
  )

  // Reset items when result changes
  React.useEffect(() => {
    setItems(
      result.appliances.map((a, i) => ({
        id: `app-${i}`,
        name: a.name,
        type: a.type,
        estimatedWatts: a.estimatedWatts,
        estimatedHoursPerDay: a.estimatedHoursPerDay,
        confidence: a.confidence,
        notes: a.notes,
      })),
    )
  }, [result])

  const totalCarbon = items.reduce((s, a) => s + computeCarbon(a).annualCo2eKg, 0)
  const roundedTotal = Math.round(totalCarbon * 10) / 10

  // --- Update a single appliance field ---
  const updateItem = (id: string, field: keyof EditableAppliance, value: unknown) => {
    setItems((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    )
  }

  // --- Delete an appliance ---
  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((a) => a.id !== id))
  }

  // --- Add a blank appliance ---
  const addItem = () => {
    const newId = `app-${Date.now()}`
    setItems((prev) => [
      ...prev,
      {
        id: newId,
        name: '',
        type: 'OTHER',
        estimatedWatts: 100,
        estimatedHoursPerDay: 4,
        confidence: 1,
        notes: 'Added manually',
      },
    ])
  }

  // --- Save to backend ---
  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/detect/${scanId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appliances: items.map((a) => ({
            name: a.name || 'Unnamed appliance',
            type: a.type,
            estimatedWatts: a.estimatedWatts,
            estimatedHoursPerDay: a.estimatedHoursPerDay,
          })),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to save')
      }
      setEditing(false)
      onSaved?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  // --- Cancel editing ---
  const handleCancel = () => {
    setItems(
      result.appliances.map((a, i) => ({
        id: `app-${i}`,
        name: a.name,
        type: a.type,
        estimatedWatts: a.estimatedWatts,
        estimatedHoursPerDay: a.estimatedHoursPerDay,
        confidence: a.confidence,
        notes: a.notes,
      })),
    )
    setEditing(false)
    setError(null)
  }

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl border border-primary/30 bg-primary/5 p-4"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {result.roomType}
            </p>
            <p className="mt-1 text-sm leading-relaxed">{result.summary}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-muted-foreground text-[10px] uppercase tracking-wide">
              Est. annual impact
            </p>
            <p className="text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCo2e(roundedTotal)}
            </p>
            <p className="text-muted-foreground text-[10px]">CO₂e / year</p>
          </div>
        </div>
      </motion.div>

      {/* Edit toggle */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          {items.length} appliance{items.length !== 1 && 's'}
        </p>
        {!editing ? (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-3" />
            Edit
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={handleCancel}
              disabled={saving}
            >
              <X className="size-3" />
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={handleSave}
              disabled={saving || items.length === 0}
            >
              {saving ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Check className="size-3" />
              )}
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        )}
      </div>

      {/* Save error */}
      {error && (
        <p className="text-destructive text-xs">{error}</p>
      )}

      {/* Appliance cards */}
      <div className="space-y-2">
        {items.map((appliance, i) => {
          const Icon = TYPE_ICONS[appliance.type] ?? Zap
          const carbon = computeCarbon(appliance)

          return (
            <motion.div
              key={appliance.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.25 }}
              className={cn(
                'flex items-start gap-3 rounded-xl border p-3 transition-colors',
                editing && 'border-primary/30 bg-primary/[0.02]',
              )}
            >
              {/* Icon */}
              <span className="bg-primary/10 text-primary mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg">
                <Icon className="size-4" />
              </span>

              {/* Editable fields */}
              <div className="min-w-0 flex-1 space-y-1.5">
                {/* Name */}
                {editing ? (
                  <input
                    type="text"
                    value={appliance.name}
                    onChange={(e) => updateItem(appliance.id, 'name', e.target.value)}
                    placeholder="Appliance name"
                    className="w-full rounded-md border bg-card px-2 py-1 text-sm focus-visible:border-primary/40 focus-visible:outline-none"
                  />
                ) : (
                  <p className="truncate text-sm font-medium">{appliance.name}</p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {/* Type dropdown */}
                  {editing ? (
                    <select
                      value={appliance.type}
                      onChange={(e) => updateItem(appliance.id, 'type', e.target.value)}
                      className="rounded-md border bg-card px-1.5 py-1 text-[11px] focus-visible:border-primary/40 focus-visible:outline-none"
                    >
                      {APPLIANCE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase">
                      {appliance.type}
                    </span>
                  )}

                  {/* Watts */}
                  {editing ? (
                    <label className="flex items-center gap-1 rounded-md border bg-card px-1.5 py-1 text-[11px]">
                      <span className="text-muted-foreground" title="Power consumption in watts">
                        Watts
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={20000}
                        value={appliance.estimatedWatts}
                        onChange={(e) =>
                          updateItem(appliance.id, 'estimatedWatts', Math.max(1, Number(e.target.value)))
                        }
                        className="w-16 tabular-nums bg-transparent focus:outline-none"
                      />
                    </label>
                  ) : (
                    <span className="tabular-nums text-xs text-muted-foreground" title="Power consumption">
                      {appliance.estimatedWatts} watts
                    </span>
                  )}

                  {/* Hours/day */}
                  {editing ? (
                    <label className="flex items-center gap-1 rounded-md border bg-card px-1.5 py-1 text-[11px]">
                      <span className="text-muted-foreground" title="Hours used per day">
                        Hrs/day
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={24}
                        step={0.5}
                        value={appliance.estimatedHoursPerDay}
                        onChange={(e) =>
                          updateItem(appliance.id, 'estimatedHoursPerDay', Math.max(0, Math.min(24, Number(e.target.value))))
                        }
                        className="w-14 tabular-nums bg-transparent focus:outline-none"
                      />
                    </label>
                  ) : (
                    <>
                      <span className="text-muted-foreground text-xs">·</span>
                      <span className="tabular-nums text-xs text-muted-foreground" title="Hours used per day">
                        {appliance.estimatedHoursPerDay} hrs/day
                      </span>
                    </>
                  )}

                  {/* kWh/yr (always visible) */}
                  <span className="text-muted-foreground text-xs">·</span>
                  <span className="tabular-nums text-xs text-muted-foreground">
                    {carbon.annualKwh} kWh/yr
                  </span>
                </div>
              </div>

              {/* Carbon impact */}
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCo2e(carbon.annualCo2eKg)}
                </p>
                <p className="text-muted-foreground text-[9px]">CO₂e/yr</p>
              </div>

              {/* Delete button (edit mode only) */}
              {editing && (
                <button
                  onClick={() => deleteItem(appliance.id)}
                  className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label="Delete appliance"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Add appliance button (edit mode only) */}
      {editing && (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-xs"
          onClick={addItem}
        >
          <Plus className="size-3.5" />
          Add appliance
        </Button>
      )}

      {/* Empty state in edit mode */}
      {editing && items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-muted-foreground text-sm">No appliances yet</p>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addItem}>
            <Plus className="size-3.5" />
            Add your first appliance
          </Button>
        </div>
      )}
    </div>
  )
}
