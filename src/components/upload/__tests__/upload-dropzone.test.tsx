/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { UploadDropzone } from '@/components/upload/upload-dropzone'

describe('UploadDropzone', () => {
  const onFileSelected = vi.fn()
  const onClear = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the dropzone when no preview', () => {
    render(
      <UploadDropzone
        preview={null}
        onFileSelected={onFileSelected}
        onClear={onClear}
        disabled={false}
      />,
    )
    expect(screen.getByText(/Drag & drop a room photo/)).toBeInTheDocument()
    expect(screen.getByText(/JPEG, PNG, or WebP/)).toBeInTheDocument()
  })

  it('shows browsing text hint', () => {
    render(
      <UploadDropzone
        preview={null}
        onFileSelected={onFileSelected}
        onClear={onClear}
        disabled={false}
      />,
    )
    expect(screen.getByText(/browse/)).toBeInTheDocument()
  })

  it('shows clipboard paste hint', () => {
    render(
      <UploadDropzone
        preview={null}
        onFileSelected={onFileSelected}
        onClear={onClear}
        disabled={false}
      />,
    )
    expect(screen.getByText(/paste from clipboard/)).toBeInTheDocument()
  })

  it('renders preview image when preview prop is provided', () => {
    render(
      <UploadDropzone
        preview="data:image/jpeg;base64,test123"
        onFileSelected={onFileSelected}
        onClear={onClear}
        disabled={false}
      />,
    )
    expect(screen.getByAltText('Room preview')).toBeInTheDocument()
  })

  it('shows remove button in preview mode', () => {
    render(
      <UploadDropzone
        preview="data:image/jpeg;base64,test123"
        onFileSelected={onFileSelected}
        onClear={onClear}
        disabled={false}
      />,
    )
    expect(screen.getByLabelText('Remove image')).toBeInTheDocument()
  })

  it('does not show remove button when disabled in preview mode', () => {
    render(
      <UploadDropzone
        preview="data:image/jpeg;base64,test123"
        onFileSelected={onFileSelected}
        onClear={onClear}
        disabled={true}
      />,
    )
    expect(screen.queryByLabelText('Remove image')).not.toBeInTheDocument()
  })

  it('calls onClear when remove button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <UploadDropzone
        preview="data:image/jpeg;base64,test123"
        onFileSelected={onFileSelected}
        onClear={onClear}
        disabled={false}
      />,
    )
    await user.click(screen.getByLabelText('Remove image'))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('disables interactions when disabled prop is true', () => {
    render(
      <UploadDropzone
        preview={null}
        onFileSelected={onFileSelected}
        onClear={onClear}
        disabled={true}
      />,
    )
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('shows file format hints', () => {
    render(
      <UploadDropzone
        preview={null}
        onFileSelected={onFileSelected}
        onClear={onClear}
        disabled={false}
      />,
    )
    expect(screen.getByText(/JPEG, PNG, or WebP/)).toBeInTheDocument()
    expect(screen.getByText(/up to 5MB/)).toBeInTheDocument()
  })
})
