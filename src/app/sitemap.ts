import type { MetadataRoute } from 'next'

// ============================================================================
// sitemap.ts — dynamic sitemap generation.
// Public marketing routes are listed; authenticated routes are excluded
// (they redirect to /login and aren't crawlable).
// ============================================================================

const BASE_URL = process.env.NEXTAUTH_URL || 'https://carbontwin.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const publicRoutes = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/forgot-password`,
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ]

  return publicRoutes
}
