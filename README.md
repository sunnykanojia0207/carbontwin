# CarbonTwin

> **AI‑Powered Personal Carbon Footprint Tracker & Climate Twin**

---

## 1. Chosen Vertical — Climate Tech & Personal Sustainability

**Why carbon footprint tracking?**

Climate change is the defining challenge of our generation, but most people have no idea what their personal carbon footprint actually is. Existing solutions fall into two camps:

| Approach | Problem |
|---|---|
| **Manual calculators** (spreadsheets, government tools) | Tedious data entry, static, no feedback loop |
| **Bank-integrated trackers** (Plaid, Yodlee) | Requires financial data sharing, inaccurate category mapping, privacy concerns |

**Our insight:** People naturally know what they eat, how they travel, and what they buy. If we make it *frictionless* to log those activities and *immediately* show the carbon impact — in a personalized, engaging way — we can turn abstract climate anxiety into actionable daily behavior change.

**Vertical:** Consumer Climate Tech (B2C, freemium SaaS)

**Target Users:**
- **Eco-beginners** who want to "be more sustainable" but don't know where to start
- **Data-minded reducers** who already care and want to track progress quantitatively
- **Skeptics** who need to see the cost-saving angle before they act

**Monetization:** Freemium (FREE / PRO / TEAM plans via Stripe)

---

## 2. Approach & Logic

### Design Philosophy

```
Humans don't change behavior because of data.
They change because of identity, narrative, and social proof.

  → So we built a "Climate Twin" — a carbon persona with a name, tier, and story.
  → So we built 5 AI Coach personas that adapt tone to the user's mindset.
  → So we built a Negotiator — not a dashboard — because commitment follows conversation.
```

### Key Product Decisions

| Decision | Why |
|---|---|
| **Scan-first input** (text/voice/photo/receipt/CSV) instead of bank-linking | Lower privacy barrier, works globally, immediate feedback |
| **AI-native from day one** (Gemini 2.0 Flash + Pro) | Structured extraction from unstructured input is the core moat |
| **Climate Twin persona** instead of a raw number | Identity drives habit change more than spreadsheets |
| **5 coach personas** (Verdant → Summit) | One tone doesn't fit all; skeptics need different framing than enthusiasts |
| **What-if simulator** before goal commitment | People need to explore before they commit |
| **Negotiator AI** not just "here's a recommendation" | Conversational commitment has higher follow-through |
| **Soft deletes + audit trail on every table** | Trust requires transparency; users can delete anything |
| **Portable Prisma schema** (SQLite dev → PostgreSQL prod) | Fast local iteration without sacrificing production rigor |

### Technical Approach

| Layer | Approach |
|---|---|
| **Frontend** | Next.js 15 App Router + React 19 + Tailwind v4 + shadcn/ui — RSC for fast loads, client components for interactivity |
| **AI** | Dual-model Gemini (Flash for fast detection, Pro for deep reasoning) + LRU cache + rate limiter + content guard |
| **Database** | Prisma ORM on PostgreSQL (Neon) — 15 models, soft-delete convention, string-backed enums for portability |
| **Auth** | NextAuth v5 with 4 providers (Google, GitHub, Email magic link, Credentials) |
| **Deployment** | Vercel edge + serverless, Neon serverless Postgres, GitHub Actions CI/CD |

---

## 3. How the Solution Works

### End-to-End User Flow

```
                        ┌──────────────────────────────────┐
                        │   LANDING & ONBOARDING           │
                        │  • Sign up (OAuth or email)      │
                        │  • Tell us your country,         │
                        │    household size, rough habits   │
                        │  → Baseline carbon estimate      │
                        │  → Climate Twin is born           │
                        └──────────┬───────────────────────┘
                                   │
                                   ▼
            ┌──────────────────────────────────────────┐
            │         DASHBOARD                         │
            │  • Twin card (name, tier, annual kg)      │
            │  • KPI summary (daily/weekly/monthly)     │
            │  • Recent scans & quick actions           │
            └──────────┬───────────────────────────────┘
                       │
          ┌────────────┴────────────────┐
          ▼                             ▼
   ┌──────────────────┐       ┌──────────────────┐
   │   SCAN ACTIVITY   │       │   VIEW RESULTS    │
   │                   │       │                   │
   │  "I ate a burger  │       │  • Category       │
   │   and drove 15km" │       │    breakdown pie  │
   │                   │       │  • Daily/weekly/  │
   │   ┌───────────┐   │       │    monthly trends │
   │   │   AI       │   │       │  • vs baseline    │
   │   │  Gemini    │   │       │  • vs country avg │
   │   │  parses →  │   │       └────────┬─────────┘
   │   │ detections │   │                │
   │   └───────────┘   │                │
   └──────────┬────────┘                │
              │                         │
              └────────┬────────────────┘
                       ▼
            ┌──────────────────────────────────┐
            │      WHAT-IF SIMULATOR            │
            │                                   │
            │  "What if I go vegetarian         │
            │   3 days a week + take train      │
            │   instead of car?"                │
            │                                   │
            │  → Adjust levers (diet, transport,│
            │     home, shopping, digital)       │
            │  → See projected reduction kg     │
            │  → See projected Twin tier        │
            └──────────┬────────────────────────┘
                       │
                       ▼
            ┌──────────────────────────────────┐
            │      AI NEGOTIATOR                │
            │                                   │
            │  Twin persona + simulation data   │
            │  → AI Coach starts conversation   │
            │  → Back-and-forth negotiation     │
            │  → User commits to a goal         │
            │                                   │
            │  "I'll reduce meat by 50%         │
            │   for the next 3 months"          │
            └──────────┬────────────────────────┘
                       │
                       ▼
            ┌──────────────────────────────────┐
            │      GOAL TRACKING                │
            │                                   │
            │  • Progress chart vs target       │
            │  • Periodic check-ins             │
            │  • Weekly email digest            │
            │  • Twin tier updates              │
            │                                   │
            │  → Cycle repeats with new scans   │
            └──────────────────────────────────┘
```

### Core Loop

```
  Scan ──▶ Detect ──▶ Compute ──▶ Simulate ──▶ Negotiate ──▶ Commit ──▶ Track
   │                                                                       │
   └────────────────────────────── ↻ ──────────────────────────────────────┘
```

### AI Persona System (The 5 Coaches)

Each user's Climate Twin has a **tier** that determines which AI coach persona they interact with:

```
Tier        Name            Tone                        When
─────────────────────────────────────────────────────────────────
🌱 VERDANT  Encouraging     Warm, celebrate small wins   Beginner / low footprint
🔥 EMBER    Practical       Direct, 80/20, metric-focused Building awareness
💫 AURORA   Curious         Data-rich, gamified, comparative  Environmentally aware
🌊 DRIFT    Skeptic         Socratic, cost-focused       Needs convincing
⛰️ SUMMIT   Advanced        Technical, systems-level     Already low-carbon
```

### The Negotiator (Key Innovation)

Unlike a standard chatbot that just answers questions, the Negotiator:

1. **Loads context** — your Twin profile, recent scans, active goals, past recommendations
2. **Adopts persona** — the right coach tone for your tier
3. **Proposes specific targets** — "How about reducing beef to 2x/week? That saves 180kg CO2e/year"
4. **Negotiates back** — you counter-offer, AI adjusts
5. **Commits** — when you agree, it creates a structured Goal in the database with progress tracking
6. **Follows up** — ongoing conversation to check in on progress

---

## 4. Assumptions Made

### Domain Assumptions

| Assumption | Rationale |
|---|---|
| **Carbon factors are estimates, not precise measurements** | Individual carbon footprint is inherently approximate (grid mix varies, supply chains are opaque). We use authoritative sources (EPA, DEFRA, IPCC AR6) and are transparent about methodology. |
| **Scan-level data is sufficient for behavior change** | You don't need 95% accuracy to change habits. 70-80% accuracy with immediate feedback is more effective than perfect accuracy with a 2-week delay. |
| **People know roughly what they consume** | We assume users can self-report meals, trips, and purchases. For granular tracking (e.g., utility bills), we plan appliance-level input. |
| **Country-level averages are meaningful baselines** | We compare users to country averages (World Bank / Our World in Data) rather than trying to compute hyper-local baselines. |
| **Five Twin tiers / five coach personas cover the spectrum** | Based on behavioral psychology stages-of-change model (Precontemplation → Maintenance). We can add more tiers if needed. |

### Technical Assumptions

| Assumption | Why |
|---|---|
| **Gemini 2.0 Flash for detection, Pro for reasoning** | Flash is 10x cheaper and fast enough for structured extraction; Pro handles nuanced negotiation. Falls back gracefully if one model is unavailable. |
| **20 AI calls/user/day is enough** | Based on typical usage patterns: 2-3 scans, a few insight queries, one negotiation session. Configurable in user settings. |
| **LRU cache with 5-60 min TTL** | Most scans are unique (different meals, trips), but repeated queries (e.g., "burger") benefit from caching identical inputs. |
| **PostgreSQL (Neon) for production** | Serverless Postgres gives us scale-to-zero for free tier, branches for dev, and pgvector for future semantic search. SQLite for local dev matches the same schema. |
| **NextAuth v5 on Vercel edge** | JWT-based sessions avoid DB lookups on every request; edge middleware checks auth before requests reach the server. |
| **UploadThing for file storage** | Handles validation, malware scanning, and CDN delivery out of the box. Avoids managing S3 directly. |
| **Soft deletes for audit trail** | GDPR right-to-deletion is handled via hard delete on explicit request; otherwise soft delete preserves data integrity. |

### Business Assumptions

| Assumption | Implication |
|---|---|
| **Freemium model works for climate tech** | Free tier limits AI calls/day and export formats. PRO unlocks unlimited scans, advanced analytics, and team sharing. |
| **Users will engage weekly** | Email digests and goal reminders drive re-engagement. Negotiator conversations are designed to be ongoing, not one-shot. |
| **Stripe subscriptions for monetization** | PRO at ~$8/mo, TEAM at ~$15/mo. Free tier is ad-free but capped. |
| **Privacy is a feature, not a barrier** | No bank-linking, no data selling, clear delete-everything policy. We assume users care about this and will pay for it. |

---

## Tech Stack Summary

| Category | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind v4, shadcn/ui, Framer Motion |
| Language | TypeScript 5 (strict) |
| Database | Prisma + Neon PostgreSQL (SQLite for dev) |
| Auth | NextAuth v5 (Google, GitHub, Email, Credentials) |
| AI | Gemini 2.0 Flash + Pro |
| File Upload | UploadThing |
| Email | Resend |
| Monitoring | Sentry, Vercel Analytics |
| Testing | Vitest + Playwright |
| CI/CD | GitHub Actions → Vercel |

---

## Quick Start

```bash
git clone https://github.com/sunnykanojia0207/carbontwin.git
cd carbontwin
npm install
cp .env.example .env.local   # Fill in your keys
npx prisma generate && npx prisma db push
npm run dev                  # → http://localhost:3000
```

---

*CarbonTwin — Track your carbon. Know your twin. Reduce your impact.*
