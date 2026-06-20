import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { estimateApplianceCarbon } from '@/lib/emissions/appliance-calc'

// ============================================================================
// PATCH /api/detect/[id] — Update appliances for a scan.
// Used when the user manually edits AI detection results (especially
// important when AI is unavailable and fallback results need correction).
//
// Body: { appliances: Array<{ name, type, estimatedWatts, estimatedHoursPerDay }> }
// Auth: required (session), must own the scan.
// ============================================================================

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  // --- Auth ---
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  // --- Find scan ---
  const scan = await db.scan.findUnique({ where: { id } })
  if (!scan) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
  }
  if (scan.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // --- Parse body ---
  let body: { appliances?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!Array.isArray(body.appliances) || body.appliances.length === 0) {
    return NextResponse.json(
      { error: 'appliances must be a non-empty array.' },
      { status: 400 },
    )
  }

  // --- Validate each appliance ---
  const validatedAppliances: Array<{
    name: string
    type: string
    estimatedWatts: number
    estimatedHoursPerDay: number
  }> = []

  for (const a of body.appliances) {
    if (!a || typeof a !== 'object') {
      return NextResponse.json(
        { error: 'Each appliance must be an object.' },
        { status: 400 },
      )
    }
    const { name, type, estimatedWatts, estimatedHoursPerDay } = a as Record<
      string,
      unknown
    >

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Each appliance requires a name.' },
        { status: 400 },
      )
    }
    if (!type || !APPLIANCE_TYPES.includes(type as (typeof APPLIANCE_TYPES)[number])) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${APPLIANCE_TYPES.join(', ')}` },
        { status: 400 },
      )
    }
    if (typeof estimatedWatts !== 'number' || estimatedWatts < 1 || estimatedWatts > 20000) {
      return NextResponse.json(
        { error: 'estimatedWatts must be a number between 1 and 20000.' },
        { status: 400 },
      )
    }
    if (typeof estimatedHoursPerDay !== 'number' || estimatedHoursPerDay < 0 || estimatedHoursPerDay > 24) {
      return NextResponse.json(
        { error: 'estimatedHoursPerDay must be a number between 0 and 24.' },
        { status: 400 },
      )
    }

    validatedAppliances.push({
      name: name.trim(),
      type: type as string,
      estimatedWatts,
      estimatedHoursPerDay,
    })
  }

  // --- Compute carbon for each ---
  const withCarbon = validatedAppliances.map((a) => ({
    ...a,
    carbon: estimateApplianceCarbon(a.estimatedWatts, a.estimatedHoursPerDay, 7),
  }))

  const totalAnnualCo2eKg =
    Math.round(withCarbon.reduce((s, a) => s + a.carbon.annualCo2eKg, 0) * 10) / 10

  // --- Delete old detections ---
  await db.detection.deleteMany({ where: { scanId: id } })

  // --- Create new detections ---
  await db.detection.createMany({
    data: withCarbon.map((a) => ({
      scanId: id,
      label: a.name,
      categorySlug: `home.${a.type.toLowerCase()}`,
      amount: a.estimatedWatts,
      unit: 'W',
      co2eKg: a.carbon.annualCo2eKg,
      confidence: 1.0, // user-confirmed
      sourceSnippet: a.name,
      status: 'CONFIRMED',
      aiMetadata: { type: a.type, estimatedWatts: a.estimatedWatts, estimatedHoursPerDay: a.estimatedHoursPerDay, manuallyEdited: true },
    })),
  })

  // --- Update scan status ---
  await db.scan.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      aiModel: 'manual',
    },
  })

  return NextResponse.json({
    ok: true,
    appliances: withCarbon,
    totalAnnualCo2eKg,
  })
}
