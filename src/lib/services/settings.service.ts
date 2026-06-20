import { db, active } from '@/lib/db'
import { LAST_QUOTA_ERROR } from '@/lib/ai'

// ============================================================================
// Settings data service — server-only.
// Loads the user's profile + settings (creating defaults if missing), plus
// connected OAuth accounts and AI usage stats.
// ============================================================================

export type SettingsData = {
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    plan: string
    country: string | null
    region: string | null
    city: string | null
    householdSize: number
    unitSystem: string
    currency: string
    baselineAnnualKg: number | null
    createdAt: Date
    lastLoginAt: Date | null
    hasPassword: boolean
  }
  settings: {
    theme: string
    reducedMotion: boolean
    plainLanguage: boolean
    highContrast: boolean
    emailDigest: string
    pushEnabled: boolean
    insightNotifications: boolean
    goalReminders: boolean
    aiEnabled: boolean
    aiDailyBudget: number
    shareTwinPublic: boolean
    exportFormat: string
  }
  accounts: ConnectedAccount[]
  aiUsage: {
    totalConversations: number
    totalMessages: number
    todayMessageCount: number
    dailyBudget: number
    budgetRemaining: number
    quotaExhausted: boolean
  }
}

export type ConnectedAccount = {
  id: string
  provider: string
  connectedAt: Date
}

export async function getSettingsData(userId: string): Promise<SettingsData | null> {
  const [user, accounts, aiConversations, todayMessages] = await Promise.all([
    db.user.findFirst({
      where: { id: userId, ...active() },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        plan: true,
        country: true,
        region: true,
        city: true,
        householdSize: true,
        unitSystem: true,
        currency: true,
        baselineAnnualKg: true,
        createdAt: true,
        lastLoginAt: true,
        hashedPassword: true,
      },
    }),
    db.account.findMany({
      where: { userId },
      select: { id: true, provider: true },
    }),
    db.aIConversation.count({
      where: { userId, deletedAt: null },
    }),
    db.aIMessage.count({
      where: {
        conversation: { userId },
        role: 'USER',
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ])

  if (!user) return null

  // Ensure a Settings row exists (create defaults if missing)
  let settings = await db.settings.findUnique({ where: { userId } })
  if (!settings) {
    settings = await db.settings.create({ data: { userId } })
  }

  return {
    user: {
      ...user,
      hasPassword: !!user.hashedPassword,
    },
    settings: {
      theme: settings.theme,
      reducedMotion: settings.reducedMotion,
      plainLanguage: settings.plainLanguage,
      highContrast: settings.highContrast,
      emailDigest: settings.emailDigest,
      pushEnabled: settings.pushEnabled,
      insightNotifications: settings.insightNotifications,
      goalReminders: settings.goalReminders,
      aiEnabled: settings.aiEnabled,
      aiDailyBudget: settings.aiDailyBudget,
      shareTwinPublic: settings.shareTwinPublic,
      exportFormat: settings.exportFormat,
    },
    accounts: accounts.map((a) => ({
      id: a.id,
      provider: a.provider,
      connectedAt: new Date(), // Account model has no createdAt; approximate
    })),
    aiUsage: {
      totalConversations: aiConversations,
      totalMessages: 0, // computed below if needed
      todayMessageCount: todayMessages,
      dailyBudget: settings.aiDailyBudget,
      budgetRemaining: Math.max(0, settings.aiDailyBudget - todayMessages),
      quotaExhausted: (LAST_QUOTA_ERROR[userId] ?? 0) > Date.now() - 300_000,
    },
  }
}
