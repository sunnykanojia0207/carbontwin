# CarbonTwin — Deployment Guide

Complete guide to deploying CarbonTwin to Vercel (or any Next.js-compatible host).

## 🚀 One-Click Vercel Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Click the button above (or go to [vercel.com/new](https://vercel.com/new))
2. Import your GitHub repository
3. Add environment variables (see [Environment Setup](#environment-setup) below)
4. Click **Deploy**

Vercel auto-detects Next.js and handles the build. The `vercel.json` in this repo pre-configures everything.

---

## 📋 Prerequisites

Before deploying, ensure you have:

- A **GitHub account** with the CarbonTwin repo pushed
- A **Vercel account** (free tier works)
- A **PostgreSQL database** (recommended: [Neon](https://neon.tech), [Supabase](https://supabase.com), or Vercel Postgres)
- A **Google Gemini API key** (optional — app degrades gracefully without it)
- **Google OAuth credentials** (optional — for Google login)

---

## 🔧 Environment Setup

### 1. Database (PostgreSQL)

**Recommended: Neon (free tier)**

1. Go to [neon.tech](https://neon.tech) and create an account
2. Create a new project
3. Copy the connection string (looks like `postgresql://user:pass@host/db?sslmode=require`)
4. Set it as `DATABASE_URL` in Vercel

**Alternative: Vercel Postgres**

1. In your Vercel project, go to Storage → Create Database → Postgres
2. Copy the connection string

### 2. Auth Secret

Generate a random secret:

```bash
openssl rand -base64 32
```

Set it as `AUTH_SECRET` and `NEXTAUTH_SECRET` in Vercel.

### 3. Gemini API Key

1. Get a key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Set it as `GEMINI_API_KEY` in Vercel
3. If not set, all AI features use deterministic fallbacks (the app still works)

### 4. Google OAuth (optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Add authorized redirect URI: `https://YOUR-DOMAIN.vercel.app/api/auth/callback/google`
5. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Vercel

### 5. NextAuth URL

Set `NEXTAUTH_URL` to your production URL: `https://your-project.vercel.app`

---

## 🌐 Vercel Environment Variables

In your Vercel project dashboard → Settings → Environment Variables, add:

| Variable | Value | Environments |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | Production, Preview |
| `AUTH_SECRET` | (random 32-byte base64) | Production, Preview |
| `NEXTAUTH_SECRET` | (same as AUTH_SECRET) | Production, Preview |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production |
| `GEMINI_API_KEY` | (your Gemini API key) | Production, Preview |
| `GOOGLE_CLIENT_ID` | (Google OAuth client ID) | Production, Preview |
| `GOOGLE_CLIENT_SECRET` | (Google OAuth secret) | Production, Preview |

---

## ⚙️ Vercel Configuration

The repo includes a `vercel.json` that configures:

- **Build command**: `prisma generate && next build`
- **Install command**: `bun install`
- **Cron jobs**: Daily rollups for insights and goal progress
- **Headers**: Security headers (X-Frame-Options, CSP, etc.)

No manual configuration needed — Vercel reads this automatically.

---

## 🗄 Database Migration

After the first deploy, run the Prisma migration:

```bash
# Install Vercel CLI
npm i -g vercel

# Link your project
vercel link

# Pull production env vars
vercel env pull .env.production

# Run migration against production DB
bunx prisma migrate deploy
```

Or use the Prisma Data Platform to run migrations via a web UI.

---

## 🔍 Post-Deploy Verification

After deployment, verify:

1. **Landing page** loads at your Vercel URL
2. **Register** works — create a test account
3. **Login** works — sign in with credentials
4. **Google OAuth** works (if configured) — sign in with Google
5. **Upload & Detect** works — upload a room photo, get AI detections
6. **Dashboard** shows data after uploading
7. **AI Negotiator** responds to messages
8. **Sitemap** accessible at `/sitemap.xml`
9. **Robots.txt** accessible at `/robots.txt`
10. **OG image** loads at `/og.png`

---

## 🔄 Continuous Deployment

Once set up, every push to `main` auto-deploys to production. Pull requests create preview deployments with isolated preview databases (if using Neon branching).

### Build Pipeline

1. **PR opened** → Vercel creates a preview deployment
2. **PR merged to main** → Vercel deploys to production
3. **Cron jobs** run daily for data rollups

---

## 📊 Performance Optimization

The app includes these optimizations:

- **Server Components** by default; client islands only where needed
- **Image optimization** via `next/image` (AVIF/WebP, 24h cache)
- **Code splitting** via dynamic imports for heavy charts
- **Font optimization** via `next/font` (Geist, `display: swap`)
- **Static assets** cached for 1 year (immutable)
- **AI responses** cached (10-15min TTL per function)
- **Rate limiting** prevents AI cost overruns

---

## 🚨 Troubleshooting

### Build fails with Prisma error

Ensure `DATABASE_URL` is set and the database is reachable:

```bash
bunx prisma validate
bunx prisma db push
```

### AI features return fallbacks

Check that `GEMINI_API_KEY` is set in Vercel. Without it, all AI functions return deterministic fallbacks (the app works, just without AI intelligence).

### Google OAuth redirect mismatch

Ensure the redirect URI in Google Cloud Console matches:
`https://YOUR-DOMAIN/api/auth/callback/google`

### Database connection limit

If using Neon free tier, you may hit connection limits. The Prisma client uses a singleton pattern to minimize connections. For high traffic, consider Prisma Accelerate or a connection pooler (PgBouncer).

---

## 📦 Alternative Deployment (Docker)

For self-hosted Docker deployment:

```bash
# Build
docker build -t carbontwin .

# Run
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e AUTH_SECRET=... \
  -e GEMINI_API_KEY=... \
  carbontwin
```

The `next.config.ts` uses `output: "standalone"` which produces a minimal Docker image.

---

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/carbontwin/issues)
- **Docs**: [README.md](README.md)
- **AI Architecture**: `src/lib/ai/` directory
