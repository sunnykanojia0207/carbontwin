'use client'

import * as React from 'react'
import { Plus, Loader2, Sparkles, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createGoal } from '@/lib/goal-actions'

// ============================================================================
// CreateGoalDialog — modal form for creating a new goal. Includes AI
// suggestion integration (suggestions are shown alongside the form and can
// be clicked to pre-fill the fields).
// ============================================================================

export type GoalSuggestion = {
  title: string
  description: string
  targetKg: number
  type: 'WEEKLY' | 'MONTHLY' | 'ANNUAL' | 'ONE_TIME'
  category: string
  difficulty: string
  potentialImpact: string
  rationale: string
}

export function CreateGoalDialog({
  suggestions,
}: {
  suggestions: GoalSuggestion[]
}) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [description, setDescription] = React.useState('')
  const [type, setType] = React.useState<'WEEKLY' | 'MONTHLY' | 'ANNUAL' | 'ONE_TIME'>('WEEKLY')
  const [targetKg, setTargetKg] = React.useState('')
  const [durationDays, setDurationDays] = React.useState('7')

  const applySuggestion = (s: GoalSuggestion) => {
    setTitle(s.title)
    setDescription(s.description)
    setType(s.type)
    setTargetKg(String(s.targetKg))
    setDurationDays(s.type === 'WEEKLY' ? '7' : s.type === 'MONTHLY' ? '30' : '365')
  }

  const handleSubmit = async () => {
    if (!title.trim() || !targetKg.trim()) {
      toast.error('Please fill in the title and target.')
      return
    }
    setLoading(true)
    const res = await createGoal({
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      targetKg: parseFloat(targetKg),
      baselineKg: parseFloat(targetKg),
      durationDays: parseInt(durationDays),
    })
    setLoading(false)
    if (res.ok) {
      toast.success('Goal created!', { description: title })
      setOpen(false)
      setTitle('')
      setDescription('')
      setTargetKg('')
      router.refresh()
    } else {
      toast.error(res.error ?? 'Failed to create goal')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          New Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a Goal</DialogTitle>
          <DialogDescription>
            Set a reduction target you&apos;ll actually keep. Start small — you
            can always add more.
          </DialogDescription>
        </DialogHeader>

        {/* AI suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <Sparkles className="text-primary size-3" />
              AI suggestions — click to use
            </p>
            <div className="max-h-32 space-y-1.5 overflow-y-auto scrollbar-thin">
              {suggestions.slice(0, 3).map((s, i) => (
                <button
                  key={i}
                  onClick={() => applySuggestion(s)}
                  className="hover:border-primary/40 flex w-full items-start gap-2 rounded-lg border p-2.5 text-left transition-colors"
                >
                  <Check className="text-muted-foreground/40 mt-0.5 size-3.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{s.title}</p>
                    <p className="text-muted-foreground text-[10px]">
                      {s.type} · {s.targetKg}kg · {s.difficulty}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="goal-title">Title</Label>
            <Input
              id="goal-title"
              placeholder="e.g. Cut weekly transport by 20%"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal-desc">Description (optional)</Label>
            <Textarea
              id="goal-desc"
              placeholder="What does this goal involve?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="goal-type">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger id="goal-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                  <SelectItem value="ONE_TIME">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-target">Target (kg CO₂e)</Label>
              <Input
                id="goal-target"
                type="number"
                placeholder="15"
                value={targetKg}
                onChange={(e) => setTargetKg(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal-duration">Duration (days)</Label>
            <Input
              id="goal-duration"
              type="number"
              placeholder="7"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            Create Goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
