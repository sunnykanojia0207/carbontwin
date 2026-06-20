import { withAuth } from 'next-auth/middleware'

// ============================================================================
// Route protection middleware (Edge runtime).
//
// Strategy: explicitly match ONLY known private app routes. Everything else
// (marketing /, /pricing, /about, auth pages, /api/*, static assets) is public.
//
//   • Authenticated users pass through.
//   • Unauthenticated users are redirected to /login?callbackUrl=<original>.
//
// API routes are intentionally NOT matched here — they self-protect via
// getServerSession() and return 401 JSON (a redirect to an HTML login page
// would be wrong for fetch callers).
//
// "Already logged in visiting /login" is handled client-side in the auth
// pages (via useSession) so this middleware stays minimal.
// ============================================================================

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/settings/:path*',
    '/coach/:path*',
    '/insights/:path*',
    '/goals/:path*',
    '/activities/:path*',
    '/simulator/:path*',
    '/twin/:path*',
    '/upload/:path*',
    '/results/:path*',
    '/recommendations/:path*',
    '/negotiator/:path*',
  ],
}

export default withAuth({
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized: ({ token }) => !!token,
  },
})
