import type { MetadataRoute } from 'next'

// ============================================================================
// robots.ts — robots.txt generation.
// Allows crawling of public routes, blocks all authenticated app routes.
// ============================================================================

const BASE_URL = process.env.NEXTAUTH_URL || 'https://carbontwin.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/register'],
        disallow: [
          '/dashboard/',
          '/upload/',
          '/results/',
          '/twin/',
          '/simulator/',
          '/negotiator/',
          '/goals/',
          '/settings/',
          '/onboarding/',
          '/api/',
        ],
      },
      // Social media crawlers can see the landing page for OG previews
      {
        userAgent: ['Googlebot', 'Bingbot', 'Twitterbot', 'facebookexternalhit'],
        allow: '/',
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
