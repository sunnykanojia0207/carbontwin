import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'

import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { detectAppliances } from '@/lib/ai'
import {
  estimateApplianceCarbon,
  type ApplianceCarbon,
} from '@/lib/emissions/appliance-calc'

// ============================================================================
// POST /api/detect — Upload & Detect endpoint.
// Receives a base64 room photo, runs AI appliance detection, stores the
// results (Scan + Detections + Appliances), and returns the structured result.
//
// Body: { image: string (base64, no data: prefix), mimeType: string }
// Auth: required (session).
// ============================================================================

export const maxDuration = 60 // vision model can take 10-30s

type DetectResponse = {
  scanId: string
  roomType: string
  summary: string
  appliances: Array<{
    name: string
    type: string
    estimatedWatts: number
    estimatedHoursPerDay: number
    confidence: number
    notes: string
    carbon: ApplianceCarbon
  }>
  totalAnnualCo2eKg: number
}

export async function POST(request: Request) {
  // --- Auth ---
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  // --- Parse body ---
  let body: { image?: string; mimeType?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const { image, mimeType } = body
  if (!image || !mimeType) {
    return NextResponse.json(
      { error: 'Missing image or mimeType.' },
      { status: 400 },
    )
  }

  // Validate mime type
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    return NextResponse.json(
      { error: 'Unsupported image format. Use JPEG, PNG, or WebP.' },
      { status: 400 },
    )
  }

  // Rough size guard (~4MB base64)
  if (image.length > 4 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'Image too large. Please use an image under 3MB.' },
      { status: 413 },
    )
  }

  // --- Create scan record (status: PROCESSING) ---
  const scan = await db.scan.create({
    data: {
      userId,
      type: 'PHOTO',
      status: 'PROCESSING',
      inputMeta: {
        mime: mimeType,
        size: image.length,
      },
      startedAt: new Date(),
    },
  })

  // --- Run AI detection (via unified facade: rate-limited, cached, fallback-enabled) ---
  try {
    const aiResult = await detectAppliances(userId, image, mimeType)

    // Handle rate limit / hard errors (fallbacks are returned as ok=true with model='fallback')
    if (!aiResult.ok) {
      await db.scan.update({
        where: { id: scan.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          durationMs: scan.startedAt ? Date.now() - scan.startedAt.getTime() : null,
          errorMessage: aiResult.error.message,
        },
      })
      return NextResponse.json({ error: aiResult.error.message }, { status: 429 })
    }

    const { result: detection, model } = { result: aiResult.data, model: aiResult.model }
    const isFallback = model === 'fallback'
    const promptVersion = 'detect-appliances-v1'

    // --- Compute carbon for each appliance ---
    const appliancesWithCarbon = detection.appliances.map((a) => ({
      ...a,
      carbon: estimateApplianceCarbon(
        a.estimatedWatts,
        a.estimatedHoursPerDay,
        7,
      ),
    }))

    const totalAnnualCo2eKg = Math.round(
      appliancesWithCarbon.reduce((s, a) => s + a.carbon.annualCo2eKg, 0) * 10,
    ) / 10

    // --- Store appliances (dedicated table for home-energy tracking) ---
    const applianceRecords = await Promise.all(
      appliancesWithCarbon.map((a) =>
        db.appliance.create({
          data: {
            userId,
            name: a.name,
            type: a.type,
            watts: a.estimatedWatts,
            hoursPerDay: a.estimatedHoursPerDay,
            daysPerWeek: 7,
          },
        }),
      ),
    )

    // --- Store detections (one per appliance, with computed CO₂e) ---
    await db.detection.createMany({
      data: appliancesWithCarbon.map((a, i) => ({
        scanId: scan.id,
        label: a.name,
        categorySlug: `home.${a.type.toLowerCase()}`,
        amount: a.estimatedWatts,
        unit: 'W',
        co2eKg: a.carbon.annualCo2eKg,
        confidence: a.confidence,
        sourceSnippet: a.notes || a.name,
        status: isFallback ? 'PENDING' : 'CONFIRMED',
        aiMetadata: {
          type: a.type,
          estimatedWatts: a.estimatedWatts,
          estimatedHoursPerDay: a.estimatedHoursPerDay,
          applianceId: applianceRecords[i]?.id,
        },
      })),
    })

    // --- Update scan to COMPLETED (store roomType + summary in inputMeta) ---
    await db.scan.update({
      where: { id: scan.id },
      data: {
        status: isFallback ? 'COMPLETED_WITH_WARNING' : 'COMPLETED',
        completedAt: new Date(),
        durationMs: Date.now() - (scan.startedAt?.getTime() ?? Date.now()),
        aiModel: model,
        promptVersion,
        inputMeta: {
          mime: mimeType,
          size: image.length,
          roomType: detection.roomType,
          summary: detection.summary,
        },
      },
    })

    // --- Return the response ---
    const response: DetectResponse & { warning?: string } = {
      scanId: scan.id,
      roomType: detection.roomType,
      summary: detection.summary,
      appliances: appliancesWithCarbon,
      totalAnnualCo2eKg,
      ...(isFallback && {
        warning:
          'AI detection is currently unavailable. The results below are generic estimates — click "Edit" to adjust them.',
      }),
    }

    return NextResponse.json(response)
  } catch (error) {
    // --- Mark scan as FAILED ---
    await db.scan.update({
      where: { id: scan.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        durationMs: Date.now() - (scan.startedAt?.getTime() ?? Date.now()),
        errorMessage:
          error instanceof Error ? error.message : 'Unknown detection error',
      },
    })

    const message =
      error instanceof Error
        ? error.message
        : 'Detection failed. Please try again.'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
