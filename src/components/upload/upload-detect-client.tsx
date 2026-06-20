'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, AlertCircle, RotateCcw, ArrowRight, Camera } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UploadDropzone } from '@/components/upload/upload-dropzone'
import { DetectionTimeline } from '@/components/upload/detection-timeline'
import { EditableDetectionResults } from '@/components/upload/editable-detection-results'
import type { DetectedApplianceWithCarbon } from '@/components/upload/detection-results'

// ============================================================================
// UploadDetectClient — the orchestrating client component for the Upload &
// Detect page. Manages the full workflow state machine:
//
//   idle → previewing → analyzing → (results | error) → idle (on reset)
//
// Responsibilities:
//   - File selection (via UploadDropzone)
//   - Client-side image resize/compress (canvas → JPEG 1024px max)
//   - POST to /api/detect
//   - Animated timeline progression during the API call
//   - Success / error / retry state rendering
// ============================================================================

type Phase = 'idle' | 'previewing' | 'analyzing' | 'results' | 'error'

type DetectApiResponse = {
  scanId: string
  roomType: string
  summary: string
  appliances: DetectedApplianceWithCarbon[]
  totalAnnualCo2eKg: number
  warning?: string
}

// Timeline step timing (ms) — cosmetic progression while the API call runs.
// The actual work happens server-side in a single request.
const STEP_TIMINGS = [0, 600, 2200, 5000, 8000]

export function UploadDetectClient() {
  const router = useRouter()
  const [phase, setPhase] = React.useState<Phase>('idle')
  const [preview, setPreview] = React.useState<string | null>(null)
  const [compressedImage, setCompressedImage] = React.useState<{
    base64: string
    mimeType: string
  } | null>(null)
  const [currentStep, setCurrentStep] = React.useState(0)
  const [result, setResult] = React.useState<DetectApiResponse | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const stepTimers = React.useRef<NodeJS.Timeout[]>([])

  // --- Cleanup timers on unmount ---
  React.useEffect(() => {
    return () => {
      stepTimers.current.forEach(clearTimeout)
    }
  }, [])

  // --- File selection → compress + preview ---
  const handleFileSelected = React.useCallback(async (file: File) => {
    setError(null)
    setResult(null)
    setCurrentStep(0)
    setPhase('previewing')

    try {
      const compressed = await compressImage(file)
      setCompressedImage(compressed)
      setPreview(compressed.dataUrl)
    } catch {
      setError('Could not process that image. Try a different one.')
      setPhase('error')
    }
  }, [])

  // --- Analyze → POST to /api/detect ---
  const handleAnalyze = React.useCallback(async () => {
    if (!compressedImage) return

    setPhase('analyzing')
    setError(null)
    setCurrentStep(0)
    setResult(null)

    // Start the cosmetic timeline progression
    stepTimers.current.forEach(clearTimeout)
    stepTimers.current = STEP_TIMINGS.map((delay, i) =>
      setTimeout(() => {
        setCurrentStep(i)
      }, delay),
    )

    try {
      const res = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: compressedImage.base64,
          mimeType: compressedImage.mimeType,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `Detection failed (HTTP ${res.status}).`)
      }

      // Complete the timeline, then show results
      setCurrentStep(4)
      setTimeout(() => {
        setResult(data)
        setPhase('results')
      }, 600)
    } catch (err) {
      stepTimers.current.forEach(clearTimeout)
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.',
      )
      setPhase('error')
    }
  }, [compressedImage])

  // --- Reset to idle ---
  const handleReset = React.useCallback(() => {
    stepTimers.current.forEach(clearTimeout)
    setPhase('idle')
    setPreview(null)
    setCompressedImage(null)
    setResult(null)
    setError(null)
    setCurrentStep(0)
  }, [])

  // --- Retry from the analyzing step (keeps the same image) ---
  const handleRetry = React.useCallback(() => {
    setError(null)
    setPhase('previewing')
  }, [])

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:py-8">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Camera className="text-primary size-6" />
          Upload &amp; Detect
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Snap a photo of any room. AI will detect appliances and estimate
          their carbon impact.
        </p>
      </div>

      {/* Phase: idle / previewing — dropzone + analyze button */}
      {(phase === 'idle' || phase === 'previewing') && (
        <div className="space-y-4">
          <UploadDropzone
            preview={preview}
            onFileSelected={handleFileSelected}
            onClear={handleReset}
            disabled={false}
          />

          {phase === 'previewing' && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={handleAnalyze}
                size="lg"
                className="flex-1"
              >
                <Sparkles className="size-4" />
                Analyze with AI
              </Button>
              <Button onClick={handleReset} variant="outline" size="lg">
                <RotateCcw className="size-4" />
                Choose different
              </Button>
            </div>
          )}

          {/* Tips */}
          {phase === 'idle' && (
            <div className="rounded-xl border bg-muted/20 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Tips for best results
              </p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>• Capture the whole room — more appliances visible means better detection</li>
                <li>• Good lighting helps the AI identify device types accurately</li>
                <li>• Include power strips, chargers, and small electronics too</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Phase: analyzing — timeline */}
      {phase === 'analyzing' && (
        <div className="space-y-4">
          {preview && (
            <div className="relative overflow-hidden rounded-xl border">
              <img
                src={preview}
                alt="Analyzing"
                className="max-h-[300px] w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-sm font-medium">AI is analyzing your photo…</p>
              </div>
            </div>
          )}
          <div className="rounded-xl border bg-card p-4">
            <DetectionTimeline
              currentStep={currentStep}
              completed={false}
              error={null}
            />
          </div>
        </div>
      )}

      {/* Phase: results */}
      {phase === 'results' && result && (
        <div className="space-y-4">
          {result.warning && (
            <Alert variant="default" className="border-amber-500/30 bg-amber-500/5">
              <AlertCircle className="size-4 text-amber-600" />
              <AlertDescription className="text-amber-700 dark:text-amber-300 text-xs">
                {result.warning}
              </AlertDescription>
            </Alert>
          )}

          {preview && (
            <div className="overflow-hidden rounded-xl border">
              <img
                src={preview}
                alt="Analyzed room"
                className="max-h-[200px] w-full object-cover"
              />
            </div>
          )}
          <EditableDetectionResults result={result} scanId={result.scanId} />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleReset} variant="outline" size="lg" className="flex-1">
              <Camera className="size-4" />
              Scan another room
            </Button>
            <Button
              onClick={() => router.push(`/results?scanId=${result.scanId}`)}
              size="lg"
              className="flex-1"
            >
              View full results
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Phase: error */}
      {phase === 'error' && (
        <div className="space-y-4">
          {preview && (
            <div className="overflow-hidden rounded-xl border opacity-50">
              <img src={preview} alt="Failed" className="max-h-[200px] w-full object-cover" />
            </div>
          )}
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              {error || 'Detection failed. Please try again.'}
            </AlertDescription>
          </Alert>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleRetry} variant="outline" size="lg" className="flex-1">
              <RotateCcw className="size-4" />
              Try again
            </Button>
            <Button onClick={handleReset} size="lg" className="flex-1">
              <Camera className="size-4" />
              Choose different image
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Image compression — resizes to max 1024px on the longest edge and converts
// to JPEG at 0.85 quality. Keeps the base64 payload small (~100-200KB) while
// preserving enough detail for the vision model.
// ============================================================================

async function compressImage(
  file: File,
): Promise<{ base64: string; mimeType: string; dataUrl: string }> {
  const dataUrl = await fileToDataUrl(file)
  const img = await loadImage(dataUrl)

  const MAX_SIZE = 1024
  let { width, height } = img
  if (width > MAX_SIZE || height > MAX_SIZE) {
    if (width > height) {
      height = Math.round((height * MAX_SIZE) / width)
      width = MAX_SIZE
    } else {
      width = Math.round((width * MAX_SIZE) / height)
      height = MAX_SIZE
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not available.')
  ctx.drawImage(img, 0, 0, width, height)

  // PNGs with transparency stay PNG; everything else becomes JPEG
  const isPng = file.type === 'image/png'
  const mimeType = isPng ? 'image/png' : 'image/jpeg'
  const quality = isPng ? undefined : 0.85
  const compressedDataUrl = canvas.toDataURL(mimeType, quality)

  // Strip the "data:image/jpeg;base64," prefix
  const base64 = compressedDataUrl.split(',')[1]

  return { base64, mimeType, dataUrl: compressedDataUrl }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Could not read file.'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image.'))
    img.src = src
  })
}
