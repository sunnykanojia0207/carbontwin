'use server'

import { db } from '@/lib/db'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ============================================================================
// Settings server actions — all auth-gated, Zod-validated.
// Each action updates a specific section of the user's profile or settings.
// ============================================================================

// --- Profile ---
const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(80).trim(),
  country: z.string().max(2).optional().or(z.literal('')),
  region: z.string().max(100).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  householdSize: z.number().min(1).max(20),
  unitSystem: z.enum(['METRIC', 'IMPERIAL']),
  currency: z.string().max(3).default('USD'),
})

export async function updateProfile(input: z.infer<typeof profileSchema>) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { ok: false, error: 'Not authenticated' }

  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      country: parsed.data.country || null,
      region: parsed.data.region || null,
      city: parsed.data.city || null,
      householdSize: parsed.data.householdSize,
      unitSystem: parsed.data.unitSystem,
      currency: parsed.data.currency,
    },
  })

  revalidatePath('/settings')
  return { ok: true }
}

// --- Preferences ---
const preferencesSchema = z.object({
  plainLanguage: z.boolean(),
  reducedMotion: z.boolean(),
  highContrast: z.boolean(),
})

export async function updatePreferences(input: z.infer<typeof preferencesSchema>) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { ok: false, error: 'Not authenticated' }

  const parsed = preferencesSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid input' }

  await db.settings.update({
    where: { userId: session.user.id },
    data: parsed.data,
  })

  revalidatePath('/settings')
  return { ok: true }
}

// --- Theme ---
export async function updateTheme(theme: 'LIGHT' | 'DARK' | 'SYSTEM') {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { ok: false, error: 'Not authenticated' }

  await db.settings.update({
    where: { userId: session.user.id },
    data: { theme },
  })

  revalidatePath('/settings')
  return { ok: true }
}

// --- Notifications ---
const notificationsSchema = z.object({
  emailDigest: z.enum(['OFF', 'WEEKLY', 'MONTHLY']),
  pushEnabled: z.boolean(),
  insightNotifications: z.boolean(),
  goalReminders: z.boolean(),
})

export async function updateNotifications(input: z.infer<typeof notificationsSchema>) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { ok: false, error: 'Not authenticated' }

  const parsed = notificationsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid input' }

  await db.settings.update({
    where: { userId: session.user.id },
    data: parsed.data,
  })

  revalidatePath('/settings')
  return { ok: true }
}

// --- Privacy / AI ---
const privacySchema = z.object({
  aiEnabled: z.boolean(),
  aiDailyBudget: z.number().min(0).max(100),
  shareTwinPublic: z.boolean(),
})

export async function updatePrivacy(input: z.infer<typeof privacySchema>) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { ok: false, error: 'Not authenticated' }

  const parsed = privacySchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid input' }

  await db.settings.update({
    where: { userId: session.user.id },
    data: parsed.data,
  })

  revalidatePath('/settings')
  return { ok: true }
}

// --- Danger zone ---
export async function deleteAccount() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { ok: false, error: 'Not authenticated' }

  // Soft-delete the user (cascades to all personal data)
  await db.user.update({
    where: { id: session.user.id },
    data: { deletedAt: new Date() },
  })

  revalidatePath('/settings')
  return { ok: true }
}
