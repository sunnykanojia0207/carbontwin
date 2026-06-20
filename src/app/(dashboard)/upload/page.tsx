import { UploadDetectClient } from '@/components/upload/upload-detect-client'

// ============================================================================
// /upload — Upload & Detect page.
// Protected by middleware (see src/middleware.ts matcher).
// The client component handles the full workflow: upload → AI detect → results.
// ============================================================================

export const metadata = {
  title: 'Upload & Detect',
}

export default function UploadPage() {
  return <UploadDetectClient />
}
