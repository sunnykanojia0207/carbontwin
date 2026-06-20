import { PrismaClient } from '@prisma/client'

// ============================================================================
// Prisma client singleton
// ----------------------------------------------------------------------------
// Next.js hot-reloads modules in dev; without a singleton every reload spawns
// a new PrismaClient and exhausts DB connections. We stash one on globalThis.
//
// Logging is env-aware: query logs are dev-only (too noisy for production).
//
// SOFT-DELETE CONVENTION (see prisma/schema.prisma)
//   Every table carries `deletedAt: DateTime?`. Active rows have deletedAt=null.
//   • Active query : db.user.findMany({ where: { ...and: [active(), other] } })
//                    or inline: where: { deletedAt: null, ... }
//   • Soft delete  : db.user.update({ where:{id}, data:{ deletedAt: new Date() } })
//   • Hard delete  : db.user.delete({ where:{id} })   (reserved for GDPR erasure)
//   Soft deletes are NOT auto-filtered by an extension — that hides data from
//   your own admin/audit queries. Explicit filtering keeps everything transparent.
// ============================================================================

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/** Convenience filter for active (non-soft-deleted) rows: `{ deletedAt: null }`. */
export const active = () => ({ deletedAt: null }) as const

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn']
        : ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
