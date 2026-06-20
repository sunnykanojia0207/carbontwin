'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { seedDemoData, clearDashboardData } from '@/lib/services/seed.service'

// ============================================================================
// Demo data controls — client buttons that call the seed/clear server actions
// and refresh the dashboard route so RSC re-fetches.
// ============================================================================

export function LoadDemoDataButton({ className }: { className?: string }) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  const handleLoad = async () => {
    setLoading(true)
    const t = toast.loading('Generating sample data…')
    const res = await seedDemoData()
    if (res.ok) {
      toast.success('Sample data loaded.', { id: t })
      router.refresh()
    } else {
      toast.error(res.error ?? 'Failed to load data.', { id: t })
    }
    setLoading(false)
  }

  return (
    <Button onClick={handleLoad} disabled={loading} className={className}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
      Load sample data
    </Button>
  )
}

export function ResetDataButton({ className }: { className?: string }) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)

  const handleReset = async () => {
    setLoading(true)
    const t = toast.loading('Clearing your data…')
    const res = await clearDashboardData()
    if (res.ok) {
      toast.success('Data cleared.', { id: t })
      router.refresh()
    } else {
      toast.error(res.error ?? 'Failed to clear.', { id: t })
    }
    setLoading(false)
  }

  return (
    <Button
      onClick={handleReset}
      disabled={loading}
      variant="ghost"
      size="sm"
      className={className}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
      Reset
    </Button>
  )
}
