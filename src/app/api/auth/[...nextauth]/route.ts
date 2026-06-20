import NextAuth from 'next-auth'

import { authOptions } from '@/lib/auth'

// NextAuth v4 route handler — mounts GET + POST at /api/auth/*
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
