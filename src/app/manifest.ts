import type { MetadataRoute } from 'next'

// ============================================================================
// manifest.ts — PWA web app manifest for installable experience.
// ============================================================================

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CarbonTwin — Carbon Footprint Tracker',
    short_name: 'CarbonTwin',
    description:
      'Understand your carbon footprint. Track it by photo or voice, and reduce it with AI-powered goals.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B0F0E',
    theme_color: '#059669',
    orientation: 'portrait-primary',
    categories: ['productivity', 'lifestyle', 'utilities'],
    icons: [
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
