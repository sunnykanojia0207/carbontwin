# CarbonTwin

> **AI‑Powered Carbon Footprint Tracker & Climate Twin** — scan, track, simulate, negotiate, and reduce your personal carbon emissions with an intelligent AI coach.

---

## Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Entity Model (Database Schema)](#-entity-model-database-schema)
- [API Routes](#-api-routes)
- [AI Layer Architecture](#-ai-layer-architecture)
- [Frontend Component Tree](#-frontend-component-tree)
- [Authentication Flow](#-authentication-flow)
- [Scan → Carbon Pipeline](#-scan--carbon-pipeline)
- [Negotiator / Goal Workflow](#-negotiator--goal-workflow)
- [Test Coverage](#-test-coverage)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
- [Security Model](#-security-model)

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Vercel (Edge + Serverless)                  │
│                                                                     │
│  ┌─────────────────────┐        ┌──────────────────────────────┐   │
│  │   Next.js 15 App     │        │      External Services        │   │
│  │                      │        │                               │   │
│  │  ┌─────────────────┐ │        │  ┌──────────┐  ┌──────────┐  │   │
│  │  │ React 19 + RSC   │ │        │  │ Gemini 2 │  │  Resend  │  │   │
│  │  │ Tailwind v4      │ │        │  │ Flash/Pro│  │ (Email)  │  │   │
│  │  │ shadcn/ui        │ │        │  └────┬─────┘  └────┬─────┘  │   │
│  │  │ Framer Motion    │ │        │       │              │        │   │
│  │  └────────┬─────────┘ │        │       └──────────────┘        │   │
│  │           │           │        │                               │   │
│  │  ┌────────▼─────────┐ │        │  ┌──────────┐                │   │
│  │  │  API Layer        │ │        │  │  Upload  │                │   │
│  │  │  (Route Handlers) │ │        │  │ (via    │                │   │
│  │  └────────┬─────────┘ │        │  │  uploadthing)             │   │
│  │           │           │        │  └──────────┘                │   │
│  │  ┌────────▼─────────┐ │        │                               │   │
│  │  │ AI Layer          │ │        │  ┌──────────┐                │   │
│  │  │ • Gemini client   │ │        │  │ Sentry   │                │   │
│  │  │ • Rate limiter    │ │        │  │ (Error   │                │   │
│  │  │ • Response cache  │ │        │  │ Tracking)│                │   │
│  │  │ • Content guard   │ │        │  └──────────┘                │   │
│  │  └────────┬─────────┘ │        │                               │   │
│  │           │           │        └──────────────────────────────┘   │
│  │  ┌────────▼─────────┐ │                                           │
│  │  │ Prisma ORM        │ │                                           │
│  │  │ (PostgreSQL)      │ │                                           │
│  │  └────────┬─────────┘ │                                           │
│  └───────────┼───────────┘                                           │
│              │                                                       │
│  ┌───────────▼───────────┐                                           │
│  │   Neon PostgreSQL      │                                           │
│  │   (Serverless DB)      │                                           │
│  └───────────────────────┘                                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | RSC, server actions, edge-ready |
| **UI Library** | React 19 | Concurrent features, compiler |
| **Language** | TypeScript 5 | Full-stack type safety |
| **Styling** | Tailwind CSS v4 + shadcn/ui | Utility-first + accessible components |
| **Animation** | Framer Motion / Motion | Declarative, gesture-aware |
| **Database ORM** | Prisma (PostgreSQL) | Type-safe, portable schema |
| **Database** | Neon (Serverless PostgreSQL) | Scale-to-zero, branchable |
| **Auth** | NextAuth v5 (Auth.js) | Multi-provider, edge-compatible |
| **AI** | Gemini 2.0 Flash/Pro | Vision + text, fast inference |
| **File Upload** | UploadThing | Type-safe, serverless-ready |
| **Email** | Resend | Transactional email API |
| **Error Tracking** | Sentry | Full-stack error monitoring |
| **Testing** | Vitest + Playwright | Unit, integration, E2E |
| **CI/CD** | GitHub Actions | Lint, type-check, test, deploy |
| **Deployment** | Vercel | Edge functions, ISR, analytics |
| **QR/Payment** | Stripe (planned) | Subscription billing |

---

## 🧬 Entity Model (Database Schema)

### Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────┐       ┌──────────────┐
│    User      │1──N──▶│   Account    │       │   Session    │
│              │       │ (OAuth)      │       │              │
│ (core entity)│       └──────────────┘       └──────────────┘
│              │
│              │1──1──▶│  Settings    │
│              │1──1──▶│ ClimateTwin  │
│              │1──N──▶│ Scan         │──1──N──▶ Detection
│              │1──N──▶│ Appliance    │
│              │1──N──▶│ CarbonResult │
│              │1──N──▶│ Simulation   │
│              │1──N──▶│ Goal         │──1──N──▶ GoalProgress
│              │1──N──▶│ Recommendation│
│              │1──N──▶│ AIConversation│──1──N──▶ AIMessage
└─────────────┘
```

### Entity Summary (14 Tables)

| # | Entity | Key Fields | Purpose |
|---|---|---|---|
| 1 | **User** | `id`, `email`, `plan`, `country`, `householdSize`, `baselineAnnualKg`, `onboardingStep` | Account owner; gravity center |
| 2 | **Account** | `userId`, `provider`, `providerAccountId` | NextAuth OAuth bridge |
| 3 | **Session** | `sessionToken`, `userId`, `expires` | NextAuth session storage |
| 4 | **VerificationToken** | `identifier`, `token`, `expires` | Email verification |
| 5 | **Scan** | `type` (PHOTO\|VOICE\|TEXT\|RECEIPT\|CSV), `status`, `inputText`, `inputUrl`, `aiModel` | One upload/capture session |
| 6 | **Detection** | `label`, `categorySlug`, `amount`, `unit`, `confidence`, `co2eKg` | One item parsed from a scan |
| 7 | **Appliance** | `name`, `type`, `watts`, `hoursPerDay`, `daysPerWeek` | User-owned home appliance |
| 8 | **CarbonResult** | `scope`, `totalKg`, `breakdown` (JSON), `factorVersion` | Computed footprint snapshot |
| 9 | **ClimateTwin** | `name`, `tier`, `avatarSeed`, `composition` (JSON), `currentAnnualKg`, `evolution` | 1:1 carbon persona |
| 10 | **Simulation** | `levers` (JSON), `baselineKg`, `projectedKg`, `forecast` (JSON) | What-if scenario |
| 11 | **Recommendation** | `title`, `categorySlug`, `potentialKg`, `difficulty`, `impact`, `status` | AI-suggested reduction |
| 12 | **Goal** | `title`, `type`, `targetKg`, `baselineKg`, `startDate`, `endDate` | Reduction commitment |
| 13 | **GoalProgress** | `periodKg`, `reductionKg`, `cumulativeKg`, `progressPct`, `onTrack` | Periodic goal snapshot |
| 14 | **AIConversation** | `type`, `messageCount`, `tokenCount`, `outcome`, `goalId` | Coach/Negotiator thread |
| 15 | **AIMessage** | `role`, `content`, `tokensIn`, `tokensOut`, `toolName`, `toolArgs` | One turn in a conversation |

### Cross‑Table Conventions

- **Soft deletes** — every entity has `deletedAt: DateTime?`; queries filter `WHERE deletedAt IS NULL` explicitly
- **UUIDs** — every primary key uses `@default(uuid())`
- **String-backed enums** — all enum-like fields (`status`, `type`, `tier`, etc.) are String for SQLite → PostgreSQL portability; validated via Zod at the app layer
- **Audit columns** — every table includes `createdAt`, `updatedAt`
- **JSON columns** — complex nested data (breakdowns, levers, forecasts) stored as `Json` → maps to `TEXT` (SQLite) or `JSONB` (PostgreSQL)

---

## 🔌 API Routes

### Public / Auth

| Method | Route | Handler | Description |
|---|---|---|---|
| `*` | `/api/auth/[...nextauth]` | NextAuth | OAuth, credentials, session, callback |
| `GET` | `/api/auth/csrf` | NextAuth | CSRF token endpoint |

### User & Settings

| Method | Route | Handler | Description |
|---|---|---|---|
| `GET` | `/api/settings` | `route.ts` | Read current user settings |
| `PATCH` | `/api/settings` | `route.ts` | Update theme, notifications, privacy |
| `GET` | `/api/export` | `route.ts` | Export user data (CSV) |

### Scans & Detections

| Method | Route | Handler | Description |
|---|---|---|---|
| `POST` | `/api/detect` | AI detection route | Parse text/scan → detections |
| `POST` | `/api/upload` | UploadThing | File upload handler |
| `GET` | `/api/scans/[id]` | Next.js param route | Get single scan with detections |
| `PATCH` | `/api/detections/[id]` | Next.js param route | Confirm/edit/discard detection |

### Carbon Results & Twin

| Method | Route | Handler | Description |
|---|---|---|---|
| `GET` | `/api/results` | Query results | Scoped carbon results (daily/weekly/monthly/annual) |
| `POST` | `/api/results` | Compute & store | Trigger carbon calculation |
| `GET` | `/api/twin` | ClimateTwin query | Get user's climate twin data |
| `PATCH` | `/api/twin` | ClimateTwin update | Update twin composition |

### Simulations

| Method | Route | Handler | Description |
|---|---|---|---|
| `POST` | `/api/simulate` | Run simulation | Apply levers, compute projected footprint |
| `GET` | `/api/simulations` | List simulations | Get user's saved simulations |
| `PATCH` | `/api/simulations/[id]` | Update simulation | Rename, archive, adjust levers |

### Goals & Progress

| Method | Route | Handler | Description |
|---|---|---|---|
| `POST` | `/api/goals` | Create goal | Commit to a reduction target |
| `GET` | `/api/goals` | List goals | Active & historical goals |
| `PATCH` | `/api/goals/[id]` | Update goal | Pause, complete, adjust |
| `POST` | `/api/goals/progress` | Log progress | Record periodic progress snapshot |

### AI Conversation

| Method | Route | Handler | Description |
|---|---|---|---|
| `POST` | `/api/ai-status` | `/api/ai-status/route.ts` | Get AI availability & daily budget |
| `POST` | `/api/negotiator` | `/api/negotiator/route.ts` | AI negotiation chat handler |
| `POST` | `/api/insights` | `/api/insights/route.ts` | Generate carbon insights from data |
| `POST` | `/api/goal-suggestions` | `/api/goal-suggestions/route.ts` | AI-suggested goal targets |
| `POST` | `/api/twin-recommendations` | `/api/twin-recommendations/route.ts` | Twin-personalized recommendations |
| `POST` | `/api/cron` | `/api/cron/route.ts` | Cron job trigger (email digests, goal checks) |

---

## 🤖 AI Layer Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         AI Layer (src/lib/ai/)                            │
│                                                                          │
│  ┌─────────────────┐   ┌──────────────────┐   ┌──────────────────────┐  │
│  │   index.ts       │   │ gemini-client.ts  │   │    rate-limiter.ts   │  │
│  │   Public API     │──▶│ Gemini API calls  │   │ Token-bucket /usr   │  │
│  │   • scanText     │   │   2 models:       │   │ 20/day default      │  │
│  │   • scanImage    │   │   Flash (fast)    │   │ Configurable in      │  │
│  │   • getRecommend.│   │   Pro (deep)      │   │ user Settings        │  │
│  │   • getInsights  │   └────────┬──────────┘   └──────────┬───────────┘  │
│  │   • negotiate    │            │                         │              │
│  └────────┬─────────┘            │                         │              │
│           │                      │                         │              │
│           ▼                      ▼                         ▼              │
│  ┌─────────────────┐   ┌──────────────────┐   ┌──────────────────────┐  │
│  │   cache.ts       │   │ content-guard.ts  │   │    env.ts            │  │
│  │   In‑memory LRU  │   │ PII filter        │   │ • GEMINI_API_KEY    │  │
│  │   TTL: 5–60 min  │   │ Prompt injection  │   │ • AI_ENABLED flag   │  │
│  │   Keyed by hash  │   │ detector          │   │ • Model selection   │  │
│  └─────────────────┘   └──────────────────┘   └──────────────────────┘  │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐│
│  │  Persona System                                                     ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ││
│  │  │ Verdant  │ │  Ember   │ │  Aurora  │ │  Drift   │ │  Summit  │ ││
│  │  │(Beginner)│ │(Building)│ │(Enth.)   │ │(Skeptic) │ │(Adv.)   │ ││
│  │  │ Coach    │ │ Coach    │ │ Coach    │ │ Coach    │ │ Coach    │ ││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ ││
│  └──────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────┘
```

### AI Pipeline (Scan → Detection)

```
User Input ──▶ Rate Limiter ──▶ Content Guard ──▶ Cache Check
                                                      │
                                              ┌───────┴───────┐
                                              │   Cache Hit?   │
                                              └───┬───────┬───┘
                                             Yes │       │ No
                                                 ▼       ▼
                                          Return    Gemini API
                                          Cached    (Flash/Pro)
                                          Result      │
                                                      ▼
                                                 Parse Response
                                                 (Zod schema)
                                                      │
                                                      ▼
                                              ┌───────────────┐
                                              │  Cache Store   │
                                              └───────┬───────┘
                                                      ▼
                                              Return Result
```

### AI Persona System (5 Tiers)

| Tier | Name | Tone | Audience |
|---|---|---|---|
| 🌱 **VERDANT** | The Encouraging Beginner Coach | Warm, simple, celebrate small wins | Carbon newcomers |
| 🔥 **EMBER** | The Practical Builder | Direct, metric-focused, 80/20 rule | Building awareness |
| 💫 **AURORA** | The Curious Enthusiast | Data-rich, gamified, comparative | Environmentally aware |
| 🌊 **DRIFT** | The Friendly Skeptic | Socratic, evidence-based, cost-focused | Doubters, ROI-driven |
| ⛰️ **SUMMIT** | The Advanced Reducer | Technical, systems-level, carbon-fluent | Low-carbon advanced |

---

## 🧩 Frontend Component Tree

```
src/app/
├── 📁 (auth)/                     Auth pages (login, register)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── layout.tsx
├── 📁 (dashboard)/                Main app shell
│   ├── layout.tsx                 Dashboard layout (sidebar + header)
│   ├── loading.tsx                Route-level loading state
│   ├── error.tsx                  Route-level error boundary
│   ├── 📁 dashboard/
│   │   └── page.tsx               Main dashboard (overview, KPI cards)
│   ├── 📁 upload/
│   │   ├── page.tsx               Upload / scan interface
│   │   └── components/
│   │       ├── ScanForm.tsx        Text/voice/file input form
│   │       ├── DetectionReview.tsx Detections list with confirm/edit/discard
│   │       └── ScanProgress.tsx    Scan status indicator
│   ├── 📁 results/
│   │   ├── page.tsx               Carbon results view
│   │   └── components/
│   │       ├── CarbonChart.tsx     Carbon trend chart (Recharts)
│   │       ├── BreakdownPie.tsx    Category breakdown pie chart
│   │       └── PeriodSelector.tsx  Daily/weekly/monthly toggle
│   ├── 📁 twin/
│   │   ├── page.tsx               Climate twin dashboard
│   │   └── components/
│   │       ├── TwinCard.tsx        Twin avatar + stats card
│   │       ├── CompositionBar.tsx  Category composition bar chart
│   │       └── CommunityCompare.tsx vs country avg/target
│   ├── 📁 simulator/
│   │   ├── page.tsx               What-if simulator
│   │   └── components/
│   │       ├── LeverPanel.tsx      Lever toggles (diet, transport, etc.)
│   │       ├── ProjectionChart.tsx Before/after comparison
│   │       └── TierPreview.tsx     Projected twin tier preview
│   ├── 📁 goals/
│   │   ├── page.tsx               Goal list & tracking
│   │   └── components/
│   │       ├── GoalCard.tsx        Single goal progress card
│   │       ├── GoalForm.tsx        Create/edit goal form
│   │       └── ProgressChart.tsx   Goal progress over time
│   ├── 📁 negotiator/
│   │   ├── page.tsx               AI negotiation chat interface
│   │   └── components/
│   │       ├── ChatBubble.tsx      Message bubble (user/assistant)
│   │       ├── NegotiationPanel.tsx Negotiation flow UI
│   │       └── GoalOffer.tsx       AI-generated goal offer card
│   └── 📁 settings/
│       ├── page.tsx               Settings page
│       └── components/
│           ├── ThemeToggle.tsx     Light/dark/system toggle
│           ├── NotificationPrefs.tsx Email/push toggle
│           ├── AIPrefs.tsx         AI budget & enable/disable
│           └── ExportData.tsx      Data export button
│
├── 📁 components/                  Shared components
│   ├── ui/                        shadcn/ui primitives (Button, Card, Dialog, etc.)
│   ├── Layout/                    AppShell, Sidebar, Header, Nav
│   ├── Typography/                Text, Heading, Prose
│   └── shared/                    InfoCard, KPICard, LoadingSpinner
│
├── 📁 lib/                         Business logic & utilities
│   ├── ai/                        AI layer (see above)
│   ├── db.ts                      Prisma client singleton
│   ├── auth.ts                    NextAuth configuration
│   ├── validations/               Zod schemas
│   └── utils.ts                   cn(), formatters, helpers
│
└── 📁 app/api/                     API route handlers
```

---

## 🔐 Authentication Flow

```
┌──────┐        ┌──────────┐        ┌────────────┐        ┌────────┐
│ User │        │  Next.js │        │ NextAuth v5 │        │  DB    │
│      │        │ App      │        │ (Auth.js)   │        │        │
└──┬───┘        └────┬─────┘        └──────┬──────┘        └───┬────┘
   │                  │                    │                   │
   │  Sign In         │                    │                   │
   │─────────────────▶│  /api/auth/signin  │                   │
   │                  │───────────────────▶│                   │
   │                  │                    │                   │
   │                  │  ┌─────────────────┴────────┐          │
   │                  │  │ Provider selection:       │          │
   │                  │  │ • Google OAuth            │          │
   │                  │  │ • GitHub OAuth            │          │
   │                  │  │ • Email (magic link)      │          │
   │                  │  │ • Credentials (email/pwd)  │          │
   │                  │  └─────────────────┬────────┘          │
   │                  │                    │                   │
   │                  │     OAuth Callback  │                   │
   │                  │◀───────────────────│                   │
   │                  │                    │                   │
   │                  │     Create/Session  │                   │
   │                  │───────────────────────────────────────▶│
   │                  │◀──────────────────────────────────────││
   │                  │                    │                   │
   │  Redirect to     │                    │                   │
   │  Dashboard       │                    │                   │
   │◀─────────────────│                    │                   │
   │                  │                    │                   │
   │  API Requests    │                    │                   │
   │─────────────────▶│  middleware.ts      │                   │
   │                  │  (checks session)  │                   │
   │                  │───────────────────▶│                   │
   │                  │◀───────────────────│                   │
   │◀─────────────────│                    │                   │
```

### Auth Protection Layers

1. **`middleware.ts`** — edge middleware protects all `/dashboard/*` and `/api/*` routes
2. **`layout.tsx`** — `(auth)` group wraps login/register; `(dashboard)` group checks session on client
3. **API handlers** — each handler fetches `auth()` to verify session
4. **Server Actions** — same `auth()` check before mutation
5. **CSRF** — NextAuth CSRF token on all POST mutations

### Providers

| Provider | Type | Status |
|---|---|---|
| Google OAuth | `google` | ✅ Active |
| GitHub OAuth | `github` | ✅ Active |
| Email (Magic Link) | `resend` | ✅ Active (requires Resend) |
| Credentials | `credentials` | ✅ Active (bcrypt-hashed passwords) |

---

## 📸 Scan → Carbon Pipeline

```
User Action         Server Processing            AI / Compute            Storage
──────────────────────────────────────────────────────────────────────────────────
│                   │                           │                      │
│ Upload photo      │                           │                      │
│ Speak voice       │   POST /api/detect        │                      │
│ Paste text        │──────────────────────────▶│                      │
│ Upload CSV        │                           │                      │
│                   │                           │                      │
│                   │     ┌─────────────────────┴─────────────┐        │
│                   │     │ 1. Rate limit check (20/day)       │        │
│                   │     │ 2. Content guard (PII + injection) │        │
│                   │     │ 3. Cache lookup (hash-based)       │        │
│                   │     └─────────────────────┬─────────────┘        │
│                   │                           │                      │
│                   │              Cache miss   │                      │
│                   │                           ▼                      │
│                   │     ┌──────────────────────────────────┐         │
│                   │     │ Gemini 2.0 Flash / Pro           │         │
│                   │     │ • Text: structured JSON output   │         │
│                   │     │ • Image: base64 → vision parse   │         │
│                   │     │ • Voice: transcript first        │         │
│                   │     └──────────────┬───────────────────┘         │
│                   │                    │                             │
│                   │     Parse via Zod   │                             │
│                   │     schema          │                             │
│                   │◀───────────────────│                             │
│                   │                    │                             │
│  Show detections  │                    │                             │
│◀──────────────────│                    │                             │
│                   │                    │                             │
│  User confirms    │   PATCH /detection │                             │
│──────────────────▶│   /[id]            │                             │
│                   │────────────────────────────────────────────────▶│
│                   │                    │    Scan, Detection rows     │
│                   │                    │                             │
│                   │   Compute CO2e     │                             │
│                   │────────────────────────────────────────────────▶│
│                   │                    │    CarbonResult row         │
│                   │                    │                             │
│                   │   Update Twin      │                             │
│                   │────────────────────────────────────────────────▶│
│                   │                    │    ClimateTwin.composition  │
```

---

## 🎯 Negotiator / Goal Workflow

```
  ┌──────────┐       ┌─────────────┐       ┌───────────┐       ┌────────┐
  │   User    │       │ Negotiator   │       │ AI Model  │       │  DB    │
  │           │       │ (Chat UI)    │       │ (Gemini)  │       │        │
  └─────┬─────┘       └──────┬──────┘       └─────┬─────┘       └───┬────┘
        │                    │                    │                  │
        │ POST /api/         │                    │                  │
        │ negotiator         │                    │                  │
        │───────────────────▶│                    │                  │
        │                    │  Load context:     │                  │
        │                    │  • Twin profile    │                  │
        │                    │  • Recent scans    │                  │
        │                    │  • Active goals    │                  │
        │                    │  • Recommendations │                  │
        │                    │───────────────────▶│                  │
        │                    │                    │                  │
        │                    │  ┌─────────────────┴─────────┐        │
        │                    │  │ Persona-driven prompt:     │        │
        │                    │  │ • Verdant: "Let's start   │        │
        │                    │  │   small! How about..."    │        │
        │                    │  │ • Drift: "Here's the data │        │
        │                    │  │   on cost savings..."     │        │
        │                    │  │ • Summit: "At your level,│        │
        │                    │  │   consider offsets..."    │        │
        │                    │  └─────────────────┬─────────┘        │
        │                    │                    │                  │
        │                    │◀───────────────────│                  │
        │                    │                    │                  │
        │    AI response     │                    │                  │
        │◀───────────────────│                    │                  │
        │                    │                    │                  │
        │  User agrees to    │                    │                  │
        │  a reduction goal  │                    │                  │
        │───────────────────▶│                    │                  │
        │                    │  POST /api/goals   │                  │
        │                    │────────────────────────────────────▶│
        │                    │                    │                  │
        │                    │                    │     Create Goal  │
        │                    │                    │     + GoalProgress│
        │                    │                    │◀─────────────────│
        │                    │  goalId linked     │                  │
        │                    │  to conversation   │                  │
        │                    │────────────────────────────────────▶│
        │                    │                    │  DB: conversation│
        │                    │                    │  .outcome=COMMITTED│
        │                    │                    │  .goalId=set    │
        │  Goal confirmed    │                    │                  │
        │◀───────────────────│                    │                  │
```

### Goal States

```
                  ┌──────────┐
                  │  ACTIVE   │
                  └────┬─────┘
                       │
               ┌───────┼───────┐
               │       │       │
               ▼       ▼       ▼
          ┌────────┐ ┌────────┐ ┌────────┐
          │PAUSED  │ │COMPLETED│ │FAILED  │
          └────┬───┘ └────────┘ └────────┘
               │
               │ (resume)
               ▼
          ┌──────────┐
          │  ACTIVE   │
          └──────────┘

Also terminal: EXPIRED (endDate passed without reaching targetKg)
```

---

## 🧪 Test Coverage

| Layer | Tool | Files | Coverage |
|---|---|---|---|
| **Unit** | Vitest | `*.test.ts` | Functions, hooks, validations |
| **Component** | Vitest + React Testing Library | `*.test.tsx` | UI component rendering & behavior |
| **API** | Vitest | `src/app/api/*/route.test.ts` | Route handler logic |
| **E2E** | Playwright | `e2e/*.spec.ts` | Full user journeys |

### Test Command Reference

```bash
npm run test          # Run all Vitest tests (watch mode)
npm run test:ci       # Run tests once (CI)
npm run test:e2e      # Run Playwright E2E tests
npm run test:e2e:ui   # Playwright UI mode
npm run coverage      # Generate coverage report
npx vitest run        # Single run all tests
npx vitest --reporter=verbose  # Verbose output
npx vitest run --changed        # Only changed files
npx vitest run -t "scan"        # Filter by test name
npx playwright test --trace on  # With trace viewer
```

### Coverage Targets (Vitest)

| Metric | Threshold |
|---|---|
| Statements | ≥ 10% |
| Branches | ≥ 10% |
| Functions | ≥ 8% |
| Lines | ≥ 10% |

*Excluded: `src/components/ui/**`, type definitions, middleware*

---

## 🔧 Environment Variables

```env
# ── Database ─────────────────────────────────────────────────
DATABASE_URL="postgresql://..."          # Neon PostgreSQL

# ── Auth (NextAuth v5) ──────────────────────────────────────
AUTH_SECRET="..."                        # openssl rand -base64 32
AUTH_URL="http://localhost:3000"

AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."

AUTH_GITHUB_ID="..."
AUTH_GITHUB_SECRET="..."

AUTH_RESEND_KEY="re_..."                 # Resend API key for magic links
AUTH_EMAIL_FROM="noreply@carbontwin.app"

# ── AI (Gemini) ──────────────────────────────────────────────
GEMINI_API_KEY="AIza..."                 # Google AI Studio key
AI_ENABLED="true"                        # Master toggle
AI_MODEL_FLASH="gemini-2.0-flash"        # Fast model (detection)
AI_MODEL_PRO="gemini-2.0-pro"            # Deep model (negotiation)
AI_DAILY_BUDGET="20"                     # Per-user daily call limit

# ── File Upload ──────────────────────────────────────────────
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="..."

# ── Error Tracking ───────────────────────────────────────────
SENTRY_DSN="https://[key]@[org].ingest.us.sentry.io/[project]"
SENTRY_ORG="carbon-twin"
SENTRY_PROJECT="carbon-twin"
SENTRY_AUTH_TOKEN="..."                  # CI only

# ── Analytics ────────────────────────────────────────────────
VERCEL_ANALYTICS_ID="..."                # Vercel Web Analytics

# ── Payments (Stripe — planned) ──────────────────────────────
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PRICE_FREE="price_..."
NEXT_PUBLIC_STRIPE_PRICE_PRO="price_..."
NEXT_PUBLIC_STRIPE_PRICE_TEAM="price_..."

# ── Cron ─────────────────────────────────────────────────────
CRON_SECRET="..."                        # Shared secret for /api/cron
```

---

## 🚀 Getting Started

```bash
# 1. Clone & install
git clone https://github.com/your-org/carbontwin.git
cd carbontwin
npm install

# 2. Copy environment
cp .env.example .env.local
# Edit .env.local with your keys

# 3. Initialize database
npx prisma generate
npx prisma db push        # Dev: push schema
npx prisma db seed        # Optional seed data

# 4. Start dev server
npm run dev               # → http://localhost:3000

# 5. Run tests
npm run test              # Unit + integration
npm run test:e2e          # E2E (requires dev server)
```

### Key Scripts

```bash
npm run dev          # next dev --turbopack
npm run build        # next build
npm run start        # next start
npm run lint         # next lint
npm run format       # prettier --write
npm run typecheck    # tsc --noEmit
npm run analyze      # @next/bundle-analyzer
npm run db:push      # prisma db push
npm run db:studio    # prisma studio (GUI)
npm run db:migrate   # prisma migrate dev
npm run db:seed      # prisma db seed
```

---

## 🚢 Deployment

### Vercel (Recommended)

1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel Dashboard
3. Deploy — zero-config for Next.js

### Neon PostgreSQL

1. Create a Neon project → get connection string
2. Set `DATABASE_URL` in Vercel
3. Run `npx prisma migrate deploy` in CI

### CI/CD Pipeline (GitHub Actions)

```
Push to main / PR
       │
       ▼
┌─────────────────┐
│  Lint (next lint)│
├─────────────────┤
│  Type check (tsc)│
├─────────────────┤
│  Unit tests      │
│  (vitest run)    │
├─────────────────┤
│  Build           │
│  (next build)    │
├─────────────────┤
│  DB migration    │
│  (prisma deploy) │
├─────────────────┤
│  E2E tests       │
│  (Playwright)    │
├─────────────────┤
│  Deploy (Vercel) │
└─────────────────┘
```

---

## 🔒 Security Model

| Category | Measure |
|---|---|
| **Auth** | NextAuth v5 with JWT + session, CSRF protection |
| **API** | All routes check `auth()` — 401 if unauthenticated |
| **User Isolation** | Every query filters `WHERE userId = session.user.id` |
| **AI** | Content guard sanitizes prompts before Gemini; rate limited per user |
| **Uploads** | UploadThing handles file validation, malware scan, S3 isolation |
| **DB** | Soft deletes (audit trail); connection pooled via Prisma |
| **Dependencies** | `npm audit` in CI; Dependabot weekly |
| **Secrets** | All API keys via env vars; no secrets in code |
| **HTTPS** | Enforced by Vercel edge |
| **Headers** | `X-Frame-Options`, `X-Content-Type-Options`, CSP (Next.js) |

### Data Handling

| Data Type | Storage | Retention |
|---|---|---|
| Auth credentials | `accounts`, `sessions` | Until account deletion |
| Scan data | `scans`, `detections` | User can delete individual scans |
| Carbon results | `carbon_results` | Aggregated (can't delete individual without full reset) |
| AI conversation | `ai_conversations`, `ai_messages` | User can clear chat history |
| Full deletion | GDPR erasure: hard delete via `prisma.user.delete()` | On request |

---

## 📊 Project Structure

```
carbontwin/
├── .github/workflows/     CI/CD pipelines
├── e2e/                   Playwright E2E tests
├── prisma/
│   ├── schema.prisma      Database schema (15 models)
│   ├── migrations/        Migration history
│   └── seed.ts            Seed data
├── public/                Static assets, icons
├── src/
│   ├── app/
│   │   ├── (auth)/        Login, register pages
│   │   ├── (dashboard)/   Main app (dashboard, upload, results, twin, simulator, goals, negotiator, settings)
│   │   ├── api/           Route handlers (auth, detect, scans, results, twin, simulate, goals, negotiator, insights, cron)
│   │   ├── components/    Shared components (ui library, layout, shared)
│   │   └── lib/           Shared logic (ai, auth, db, validations, utils)
│   └── middleware.ts      Edge auth middleware
├── test/                  Test setup
├── next.config.ts         Next.js configuration
├── tailwind.config.ts     Tailwind CSS configuration
├── vitest.config.ts       Vitest configuration
├── playwright.config.ts   Playwright configuration
└── tsconfig.json          TypeScript configuration
```

---

## 🧭 Navigation Map

```
┌─────────────┬─────────────────────────────────────────────────────┐
│   Route      │  Description                                        │
├─────────────┼─────────────────────────────────────────────────────┤
│ /            │ Landing page (public)                               │
│ /login       │ Authentication page                                 │
│ /register    │ Registration page                                   │
│ /dashboard   │ Main dashboard — KPIs, quick stats, recent activity │
│ /upload      │ Scan input — text, voice, photo, receipt, CSV      │
│ /results     │ Carbon footprint results — charts, breakdowns      │
│ /twin        │ Climate twin profile — persona card, composition    │
│ /simulator   │ What-if scenario builder — levers, projections     │
│ /goals       │ Goal management — active, completed, progress      │
│ /negotiator  │ AI negotiation chat — commit to reduction goals    │
│ /settings    │ User settings — theme, notifications, AI prefs     │
└─────────────┴─────────────────────────────────────────────────────┘
```

---

*CarbonTwin — Track your carbon. Know your twin. Reduce your impact.*
