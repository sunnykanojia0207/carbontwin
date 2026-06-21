'use client'

import * as React from 'react'
import { Upload, X } from 'lucide-react'

import { cn } from '@/lib/utils'

// ============================================================================
// UploadDropzone — drag & drop + click + paste image upload with preview.
// Calls onFileSelected(file) when a valid image is provided.
// ============================================================================

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB pre-compression

export function UploadDropzone({
  preview,
  onFileSelected,
  onClear,
  disabled,
}: {
  preview: string | null
  onFileSelected: (file: File) => void
  onClear: () => void
  disabled?: boolean
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleFile = React.useCallback(
    (file: File) => {
      setError(null)
      if (!ACCEPTED.includes(file.type)) {
        setError('Please use a JPEG, PNG, or WebP image.')
        return
      }
      if (file.size > MAX_SIZE) {
        setError('Image is too large. Please use an image under 5MB.')
        return
      }
      onFileSelected(file)
    },
    [onFileSelected],
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onPaste = (e: React.ClipboardEvent) => {
    if (disabled) return
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          handleFile(file)
          break
        }
      }
    }
  }

  // If we have a preview, show it
  if (preview) {
    return (
      <div className="group relative overflow-hidden rounded-xl border">
        <img
          src={preview}
          alt="Room preview"
          className="max-h-[400px] w-full object-contain bg-muted/30"
        />
        {!disabled && (
          <button
            onClick={onClear}
            className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-background/80 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background"
            aria-label="Remove image"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    )
  }

  // Dropzone
  return (
    <div onPaste={onPaste} tabIndex={0}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        disabled={disabled}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-16 transition-colors',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/40 hover:bg-accent/30',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <span
          className={cn(
            'flex size-16 items-center justify-center rounded-full transition-colors',
            dragging ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
          )}
        >
          <Upload className="size-7" />
        </span>
        <div className="text-center">
          <p className="text-sm font-medium">
            {dragging ? 'Drop your image here' : 'Drag & drop a room photo'}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            or <span className="text-primary font-medium">browse</span> · paste from clipboard
          </p>
        </div>
        <p className="text-muted-foreground text-[11px]">
          JPEG, PNG, or WebP · up to 5MB
        </p>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')
        }
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = '' // reset so same file can be re-selected
        }}
      />

      {error && (
        <p className="text-destructive mt-2 text-center text-xs">{error}</p>
      )}
    </div>
  )
}
