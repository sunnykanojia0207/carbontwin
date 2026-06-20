import { db } from '@/lib/db'

// ============================================================================
// Data Export Service — server-only. Exports user data as CSV/JSON for
// download. Used by the Settings page's "Export My Data" button.
//
// Fields are aligned with prisma/schema.prisma model definitions.
// ============================================================================

export type ExportFormat = 'csv' | 'json'

type ExportableData = {
  scans: Array<Record<string, unknown>>
  detections: Array<Record<string, unknown>>
  carbonResults: Array<Record<string, unknown>>
  appliances: Array<Record<string, unknown>>
  goals: Array<Record<string, unknown>>
  conversations: Array<Record<string, unknown>>
  simulations: Array<Record<string, unknown>>
  recommendations: Array<Record<string, unknown>>
}

/**
 * Fetch all user data for export.
 */
async function collectUserData(userId: string): Promise<ExportableData> {
  const where = { userId, deletedAt: null } as const

  const [scans, detections, carbonResults, appliances, goals, conversations, simulations, recommendations] =
    await Promise.all([
      db.scan.findMany({
        where,
        select: { id: true, type: true, status: true, inputText: true, aiModel: true, createdAt: true, completedAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.detection.findMany({
        where: { deletedAt: null, scan: { userId } },
        select: { id: true, label: true, categorySlug: true, amount: true, unit: true, co2eKg: true, confidence: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      }),
      db.carbonResult.findMany({
        where,
        select: { id: true, scope: true, totalKg: true, unit: true, periodStart: true, periodEnd: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      }),
      db.appliance.findMany({
        where,
        select: { id: true, name: true, type: true, watts: true, quantity: true, hoursPerDay: true, daysPerWeek: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.goal.findMany({
        where,
        select: { id: true, title: true, type: true, status: true, targetKg: true, currentKg: true, baselineKg: true, startDate: true, endDate: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.aIConversation.findMany({
        where,
        select: { id: true, type: true, title: true, outcome: true, messageCount: true, createdAt: true, lastMessageAt: true },
        orderBy: { lastMessageAt: 'desc' },
      }),
      db.simulation.findMany({
        where,
        select: { id: true, name: true, status: true, baselineKg: true, projectedKg: true, reductionKg: true, reductionPct: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.recommendation.findMany({
        where,
        select: { id: true, title: true, potentialKg: true, difficulty: true, impact: true, status: true, categorySlug: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 5000,
      }),
    ])

  return {
    scans: scans as unknown as Array<Record<string, unknown>>,
    detections: detections as unknown as Array<Record<string, unknown>>,
    carbonResults: carbonResults as unknown as Array<Record<string, unknown>>,
    appliances: appliances as unknown as Array<Record<string, unknown>>,
    goals: goals as unknown as Array<Record<string, unknown>>,
    conversations: conversations as unknown as Array<Record<string, unknown>>,
    simulations: simulations as unknown as Array<Record<string, unknown>>,
    recommendations: recommendations as unknown as Array<Record<string, unknown>>,
  }
}

/**
 * Convert an array of objects to CSV.
 */
function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const lines = [headers.join(',')]
  for (const row of rows) {
    const vals = headers.map((h) => {
      const v = row[h]
      if (v === null || v === undefined) return ''
      const s = String(v)
      // Escape quotes and wrap in quotes if contains comma or quote
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    })
    lines.push(vals.join(','))
  }
  return lines.join('\n')
}

/**
 * Export user data as JSON string.
 */
export async function exportAsJson(userId: string): Promise<string> {
  const data = await collectUserData(userId)
  return JSON.stringify(data, null, 2)
}

/**
 * Export user data as multiple CSV files, returned as a record of filename → content.
 */
export async function exportAsCsv(
  userId: string,
): Promise<Record<string, string>> {
  const data = await collectUserData(userId)
  return {
    'scans.csv': toCsv(data.scans),
    'detections.csv': toCsv(data.detections),
    'carbon-results.csv': toCsv(data.carbonResults),
    'appliances.csv': toCsv(data.appliances),
    'goals.csv': toCsv(data.goals),
    'conversations.csv': toCsv(data.conversations),
    'simulations.csv': toCsv(data.simulations),
    'recommendations.csv': toCsv(data.recommendations),
  }
}

/**
 * Get a summary of exportable data counts (for the UI).
 */
export async function getExportSummary(userId: string): Promise<{
  totalRecords: number
  sections: Array<{ label: string; count: number }>
}> {
  const data = await collectUserData(userId)
  const sections = [
    { label: 'Scans', count: data.scans.length },
    { label: 'Detections', count: data.detections.length },
    { label: 'Carbon Results', count: data.carbonResults.length },
    { label: 'Appliances', count: data.appliances.length },
    { label: 'Goals', count: data.goals.length },
    { label: 'Conversations', count: data.conversations.length },
    { label: 'Simulations', count: data.simulations.length },
    { label: 'Recommendations', count: data.recommendations.length },
  ]
  const totalRecords = sections.reduce((sum, s) => sum + s.count, 0)
  return { totalRecords, sections }
}
