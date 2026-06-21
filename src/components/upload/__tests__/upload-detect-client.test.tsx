/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      const { initial: _i, animate: _a, transition: _t, ...rest } = props
      return <div {...rest}>{children}</div>
    },
  },
}))

// Mock the child components that are complex
vi.mock('@/components/upload/upload-dropzone', () => ({
  UploadDropzone: ({ onFileSelected, preview, onClear, disabled }: {
    onFileSelected: (file: File) => void
    preview: string | null
    onClear: () => void
    disabled?: boolean
  }) => (
    <div data-testid="upload-dropzone">
      {preview ? (
        <div>
          <img src={preview} alt="preview" data-testid="preview-image" />
          <button onClick={onClear} aria-label="Remove image">X</button>
        </div>
      ) : (
        <button onClick={() => onFileSelected(new File(['test'], 'test.jpg', { type: 'image/jpeg' }))}>
          Select file
        </button>
      )}
    </div>
  ),
}))

vi.mock('@/components/upload/detection-timeline', () => ({
  DetectionTimeline: ({ currentStep, completed, error }: {
    currentStep: number
    completed: boolean
    error: string | null
  }) => (
    <div data-testid="detection-timeline">
      Step: {currentStep} | Completed: {String(completed)} | Error: {error ?? 'null'}
    </div>
  ),
}))

vi.mock('@/components/upload/editable-detection-results', () => ({
  EditableDetectionResults: ({ result, scanId }: {
    result: Record<string, unknown>
    scanId: string
  }) => (
    <div data-testid="editable-results">
      Room: {result.roomType as string} | Scan: {scanId}
    </div>
  ),
}))

import { UploadDetectClient } from '@/components/upload/upload-detect-client'

// Patch Image and canvas for compressImage to work in jsdom.
// - jsdom's FileReader works with real File objects (no mock needed)
// - Image needs a src setter override to fire 'load' events (jsdom doesn't load images)
// - Canvas toDataURL needs to support 'image/jpeg' (jsdom canvas only supports PNG natively)
function setupCompressionMocks() {
  // Mock getContext('2d') — jsdom returns null without the optional 'canvas' package
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (
    this: HTMLCanvasElement,
    contextType: string,
  ) {
    if (contextType === '2d') {
      return {
        drawImage: vi.fn(),
        // CanvasRenderingContext2D has many properties; only drawImage is used here
        canvas: this,
        globalAlpha: 1,
        globalCompositeOperation: 'source-over',
      } as unknown as CanvasRenderingContext2D
    }
    return null
  })

  // Ensure canvas returns valid data for JPEG (jsdom canvas only supports PNG)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(function (
    this: HTMLCanvasElement,
    type?: string,
    _quality?: number,
  ) {
    if (type === 'image/jpeg') {
      return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYI5Q2NkZSsuL8A0uLx/9oADAMBAAIRAxEAPwC1//9k='
    }
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  })

  // Mock window.Image to produce elements that fire 'load' synchronously when src is set
  const OrigImage = window.Image
  const MockImage = function (this: HTMLImageElement, width?: number, height?: number) {
    const img = new OrigImage(width, height)
    const origSrcDesc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src')
    const origSrcSetter = origSrcDesc!.set!
    let savedSrc = ''
    Object.defineProperty(img, 'src', {
      get() { return savedSrc },
      set(value: string) {
        origSrcSetter.call(this, value)
        savedSrc = value
        if (value) {
          Object.defineProperties(this, {
            width: { value: 100, configurable: true },
            height: { value: 100, configurable: true },
            naturalWidth: { value: 100, configurable: true },
            naturalHeight: { value: 100, configurable: true },
          })
          this.dispatchEvent(new Event('load'))
        }
      },
      configurable: true,
      enumerable: true,
    })
    return img
  } as unknown as typeof Image
  MockImage.prototype = OrigImage.prototype
  vi.stubGlobal('Image', MockImage)
}

describe('UploadDetectClient', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the page header', () => {
    render(<UploadDetectClient />)
    expect(screen.getByText('Upload & Detect')).toBeInTheDocument()
    expect(screen.getByText(/Snap a photo of any room/)).toBeInTheDocument()
  })

  it('shows idle state with tips', () => {
    render(<UploadDetectClient />)
    expect(screen.getByText(/Tips for best results/)).toBeInTheDocument()
    expect(screen.getByText(/Capture the whole room/)).toBeInTheDocument()
  })

  it('shows the upload dropzone in idle state', () => {
    render(<UploadDetectClient />)
    expect(screen.getByTestId('upload-dropzone')).toBeInTheDocument()
  })

  it('transitions to previewing state after file selection', async () => {
    setupCompressionMocks()
    const user = userEvent.setup()
    render(<UploadDetectClient />)

    await user.click(screen.getByText('Select file'))

    await waitFor(() => {
      expect(screen.getByText('Analyze with AI')).toBeInTheDocument()
    })
  })

  it('shows analyze and choose different buttons in previewing state', async () => {
    setupCompressionMocks()
    const user = userEvent.setup()
    render(<UploadDetectClient />)

    await user.click(screen.getByText('Select file'))

    await waitFor(() => {
      expect(screen.getByText('Analyze with AI')).toBeInTheDocument()
      expect(screen.getByText('Choose different')).toBeInTheDocument()
    })
  })

  it('transitions to analyzing state when analyze is clicked', async () => {
    setupCompressionMocks()
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        scanId: 'scan-456',
        roomType: 'Kitchen',
        summary: 'Found appliances',
        appliances: [],
        totalAnnualCo2eKg: 0,
      }),
    } as Response)

    render(<UploadDetectClient />)

    await user.click(screen.getByText('Select file'))
    await waitFor(() => expect(screen.getByText('Analyze with AI')).toBeInTheDocument())

    await user.click(screen.getByText('Analyze with AI'))

    await waitFor(() => {
      expect(screen.getByText(/AI is analyzing your photo/)).toBeInTheDocument()
    })
  })

  it('shows results state after successful analysis', async () => {
    setupCompressionMocks()
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        scanId: 'scan-456',
        roomType: 'Kitchen',
        summary: 'Found 5 appliances',
        appliances: [
          { name: 'Fridge', type: 'REFRIGERATION', estimatedWatts: 150, estimatedHoursPerDay: 24, confidence: 0.95, notes: '', carbon: { annualKwh: 1000, annualCo2eKg: 400 } },
        ],
        totalAnnualCo2eKg: 400,
      }),
    } as Response)

    render(<UploadDetectClient />)

    await user.click(screen.getByText('Select file'))
    await waitFor(() => expect(screen.getByText('Analyze with AI')).toBeInTheDocument())

    await user.click(screen.getByText('Analyze with AI'))

    // Wait for the API response + setTimeout(600ms) for results transition
    await waitFor(() => {
      expect(screen.getByTestId('editable-results')).toBeInTheDocument()
    }, { timeout: 5000 })

    await waitFor(() => {
      expect(screen.getByText('Scan another room')).toBeInTheDocument()
      expect(screen.getByText('View full results')).toBeInTheDocument()
    })
  })

  it('shows warning alert when result has warning', async () => {
    setupCompressionMocks()
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        scanId: 'scan-456',
        roomType: 'Kitchen',
        summary: 'Found appliances',
        appliances: [],
        totalAnnualCo2eKg: 0,
        warning: 'Some items may be misidentified',
      }),
    } as Response)

    render(<UploadDetectClient />)

    await user.click(screen.getByText('Select file'))
    await waitFor(() => expect(screen.getByText('Analyze with AI')).toBeInTheDocument())

    await user.click(screen.getByText('Analyze with AI'))

    await waitFor(() => {
      expect(screen.getByText('Some items may be misidentified')).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('shows error state when API call fails', async () => {
    setupCompressionMocks()
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Server error'))

    render(<UploadDetectClient />)

    await user.click(screen.getByText('Select file'))
    await waitFor(() => expect(screen.getByText('Analyze with AI')).toBeInTheDocument())

    await user.click(screen.getByText('Analyze with AI'))

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('shows error state and allows retry', async () => {
    setupCompressionMocks()
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Server error'))

    render(<UploadDetectClient />)

    await user.click(screen.getByText('Select file'))
    await waitFor(() => expect(screen.getByText('Analyze with AI')).toBeInTheDocument())

    await user.click(screen.getByText('Analyze with AI'))

    await waitFor(() => {
      expect(screen.getByText('Try again')).toBeInTheDocument()
    }, { timeout: 5000 })

    // Retry should go back to previewing state
    await user.click(screen.getByText('Try again'))

    await waitFor(() => {
      expect(screen.getByText('Analyze with AI')).toBeInTheDocument()
    })
  })

  it('shows error on file compression failure', async () => {
    // Mock canvas getContext to return null (causes compression failure)
    setupCompressionMocks()
    const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const user = userEvent.setup()

    render(<UploadDetectClient />)

    await user.click(screen.getByText('Select file'))

    await waitFor(() => {
      expect(screen.getByText(/Could not process that image/)).toBeInTheDocument()
    })

    getContextSpy.mockRestore()
  })

  it('resets to idle when "Choose different image" is clicked in error state', async () => {
    setupCompressionMocks()
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Server error'))

    render(<UploadDetectClient />)

    await user.click(screen.getByText('Select file'))
    await waitFor(() => expect(screen.getByText('Analyze with AI')).toBeInTheDocument())

    await user.click(screen.getByText('Analyze with AI'))

    await waitFor(() => {
      expect(screen.getByText('Choose different image')).toBeInTheDocument()
    }, { timeout: 5000 })

    await user.click(screen.getByText('Choose different image'))

    await waitFor(() => {
      expect(screen.getByText('Select file')).toBeInTheDocument()
    })
  })

  it('resets to idle when "Scan another room" is clicked in results', async () => {
    setupCompressionMocks()
    const user = userEvent.setup()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        scanId: 'scan-456',
        roomType: 'Kitchen',
        summary: 'Found appliances',
        appliances: [],
        totalAnnualCo2eKg: 0,
      }),
    } as Response)

    render(<UploadDetectClient />)

    await user.click(screen.getByText('Select file'))
    await waitFor(() => expect(screen.getByText('Analyze with AI')).toBeInTheDocument())

    await user.click(screen.getByText('Analyze with AI'))

    await waitFor(() => {
      expect(screen.getByText('Scan another room')).toBeInTheDocument()
    }, { timeout: 5000 })

    await user.click(screen.getByText('Scan another room'))

    await waitFor(() => {
      expect(screen.getByText('Select file')).toBeInTheDocument()
    })
  })
})
