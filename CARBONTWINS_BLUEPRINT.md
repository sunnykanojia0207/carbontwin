# CarbonTwin — Technical Blueprint

> **Version:** 1.0.0  
> **Status:** Production-Ready Architecture  
> **Last Updated:** June 20, 2026  
> **Stack:** Next.js 16 · TypeScript 5 · PostgreSQL/SQLite · Prisma 6 · Tailwind CSS 4 · Google Gemini AI

---

## Table of Contents

1. [Project Architecture](#1-project-architecture)
2. [Database Design](#2-database-design)
3. [Folder Structure](#3-folder-structure)
4. [Route Architecture](#4-route-architecture)
5. [Component Architecture](#5-component-architecture)
6. [AI Architecture](#6-ai-architecture)
7. [State Management Architecture](#7-state-management-architecture)
8. [Development Roadmap](#8-development-roadmap)
9. [Deployment Architecture](#9-deployment-architecture)

---

## 1. Project Architecture

### 1.1 Overview

CarbonTwin is an **AI-powered personal carbon footprint platform** that helps individuals understand, track, predict, and reduce their emissions. The application follows a **modular monolith** architecture within Next.js 16's App Router, combining server-rendered pages with client-side interactivity where needed.

The architecture is organized around five core domains:

| Domain | Description |
|--------|-------------|
| **Detection** | Upload room photos → AI identifies appliances → compute carbon impact |
| **Climate Twin** | Digital carbon persona across 5 lifestyle dimensions with tiers |
| **What-If Simulator** | Model 6 scenarios (solar, EV, remote work, etc.) before committing |
| **AI Negotiator** | Conversational advisor that finds reductions users will actually keep |
| **Goals & Tracking** | Track commitments with milestones, achievements, and progress charts |

**Key architectural principles:**

- **Server-first by default** — Pages are React Server Components; client-side islands only where interactivity is required
- **Unified AI facade** — All 5 AI functions go through a single entry point with rate limiting, caching, error handling, and deterministic fallbacks
- **Deterministic carbon math** — All emission calculations are pure math functions, never AI-dependent; AI only adds narrative/insight
- **Graceful degradation** — Without a Gemini API key, every feature still works using deterministic fallbacks
- **Soft-delete convention** — Every table supports soft deletes for GDPR compliance and audit trails

### 1.2 Tech Stack

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| **Framework** | Next.js | 16.1.1 | App Router, React 19, Server Components, Edge Runtime |
| **Language** | TypeScript | 5.x | Type safety across the full stack |
| **Styling** | Tailwind CSS | 4.x | Utility-first, zero-runtime CSS |
| **UI Components** | shadcn/ui (New York) | Latest | Accessible, composable, Radix-based primitives |
| **Charts** | Recharts | 2.15.4 | Composable, responsive, React-native charting |
| **Animations** | Framer Motion | 12.23.2 | Declarative animations, layout animations |
| **Database** | PostgreSQL (prod) / SQLite (dev) | — | Single Prisma schema for both via portable features |
| **ORM** | Prisma | 6.11.1 | Type-safe queries, migrations, studio |
| **Auth** | NextAuth.js | 4.24.11 | Credentials + Google OAuth, JWT sessions |
| **AI** | Google Gemini (`@google/generative-ai`) | 0.24.1 | Vision (photo detection) + text (chat/insights) |
| **Server State** | TanStack Query | 5.82.0 | Caching, deduplication, stale-while-revalidate |
| **Client State** | Zustand | 5.0.6 | Lightweight global state (theme, UI prefs) |
| **Forms** | React Hook Form + Zod | 7.60 / 4.0 | Performant forms + schema validation |
| **Icons** | Lucide React | 0.525.0 | Consistent iconography across app |
| **Fonts** | Geist (Vercel) | — | Modern, optimized variable font |
| **Deployment** | Vercel | — | Edge-optimized, cron jobs, preview deploys |

### 1.3 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                              │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌───────────┐  │
│  │ Landing │ │   Auth   │ │Dashboard │ │AI Chat  │ │  Settings  │  │
│  │  Page   │ │  Pages   │ │  Pages   │ │Interface│ │   Pages    │  │
│  └─────────┘ └──────────┘ └──────────┘ └─────────┘ └───────────┘  │
│         │            │            │           │            │        │
│         └────────────┴────────────┴───────────┴────────────┘        │
│                              │                                      │
│              ┌───────────────┴───────────────────┐                  │
│              │        TanStack Query             │                  │
│              │       + Zustand Store             │                  │
│              └───────────────┬───────────────────┘                  │
└──────────────────────────────┼──────────────────────────────────────┘
                               │ HTTP / SSE
┌──────────────────────────────┼──────────────────────────────────────┐
│                    NEXT.JS 16 APP ROUTER                            │
│                               │                                     │
│  ┌────────────────────────────┴─────────────────────────────┐      │
│  │                    EDGE RUNTIME                           │      │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐    │      │
│  │  │Middleware│  │   Server     │  │   Static Assets  │    │      │
│  │  │(Auth)    │  │  Components  │  │  (images, fonts) │    │      │
│  │  └──────────┘  └──────────────┘  └──────────────────┘    │      │
│  └──────────────────────────────────────────────────────────┘      │
│                               │                                     │
│  ┌────────────────────────────┴─────────────────────────────┐      │
│  │                    NODE RUNTIME                           │      │
│  │                                                          │      │
│  │  ┌─────────────────┐     ┌─────────────────────────┐    │      │
│  │  │  Route Handlers  │     │    Server Actions        │    │      │
│  │  │  (API endpoints) │     │  (auth, goals, settings) │    │      │
│  │  └────────┬────────┘     └───────────┬─────────────┘    │      │
│  │           │                          │                  │      │
│  │  ┌────────┴──────────────────────────┴────────────┐     │      │
│  │  │               SERVICE LAYER                     │     │      │
│  │  │  dashboard.service  twin.service  goals.service │     │      │
│  │  │  results.service    settings.service            │     │      │
│  │  │  seed.service                                   │     │      │
│  │  └───────────────────────┬────────────────────────┘     │      │
│  │                          │                              │      │
│  │  ┌───────────────────────┴────────────────────────┐     │      │
│  │  │               AI FACADE                         │     │      │
│  │  │  detectAppliances()   generateInsights()        │     │      │
│  │  │  generateTwinRecs()   generateNegotiator()      │     │      │
│  │  │  generateGoalSuggestions()                      │     │      │
│  │  │  ┌──────────┐ ┌────────┐ ┌───────┐ ┌────────┐  │     │      │
│  │  │  │Rate      │ │ Cache  │ │Gemini │ │Env     │  │     │      │
│  │  │  │Limiter   │ │ (TTL)  │ │Client │ │Check   │  │     │      │
│  │  │  └──────────┘ └────────┘ └───────┘ └────────┘  │     │      │
│  │  └────────────────────────────────────────────────┘     │      │
│  └──────────────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
┌─────────▼────────┐ ┌────────▼────────┐ ┌─────────▼──────────┐
│   PostgreSQL      │ │   Google       │ │   In-Memory         │
│   (Neon / Vercel) │ │   Gemini API   │ │   Cache + RL        │
│   ┌─────────────┐ │ │                │ │   ┌──────────────┐ │
│   │ 15 tables   │ │ │   gemini-2.0-  │ │   │ TTL Cache   │ │
│   │ +pgvector   │ │ │   flash        │ │   │ (200 entry) │ │
│   │ (future)    │ │ │                │ │   │ Rate Buckets│ │
│   └─────────────┘ │ │                │ │   └──────────────┘ │
└───────────────────┘ └────────────────┘ └─────────────────────┘
```

### 1.4 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Modular monolith** within Next.js | Avoids premature microservice complexity; all code lives in one repo with clear domain boundaries. Easy to extract services later if needed. |
| **Portable Prisma schema** (SQLite + PostgreSQL) | Single schema file works on both databases using UUIDs, String-backed enums, and Json fields. Enables SQLite for local dev without a Postgres install. |
| **Deterministic carbon math** | All emission calculations (appliance energy → kWh → CO₂e) are pure functions. AI is only used for detection, narrative, and suggestions — never for math. |
| **Unified AI facade with fallbacks** | Every AI function has a deterministic fallback response. The UI never breaks when the AI API is unavailable, rate-limited, or misconfigured. |
| **Soft-delete convention** | Every table has `deletedAt`. Supports GDPR right-to-erasure, data recovery, and audit trails without data loss. |
| **JWT sessions over database sessions** | Required by the Credentials provider (NextAuth limitation). Also eliminates database lookups on every request. |
| **Server Actions for mutations** | Progressive enhancement, direct database access without API boilerplate. Used for auth, goals, and settings mutations. |
| **Route Handlers for AI endpoints** | AI calls have longer durations (up to 60s) and need streaming (SSE). Server Actions time out; Route Handlers support `maxDuration`. |
| **In-memory rate limiting over Redis** | Acceptable for single-instance Vercel deployment. Upstash Redis can be swapped in when scaling to multiple instances. |

---

## 2. Database Design

### 2.1 Entity Relationship Overview

The database has **15 models** organized into 5 groups:

```
                    ┌──────────────────────────────────────────────┐
                    │                  USER                        │
                    │  (gravity center — 13 outgoing relations)    │
                    └────┬─────┬─────┬─────┬─────┬─────┬─────┬────┘
                         │     │     │     │     │     │     │
          ┌──────────────┘  ┌──┘  ┌──┘  ┌──┘  ┌──┘  ┌──┘  ┌──┘
          ▼                 ▼     ▼     ▼     ▼     ▼     ▼
    ┌──────────┐    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ Account  │    │  Scan    │ │Appliance │ │Climate   │ │Simulation│
    │(NextAuth)│    │          │ │          │ │Twin (1:1)│ │          │
    └──────────┘    └──┬───────┘ └──────────┘ └──────────┘ └────┬─────┘
         ┌──────────┐  │         ┌──────────┐ ┌──────────┐      │
         │ Session  │  │         │Carbon    │ │Recommen- │      │
         │(NextAuth)│  │         │Result    │ │dation    │      │
         └──────────┘  │         └──────────┘ └──────────┘      │
         ┌──────────┐  │                                        │
         │Verif.    │  ▼                                        │
         │Token     │ ┌──────────┐  ┌──────────┐               │
         └──────────┘ │Detection │  │  Goal    │               │
                      │          │  │          │               │
                      └──────────┘  └────┬─────┘               │
                                         │                     │
                                         ▼                     │
                                  ┌──────────────┐             │
                                  │ GoalProgress │             │
                                  └──────────────┘             │
                      ┌──────────────────┐                     │
                      │ AIConversation   │◄────────────────────┘
                      └────────┬─────────┘
                               │
                               ▼
                        ┌──────────────┐
                        │  AIMessage   │
                        └──────────────┘
                      ┌────────────┐
                      │  Settings  │
                      │  (1:1)     │
                      └────────────┘
```

### 2.2 All 15 Models Explained

#### Group 1: User & Auth Infrastructure (4 models)

**User** — The account owner; gravity center of the schema.
- Stores profile (name, email, image), location (country, region, city), preferences (unitSystem, currency), onboarding state (step, done), and carbon context (householdSize, baselineAnnualKg)
- Supports soft-delete (`deletedAt`)
- Has 13 outgoing relations to all domain entities
- Indexed on `deletedAt` and `plan`

**Account** — NextAuth requirement. Stores OAuth provider tokens.
- Supports multiple providers per user (Credentials + Google)
- Cascades on user delete

**Session** — NextAuth requirement. Although JWT strategy is used, PrismaAdapter still creates Session rows for OAuth.
- Cascades on user delete

**VerificationToken** — NextAuth requirement. Used for email verification and password reset tokens.
- Token is unique; compound unique on `[identifier, token]`

#### Group 2: Detection Domain (3 models)

**Scan** — One upload/capture/voice/text session submitted for AI parsing.
- Type can be PHOTO, VOICE, TEXT, RECEIPT, or CSV
- Status transitions: PENDING → PROCESSING → COMPLETED | FAILED | CANCELLED
- Stores telemetry (startedAt, completedAt, durationMs, errorMessage, aiModel, promptVersion)
- Indexed on `[userId, createdAt]` and `status`

**Detection** — One item extracted from a scan, reviewable before commit.
- Label (e.g. "Chicken burger"), categorySlug (e.g. "food.meat.burger"), amount, unit
- Confidence score (0..1)
- SourceSnippet for traceability
- Status: PENDING → CONFIRMED | EDITED | DISCARDED
- Denormalized `co2eKg` for fast list rendering
- Indexed on `scanId` and `status`

**Appliance** — User-owned home appliances feeding the home-energy footprint.
- Type constrained to HVAC, REFRIGERATION, LAUNDRY, KITCHEN, ELECTRONICS, LIGHTING, WATER_HEATING, OTHER
- Power rating (watts), usage pattern (hoursPerDay, daysPerWeek)
- Region field for future grid-factor lookup
- Indexed on `[userId, type]`

#### Group 3: Carbon & Twin Domain (4 models)

**CarbonResult** — Computed footprint for a scope.
- Scope can be SCAN, DAILY, WEEKLY, MONTHLY, ANNUAL, SIMULATION, or BASELINE
- Total in kg CO₂e with JSON breakdown by category
- Optional provenance links to scan, simulation, or appliance
- Methodology tracking (factorVersion, methodologyRef)
- Indexed on `[userId, scope, periodStart]`, `scanId`, `simulationId`

**ClimateTwin** — User's personal carbon persona (1:1 with User).
- Name (e.g. "Verdant Maya"), tier (VERDANT / EMBER / AURORA / DRIFT / SUMMIT)
- Deterministic avatarSeed for generative avatar
- Composition JSON with 6 lifestyle dimensions + annual kg
- Comparison metrics: vsCountryAvgPct, vsTargetPct
- Evolution JSON array for tracking changes over time

**Simulation** — A what-if scenario stack.
- Levers JSON: array of `{ slug, intensity, params }`
- Baseline snapshots + project reductions
- Forecast JSON: monthly projection array with confidence intervals
- Twin preview (projected tier + kg under scenario)
- Status: DRAFT → ACTIVE | ARCHIVED
- Indexed on `[userId, status]`

**Recommendation** — An AI-suggested reduction lever.
- Title, description, categorySlug
- Potential annual reduction (kg), difficulty (EASY/MEDIUM/HARD), impact (LOW/MEDIUM/HIGH)
- Status: SUGGESTED → ACCEPTED | DISMISSED | COMPLETED
- `aiGenerated` flag for provenance
- Indexed on `[userId, status]`

#### Group 4: Goals Domain (2 models)

**Goal** — A reduction commitment, often AI-negotiated.
- Type: WEEKLY, MONTHLY, ANNUAL, ONE_TIME
- Status: ACTIVE → COMPLETED | PAUSED | EXPIRED | FAILED
- Target kg, baseline kg, current kg
- Links to simulation (provenance) and AI negotiation metadata
- Indexed on `[userId, status]` and `[userId, endDate]`

**GoalProgress** — Periodic snapshot of a goal's trajectory.
- Unique constraint on `[goalId, periodStart]` (one snapshot per period per goal)
- Period kg, reduction kg, cumulative kg, progress percentage
- `onTrack` boolean for dashboard green/red indicators
- Indexed on `[goalId, periodEnd]`

#### Group 5: AI & Settings Domain (2 models)

**AIConversation** — A coach/negotiator/insight/parser thread.
- Type: COACH, NEGOTIATOR, INSIGHT, PARSER
- Context JSON: compact carbon passport passed to the model
- Tracks message count, token count, last message time
- Negotiator outcome: PENDING → COMMITTED | DECLINED | DEFERRED
- Optional link to a Goal if the conversation produced one
- Indexed on `[userId, type, lastMessageAt]`

**AIMessage** — A single turn within a conversation.
- Role: USER, ASSISTANT, SYSTEM, TOOL
- Content + token counts (tokensIn, tokensOut)
- Function calling support (toolName, toolArgs, toolResult)
- Model + promptVersion traceability
- Indexed on `[conversationId, createdAt]`

**Settings** — Per-user preferences (1:1 with User).
- Display: theme, reducedMotion, plainLanguage, highContrast
- Notifications: emailDigest, pushEnabled, insightNotifications, goalReminders
- Privacy/AI: aiEnabled, aiDailyBudget, shareTwinPublic
- Data: exportFormat

### 2.3 Indexing Strategy

| Table | Indexes | Purpose |
|-------|---------|---------|
| `users` | `deletedAt`, `plan` | Filter active users, plan-based queries |
| `accounts` | `userId`, `[provider, providerAccountId]` | Auth lookups |
| `sessions` | `userId` | Auth lookups |
| `scans` | `[userId, createdAt]`, `status` | Timeline queries, status filtering |
| `detections` | `scanId`, `status` | Scan join, status filtering |
| `appliances` | `[userId, type]` | By-user appliance filtering |
| `carbon_results` | `[userId, scope, periodStart]`, `scanId`, `simulationId` | Scope/timeline queries, provenance joins |
| `simulations` | `[userId, status]` | By-user simulation listing |
| `recommendations` | `[userId, status]` | By-user recommendation queries |
| `goals` | `[userId, status]`, `[userId, endDate]` | Active goals, due-date queries |
| `goal_progress` | `[goalId, periodStart]` (unique), `[goalId, periodEnd]` | Progress snapshots |
| `ai_conversations` | `[userId, type, lastMessageAt]` | Conversation history listing |
| `ai_messages` | `[conversationId, createdAt]` | Message thread queries |

**Key decisions:**
- Composite indexes match the most common query patterns (e.g., `[userId, createdAt]` for timeline queries)
- Unique constraints prevent duplicate entities (user email, provider accounts, goal progress periods)
- No over-indexing: only indexes that directly support application queries are created

### 2.4 Migration Strategy

```
Development (local)
    │
    ├── prisma migrate dev         → Create + apply migration against SQLite
    ├── prisma db push             → Quick schema sync (no migration file)
    └── prisma generate            → Regenerate Prisma Client
                        │
                        ▼
Production (Vercel + PostgreSQL)
    │
    ├── prisma migrate deploy      → Apply pending migrations to production DB
    ├── bun run db:generate        → Part of build pipeline
    └── prisma migrate reset       → Only for dev, never in production
```

**Provider-agnostic approach:**
- The schema uses only portable Prisma features (UUIDs as Strings, String-backed enums, Json fields)
- Switching from SQLite to PostgreSQL requires only changing `provider = "sqlite"` → `provider = "postgresql"` in the schema
- PostgreSQL-native optimizations (e.g., `@db.Uuid`, `@db.Timestamptz`) can be added in a follow-up migration without changing the model graph

**Production hardening (PostgreSQL-specific):**
1. Change provider to `postgresql`
2. Add `@db.Uuid` to every `id` and `*Id` column
3. Add `@db.Timestamptz(3)` to every `DateTime` column
4. Add `@db.Text` to long-form String columns
5. Convert String-backed enums to native `enum` types

---

## 3. Folder Structure

### 3.1 Complete Tree

```
carbontwin/
├── .env                            # Environment variables (gitignored)
├── .gitignore
├── .vscode/                        # VS Code workspace settings
├── bun.lock                        # Bun lockfile
├── Caddyfile                       # Local HTTPS proxy (sandbox)
├── CARBONTWINS_BLUEPRINT.md        # This document
├── components.json                 # shadcn/ui configuration
├── DEPLOYMENT.md                   # Vercel deployment guide
├── db/
│   └── custom.db                   # SQLite database (dev/local)
├── eslint.config.mjs               # ESLint flat config
├── next-env.d.ts
├── next.config.ts                  # Next.js configuration
├── package.json
├── postcss.config.mjs
├── prisma/
│   └── schema.prisma               # Database schema (15 models)
├── public/
│   ├── apple-icon.png
│   ├── favicon.ico
│   ├── logo.svg                    # Brand SVG logo
│   ├── og.png                      # Open Graph social image
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── globals.css             # Global CSS + Tailwind directives
│   │   ├── layout.tsx              # Root layout (metadata, fonts, Providers)
│   │   ├── manifest.ts             # PWA web app manifest
│   │   ├── not-found.tsx           # Custom 404 page
│   │   ├── page.tsx                # Landing page
│   │   ├── robots.ts               # Dynamic robots.txt
│   │   ├── sitemap.ts              # Dynamic XML sitemap
│   │   │
│   │   ├── (auth)/                 # Auth route group (split-screen layout)
│   │   │   ├── layout.tsx          # Auth split-screen shell
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx
│   │   │   └── verify-request/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (dashboard)/            # Dashboard route group (sidebar layout)
│   │   │   ├── layout.tsx          # Dashboard sidebar + header shell
│   │   │   ├── error.tsx           # Error boundary
│   │   │   ├── loading.tsx         # Suspense fallback
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── goals/
│   │   │   │   └── page.tsx
│   │   │   ├── negotiator/
│   │   │   │   └── page.tsx
│   │   │   ├── results/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   ├── simulator/
│   │   │   │   └── page.tsx
│   │   │   ├── twin/
│   │   │   │   └── page.tsx
│   │   │   └── upload/
│   │   │       └── page.tsx
│   │   │
│   │   ├── onboarding/
│   │   │   └── page.tsx            # Multi-step onboarding flow
│   │   │
│   │   └── api/                    # Route Handlers (Node runtime)
│   │       ├── route.ts            # /api health check
│   │       ├── ai-status/
│   │       │   └── route.ts        # GET AI configuration status
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts    # NextAuth catch-all
│   │       ├── cron/
│   │       │   ├── goal-progress/
│   │       │   │   └── route.ts    # Daily goal progress rollup
│   │       │   └── weekly-insights/
│   │       │       └── route.ts    # Weekly insight generation
│   │       ├── detect/
│   │       │   └── route.ts        # POST appliance detection
│   │       ├── goal-suggestions/
│   │       │   └── route.ts        # POST AI goal suggestions
│   │       ├── insights/
│   │       │   └── route.ts        # POST AI carbon insights
│   │       ├── negotiator/
│   │       │   └── route.ts        # POST streaming AI chat
│   │       └── twin-recommendations/
│   │           └── route.ts        # POST AI twin recommendations
│   │
│   ├── components/
│   │   ├── ui/                     # 48 shadcn/ui primitives
│   │   │   ├── accordion.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── chart.tsx           # Recharts wrapper
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx            # React Hook Form wrapper
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── sidebar.tsx         # shadcn sidebar
│   │   │   ├── skeleton.tsx
│   │   │   ├── table.tsx           # TanStack Table wrapper
│   │   │   ├── toast.tsx
│   │   │   └── ... (48 total)
│   │   │
│   │   ├── auth/                   # Authentication components
│   │   │   ├── auth-brand-panel.tsx
│   │   │   ├── sign-out-button.tsx
│   │   │   ├── login-form.tsx
│   │   │   └── register-form.tsx
│   │   │
│   │   ├── dashboard/              # Dashboard domain components
│   │   │   ├── kpi-cards.tsx
│   │   │   ├── trend-chart.tsx
│   │   │   ├── category-pie.tsx
│   │   │   ├── recent-scans.tsx
│   │   │   ├── goals-list.tsx
│   │   │   ├── recommendations.tsx
│   │   │   ├── forecast-section.tsx
│   │   │   ├── empty-state.tsx
│   │   │   └── mobile-nav.tsx
│   │   │
│   │   ├── goals/                  # Goals domain components
│   │   │   ├── goal-card.tsx
│   │   │   ├── goal-create-form.tsx
│   │   │   ├── goal-progress-bar.tsx
│   │   │   ├── achievement-badge.tsx
│   │   │   └── weekly-trend.tsx
│   │   │
│   │   ├── marketing/              # Landing page sections
│   │   │   ├── hero.tsx
│   │   │   ├── features.tsx
│   │   │   └── cta.tsx
│   │   │
│   │   ├── negotiator/             # AI chat interface components
│   │   │   ├── chat-message.tsx
│   │   │   ├── chat-input.tsx
│   │   │   ├── action-plan-card.tsx
│   │   │   └── conversation-list.tsx
│   │   │
│   │   ├── provider/               # Client context providers
│   │   │   └── providers.tsx       # SessionProvider + ThemeProvider
│   │   │
│   │   ├── results/                # Results page components
│   │   │   ├── appliance-card.tsx
│   │   │   ├── impact-breakdown.tsx
│   │   │   ├── top-emitters.tsx
│   │   │   └── savings-list.tsx
│   │   │
│   │   ├── settings/               # Settings page components
│   │   │   ├── profile-form.tsx
│   │   │   ├── preferences-form.tsx
│   │   │   ├── notifications-form.tsx
│   │   │   ├── privacy-form.tsx
│   │   │   └── danger-zone.tsx
│   │   │
│   │   ├── shared/                 # Shared brand components
│   │   │   ├── logo.tsx
│   │   │   └── theme-toggle.tsx
│   │   │
│   │   ├── simulator/              # Simulator domain components
│   │   │   ├── scenario-card.tsx
│   │   │   ├── simulation-results.tsx
│   │   │   ├── timeline-chart.tsx
│   │   │   └── comparison-bars.tsx
│   │   │
│   │   ├── twin/                   # Climate Twin domain components
│   │   │   ├── twin-header.tsx
│   │   │   ├── radar-chart.tsx
│   │   │   ├── forecast-chart.tsx
│   │   │   ├── dimension-card.tsx
│   │   │   └── risk-areas.tsx
│   │   │
│   │   └── upload/                 # Upload & detect components
│   │       ├── upload-zone.tsx
│   │       ├── camera-capture.tsx
│   │       └── detection-result.tsx
│   │
│   └── lib/
│       ├── auth.ts                 # NextAuth full config (Node runtime)
│       ├── auth.config.ts          # Edge-safe NextAuth partial config
│       ├── auth-client.ts          # Client-safe auth helpers
│       ├── auth.actions.ts         # Auth server actions (register, reset)
│       ├── db.ts                   # Prisma singleton + active() helper
│       ├── goal-actions.ts         # Goal server actions
│       ├── onboarding.actions.ts   # Onboarding server actions
│       ├── password.ts             # bcryptjs hash + verify
│       ├── settings-actions.ts     # Settings server actions
│       ├── utils.ts                # cn() utility (clsx + tailwind-merge)
│       │
│       ├── ai/                     # Unified AI facade
│       │   ├── index.ts            # 5 AI functions + exports
│       │   ├── gemini-client.ts    # Gemini SDK wrapper (text + vision)
│       │   ├── rate-limiter.ts     # In-memory token bucket limiter
│       │   ├── cache.ts            # TTL cache with LRU eviction
│       │   ├── env.ts              # AI env validation + model config
│       │   └── negotiator-prompt.ts # System prompt builder + action plan parser
│       │
│       ├── emissions/              # Carbon calculation engine
│       │   ├── appliance-calc.ts   # Wattage → kWh → CO₂e math
│       │   └── appliance-suggestions.ts  # Improvement suggestions + savings
│       │
│       ├── services/               # Server-only data services (DTOs)
│       │   ├── dashboard.service.ts    # Dashboard aggregations
│       │   ├── goals.service.ts        # Goals + achievements
│       │   ├── results.service.ts      # Scan results + impact
│       │   ├── seed.service.ts         # Demo data generator
│       │   ├── settings.service.ts     # Settings + connected accounts
│       │   └── twin.service.ts         # Climate Twin computation
│       │
│       ├── simulator/              # What-If scenario engine
│       │   └── scenarios.ts        # 6 scenarios + runSimulation()
│       │
│       └── validations/            # Zod validation schemas
│           └── auth.ts             # Login, register, forgot/reset schemas
│
├── tsconfig.json
├── tsconfig.tsbuildinfo
└── vercel.json                     # Vercel build config + cron jobs
```

### 3.2 Directory Explanations

| Directory | Purpose |
|-----------|---------|
| `prisma/` | Database schema, migrations, seed files |
| `public/` | Static assets (images, icons, metadata files) |
| `src/app/` | Next.js App Router — all routes, layouts, and API endpoints |
| `src/app/(auth)/` | Auth route group (split-screen layout for login/register) |
| `src/app/(dashboard)/` | Protected dashboard route group (sidebar layout) |
| `src/app/api/` | Route Handlers for AI endpoints, auth callbacks, and cron jobs |
| `src/components/ui/` | 48 shadcn/ui primitives (Radix-based, unstyled) |
| `src/components/provider/` | Client-side context providers (Session, Theme) |
| `src/components/domain/` | Feature-vertical components (dashboard, twin, simulator, etc.) |
| `src/lib/` | Server-side library code (auth, db, AI, services, emissions math) |
| `src/lib/ai/` | Unified AI facade — the only entry point for all AI operations |
| `src/lib/services/` | Data access layer — typed DTOs that pages consume |
| `src/lib/emissions/` | Deterministic carbon math — no AI dependency |
| `src/lib/simulator/` | What-if scenario definitions + computation engine |
| `db/` | SQLite database file for local development |

---

## 4. Route Architecture

### 4.1 App Router Routes

| Route | Layout | Page | Auth | Description |
|-------|--------|------|------|-------------|
| `/` | Root | `page.tsx` | Public | Landing page with marketing sections |
| `/login` | `(auth)/layout` | `page.tsx` | Public | Login form (credentials + Google) |
| `/register` | `(auth)/layout` | `page.tsx` | Public | Registration form |
| `/forgot-password` | `(auth)/layout` | `page.tsx` | Public | Password reset request |
| `/reset-password` | `(auth)/layout` | `page.tsx` | Public | Password reset with token |
| `/verify-request` | `(auth)/layout` | `page.tsx` | Public | Email verification notice |
| `/onboarding` | Root | `page.tsx` | Protected | Multi-step onboarding flow |
| `/dashboard` | `(dashboard)/layout` | `page.tsx` | Protected | Main dashboard with KPIs |
| `/upload` | `(dashboard)/layout` | `page.tsx` | Protected | Photo upload + AI detection |
| `/results` | `(dashboard)/layout` | `page.tsx` | Protected | Detection results + impact |
| `/twin` | `(dashboard)/layout` | `page.tsx` | Protected | Climate Twin persona page |
| `/simulator` | `(dashboard)/layout` | `page.tsx` | Protected | What-If scenario simulator |
| `/negotiator` | `(dashboard)/layout` | `page.tsx` | Protected | AI Carbon Negotiator chat |
| `/goals` | `(dashboard)/layout` | `page.tsx` | Protected | Goals + achievements |
| `/settings` | `(dashboard)/layout` | `page.tsx` | Protected | Profile, preferences, danger zone |

### 4.2 API Routes

| Endpoint | Method | Duration | AI? | Description |
|----------|--------|----------|-----|-------------|
| `/api/auth/[...nextauth]` | * | Standard | No | NextAuth catch-all (sign-in, callback, session) |
| `/api/detect` | POST | 60s | Yes | Vision AI appliance detection |
| `/api/insights` | POST | 30s | Yes | Carbon insight narrative |
| `/api/twin-recommendations` | POST | 30s | Yes | Twin recommendation narrative |
| `/api/negotiator` | POST | 60s | Yes | Streaming AI chat (SSE) |
| `/api/goal-suggestions` | POST | 30s | Yes | AI goal suggestions |
| `/api/ai-status` | GET | Instant | No | AI configuration health check |
| `/api/cron/weekly-insights` | GET | 120s | Yes | Cron: weekly rollup |
| `/api/cron/goal-progress` | GET | 120s | No | Cron: daily goal progress |

### 4.3 Middleware Protection Rules

The middleware (`src/middleware.ts`) uses `next-auth/middleware` with explicit route matching:

```
MATCHER (protected routes):
  /dashboard/:path*
  /onboarding/:path*
  /settings/:path*
  /coach/:path*
  /insights/:path*
  /goals/:path*
  /activities/:path*
  /simulator/:path*
  /twin/:path*
  /upload/:path*
  /results/:path*
  /recommendations/:path*
  /negotiator/:path*

BEHAVIOR:
  Authenticated  → pass through
  Unauthenticated → redirect to /login?callbackUrl=<original>

EXCLUDED (no middleware):
  /                          (landing page — public)
  /login, /register          (auth pages — public)
  /forgot-password, /reset-password, /verify-request  (public)
  /api/*                     (self-protect via getServerSession() + 401 JSON)
  /_next/*                   (static assets)
  /favicon.ico, /robots.txt, /sitemap.xml, /manifest.webmanifest
```

**Key decision:** API routes are intentionally NOT matched by middleware because a redirect to an HTML login page is wrong for fetch callers. Instead, every API route self-protects by calling `getServerSession()` and returning a `401` JSON response.

---

## 5. Component Architecture

### 5.1 UI Primitives (48 shadcn/ui Components)

All located in `src/components/ui/`. Configured with the New York style, Lucide icons, and CSS variables:

| Category | Components |
|----------|-----------|
| **Layout** | `card`, `sidebar`, `resizable`, `scroll-area`, `separator` |
| **Navigation** | `navigation-menu`, `menubar`, `breadcrumb`, `pagination`, `tabs` |
| **Forms** | `form`, `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `slider`, `label`, `input-otp` |
| **Overlay** | `dialog`, `alert-dialog`, `drawer`, `sheet`, `popover`, `hover-card`, `tooltip`, `command` |
| **Data Display** | `table`, `badge`, `avatar`, `calendar`, `carousel`, `chart`, `progress`, `skeleton` |
| **Actions** | `button`, `dropdown-menu`, `context-menu`, `toggle`, `toggle-group`, `accordion`, `collapsible` |
| **Notifications** | `sonner` (toast), `toast`, `toaster`, `alert` |
| **Utilities** | `aspect-ratio`, `separator` |

### 5.2 Domain Components by Feature

**Auth Domain (`components/auth/`):**
- `auth-brand-panel.tsx` — Emerald brand panel for the auth split-screen
- `sign-out-button.tsx` — Sign out button with confirmation
- `login-form.tsx` — Login form with credentials + Google OAuth buttons
- `register-form.tsx` — Registration form with password strength meter

**Dashboard Domain (`components/dashboard/`):**
- `kpi-cards.tsx` — 4 KPI cards (week kg, streak, activities, reduction)
- `trend-chart.tsx` — 14-day trend line chart with goal line
- `category-pie.tsx` — Weekly category breakdown pie chart
- `recent-scans.tsx` — Recent scan activity list
- `goals-list.tsx` — Active goal progress cards
- `recommendations.tsx` — Top recommendation cards
- `forecast-section.tsx` — 12-week forecast projection
- `empty-state.tsx` — Dashboard empty state with "Load sample data" CTA
- `mobile-nav.tsx` — Mobile navigation drawer

**Twin Domain (`components/twin/`):**
- `twin-header.tsx` — Twin name, tier badge, avatar, carbon score
- `radar-chart.tsx` — 5-dimension radar chart (Recharts)
- `forecast-chart.tsx` — 1/3/5-year forecast comparison chart
- `dimension-card.tsx` — Individual dimension breakdown card
- `risk-areas.tsx` — Top 3 risk areas with severity badges

**Simulator Domain (`components/simulator/`):**
- `scenario-card.tsx` — Toggleable scenario with icon, description, impact
- `simulation-results.tsx` — Before/after comparison summary
- `timeline-chart.tsx` — 10-year cumulative carbon/cost projection
- `comparison-bars.tsx` — Per-dimension before/after bar comparison

**Negotiator Domain (`components/negotiator/`):**
- `chat-message.tsx` — Individual message bubble (user or assistant)
- `chat-input.tsx` — Message input with send button
- `action-plan-card.tsx` — Rendered action plan block with accept/decline
- `conversation-list.tsx` — Previous conversation history

**Results Domain (`components/results/`):**
- `appliance-card.tsx` — Per-appliance carbon + cost + suggestions
- `impact-breakdown.tsx` — By-type CO₂e breakdown chart
- `top-emitters.tsx` — Top 5 emitter ranking table
- `savings-list.tsx` — Savings opportunities sorted by impact

**Goals Domain (`components/goals/`):**
- `goal-card.tsx` — Goal with progress bar, milestones, days remaining
- `goal-create-form.tsx` — Create goal form (manual or AI-suggested)
- `goal-progress-bar.tsx` — Animated progress with milestone markers
- `achievement-badge.tsx` — Achievement icon with earn state
- `weekly-trend.tsx` — Weekly carbon saved trend chart

**Upload Domain (`components/upload/`):**
- `upload-zone.tsx` — Drag-and-drop file upload zone
- `camera-capture.tsx` — Camera capture for mobile
- `detection-result.tsx` — Real-time detection result display

**Settings Domain (`components/settings/`):**
- `profile-form.tsx` — Name, location, household size form
- `preferences-form.tsx` — Display preferences (plain language, motion, contrast)
- `notifications-form.tsx` — Email digest, push, insight/goal notifications
- `privacy-form.tsx` — AI toggle, daily budget, public twin
- `danger-zone.tsx` — Account deletion

### 5.3 Layout Components

**Root Layout (`src/app/layout.tsx`):**
- Sets up Geist fonts (sans + mono) with `display: swap`
- Comprehensive SEO metadata (OpenGraph, Twitter, JSON-LD, robots)
- PWA viewport configuration
- Wraps all pages in `<Providers>` (SessionProvider + ThemeProvider)
- Skip-to-main-content link for keyboard accessibility
- Sonner `<Toaster>` for toast notifications

**Auth Layout (`src/app/(auth)/layout.tsx`):**
- 2-column split screen: brand panel (left, lg+) + form (right)
- Mobile: condensed top header with logo + theme toggle
- Footer with Terms & Privacy links

**Dashboard Layout (`src/app/(dashboard)/layout.tsx`):**
- Desktop: fixed sidebar (240px) with logo + 7 nav items + user profile
- Mobile: condensed topbar with mobile nav drawer
- Sticky header with backdrop blur
- Theme toggle in header
- 8 navigation items: Dashboard, Upload & Detect, Results, Climate Twin, What-If, AI Negotiator, Goals, Settings

### 5.4 Provider Components

**`providers.tsx`** — The only client provider wrapper:

```tsx
function Providers({ children }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
```

- `SessionProvider` — NextAuth session context for `useSession()` hooks
- `ThemeProvider` — `next-themes` for light/dark/system theme switching
- `disableTransitionOnChange` — Prevents FOUC during theme switches
- `TanStack QueryProvider` — Not explicitly shown but available for client-side data fetching

---

## 6. AI Architecture

### 6.1 Unified AI Facade Pattern

All AI operations go through a single entry point at `src/lib/ai/index.ts`. This follows the **facade pattern** with a consistent pipeline for every function:

```
User Request
    │
    ▼
┌─────────────────────────────────────────┐
│           UNIFIED AI FACADE              │
│                                          │
│  1. RATE LIMIT CHECK                     │
│     └─ Token bucket (per user+function)  │
│        → RATE_LIMITED error if exceeded  │
│                                          │
│  2. CACHE LOOKUP (if cacheable)          │
│     └─ FNV-1a hash key → TTL check      │
│        → Return cached result if fresh   │
│                                          │
│  3. AI MODEL CALL (with timeout)         │
│     ├─ callTextModel()  for text tasks   │
│     └─ callVisionModel() for image tasks │
│        → 30s default / 45s vision        │
│                                          │
│  4. RESPONSE PARSING                     │
│     └─ extract JSON (strip markdown)     │
│        → Zod schema validation           │
│        → PARSE_ERROR on mismatch         │
│                                          │
│  5. ERROR HANDLING                       │
│     └─ withErrorHandling() wrapper       │
│        → TIME OUT / API_ERROR / UNKNOWN  │
│        → Typed AiResult<T>               │
│                                          │
│  6. FALLBACK (on any failure)            │
│     └─ Deterministic, hardcoded response │
│        → ok:true, model:'fallback'       │
│                                          │
│  7. CACHE STORE (if cacheable)           │
│     └─ Hash key → TTL store             │
│                                          │
│  8. RETURN AiResult<T>                   │
│     └─ { ok, data, cached, model }       │
└─────────────────────────────────────────┘
    │
    ▼
Route Handler (returns JSON or SSE stream)
```

### 6.2 Five AI Functions

#### Function 1: `detectAppliances(userId, base64Image, mimeType)`
- **Type:** Vision (image → structured JSON)
- **Model:** `gemini-2.0-flash` (vision)
- **Input:** Base64-encoded room photo (JPEG/PNG/WebP, <4MB)
- **Output:** `DetectionResult { appliances[], roomType, summary }`
- **Caching:** Disabled (images vary)
- **Rate Limit:** 10 burst, 20/hour
- **Timeout:** 45 seconds
- **Fallback:** Generic appliance estimate with 0.3 confidence

#### Function 2: `generateInsights(userId, context)`
- **Type:** Text (carbon data → narrative)
- **Model:** `gemini-2.0-flash` (text)
- **Input:** Room type, total kg, cost, appliance summary, top savings
- **Output:** `{ insight: string, highlights: string[] }`
- **Caching:** 10-minute TTL (keyed on context hash)
- **Rate Limit:** 5 burst, 10/hour
- **Timeout:** 30 seconds
- **Fallback:** Data-driven narrative using input values

#### Function 3: `generateTwinRecommendations(userId, context)`
- **Type:** Text (twin data → analysis)
- **Model:** `gemini-2.0-flash` (text)
- **Input:** Complete twin snapshot (tier, dimensions, forecast, risks)
- **Output:** `{ summary, outlook, recommendations[], riskAssessment }`
- **Caching:** 15-minute TTL
- **Rate Limit:** 10 burst, 20/hour
- **Timeout:** 30 seconds
- **Fallback:** Tier-based deterministic response with generic recommendations

#### Function 4: `generateNegotiatorResponse(userId, messages)`
- **Type:** Text (conversational chat)
- **Model:** `gemini-2.0-flash` (text)
- **Input:** Full message history with system prompt (carbon passport)
- **Output:** Raw text string (may contain `action-plan` JSON blocks)
- **Caching:** Disabled (conversational)
- **Rate Limit:** 30 burst, 60/hour
- **Timeout:** 30 seconds
- **Fallback:** "I'm having trouble connecting..." with general advice
- **Streaming:** Response is sent as SSE word-chunks (15ms delay per word)

#### Function 5: `generateGoalSuggestions(userId, context)`
- **Type:** Text (twin data → goal suggestions)
- **Model:** `gemini-2.0-flash` (text)
- **Input:** Total kg, tier, dimension summary, Paris target
- **Output:** `GoalSuggestion[]` (title, description, targetKg, type, category, difficulty, etc.)
- **Caching:** 10-minute TTL
- **Rate Limit:** 10 burst, 20/hour
- **Timeout:** 30 seconds
- **Fallback:** 3 generic suggestions (reduce biggest dimension, plant-based days, daily logging)

#### Bonus: `generateForecast(userId, context)`
- **Type:** Text (twin data → forecast)
- **Model:** `gemini-2.0-flash` (text)
- **Input:** Total kg, Paris target, dimension summary, trend
- **Output:** `{ projection, confidence, keyDriver, recommendation }`
- **Caching:** 10-minute TTL
- **Rate Limit:** Reuses `insights` budget (10/hour total)
- **Timeout:** 30 seconds
- **Fallback:** Gap analysis between current and Paris target

### 6.3 Rate Limiting Design

**Algorithm:** In-memory token bucket (per-user, per-function)

```
Key: `${userId}:${functionKey}`
Bucket: { tokens: number, lastRefill: number }

Per-function limits:
  detect:             10 burst,  20/hour
  insights:            5 burst,  10/hour
  twin-recommendations:10 burst,  20/hour
  negotiator:         30 burst,  60/hour
  goal-suggestions:   10 burst,  20/hour
  default:            10 burst,  20/hour

Refill: tokens += elapsed_ms * (refillPerHour / 3_600_000)
Cap:    min(capacity, tokens)
GC:     Stale buckets not touched in 1 hour are evicted (checked every 5 min)
```

**Multi-instance strategy:** Current implementation is per-instance memory. For Vercel multi-instance deployment, swap to Upstash Redis. Migration path: replace `Map<string, Bucket>` with a Redis hash.

### 6.4 Caching Strategy

**Algorithm:** In-memory TTL cache with FNV-1a hashing and LRU eviction

```
Capacity: 200 entries (hard limit)
Eviction: Oldest inserted entry dropped when full

Per-function TTLs:
  detect:               0ms (disabled — images vary)
  insights:            10 min
  twin-recommendations:15 min
  goal-suggestions:    10 min
  negotiator:           0ms (disabled — conversational)
  forecast:            10 min (reuses insights TTL)

Cache key: `${functionKey}:${fnv1a_hash(JSON.stringify(input))}`
Invalidation: invalidateFunction('insights') clears all insights entries
```

**Cache invalidation triggers:**
- New scan uploaded → invalidate `insights` for that user's context
- User data changes (settings, appliances) → invalidate `twin-recommendations` and `goal-suggestions`
- Manual refresh button on twin/recommendations pages

### 6.5 Fallback Strategy

Every AI function has a **deterministic, hardcoded fallback response** that is returned when:

1. **Not configured** — `GEMINI_API_KEY` is not set
2. **Rate limited** — User exceeded their per-function budget
3. **Timed out** — Model call exceeded timeout (30s text, 45s vision)
4. **API error** — Gemini returned an error (quota, permission, overload)
5. **Parse error** — Raw response didn't match Zod schema
6. **Unknown error** — Unexpected exception

Fallback design rules:
- Fallbacks are always `ok: true` with `model: 'fallback'` — the UI never sees an error
- Fallbacks use real user data from the context object where available
- Generic fallbacks are used only when no user data exists
- The `cached: false` flag distinguishes fallbacks from AI responses

### 6.6 Error Handling

**Typed result pattern** (discriminated union):

```typescript
type AiResult<T> =
  | { ok: true; data: T; cached: boolean; model: string }
  | { ok: false; error: AiError }

type AiError = {
  code: 'RATE_LIMITED' | 'TIMEOUT' | 'API_ERROR' | 'PARSE_ERROR' | 'NOT_CONFIGURED' | 'UNKNOWN'
  message: string
  retryable: boolean
}
```

**Error handling pipeline:**
1. `withErrorHandling()` wraps every AI model call
2. Catches: AbortError/timeout, API errors, SDK exceptions
3. Normalizes all to the `AiError` type
4. Each AI function in the facade handles `!result.ok` by returning a fallback
5. Route handlers handle rate limit errors separately (return 429 status)
6. Fallback responses never break the UI

---

## 7. State Management Architecture

### 7.1 State Management Strategy

CarbonTwin uses a **layered state management approach** with clear boundaries:

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVER STATE                              │
│  (React Server Components + Server Actions)                  │
│                                                              │
│  ┌────────────────────┐  ┌────────────────────────────┐     │
│  │  Server Components  │  │    Server Actions          │     │
│  │  (async data fetch) │  │  (mutations + revalidate)  │     │
│  │  • Services layer   │  │  • auth.actions.ts         │     │
│  │  • Direct DB access │  │  • goal-actions.ts         │     │
│  │  • No client JS     │  │  • settings-actions.ts     │     │
│  └────────────────────┘  └────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
      Server data flows down via props / RSC payload
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              CLIENT-SIDE STATE (TANSTACK QUERY)              │
│  (Interactive islands that need live data)                   │
│                                                              │
│  ┌────────────────────┐  ┌────────────────────────────┐     │
│  │  useQuery hooks    │  │  useMutation hooks          │     │
│  │  • Dashboard data  │  │  • Update settings          │     │
│  │  • Twin data       │  │  • Create goals             │     │
│  │  • AI responses    │  │  • Upload photo             │     │
│  │  • Goals/scan list │  │  • Delete account           │     │
│  │  caching + refresh │  │  • optimistic updates       │     │
│  └────────────────────┘  └────────────────────────────┘     │
│  Global queryClient with:                                    │
│    • staleTime: 30s                                         │
│    • gcTime: 5min                                           │
│    • refetchOnWindowFocus: true                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              CLIENT STATE (ZUSTAND)                          │
│  (UI-only state, never persisted to server)                  │
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │  uiStore:                                        │       │
│  │  • sidebarOpen (boolean)                         │       │
│  │  • mobileNavOpen (boolean)                       │       │
│  │  • activeNegotiatorConversation (string | null)  │       │
│  │  • selectedScenarios (ScenarioKey[])             │       │
│  │  • uploadState (idle | uploading | processing)   │       │
│  └──────────────────────────────────────────────────┘       │
│  No persistence needed (zustand/middleware not used)         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              FORM STATE (REACT HOOK FORM + ZOD)              │
│  (Ephemeral form state)                                      │
│                                                              │
│  ┌────────────────────┐  ┌────────────────────────────┐     │
│  │  useForm + Zod     │  │  Zod schemas               │     │
│  │  • Login form      │  │  • loginSchema              │     │
│  │  • Register form   │  │  • registerSchema           │     │
│  │  • Settings forms  │  │  • profileSchema            │     │
│  │  • Goal create     │  │  • createGoalSchema         │     │
│  │  • Onboarding      │  │  • (from validations/)      │     │
│  └────────────────────┘  └────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Server State (TanStack Query)

Used for client-side data fetching where interactivity is required.

**Typical query pattern:**

```typescript
// In a client component:
const { data, isLoading, error } = useQuery({
  queryKey: ['twin-recommendations', userId],
  queryFn: () => fetch('/api/twin-recommendations', { method: 'POST' }).then(r => r.json()),
  staleTime: 1000 * 60 * 5,  // 5 min
  gcTime: 1000 * 60 * 15,    // 15 min
})
```

**Mutation pattern for AI endpoints:**

```typescript
const detectMutation = useMutation({
  mutationFn: (payload: { image: string; mimeType: string }) =>
    fetch('/api/detect', { method: 'POST', body: JSON.stringify(payload) }).then(r => r.json()),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['insights'] })
  },
})
```

**Query key convention:**
```
['dashboard', userId]
['twin', userId]
['results', userId, scanId?]
['goals', userId]
['settings', userId]
['insights', userId, scanId]
['twin-recommendations', userId]
['goal-suggestions', userId]
['negotiator', userId, conversationId]
```

### 7.3 Client State (Zustand)

Minimal UI-only state, managed with a single store:

```typescript
interface UIState {
  sidebarOpen: boolean
  mobileNavOpen: boolean
  activeConversationId: string | null
  selectedScenarios: ScenarioKey[]
  uploadState: 'idle' | 'uploading' | 'processing' | 'done' | 'error'
  
  // Actions
  toggleSidebar: () => void
  setMobileNavOpen: (open: boolean) => void
  setActiveConversation: (id: string | null) => void
  toggleScenario: (key: ScenarioKey) => void
  setUploadState: (state: UIState['uploadState']) => void
}
```

**Design choice:** Zustand over Context because:
- No provider nesting required
- No re-renders on unrelated state changes
- Simpler API for toggles and transient UI state
- Can be used outside React (e.g., event handlers)

### 7.4 Form State (React Hook Form + Zod)

| Form | Schema | Description |
|------|--------|-------------|
| Login | `loginSchema` | Email + password |
| Register | `registerSchema` | Name + email + password + confirm |
| Forgot Password | `forgotPasswordSchema` | Email only |
| Reset Password | `resetPasswordSchema` | Token + password + confirm |
| Profile | `profileSchema` | Name, country, region, city, household size, unit system, currency |
| Preferences | `preferencesSchema` | Plain language, reduced motion, high contrast |
| Notifications | `notificationsSchema` | Email digest, push, notifications, reminders |
| Privacy | `privacySchema` | AI enabled, daily budget, share twin |
| Create Goal | `createGoalSchema` | Title, description, type, target kg, duration |

All schemas live in `src/lib/validations/auth.ts` (auth) or inline in `settings-actions.ts` and `goal-actions.ts`.

### 7.5 Auth State (NextAuth)

- **Server-side:** `getServerSession(authOptions)` in Server Components and Route Handlers
- **Client-side:** `useSession()` from `next-auth/react` (via SessionProvider)
- **Token enrichment:** JWT token carries `id`, `plan`, and `onboardingDone` fields
- **Session updates:** Calling `update()` from the client refreshes the JWT (used after onboarding completion)
- **Session strategy:** JWT (required by Credentials provider)

---

## 8. Development Roadmap

### Phase 1: Foundation & Core UX (Weeks 1-3)

| Feature | Description | Status |
|---------|-------------|--------|
| Auth flow | Login, register, forgot/reset password, Google OAuth | ✅ Complete |
| Landing page | Marketing site with hero, features, CTA | ✅ Complete |
| Dashboard | KPI cards, trend chart, category breakdown, recent scans, goals | ✅ Complete |
| Empty state | Dashboard empty state with "Load sample data" CTA | ✅ Complete |
| Settings | Profile, preferences, notifications, privacy, danger zone | ✅ Complete |
| Onboarding | Multi-step onboarding flow | 🟡 Placeholder |
| Demo data seed | "Load sample data" button generates 14 days of realistic data | ✅ Complete |

### Phase 2: Detection & AI Features (Weeks 4-6)

| Feature | Description | Status |
|---------|-------------|--------|
| Upload & Detect | Photo upload + AI appliance detection | ✅ Complete |
| Results page | Appliance cards, impact breakdown, top emitters, savings opportunities | ✅ Complete |
| AI Insights | Narrative insight generation from detection data | ✅ Complete |
| Climate Twin | 5-dimension carbon persona with tiers, radar chart, forecast | ✅ Complete |
| AI Twin Recommendations | Personalized recommendation narrative | ✅ Complete |
| AI Negotiator | Streaming chat with carbon passport context | ✅ Complete |
| AI Goal Suggestions | Personalized goal recommendations | ✅ Complete |

### Phase 3: What-If Simulator & Goals (Weeks 7-8)

| Feature | Description | Status |
|---------|-------------|--------|
| Simulator | 6 scenarios with toggle, before/after comparison, 10-year projection | ✅ Complete |
| Goals | Create, track, complete goals with progress milestones | ✅ Complete |
| Achievements | 8 deterministic achievements (First Step, Goal Getter, Centurion, etc.) | ✅ Complete |
| Goal progress snapshots | Periodic snapshots with onTrack status | ✅ Complete |

### Phase 4: Premium & Growth (Weeks 9-11)

| Feature | Description |
|---------|-------------|
| Subscription plans | FREE / PRO / TEAM with feature gates |
| PRO features | Unlimited scans, advanced analytics, CSV export |
| Team features | Shared goals, team dashboard, manager view |
| Email reports | Weekly digest with progress, insights, recommendations |
| Public twin sharing | Shareable twin profile page |
| Dark mode refinements | Full dark mode polish across all components |

### Phase 5: Scale & Optimize (Weeks 12-14)

| Feature | Description |
|---------|-------------|
| pgvector embeddings | Semantic search in negotiator history |
| Redis rate limiting | Swap in-memory limiter for Upstash Redis |
| Prisma Accelerate | Connection pooling for production database |
| Performance audit | Lighthouse, Core Web Vitals, bundle analysis |
| E2E tests | Playwright test suite for critical flows |
| i18n preparation | Extract strings for future localization (next-intl already installed) |
| PWA enhancements | Offline support, background sync, push notifications |

---

## 9. Deployment Architecture

### 9.1 Vercel Configuration

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "bun run db:generate && next build",
  "installCommand": "bun install",
  "crons": [
    { "path": "/api/cron/weekly-insights", "schedule": "0 3 * * *" },
    { "path": "/api/cron/goal-progress", "schedule": "0 4 * * *" }
  ]
}
```

**Build pipeline:**
```
1. bun install          → Install dependencies (fast, Bun package manager)
2. prisma generate      → Generate Prisma Client from schema
3. next build           → Build Next.js app (all routes, static optimization)
4. (output: standalone) → Produces minimal Docker-ready output
```

### 9.2 Environment Variables

| Variable | Required | Source | Description |
|----------|----------|--------|-------------|
| `DATABASE_URL` | ✅ | Neon/Supabase/Vercel Postgres | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | `openssl rand -base64 32` | NextAuth encryption secret |
| `NEXTAUTH_SECRET` | ✅ | Same as AUTH_SECRET | NextAuth secret (Edge runtime) |
| `NEXTAUTH_URL` | ✅ | Vercel deployment URL | Production URL for callbacks |
| `GEMINI_API_KEY` | ❌ | Google AI Studio | Gemini API key (falls back gracefully) |
| `GOOGLE_CLIENT_ID` | ❌ | Google Cloud Console | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google Cloud Console | Google OAuth client secret |
| `NEXT_PUBLIC_GOOGLE_ENABLED` | ❌ | Set to `true` when Googles OAuth is configured | Client-side Google OAuth toggle |

### 9.3 Production Database

**Provider:** Neon (recommended) or Vercel Postgres
**Connection pooling:** Prisma Accelerate or PgBouncer for high-traffic scenarios

**Migration commands:**
```bash
# Pull production env vars
vercel env pull .env.production

# Run migrations
bunx prisma migrate deploy

# Verify
bunx prisma validate
```

### 9.4 Cron Jobs

| Cron | Schedule | Function |
|------|----------|----------|
| `/api/cron/weekly-insights` | Daily at 3:00 AM | Generates weekly insight summaries for active users |
| `/api/cron/goal-progress` | Daily at 4:00 AM | Creates goal progress snapshots for active goals |

### 9.5 Security Headers

Configured in `next.config.ts` and `vercel.json`:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cache-Control: public, max-age=31536000, immutable  (static assets)
```

### 9.6 Image Optimization

- Formats: AVIF + WebP (automatic via `next/image`)
- Remote patterns: `lh3.googleusercontent.com` (Google avatars)
- Cache: 24-hour minimum TTL

### 9.7 Monitoring & Observability

| Concern | Tool | Approach |
|---------|------|----------|
| **Error tracking** | Sentry (planned) | Capture unhandled exceptions, API errors, AI failures |
| **AI cost tracking** | Custom logging | Log `tokensIn`, `tokensOut`, `model` per AIMessage |
| **Rate limit monitoring** | Custom metrics | Track rate limit hit rates by function |
| **Performance** | Vercel Analytics | Core Web Vitals, page load times, API durations |
| **Uptime** | Vercel Status | Built-in deployment monitoring |

### 9.8 Continuous Deployment

```
Main branch (main)
    │
    ├── PR opened → Vercel Preview Deployment (unique URL)
    │   └── Preview DB: Neon branch (isolated)
    │
    └── PR merged → Production Deployment
        └── Build + migrate + deploy
```

---

## Risks & Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Gemini API cost overruns** | High | Per-user rate limiting, daily budgets, caching (10-15min TTLs) |
| **Single-instance rate limiter** | Medium | Works for single Vercel instance; migrate to Upstash Redis in Phase 5 |
| **In-memory cache volatility** | Low | Cache TTLs are short (10-15min); cold start penalty is minimal |
| **SQLite → PostgreSQL migration** | Low | Portable schema design ensures zero structural changes |
| **JWT token size growth** | Low | Token only carries `id`, `plan`, `onboardingDone` — minimal payload |
| **AI model deprecation** | Low | `gemini-2.0-flash` constant in `env.ts` — single-line change |
| **No connection pooling** | Medium | Prisma Accelerate planned for Phase 5; Neon free tier limits connections |

---

## Next Steps

1. **Phase 1 immediate work:** Complete the multi-step onboarding flow (currently a placeholder)
2. **Phase 4 preparation:** Design the subscription model and feature gate system
3. **Testing:** Add Playwright E2E tests for critical flows (auth, upload, dashboard)
4. **Monitoring:** Set up Sentry for error tracking and Vercel Analytics for performance
5. **Performance:** Run a Lighthouse audit and optimize bundle sizes for chart-heavy pages
6. **Documentation:** Maintain this blueprint as the single source of truth for architectural decisions
