import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { exportAsJson, exportAsCsv, getExportSummary } from '@/lib/services/export.service'

// ============================================================================
// GET /api/export — export user data as JSON or CSV.
// GET /api/export?summary=1 — get exportable data summary (no download).
//
// Query params:
//   format: 'json' | 'csv' (default: 'json')
//   summary: '1' to return metadata only (counts per section)
// ============================================================================

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') ?? 'json'
  const isSummary = searchParams.get('summary') === '1'

  const userId = session.user.id

  try {
    // --- Summary mode: return lightweight metadata ---
    if (isSummary) {
      const summary = await getExportSummary(userId)
      return NextResponse.json({ ok: true, data: summary })
    }

    // --- Download mode ---
    if (format === 'csv') {
      const csvFiles = await exportAsCsv(userId)

      const combined: string[] = []
      for (const [filename, content] of Object.entries(csvFiles)) {
        combined.push(`=== ${filename} ===`)
        combined.push(content)
      }
      const body = combined.join('\n\n')

      return new Response(body, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="carbontwin-export.csv"',
        },
      })
    }

    const json = await exportAsJson(userId)
    return new Response(json, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="carbontwin-export.json"',
      },
    })
  } catch (error) {
    console.error('Export failed:', error)
    return NextResponse.json(
      { error: 'Export failed. Please try again.' },
      { status: 500 },
    )
  }
}
