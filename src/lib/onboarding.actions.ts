'use server'

import { db } from '@/lib/db'
import { getServerSession } from '@/lib/auth'
import { authOptions } from '@/lib/auth'

// ============================================================================
// Onboarding actions — minimal Phase-4 placeholders so the auth loop is
// complete and testable. Full multi-step onboarding arrives in Phase 1.
// ============================================================================

/**
 * Mark the current user's onboarding as complete.
 * Called from the onboarding placeholder "Go to dashboard" button.
 */
export async function completeOnboarding(): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { ok: false, error: 'Not authenticated' }
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { onboardingDone: true },
  })

  return { ok: true }
}
