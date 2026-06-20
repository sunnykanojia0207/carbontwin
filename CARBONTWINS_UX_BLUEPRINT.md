# CarbonTwin — UX Blueprint

> **Document version:** 1.0  
> **Last updated:** June 2026  
> **Product:** CarbonTwin — AI-powered personal carbon intelligence platform  
> **Tech stack:** Next.js 16 · React 19 · Tailwind CSS v4 · shadcn/ui · Framer Motion · Recharts  
> **Auth:** NextAuth v4 (credentials + Google OAuth)  
> **Database:** PostgreSQL via Prisma  

---

## Table of Contents

1. [Design System Overview](#1-design-system-overview)
2. [User Personas](#2-user-personas)
3. [User Journey Maps](#3-user-journey-maps)
4. [Page-by-Page UX Spec](#4-page-by-page-ux-spec)
5. [Component Inventory](#5-component-inventory)
6. [Accessibility Standards](#6-accessibility-standards)
7. [Micro-interactions & Motion](#7-micro-interactions--motion)
8. [Empty State Library](#8-empty-state-library)

---

## 1. Design System Overview

### 1.1 Visual Language

CarbonTwin employs a **premium SaaS aesthetic** inspired by Stripe, Linear, Vercel, and Notion. The visual identity is defined by:

- **Large editorial typography**: Bold headlines with tight tracking, generous scale jumps
- **Emerald/green accents**: The brand color (`oklch(0.58 0.15 162)`) anchors all interactive elements
- **Radial brand gradients**: Soft green radial fills behind hero sections and cards
- **Subtle grid patterns**: `bg-grid` utility for background texture on marketing sections
- **Generative orb avatar**: The Climate Twin is represented by a pulsing, layered circular visualization
- **Glassmorphism accents**: Backdrop-blur overlays on hover cards and navigation
- **Dark/light mode**: Complete dual theme system via `next-themes` with OKLCH color tokens

### 1.2 Spacing & Rhythm System

The spacing system derives from Tailwind's default scale (4px base unit), with a consistent rhythm across all pages:

| Token | Value | Usage |
|-------|-------|-------|
| `gap-3` | 12px | Compact card grids, inline icon-text spacing |
| `gap-4` | 16px | Standard component spacing within sections |
| `space-y-4` | 16px | Vertical rhythm between stacked content blocks |
| `p-4` | 16px | Card padding (compact) |
| `p-6` | 24px | Card padding (standard) |
| `px-4` | 16px | Horizontal page margin (mobile) |
| `sm:px-6` | 24px | Horizontal page margin (tablet+) |
| `py-6` | 24px | Section vertical padding (compact) |
| `py-8` | 32px | Section vertical padding (standard) |
| `lg:py-10` | 40px | Section vertical padding (desktop) |
| `mt-6` | 24px | Section spacing after headings |
| `gap-6` | 24px | Large grid gaps |

**Page layout rhythm** (top to bottom):
1. Page title + description (2 lines)
2. Tab navigation bar
3. Content panels with `space-y-4` between sections
4. Cards within sections use `gap-3` or `gap-4` grids

### 1.3 Typography Hierarchy

**Font stack:** Geist Sans (variable) for UI, Geist Mono for tabular data and code.

| Element | Size | Weight | Tracking | Usage |
|---------|------|--------|----------|-------|
| **Display** | `text-4xl` → `lg:text-[4.25rem]` | `font-semibold` | `tracking-tight` | Hero headline (landing page only) |
| **H1** | `text-2xl` | `font-semibold` | `tracking-tight` | Page titles |
| **H2** | `text-xl` | `font-semibold` | `tracking-tight` | Empty state headings, section titles |
| **H3** | `text-base` | `font-semibold` | `tracking-tight` | Card titles, capability names |
| **Body** | `text-sm` | `font-medium` | normal | Body text, list items |
| **Body small** | `text-xs` | `font-medium` | normal | Descriptions, subtitles |
| **Caption** | `text-[10px]` or `text-[11px]` | `font-medium` | `tracking-wide` | Labels, badges, stats |
| **Mono** | `text-xs` → `text-sm` | `font-semibold` | `tabular-nums` | CO₂e values, KPIs, scores |
| **Eyebrow** | `text-xs` | `font-semibold` | `uppercase tracking-wide` | Section labels |

**Key typography patterns:**
- All headings use `tracking-tight` for editorial density
- Tabular numbers (`tabular-nums`) are enforced on ALL numerical data displays
- Muted text uses `text-muted-foreground` (OKLCH 0.52 luminance in light, 0.71 in dark)
- Gradient text uses `.text-gradient-brand` utility for hero emphasis
- Code/technical references use Geist Mono (`font-mono`)

### 1.4 Color System

#### Brand Colors (OKLCH)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--primary` | `oklch(0.58 0.15 162)` | `oklch(0.72 0.17 162)` | Buttons, links, active states, brand elements |
| `--primary-foreground` | `oklch(0.99 0.01 160)` | `oklch(0.16 0.02 162)` | Text on primary backgrounds |
| `--brand` | `oklch(0.58 0.15 162)` | `oklch(0.72 0.17 162)` | Brand mark, gradient text |
| `--brand-foreground` | `oklch(0.99 0.01 160)` | `oklch(0.16 0.02 162)` | Text on brand backgrounds |

#### Neutral Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | `oklch(0.99 0.002 150)` | `oklch(0.165 0.008 155)` | Page background |
| `--foreground` | `oklch(0.18 0.01 155)` | `oklch(0.97 0.005 155)` | Primary text |
| `--card` | `oklch(1 0 0)` | `oklch(0.205 0.01 155)` | Card surfaces |
| `--muted` | `oklch(0.965 0.004 150)` | `oklch(0.24 0.01 155)` | Subtle backgrounds |
| `--muted-foreground` | `oklch(0.52 0.012 155)` | `oklch(0.71 0.012 155)` | Secondary text |
| `--border` | `oklch(0.91 0.004 150)` | `oklch(1 0 0 / 10%)` | Borders, dividers |
| `--accent` | `oklch(0.95 0.03 162)` | `oklch(0.28 0.04 162)` | Hover backgrounds |
| `--accent-foreground` | `oklch(0.30 0.06 162)` | `oklch(0.85 0.10 162)` | Text on accent |

#### Semantic Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Errors, destructive actions |
| `--ring` | `oklch(0.58 0.15 162 / 0.5)` | `oklch(0.72 0.17 162 / 0.5)` | Focus rings |

#### Chart Colors (Emerald-forward palette)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--chart-1` | `oklch(0.58 0.15 162)` | `oklch(0.72 0.17 162)` | Primary chart series (emerald) |
| `--chart-2` | `oklch(0.65 0.13 180)` | `oklch(0.70 0.14 180)` | Secondary chart series (teal) |
| `--chart-3` | `oklch(0.70 0.10 200)` | `oklch(0.72 0.12 200)` | Tertiary chart series (sky) |
| `--chart-4` | `oklch(0.75 0.14 145)` | `oklch(0.78 0.15 145)` | Quaternary (light green) |
| `--chart-5` | `oklch(0.55 0.10 130)` | `oklch(0.62 0.12 130)` | Quinary (olive) |

#### Category Colors (from dashboard service)

| Category | Color |
|----------|-------|
| Transport / Driving | `#0ea5e9` (sky-500) |
| Flights | `#6366f1` (indigo-500) |
| Transit | `#06b6d4` (cyan-500) |
| Food | `#10b981` (emerald-500) |
| Meat | `#f43f5e` (rose-500) |
| Plant-based | `#22c55e` (green-500) |
| Dairy | `#eab308` (yellow-500) |
| Home Energy / Electricity | `#f59e0b` (amber-500) |
| Heating | `#ef4444` (red-500) |
| Shopping | `#a855f7` (purple-500) |
| Digital | `#8b5cf6` (violet-500) |

#### Confidence Colors (detection results)

| Confidence | Color |
|------------|-------|
| ≥ 80% | `text-emerald-500` |
| 60-79% | `text-sky-500` |
| 40-59% | `text-amber-500` |
| < 40% | `text-red-500` |

### 1.5 Elevation / Shadow System

CarbonTwin uses a minimal shadow system with border-based elevation rather than heavy box-shadows, following the modern SaaS trend:

| Level | Token | Usage |
|-------|-------|-------|
| Flat | No border | Page backgrounds, muted surfaces |
| Raised | `border border-border` | Cards, panels, sections |
| Elevated | `border shadow-sm` | Dropdown menus, hovered cards |
| Modal | `border shadow-2xl` | Dialogs, sheets |
| Sticky | `border-b backdrop-blur` | Sticky headers, nav bars |

**Border radius tokens:**
- `--radius`: `0.75rem` (12px) — base radius
- `--radius-sm`: `calc(var(--radius) - 4px)` = 8px
- `--radius-md`: `calc(var(--radius) - 2px)` = 10px
- `--radius-lg`: `var(--radius)` = 12px
- `--radius-xl`: `calc(var(--radius) + 4px)` = 16px

**Specific radius usage:**
- `rounded-lg` (8px): Cards, input fields, buttons
- `rounded-xl` (12px): Image containers, section cards, dropzones
- `rounded-2xl` (16px): Chat bubbles, modals
- `rounded-full`: Avatars, badges, pill buttons
- `rounded-md` (6px): Badges, inline tags

### 1.6 Motion Principles

All motion follows these principles:

1. **Fast by default**: UI transitions complete in 200-400ms
2. **Subtle micro-interactions**: Hover effects at 150-200ms
3. **Spring physics**: Tab indicator, card entrance, modal transitions use `type: 'spring', stiffness: 500, damping: 35`
4. **Respects reduced motion**: All framer-motion animations check `useReducedMotion()`; scroll animations use `prefers-reduced-motion: reduce`
5. **Staggered entrances**: Lists of items (appliance cards, capability cards) use staggered children with 60-100ms delays
6. **Opacity + translateY** for content entrances (never scale or rotate for functional elements)
7. **Animated orb**: The Climate Twin avatar features continuous rotation (40s/28s) and gentle pulsing (4s cycle) when motion is not reduced

---

## 2. User Personas

### 2.1 Eco-conscious Homeowner

| Attribute | Detail |
|-----------|--------|
| **Name** | Maya Chen |
| **Photo** | Female, 30s, professional |
| **Demographics** | 34 years old · San Francisco, CA · Lives with partner in 2BR apartment · Software engineer · $140k household income |
| **Goals** | Reduce household carbon footprint by 40% in 2 years · Lower energy bills · Feel in control of her environmental impact |
| **Pain Points** | Overwhelmed by conflicting sustainability advice · Doesn't know where to start · Previous apps required too much manual data entry |
| **Tech Comfort** | High — daily user of SaaS tools, comfortable with AI features, prefers mobile but uses desktop for deep work |
| **Key Journeys** | Onboarding → Upload photos → View results → Set goals → Simulate changes → Track progress |

### 2.2 Sustainability Manager

| Attribute | Detail |
|-----------|--------|
| **Name** | James Okonkwo |
| **Photo** | Male, 40s, professional |
| **Demographics** | 42 years old · London, UK · Lives with family (4) in 3BR house · Sustainability manager at mid-size company · £85k salary |
| **Goals** | Lead by example at home · Master carbon data to inform workplace decisions · Reach net-zero household within 5 years |
| **Pain Points** | Wants granular data, not gamification · Needs exportable reports · Frustrated by "greenwashing" apps with no methodology |
| **Tech Comfort** | Medium-high — comfortable with dashboards and analytics, less interested in gamification or social features |
| **Key Journeys** | Full onboarding → Configure Climate Twin dimensions → Run multiple simulations → Review forecast → Set quantitative goals |

### 2.3 Climate Advocate

| Attribute | Detail |
|-----------|--------|
| **Name** | Priya Sharma |
| **Photo** | Female, 20s, student/activist |
| **Demographics** | 26 years old · Berlin, Germany · Lives in shared flat · Environmental science graduate student · €30k stipend |
| **Goals** | Achieve the lowest possible personal footprint · Inspire friends and community · Document reduction journey with verifiable data |
| **Pain Points** | Skeptical of "carbon offset" features · Wants transparency in methodology · Needs concrete proof of impact |
| **Tech Comfort** | High — uses open-source tools, values privacy, prefers AI-powered features |
| **Key Journeys** | Onboarding → Configure detailed dimensions → Explore AI Negotiator → Set ambitious goals → Track achievements → Community advocacy |

### 2.4 Family Budget Planner

| Attribute | Detail |
|-----------|--------|
| **Name** | Carlos Rivera |
| **Photo** | Male, 35s, family-oriented |
| **Demographics** | 38 years old · Austin, TX · Lives with spouse + 2 kids in 4BR house · Small business owner · $90k household income |
| **Goals** | Save money on utilities · "Kill two birds" — save money AND help the environment · Teach kids about sustainability |
| **Pain Points** | Limited time · Cares more about cost savings than carbon metrics · Needs simple, obvious ROI projections |
| **Tech Comfort** | Medium — comfortable with mobile apps, prefers straightforward interfaces without jargon |
| **Key Journeys** | Onboarding (quick) → Upload utility bills → Simulator for cost savings → Negotiator for bill reduction → Set simple goals |

---

## 3. User Journey Maps

### 3.1 Onboarding Journey

**Goal:** Convert a new user from first visit to their first scan result in under 5 minutes.

```
Landing Page → Register → Onboarding Wizard → Dashboard → Scan Upload → Results
```

| Step | User Action | System Response | Emotions | Notes |
|------|------------|-----------------|----------|-------|
| 1. Arrive | Visits landing page, reads hero | Shows marketing content, animated CarbonPulse visual | Curious, skeptical | Trust line ("EPA, DEFRA, IPCC") builds credibility |
| 2. Sign up | Clicks "Meet your Climate Twin" → fills registration form | Creates account, validates email/password, shows password strength meter | Anticipated, impatient | Form uses react-hook-form + zod validation with real-time field errors |
| 3. Auto sign-in | Submitted form triggers auto-login | NextAuth credentials sign-in → JWT issued → redirect to /onboarding | Neutral | No explicit post-registration login needed |
| 4. Welcome | Sees welcome card | Shows "Welcome to CarbonTwin" with Leaf icon, explanatory message, "Go to dashboard" CTA | Ready to start | Current placeholder — full 5-step wizard planned |
| 5. Dashboard | Lands on dashboard (empty state) | Shows "Your dashboard is ready — it just needs data" with LoadDemoDataButton + Upload CTA | Eager but uncertain | Empty state is friendly, not intimidating |
| 6. Upload | Clicks "Upload & Detect" → drags or selects room photo | UploadDropzone validates file type/size, creates preview | Engaged | Drag & drop + clipboard paste + click-to-browse supported |
| 7. Analyze | Clicks "Analyze with AI" | Image compressed (1024px, JPEG 0.85), POST to /api/detect, animated timeline plays | Anticipated, a bit anxious | DetectionTimeline shows 5 cosmetic steps to explain wait time |
| 8. Results | Sees detected appliances + carbon impact | DetectionResults shows animated cards with confidence rings, total CO₂e | Delighted, informed | Per-appliance carbon + cost estimates displayed |
| 9. View full | Clicks "View full results" | Navigates to /results?scanId=... with tabbed detail view | Curious | ResultsTabs: Overview → Appliances → Impact → Savings → AI Insights |

**Key success metric:** 70%+ of new users complete at least one scan within 24 hours of registration.

### 3.2 Daily Engagement Journey

**Goal:** Users check their dashboard regularly (3+ times/week) and log activities.

```
Dashboard → Check Progress → Log Activity → View Impact
```

| Step | User Action | System Response | Emotions | Notes |
|------|------------|-----------------|----------|-------|
| 1. Login | Enters credentials (or session restored) | Server-side session check, redirects to /dashboard | Quick, frictionless | Already-authenticated users skip auth |
| 2. Glance KPIs | Scans KPI row | Shows: This week (kg, vs last week), Month total, Streak days, Reduction amount | Informed, motivated | Color-coded trend indicators |
| 3. Check score | Looks at carbon score gauge | Radial gauge (0-100) with trend + current vs target | Self-assessing | Score goes UP when footprint goes DOWN |
| 4. View trend | Reviews 14-day trend chart | Area chart with daily kg and goal line | Pattern-seeking | Weekend spikes visible |
| 5. Review scans | Looks at recent scans list | Last 6 scans shown with detection count and total kg | Reminded | Can click to view results |
| 6. Check goals | Glances goals progress | Active goals with progress bars, on-track indicators | Motivated (if on track) or concerned | Supports habit formation |
| 7. Log new activity | Uploads new photo or manually logs | New scan workflow, results appended to dashboard | Productive | Quick upload path minimizes friction |

**Key success metric:** Average of 4+ sessions per week with 2+ activities logged per session.

### 3.3 Goal Setting Journey

**Goal:** User creates a meaningful, achievable goal that compounds over time.

```
Goals Page → Browse Suggestions → Set Goal → Track Progress → Achieve
```

| Step | User Action | System Response | Emotions | Notes |
|------|------------|-----------------|----------|-------|
| 1. Navigate | Opens /goals from sidebar | Server loads goals data, GoalsTabs renders Active tab (empty state if first time) | Intentional |
| 2. Browse suggestions | Clicks "Suggestions" tab | Shows AI-generated suggestions based on footprint data + progress chart | Curious | Suggestions are data-driven, not generic |
| 3. Accept suggestion | Clicks "Create Goal" on a suggestion | CreateGoalDialog opens with pre-filled suggestion | Committed | Modal over current context |
| 4. Customize | Adjusts target, deadline, name | Form updates in real-time, validates inputs | In control |
| 5. Confirm | Saves goal | Server action creates goal record, goals page refreshes, new card appears in Active tab | Accomplished |
| 6. Track progress | Returns to goals periodically | Progress chart updates, milestone badges earned, streak counter increments | Consistent |
| 7. Complete | Reaches 100% progress | Goal moves to Completed tab, achievement unlocked, notification shown | Triumphant | Motivates next goal |

**Key success metric:** Average of 2+ goals created per user within first 14 days.

### 3.4 What-If Simulation Journey

**Goal:** User models lifestyle changes before committing, understands financial + carbon ROI.

```
Simulator → Toggle Scenarios → View Results → Compare → Adopt
```

| Step | User Action | System Response | Emotions | Notes |
|------|------------|-----------------|----------|-------|
| 1. Open simulator | Navigates to /simulator | Server loads twin dimensions, SimulatorTabs renders with Scenarios tab active | Exploratory |
| 2. Toggle scenarios | Clicks scenario cards (Remote Work, LED, Solar, etc.) | Active scenarios highlighted, state updates, badge shows "2 of 6 active" | Engaged, experimenting | Toggle is additive (combinable) |
| 3. View results | Switches to Results tab | SimulationSummary shows before/after KPI cards + BeforeAfterChart + ScenarioComparison | Informed |
| 4. Check timeline | Switches to Timeline tab | SavingsTimeline shows 10-year projection with payback line | Financially aware |
| 5. Compare | Views Comparison tab | Side-by-side scenario impact comparison | Decisive |
| 6. Take action | Accepts a recommendation | Could link to goal creation or Negotiator for follow-through | Committed |

**Key success metric:** 30%+ of users who open the simulator adopt at least one scenario as a goal.

### 3.5 Climate Twin Journey

**Goal:** User builds and maintains an accurate personal carbon model that forecasts their trajectory.

```
Twin Page → View Overview → Explore Dimensions → Check Forecast → Review Risks
```

| Step | User Action | System Response | Emotions | Notes |
|------|------------|-----------------|----------|-------|
| 1. Open twin | Navigates to /twin | Server loads TwinData DTO (profile, dimensions, forecast, risk areas, opportunities) | Curious |
| 2. View overview | Sees TwinHero orb + stats | Animated orb shows tier badge, CO₂e, monthly breakdown, Paris target | Impressed | The orb is the emotional centerpiece |
| 3. Explore dimensions | Switches to Dimensions tab | 5 dimension cards (Home, Appliances, Transport, Lifestyle, Diet) with border-color accent | Self-insightful | Color-coded by dimension |
| 4. Check forecast | Switches to Forecast tab | Multi-year AreaChart with 3 trajectories + Paris target reference line | Forward-looking | "5-yr potential" badge |
| 5. Compare | Switches to Comparison tab | Radar chart + scenario forecast comparison | Analytical | Polar grid for dimensional balance |
| 6. Review risks | Switches to Risks & Opportunities tab | RiskAreas cards ranked by severity + AI recommendations list | Action-oriented | Clear "what to fix first" |

**Key success metric:** Users visit their Climate Twin page at least once per week.

### 3.6 Negotiator Journey

**Goal:** User engages with AI to negotiate realistic reduction commitments.

```
Negotiator → Chat → Get Analysis → Accept Plan → Create Goal
```

| Step | User Action | System Response | Emotions | Notes |
|------|------------|-----------------|----------|-------|
| 1. Open negotiator | Navigates to /negotiator | Server loads last conversation for context, NegotiatorClient renders with empty state | Cautiously curious | Context memory = personalized |
| 2. Read prompts | Sees suggested prompts | SuggestedPrompts shows context-aware options | Guided, not lost |
| 3. Send message | Types or clicks a prompt | Optimistic UI adds user message + streaming assistant message | Engaged | Auto-scroll to bottom |
| 4. Wait for response | Watches streaming text appear | SSE stream from /api/negotiator, token-by-token rendering | Anticipated | Pulsing cursor during stream |
| 5. Review analysis | Reads AI response | ChatMessage renders structured text + ActionPlanCard if plans detected | Informed | Parsed action plans rendered as interactive cards |
| 6. Accept plan | Clicks "Accept" on ActionPlanCard | Toast confirms acceptance, future phase creates Goal record | Committed | Plan becomes actionable |
| 7. Continue | Sends follow-up message | Conversation tree continues, context preserved | Ongoing | Multi-turn dialogue |

**Key success metric:** 25%+ of conversations result in an accepted action plan.

---

## 4. Page-by-Page UX Spec

### 4.1 Landing Page (`/`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Marketing conversion — explain value proposition, build trust, drive registration |
| **User Goal** | Understand what CarbonTwin does and decide to sign up |
| **Path** | `src/app/page.tsx` → Server Component with session check |

**Content hierarchy (top to bottom):**
1. `SiteNav` — Logo, navigation links, CTA buttons (dynamically switch between "Sign in" / "Dashboard")
2. `Hero` — Large editorial headline ("Your footprint, finally legible."), emerald radial gradient + grid backdrop, animated CarbonPulse visualization, dual CTAs ("Meet your Climate Twin" primary, "See how it works" secondary), trust line with EPA/DEFRA/IPCC methodology citation
3. `Problem` — Section reframing carbon as invisible/abstract into a tangible problem
4. `Solution` — 6 capabilities in a 3-column grid: Invisible Carbon Detector, Digital Climate Twin, What-If Simulator, AI Carbon Negotiator, Sustainability Goals, Carbon Forecasting
5. `FeatureHighlights` — Detailed feature descriptions with visual emphasis
6. `HowItWorks` — 3-step vertical timeline: (1) Meet your Twin, (2) Log your life, (3) Reduce with help
7. `AIFeatures` — AI-specific capabilities and technology highlights
8. `Technology` — Technical foundation and methodology
9. `FAQ` — Expandable accordion with common questions
10. `FinalCTA` — Final conversion push with registration link
11. `SiteFooter` — Links, legal, social

**Interactive states:**
- **Loading:** Skeleton nav (no JS needed — fully server-rendered marketing page)
- **Logged in:** Nav shows "Dashboard" link instead of "Sign in"
- **Error:** N/A (static marketing content, no data dependencies)
- **Edge cases:** Scroll animations use Intersection Observer via `Reveal` component; respects `prefers-reduced-motion`

**Mobile adaptation:**
- Hero stacks vertically: copy above visual
- Grid layouts collapse to single column
- "How it Works" timeline becomes simple stacked cards without vertical line
- Navigation collapses to hamburger menu (via SiteNav)

**Transitions:**
- `Reveal` component animates sections into view with `opacity 0 → 1` and `y: 20px → 0`
- `Stagger` + `StaggerItem` for the solution capabilities grid (70ms delay between items)
- Hero has sequential reveals with increasing delays (0 → 50ms → 100ms → 150ms → 200ms)

### 4.2 Auth Pages

#### Login (`/login`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Authenticate returning users |
| **User Goal** | Sign in quickly to access dashboard |
| **Path** | `src/app/(auth)/login/page.tsx` → Server Component → LoginForm (client) |

**Content hierarchy:**
1. "Welcome back" heading + subtitle
2. Success alert (if redirected from registration with `?registered=1`)
3. Error alert (if `?error` param present)
4. OAuth buttons (Google, conditionally shown)
5. Divider with "or continue with email"
6. Email + password fields with react-hook-form + zod validation
7. "Forgot password?" link → `/forgot-password`
8. "Sign in" submit button
9. Link to registration ("Sign up")

**Interactive states:**
- **Default:** Clean form with placeholder text
- **Loading:** Spinner on button, fields disabled
- **Success:** Router.push to callbackUrl (defaults to /dashboard)
- **Error (credentials):** Inline destructive alert "That email and password don't match"
- **Error (network):** Generic error message
- **Already authenticated:** Server-side redirect to /dashboard or /onboarding
- **Edge cases:** Email case-insensitive, whitespace trimmed via zod

**Mobile adaptation:** Full-width form, single column layout, touch-friendly inputs (min 44px height)

**Transitions:** None (form appears immediately)

#### Register (`/register`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Create new user account |
| **User Goal** | Complete sign-up quickly (under 60 seconds) |
| **Path** | `src/app/(auth)/register/page.tsx` → Server Component → RegisterForm (client) |

**Content hierarchy:**
1. "Create your Climate Twin" heading + "60 seconds to understand your footprint"
2. Error alert
3. OAuth buttons (if enabled)
4. Divider
5. Name field
6. Email field
7. Password field + PasswordStrengthMeter
8. Confirm password field
9. "Create account" submit button
10. Link to login ("Already have an account?")

**Interactive states:**
- **Default:** Clean form, real-time password strength meter
- **Loading:** Spinner on button, all fields disabled
- **Field errors:** Server-side validation errors mapped back to form fields via `form.setError`
- **Success:** Auto sign-in via NextAuth → redirect to /onboarding
- **Auto-login failure:** Redirect to /login?registered=1
- **Server error:** Inline destructive alert

**Transitions:** Password strength meter animates as user types

#### Forgot Password (`/forgot-password`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Initiate password reset |
| **Path** | `src/app/(auth)/forgot-password/page.tsx` |

#### Reset Password (`/reset-password`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Complete password reset with token |
| **Path** | `src/app/(auth)/reset-password/page.tsx` |

#### Verify Request (`/verify-request`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Fallback page for email verification flows |
| **Content** | MailCheck icon + "Check your email" message + Logo |

### 4.3 Onboarding (`/onboarding`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Welcome new users, complete the onboarding flag, route to dashboard |
| **User Goal** | Get to the dashboard quickly |
| **Path** | `src/app/onboarding/page.tsx` — Client Component |

**Current state:** Minimal placeholder — a centered card with Leaf icon, welcome message, and "Go to dashboard" button. Full 5-step wizard (location → household → transport → diet → baseline) planned for Phase 1.

**Content hierarchy:**
1. Leaf icon in branded circle
2. "Welcome to CarbonTwin" heading
3. Description (explains wizard arriving in next phase)
4. "Go to dashboard" button (calls `completeOnboarding()` server action, updates JWT session)

**Interactive states:**
- **Default:** Welcome card visible
- **Loading:** Spinner replaces ArrowRight icon
- **Error:** Function returns `{ ok: false }` — button re-enables
- **Success:** Session update → router.push('/dashboard') → router.refresh()

### 4.4 Dashboard (`/dashboard`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Command center — glanceable KPIs, carbon score, trend, recent activity |
| **User Goal** | "How am I doing?" answered in under 5 seconds |
| **Path** | `src/app/(dashboard)/dashboard/page.tsx` → Server Component → DashboardTabs (client) |
| **Tab system** | `PageTabs` with `paramKey="dt"`, `variant="primary"` |

**Tab structure:**

| Tab | Value | Icon | Content |
|-----|-------|------|---------|
| Overview | `overview` | `LayoutDashboard` | KPI row (4 cards) + Carbon Score gauge + Carbon Trend chart |
| Analytics | `analytics` | `BarChart3` | Category Donut chart + Forecast Snapshot |
| Activity | `activity` | `Activity` | Recent Scans + Quick Actions + Goals Progress + Recent Recommendations |
| Goals | `goals` | `Target` | Goals Progress cards |

**Content hierarchy (Overview tab):**
1. Dashboard header: "Welcome, {name}" + date + ResetDataButton
2. KPI Row: 4 metric cards (This Week, This Month, Streak, vs Last Week)
3. Two-column grid: Carbon Score (radial gauge, 1/3) + Carbon Trend (line chart, 2/3)

**Interactive states:**
- **Empty (no data):** "Your dashboard is ready — it just needs data" card with LoadDemoDataButton + Upload CTA
- **Loading:** Skeleton via Suspense boundary (TBD — currently server-composed)
- **Populated:** Full dashboard with all sections
- **Error:** Not handled at page level — service returns empty dataset gracefully
- **Edge cases:** Zero activity week shows "0 kg" with neutral trend, streak breaks after 1 missed day (excluding today)

**Mobile adaptation:**
- KPI row: 2×2 grid (collapses from 4 columns)
- Overview grid: stacks vertically (score above trend)
- Analytics grid: stacks vertically (donut above forecast)
- Activity grid: 1 column for scans, actions, goals

**Transitions:**
- Tab indicator uses framer-motion `layoutId` spring animation
- Section Cards have no entrance animation (immediate render for glanceability)

### 4.5 Upload & Detect (`/upload`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Upload room photo → AI detects appliances → show impacts |
| **User Goal** | Log a room's carbon footprint in under 30 seconds |
| **Path** | `src/app/(dashboard)/upload/page.tsx` → UploadDetectClient (client) |

**State machine:** `idle → previewing → analyzing → (results | error) → idle`

**Content hierarchy:**
1. Page header: Camera icon + "Upload & Detect" title + description
2. **Idle phase:** UploadDropzone (drag & drop zone) + Tips box (3 tips for best results)
3. **Previewing phase:** Image preview with "Remove" button + "Analyze with AI" button + "Choose different" button
4. **Analyzing phase:** Preview overlay (dimmed + gradient) + DetectionTimeline (5-step animated progress)
5. **Results phase:** Image preview + DetectionResults (summary + appliance cards) + "Scan another room" + "View full results" buttons
6. **Error phase:** Dimmed preview + Alert (destructive) + "Try again" + "Choose different image" buttons

**DetectionTimeline steps:**
1. Uploading image (Upload icon)
2. Analyzing room (Eye icon)
3. Detecting appliances (ScanSearch icon)
4. Estimating carbon impact (Calculator icon)
5. Storing results (Database icon)

**Interactive states:**
- **Idle:** Dropzone shows dashed border, "Drag & drop a room photo", format/size constraints
- **Dragging:** Border highlights in primary color, icon background changes
- **Previewing:** Image preview with X button, two action buttons
- **Analyzing:** Timeline animates through 5 steps with staggered delays (0, 600, 2200, 5000, 8000ms), image is dimmed
- **Results:** Summary card slides in, appliance cards stagger in with `x: -8px` entrance
- **Error:** Red alert with error message, retry options
- **File error (size/type):** Inline red text below dropzone
- **File system error:** "Could not process that image" error state

**Mobile adaptation:**
- Full-width dropzone
- Button pairs stack vertically on narrow screens
- Image preview respects aspect ratio with `object-contain`
- Timeline text may wrap on very small screens

**Transitions:**
- Dropzone hover: `border-primary/40`, `bg-accent/30`
- Appliance cards: staggered entrance with `opacity + x` animation (80ms delay between items)
- Summary card: `opacity + y` entrance (400ms)
- Timeline steps: sequential entrance with delayed opacity + x animation
- Phase transitions: fade between states

### 4.6 Climate Twin (`/twin`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Visualize and explore the user's digital carbon persona |
| **User Goal** | Understand their footprint composition across 5 dimensions |
| **Path** | `src/app/(dashboard)/twin/page.tsx` → Server Component → TwinTabs (client) |
| **Tab system** | `PageTabs` with `paramKey="tt"`, `variant="primary"` |

**Tab structure:**

| Tab | Value | Icon | Content |
|-----|-------|------|---------|
| Overview | `overview` | `LayoutDashboard` | TwinHero (orb + stats) + LifestyleInputs (5 dimension cards) |
| Dimensions | `dimensions` | `Grid3x3` | LifestyleInputs (5 dimension cards) |
| Forecast | `forecast` | `TrendingUp` | ForecastGraphs (multi-year projection chart + forecast cards) |
| Comparison | `comparison` | `Radar` | CategoryComparison (radar chart, 5/12) + ScenarioForecast (7/12) |
| Risks & Opportunities | `risks` | `AlertTriangle` | RiskAreas (6/12) + ScenarioForecast (6/12) + AiRecommendations |

**Content hierarchy (Overview tab):**
1. TwinHero card: Animated orb (tier-colored gradient with rotating rings), profile name, tier badge, description
2. Stats row: Monthly CO₂e, vs Country Average (%), vs Baseline (%), Paris 1.5°C target
3. On-track badge (green if on track, amber if not)
4. LifestyleInputs: 5 dimension cards in row (Home, Appliances, Transport, Lifestyle, Diet)

**Twin tiers:**

| Tier | Annual CO₂e | Color | Description |
|------|-------------|-------|-------------|
| Verdant | ≤ 2,000 kg | `#10b981` | Excellent — well below average |
| Aurora | 2,001-4,000 kg | `#34d399` | Good — below average |
| Ember | 4,001-7,000 kg | `#f59e0b` | Moderate — near average |
| Drift | ≥ 7,001 kg | `#ef4444` | High — above average |

**Interactive states:**
- **Empty (no data):** "Meet your Climate Twin" card with Camera icon, description, "Upload a room photo" CTA + "Go to dashboard" secondary
- **Loading:** TwinTabs renders immediately with server data (no client loading state)
- **Populated:** Full tabbed interface with all charts and cards
- **Error:** Data fetch returns empty twin shape — page shows empty state

**Mobile adaptation:**
- TwinHero stacks vertically (orb above stats)
- Stats grid: 2×2 on mobile (from 4 columns on desktop)
- Dimensions grid: 2 columns on mobile (from 5 on desktop) → eventually 1 column
- Forecast grid: single column
- Comparison grid: stacks vertically

**Transitions:**
- Orb rotation: continuous 40s + 28s orbits, 4s breathing pulse
- Dimension cards: hover border-right-color accent (2px themed border)
- Stat cards: `bg-background/60 backdrop-blur` for glass effect

### 4.7 Results (`/results`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Detailed breakdown of a single appliance scan with carbon and cost impact |
| **User Goal** | Understand which appliances contribute most and how to improve |
| **Path** | `src/app/(dashboard)/results/page.tsx` → Server Component → ResultsTabs (client) |
| **Tab system** | `PageTabs` with `paramKey="rt"`, `variant="primary"` |

**Tab structure:**

| Tab | Value | Icon | Content |
|-----|-------|------|---------|
| Overview | `overview` | `Eye` | CarbonOverview (KPI cards) |
| Appliances | `appliances` | `Monitor` | DetectedAppliances list (badge shows count) |
| Impact | `impact` | `BarChart3` | ImpactBreakdown (pie/donut, 4/12) + TopEmitters (8/12) |
| Savings | `savings` | `PiggyBank` | TrendChart + SavingsOpportunities |
| AI Insights | `insights` | `Sparkles` | AiInsights (AI-generated narrative) |

**Content hierarchy (Overview tab):**
1. Header: Room type (e.g., "Kitchen") + AI model badge + scan date + summary + "New scan" button
2. CarbonOverview: KPI cards for total CO₂e, total cost, appliance count, total kWh

**Interactive states:**
- **Empty (no scan):** "No results to show yet" with Inbox icon + "Upload a room photo" CTA
- **Loading:** Server-composed (data loaded before render)
- **Populated:** Full tabbed results with all data
- **No scanId provided:** Loads most recent scan automatically
- **Invalid scanId:** Returns empty results gracefully (isEmpty: true)

**Mobile adaptation:**
- Impact grid: stacks vertically
- Appliance list: full-width cards with badge count
- Savings: single column

**Transitions:**
- Appliance cards: hover `border-primary/30`

### 4.8 Goals (`/goals`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Track reduction commitments, milestones, and achievements |
| **User Goal** | Set and monitor progress toward sustainability goals |
| **Path** | `src/app/(dashboard)/goals/page.tsx` → Server Component → GoalsTabs (client) |
| **Tab system** | `PageTabs` with `paramKey="gt"`, `variant="primary"` |

**Tab structure:**

| Tab | Value | Icon | Content |
|-----|-------|------|---------|
| Active | `active` | `Target` | GoalsHeader (KPIs) + GoalCard grid (badge shows count) |
| Completed | `completed` | `CheckCircle2` | Completed GoalCard grid (badge shows count) |
| Achievements | `achievements` | `Trophy` | AchievementsGrid (badge grid) |
| Suggestions | `suggestions` | `Lightbulb` | ProgressChart (7/12) + GoalSuggestions (5/12) |

**Content hierarchy (Active tab):**
1. GoalsHeader: Total carbon saved, active count, completed count, streak, avg progress %
2. GoalCard grid: 2-column grid of active goals with progress bars, milestones, days remaining

**Goal milestone structure:** Each goal has milestones at 25%, 50%, 75%, 100% with reached date tracking.

**Achievement badges (8 total):**

| Slug | Name | Tier | Criteria |
|------|------|------|----------|
| `first-goal` | First Step | BRONZE | Created first goal |
| `first-completion` | Goal Getter | SILVER | Completed first goal |
| `three-goals` | Hat Trick | SILVER | Completed 3 goals |
| `100kg-saved` | Centurion | SILVER | Saved 100 kg CO₂e |
| `500kg-saved` | Half-Ton Hero | GOLD | Saved 500 kg CO₂e |
| `1000kg-saved` | Ton Saver | GOLD | Saved 1 tonne CO₂e |
| `week-streak` | Consistent | BRONZE | Logged 14+ activities |
| `all-on-track` | On Track | SILVER | All active goals on track |

**Interactive states:**
- **Empty (no goals):** "Start with one goal" card with CreateGoalDialog + "Ask the AI negotiator" CTA
- **No active goals (but completed exist):** "No active goals" empty state in Active tab
- **No completed goals:** "No completed goals yet" in Completed tab
- **Achievements:** Grid shows earned (full color) and unearned (dimmed with progress) badges
- **Error:** N/A — goals service returns empty arrays gracefully

**Mobile adaptation:**
- Goal card grid: 1 column on mobile (from 2 on desktop)  
- Suggested layout: stacks vertically

**Transitions:**
- GoalCard: hover interaction only
- Progress bars: fluid animation via Radix progress

### 4.9 Settings (`/settings`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Manage account, preferences, theme, notifications, privacy, connected accounts, API status |
| **User Goal** | Configure app behavior to personal preference |
| **Path** | `src/app/(dashboard)/settings/page.tsx` → Server Component → SettingsTabs (client) |
| **Tab system** | `PageTabs` with `paramKey="st"`, `variant="secondary"` (filled tab style) |

**Tab structure (7 tabs):**

| Tab | Value | Icon | Content |
|-----|-------|------|---------|
| Profile | `profile` | `User` | ProfileSection (name, email, country, region, household size) |
| Preferences | `preferences` | `SlidersHorizontal` | PreferencesSection (plain language, reduced motion, high contrast) |
| Theme | `theme` | `Palette` | ThemeSection (light/dark/system toggle) |
| Notifications | `notifications` | `Bell` | NotificationsSection (email digest, push, insights, goals) |
| Privacy & AI | `privacy` | `Shield` | PrivacySection (AI toggle, budget, share twin) |
| Connected Accounts | `accounts` | `Link2` | ConnectedAccountsSection (OAuth accounts, password management) |
| API Status | `api` | `Activity` | ApiStatusSection (AI usage metrics, daily budget) |

**Content hierarchy:**
1. Header: "Settings" title + "Manage your account, preferences, and data." subtitle
2. Tab navigation (secondary variant — filled background on active tab)
3. Tab content panels with form sections

**Interactive states:**
- **Loading:** Server-composed (data fetched before render)
- **Error:** "Unable to load settings." centered error message
- **Theme change:** Calls server action `updateTheme`, updates via `next-themes`
- **Form submissions:** Inline form handlers per section

**Mobile adaptation:**
- Settings tabs might benefit from vertical layout on mobile (future enhancement)
- Currently uses horizontal scrollable tabs with `ScrollArea`

### 4.10 Simulator (`/simulator`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | Model the impact of lifestyle changes before committing |
| **User Goal** | Compare scenarios, understand ROI, decide which changes to adopt |
| **Path** | `src/app/(dashboard)/simulator/page.tsx` → Server Component → SimulatorTabs (client) |
| **Tab system** | `PageTabs` with `paramKey="sim"`, `variant="primary"` |

**Tab structure:**

| Tab | Value | Icon | Content |
|-----|-------|------|---------|
| Scenarios | `scenarios` | `SlidersHorizontal` | ScenarioCards (6 toggle cards with count badge) |
| Results | `results` | `BarChart3` | SimulationSummary + BeforeAfterChart (7/12) + ScenarioComparison (5/12) |
| Timeline | `timeline` | `ChartLine` | SavingsTimeline (10-year projection with payback) |
| Comparison | `comparison` | `ArrowLeftRight` | BeforeAfterChart (7/12) + ScenarioComparison (5/12) |

**6 scenarios:**

| Key | Title | Category | Reduction | Cost | Difficulty |
|-----|-------|----------|-----------|------|------------|
| `solar` | Install Solar Panels | Home | 75% | $12,000 | HARD |
| `ev` | Switch to Electric Vehicle | Transport | 60% | $8,000 | HARD |
| `remote` | Work Remotely 3 Days/Week | Transport | 45% | $0 | EASY |
| `led` | Upgrade All Lighting to LED | Appliances | 20% | $200 | EASY |
| `transit` | Switch to Public Transport | Transport | 50% | $100 | EASY |
| `diet` | Adopt Plant-Based Diet | Diet | 60% | $0 | MEDIUM |

**Interactive states:**
- **Empty (no twin data):** "Build your Climate Twin first" card with "Upload a room photo" CTA
- **No scenarios active:** "No Active Scenarios" empty state in Results/Timeline/Comparison tabs
- **Scenarios active:** Full simulation results with live computation
- **Scenario toggle:** Client-side state updates, computed results via `runSimulation()` in `useMemo`

**Mobile adaptation:**
- Scenario cards: 1 column from 2 on desktop
- Results grids: stack vertically
- Timeline: horizontal scroll if needed

**Transitions:**
- Scenario toggle: instant card highlight change
- Results update: recomputed via useMemo (no animation on data change)

### 4.11 Negotiator (`/negotiator`)

| Aspect | Detail |
|--------|--------|
| **Purpose** | AI-powered conversational advisor for carbon reduction |
| **User Goal** | Get personalized recommendations through natural dialogue |
| **Path** | `src/app/(dashboard)/negotiator/page.tsx` → Server Component → NegotiatorClient (client) |
| **Layout** | Full-height chat interface (`h-[calc(100vh-4rem)]`) |

**Content hierarchy:**
1. Header: Handshake icon + "AI Carbon Negotiator" title + "Your personalized sustainability advisor" subtitle
2. Error alert (conditionally shown)
3. Scrollable message area:
   - **Empty state:** Sparkles icon + "Let's find reductions you'll keep" + SuggestedPrompts grid
   - **With messages:** ChatMessage bubbles (user right-aligned, assistant left-aligned) + ActionPlanCard inline
4. ChatInput bar (fixed at bottom) with send button

**Interactive states:**
- **Empty (no conversation):** Suggested prompts shown, input ready
- **Streaming:** Assistant message shows expanding content with pulsing cursor
- **Complete:** Full message rendered, Input re-enabled
- **Error:** Destructive alert with error message, assistant message removed if empty
- **Context loaded:** Previous conversation restored from server (last 20 messages)

**Conversation persistence:**
- Most recent NEGOTIATOR conversation loaded server-side
- New conversationId returned on first message
- SSE streaming from `/api/negotiator` with token/done/error frame types

**Mobile adaptation:**
- Full-height layout adapts to mobile viewport
- Input bar stays fixed at bottom with keyboard handling
- Chat bubbles use `max-w-[85%]` for readability

**Transitions:**
- Message entrance: `opacity + y` (250ms)
- Streaming cursor: `animate-pulse` on thin vertical bar
- Empty state entrance: `animate-in fade-in zoom-in-95 duration-500`

---

## 5. Component Inventory

### 5.1 Shared / Global

#### PageTabs

| Aspect | Detail |
|--------|--------|
| **Location** | `src/components/shared/page-tabs.tsx` |
| **Type** | Client Component ('use client') |
| **Implementation** | Wraps Radix UI Tabs with URL-synced state via `useSearchParams` |
| **Variants** | `primary` (underlined), `secondary` (filled), `pills` |
| **Layouts** | `horizontal` (scrollable on mobile), `vertical` (sidebar-style) |
| **Key features** | URL persistence, animated indicator (framer-motion LayoutGroup), optional badges, disabled tabs, scrollable on overflow |

**Props:**
```typescript
interface PageTabsProps {
  tabs: TabItem[]
  defaultTab?: string
  paramKey?: string    // default: 'tab'
  variant?: 'primary' | 'secondary' | 'pills'
  layout?: 'horizontal' | 'vertical'
  className?: string
}
```

**States:**
- **Default:** First tab selected (or `defaultTab`)
- **Active tab:** Animated indicator via `layoutId`, styled per variant
- **Disabled tab:** `cursor-not-allowed opacity-50`
- **With badge:** Badge shown after label (variant changes with active state)
- **Empty tabs:** Array of zero items — nothing renders
- **No defaultTab:** First tab value used as default
- **URL override:** `?tab=value` from searchParams takes precedence
- **Mobile:** Horizontal scroll via ScrollArea with invisible scrollbar

**Accessibility:**
- Radix Tabs provides full keyboard navigation (arrow keys, Home/End)
- ARIA `role="tablist"`, `role="tab"`, `role="tabpanel"` automatically applied
- Focus visible outlines managed via `focus-visible:outline-none` + ring

#### Logo

| Aspect | Detail |
|--------|--------|
| **Location** | `src/components/shared/logo.tsx` |
| **Type** | Shared (server compatible) |
| **Props** | `className?`, `showWordmark?` (default true), `href?` (default '/'), `size?` (default 28) |
| **Description** | Inline SVG brand mark — two leaves forming a sprout on emerald rounded square + wordmark |

### 5.2 Auth Components

#### LoginForm

| Aspect | Detail |
|--------|--------|
| **Location** | `src/components/auth/login-form.tsx` |
| **States** | Default, loading (spinner + disabled), error (alert), success (redirect), already authenticated (redirect) |
| **Accessibility** | Labels via FormLabel, error messages via FormMessage, autoComplete attributes, disabled state on inputs |
| **Responsive** | Full-width form, stacked layout |

#### RegisterForm

| Aspect | Detail |
|--------|--------|
| **Location** | `src/components/auth/register-form.tsx` |
| **States** | Default, loading (spinner + disabled), field errors (inline), server error (alert), success (auto-login + redirect) |
| **Accessibility** | Same as LoginForm + password strength meter with live region |
| **Special** | Real-time password strength meter, confirm password match validation |

### 5.3 Upload Components

#### UploadDropzone

| Aspect | Detail |
|--------|--------|
| **Location** | `src/components/upload/upload-dropzone.tsx` |
| **Props** | `preview`, `onFileSelected`, `onClear`, `disabled?` |
| **States** | Default (dashed border + "Drag & drop a room photo"), dragging (highlighted border + "Drop your image here"), preview (image + X button), error (inline text), disabled |
| **Accessibility** | Button with `type="button"` and `aria-label` on clear, hidden file input, keyboard accessible drag zone, paste support |
| **Validation** | Accepts: JPEG/PNG/WebP, max 5MB |
| **Responsive** | Full width, `py-16` for generous touch target |

#### DetectionTimeline

| Aspect | Detail |
|--------|--------|
| **Location** | `src/components/upload/detection-timeline.tsx` |
| **Props** | `currentStep` (0-4), `completed` (boolean), `error` (string or null) |
| **Steps** | 5 steps with icon, label, description |
| **States** | Pending (dimmed), active (highlighted + spinner), done (checkmark + green), error (red highlight on active step) |
| **Animation** | Steps stagger in with `opacity + x`, active step shows `Loader2 animate-spin` |

#### DetectionResults

| Aspect | Detail |
|--------|--------|
| **Location** | `src/components/upload/detection-results.tsx` |
| **Props** | `result` (scanId, roomType, summary, appliances[], totalAnnualCo2eKg) |
| **States** | Summary card + per-appliance cards with confidence ring |
| **Accessibility** | Appliance icons have semantic meaning, color not sole indicator (confidence label text also) |
| **Animation** | Staggered card entrance with `opacity + x` (80ms delay per item) |

### 5.4 Dashboard Components

#### KpiRow

| Aspect | Detail |
|--------|--------|
| **Location** | `src/components/dashboard/kpi-row.tsx` |
| **Props** | `kpis` (DashboardData['kpis']) |
| **States** | Default (4 cards with values), zero values (shows "0 kg", "0d"), negative delta (green reduction) |
| **Accessibility** | Trend indicators have color + icon + text label |
| **Responsive** | 4→2→1 columns |

#### CarbonScore

| Aspect | Detail |
|--------|--------|
| **Location** | `src/components/dashboard/carbon-score.tsx` |
| **Props** | `score` (value, label, trend, deltaPct, targetKg, currentKg) |
| **Implementation** | Recharts RadialBarChart with PolarAngleAxis |
| **States** | Score bands: Excellent (≥75), Good (≥50), Fair (≥30), High (<30) |
| **Accessibility** | Score value is text, not just gauge; chart has ChartContainer wrapper |

#### CarbonTrend

| Aspect | Detail |
|--------|--------|
| **Location** | `src/components/dashboard/carbon-trend.tsx` |
| **Props** | `trend` (14-day data), `weekKg` |
| **Implementation** | Recharts AreaChart |

### 5.5 Twin Components

#### TwinHero

| Aspect | Detail |
|--------|--------|
| **Location** | `src/components/twin/twin-hero.tsx` |
| **Props** | `data` (TwinData) |
| **Key feature** | Animated orb with pulsing gradient + rotating rings + tier-colored core |
| **States** | Tier-based colorization, on-track/off-track badge |
| **Animation** | Orb rotation (40s/28s), breathing pulse (4s), respects reduced motion |
| **Accessibility** | All data shown as text, not reliant on orb visualization |

#### LifestyleInputs

| Aspect | Detail |
|--------|--------|
| **Location** | `src/components/twin/lifestyle-inputs.tsx` |
| **Props** | `dimensions` (5 TwinDimension objects) |
| **States** | Each card shows icon, label, annual CO₂e, share %, detail line |
| **Responsive** | 5→2→1 columns |

#### ForecastGraphs

| Aspect | Detail |
|--------|--------|
| **Location** | `src/components/twin/forecast-graphs.tsx` |
| **Props** | `forecast`, `parisTargetKg`, `currentKg` |
| **Implementation** | Recharts AreaChart with 3 series + ReferenceLine for Paris target |
| **States** | Default (3 trajectories), empty (no forecast data), all lines potentially overlapping |

### 5.6 Negotiator Components

#### NegotiatorClient

| Aspect | Detail |
|--------|--------|
| **Location** | `src/components/negotiator/negotiator-client.tsx` |
| **Props** | `initialMessages`, `initialConversationId?` |
| **States** | Empty (suggested prompts), streaming, complete, error |
| **Key feature** | SSE streaming via /api/negotiator with optimistic UI |

#### ChatMessage

| Aspect | Detail |
|--------|--------|
| **Location** | `src/components/negotiator/chat-message.tsx` |
| **Props** | `message` (ChatMessageData), `onAcceptPlan?` |
| **States** | User bubble (right, primary bg), assistant bubble (left, card bg), streaming (pulsing cursor) |
| **Accessibility** | Proper heading hierarchy, ARIA live region for streaming content (future) |
| **Animation** | `opacity + y` entrance (250ms) |

### 5.7 Simulator Components

#### ScenarioCards

| Aspect | Detail |
|--------|--------|
| **Location** | `src/components/simulator/scenario-cards.tsx` |
| **Props** | `scenarios` (6 ScenarioDef), `active` (ScenarioKey[]), `onToggle` |
| **States** | Inactive (default border), active (highlighted border + check), disabled (if dimension missing) |
| **Toggle behavior** | Multiple scenarios can be active simultaneously (additive) |

#### SimulationSummary

| Aspect | Detail |
|--------|--------|
| **Location** | `src/components/simulator/simulation-summary.tsx` |
| **Props** | `result` (SimulationResult) |
| **Content** | Before/after KPI comparison, total savings, reduction %, payback period |

---

## 6. Accessibility Standards

### 6.1 WCAG 2.2 AA Compliance Checklist

| Criterion | Status | Notes |
|-----------|--------|-------|
| **1.1.1 Non-text Content** | ✅ | All icons have `aria-hidden` or text alternatives |
| **1.3.1 Info and Relationships** | ✅ | Semantic HTML, proper heading hierarchy, ARIA roles via Radix |
| **1.3.2 Meaningful Sequence** | ✅ | Reading order matches visual order |
| **1.4.1 Use of Color** | ✅ | Color is never sole indicator — text labels + icons accompany color cues |
| **1.4.3 Contrast (Minimum)** | ✅ | OKLCH tokens verified — 4.5:1+ for normal text, 3:1+ for large text |
| **1.4.4 Resize Text** | ✅ | No fixed font sizes; rem/em units throughout |
| **1.4.10 Reflow** | ✅ | Responsive layouts, no horizontal scroll at 320px width |
| **1.4.11 Non-text Contrast** | ✅ | UI components (borders, focus rings) meet 3:1 |
| **1.4.12 Text Spacing** | ✅ | No `!important` overrides on spacing |
| **2.1.1 Keyboard** | ✅ | All interactive elements keyboard accessible |
| **2.1.2 No Keyboard Trap** | ✅ | No trapped focus |
| **2.4.3 Focus Order** | ✅ | Logical tab order |
| **2.4.4 Link Purpose (In Context)** | ✅ | Descriptive link text |
| **2.4.7 Focus Visible** | ✅ | Visible focus rings on all interactive elements |
| **2.5.3 Label in Name** | ✅ | Accessible names match visible labels |
| **2.5.8 Target Size (AA)** | ✅ | Minimum 44×44px for all touch targets |
| **3.2.1 On Focus** | ✅ | No context changes on focus |
| **3.3.1 Error Identification** | ✅ | Inline form errors with FormMessage |
| **3.3.2 Labels or Instructions** | ✅ | All inputs have associated FormLabel |
| **4.1.2 Name, Role, Value** | ✅ | ARIA attributes via Radix primitives |
| **4.1.3 Status Messages** | ⚠️ | Toasts via sonner (role="status"), but streaming status needs live region |

### 6.2 Color Contrast Ratios

**Light mode key ratios:**

| Combination | Ratio | Passes AA? |
|-------------|-------|-----------|
| `--foreground` on `--background` | ~14:1 | ✅ AAA |
| `--muted-foreground` on `--background` | ~6:1 | ✅ AA |
| `--primary` on `--background` | ~4.8:1 | ✅ AA |
| `--primary-foreground` on `--primary` | ~7.5:1 | ✅ AAA |
| `--muted-foreground` on `--muted` | ~4.5:1 | ✅ AA |
| Border on background (`--border` vs `--background`) | ~2.8:1 | ✅ 3:1 for non-text |

**Dark mode key ratios:**

| Combination | Ratio | Passes AA? |
|-------------|-------|-----------|
| `--foreground` on `--background` | ~16:1 | ✅ AAA |
| `--muted-foreground` on `--background` | ~8:1 | ✅ AA |
| `--primary` on `--background` | ~6:1 | ✅ AA |
| `--primary-foreground` on `--primary` | ~4.8:1 | ✅ AA |
| Border on background (10% white on background) | ~3.5:1 | ✅ 3:1 for non-text |

### 6.3 Keyboard Navigation Patterns

| Pattern | Implementation |
|---------|---------------|
| **Skip to content** | Hidden `<a>` in root layout, visible on focus (Tab from page load) |
| **Tab navigation** | All buttons, links, inputs, and interactive elements in natural tab order |
| **Arrow keys (tabs)** | Radix Tabs provides Left/Right arrow navigation between tabs |
| **Arrow keys (chat)** | Up/Down arrows could navigate message history (future) |
| **Escape** | Closes modals, dialogs, dropdowns |
| **Enter/Space** | Activates buttons, toggles switches, submits forms |
| **Focus trap** | Modals and dialogs trap focus within (via Radix Dialog) |
| **Focus management** | Focus sent to first focusable element in dialog on open, restored on close |

**Focus indicator style:**
```css
/* Applied globally via globals.css */
* {
  @apply outline-ring/50;
}
/* Ring: 2px solid with 50% opacity of brand color */
```

### 6.4 Screen Reader Considerations

| Element | Consideration |
|---------|---------------|
| **Charts (Recharts)** | All chart data is also available as text elsewhere on the page; ChartContainer provides `role="figure"` |
| **Tab panels** | Radix Tabs provides proper `aria-labelledby` linking tabs to panels |
| **Loading states** | Spinners have `aria-label="Loading"`; skeleton loaders use `aria-busy` |
| **Empty states** | Descriptive text that conveys what the user should do next |
| **Error messages** | Form errors are programmatically associated via `aria-describedby` (via Radix Form) |
| **Streaming content** | Assistant messages in Negotiator should use `aria-live="polite"` for screen reader announcement |
| **Toast notifications** | sonner uses `role="status"` with `aria-live="polite"` |

### 6.5 Focus Management Strategy

| Scenario | Behavior |
|----------|----------|
| **Page load** | Focus starts at top of page (browser default) |
| **Tab switch** | Focus moves to the tab panel content (handled by Radix Tabs) |
| **Dialog open** | Focus moves to first focusable element in dialog (Radix Dialog) |
| **Dialog close** | Focus returns to trigger element (Radix Dialog) |
| **Form error** | Focus moves to first field with error (via `setError` + programmatic focus) |
| **Toast appears** | Focus remains on current element (toast is non-modal) |
| **Navigation** | Focus moves to new page title (h1) |

---

## 7. Micro-interactions & Motion

### 7.1 Page Transitions

| Element | Animation | Duration | Implementation |
|---------|-----------|----------|----------------|
| Page navigation (dashboard) | No explicit page transition (Next.js app router) | — | Server-rendered pages load instantly |
| Tab content switch | Content changes immediately (no fade), indicator animates | 300ms | framer-motion `layoutId` |
| Empty → populated state | Content appears immediately | — | Server-rendered |

### 7.2 Tab Indicator Animation

The tab indicator uses framer-motion's `LayoutGroup` and `layoutId` pattern:

```typescript
// Horizontal primary tabs
{isActive && (
  <motion.span
    layoutId={`indicator-${paramKey}`}
    className="absolute -bottom-[1px] left-0 right-0 h-0.5 bg-primary"
    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
  />
)}

// Vertical tabs
{isActive && (
  <motion.span
    layoutId={`indicator-${paramKey}`}
    className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
  />
)}
```

Spring physics: `stiffness: 500, damping: 35` — fast but with subtle overshoot, feels premium.

### 7.3 Card Hover Effects

| Component | Effect | Duration |
|-----------|--------|----------|
| Solution capability cards | Scale icon `scale-110`, border color transition | 200ms |
| Appliance result cards | Border color `hover:border-primary/30` | 200ms |
| Dimension cards | Top border highlight (2px themed color) | 200ms |
| Scenario cards | Highlight border when active | 200ms |
| KPI cards | No hover effect (glanceable data) | — |

### 7.4 Score / Percentage Animations

| Component | Type | Notes |
|-----------|------|-------|
| Carbon Score gauge | SVG radial bar | Recharts animates the radial bar on mount |
| Progress bars | CSS transition | Radix Progress uses CSS transitions for value changes |
| Confidence rings | SVG circle dashoffset | Static on render (no count-up animation) |

**Future enhancement:** Count-up animation for KPI values (weekKg, streak, score) using framer-motion `useSpring` or `useAnimatedCounter`.

### 7.5 Progress Bar Animations

Radix `Progress` component animates value changes via CSS transitions. Goal progress bars update when goals are logged against.

### 7.6 Chart Enter Animations

All Recharts charts use default animation:

| Chart Type | Animation | Notes |
|------------|-----------|-------|
| AreaChart (Carbon Trend) | Area expand from bottom | Recharts default |
| AreaChart (Forecast) | Area expand from bottom | Recharts default |
| RadialBarChart (Score) | Radial sweep | Recharts default |
| BarChart (Category Donut) | Pie sweep | Recharts default |

### 7.7 Form Field Focus States

All inputs via shadcn/ui have:
- Focus ring: `ring-2 ring-ring` (2px, brand color at 50% opacity)
- Border: transition from `border-border` to `border-primary`
- Label: No movement (labels are above fields, not floating)

### 7.8 Toast / Snackbar Animations

sonner library handles its own animations:
- **Enter:** Slide up + fade in from bottom-right
- **Exit:** Slide down + fade out
- **Rich colors:** Brand-consistent styling with close button
- **Position:** `bottom-right` (configured in RootLayout)

### 7.9 Modal / Dialog Transitions

Radix Dialog provides:
- **Overlay:** Fade in (150ms)
- **Content:** Scale + fade in (200ms)
- **Exit:** Reverse animation on close
- VAUL drawer used for mobile-responsive sheet patterns

### 7.10 Detection Timeline Steps

During the analyze phase, timeline steps animate in sequence:

| Step | Delay | Animation |
|------|-------|-----------|
| 1. Uploading image | 0ms | Icon transitions to spinner |
| 2. Analyzing room | 600ms | Step enters, spinner replaces icon |
| 3. Detecting appliances | 2200ms | Step enters with text |
| 4. Estimating carbon impact | 5000ms | Checkmark replaces spinner on completed steps |
| 5. Storing results | 8000ms | Final step, completion transitions to results |

Each step entrance: `opacity: 0 → 1`, `x: -8px → 0`, with 100ms delay between step entrances.

---

## 8. Empty State Library

Every list, section, or data-driven panel has a defined empty state with illustration concept, heading, description, and CTA.

### 8.1 No Scans Yet

| Aspect | Detail |
|--------|--------|
| **Where** | Dashboard (when no detections exist), Results page |
| **Illustration** | `Sparkles` icon or `Inbox` icon in branded circle |
| **Heading** | "Your dashboard is ready — it just needs data" / "No results to show yet" |
| **Description** | "Log your first activity, or load realistic sample data to explore every chart, goal, and forecast before you start tracking for real." / "Upload a photo of any room and the AI will detect appliances, estimate their carbon and cost impact, and suggest improvements." |
| **CTA** | "Upload & Detect" (primary) + "Load Demo Data" (secondary) |
| **Action** | Navigates to `/upload` or triggers demo data loader |

### 8.2 No Climate Twin Data

| Aspect | Detail |
|--------|--------|
| **Where** | Climate Twin page (when twin is empty) |
| **Illustration** | `Sparkles` icon in branded circle |
| **Heading** | "Meet your Climate Twin" |
| **Description** | "Your Twin is a digital model of your lifestyle — home, appliances, transport, shopping, and diet. Upload a room photo and log a few activities to bring it to life." |
| **CTA** | "Upload a room photo" (primary) + "Go to dashboard" (secondary) |
| **Action** | Navigates to `/upload` or `/dashboard` |

### 8.3 No Goals Set

| Aspect | Detail |
|--------|--------|
| **Where** | Goals page (Active tab, no goals exist) |
| **Illustration** | `Sparkles` icon in branded circle |
| **Heading** | "Start with one goal" |
| **Description** | "Small commitments compound. Pick a goal below — the AI will suggest ones tailored to your footprint, or create your own." |
| **CTA** | "Create Goal" (primary) + "Ask the AI negotiator" (secondary) |
| **Action** | Opens CreateGoalDialog / navigates to /negotiator |

### 8.4 No Active Goals (But Have Completed)

| Aspect | Detail |
|--------|--------|
| **Where** | Goals page, Active tab (goals exist but none active) |
| **Illustration** | `Target` icon in muted circle |
| **Heading** | "No active goals" |
| **Description** | "Create one or accept an AI suggestion." |
| **CTA** | (No explicit CTA — users can click "Suggestions" tab) |

### 8.5 No Completed Goals

| Aspect | Detail |
|--------|--------|
| **Where** | Goals page, Completed tab |
| **Illustration** | `CheckCircle2` icon in muted circle |
| **Heading** | "No completed goals yet" |
| **Description** | "Keep working on your active goals — every bit counts." |
| **CTA** | None (motivational) |

### 8.6 No Achievements Earned

| Aspect | Detail |
|--------|--------|
| **Where** | Goals page, Achievements tab |
| **Illustration** | `Trophy` icon in muted circle |
| **Heading** | "Achievements are earned, not given" |
| **Description** | (Achievements grid shows all badges — earned are full color, unearned are dimmed with progress) |
| **CTA** | None (progress indicators on each badge) |

### 8.7 No Simulation Scenarios Active

| Aspect | Detail |
|--------|--------|
| **Where** | Simulator page, Results/Timeline/Comparison tabs |
| **Illustration** | `SlidersHorizontal` icon in muted circle |
| **Heading** | "No scenarios selected" |
| **Description** | "Toggle one or more scenarios to model their combined impact on your carbon and cost footprint." |
| **CTA** | Switch to Scenarios tab (implicit — user must toggle) |

### 8.8 No Simulator Data (Twin Empty)

| Aspect | Detail |
|--------|--------|
| **Where** | Simulator page (when twin data is empty) |
| **Illustration** | `Sparkles` icon in branded circle |
| **Heading** | "Build your Climate Twin first" |
| **Description** | "The simulator models changes against your real footprint. Upload a room photo and log a few activities to form your Twin, then come back here to experiment." |
| **CTA** | "Upload a room photo" (primary) + "View Climate Twin" (secondary) |
| **Action** | Navigates to `/upload` or `/twin` |

### 8.9 No Negotiation Conversation

| Aspect | Detail |
|--------|--------|
| **Where** | Negotiator page (no messages yet) |
| **Illustration** | `Sparkles` icon + motion entrance |
| **Heading** | "Let's find reductions you'll keep" |
| **Description** | "I know your footprint profile. Tell me what you're considering, or ask about any dimension. I'll negotiate a realistic commitment — never an ultimatum." |
| **CTA** | Suggested prompts grid (interactive) + ChatInput ready |
| **Action** | Click suggested prompt or type message |

### 8.10 No Savings Opportunities

| Aspect | Detail |
|--------|--------|
| **Where** | Results page, Savings tab |
| **Illustration** | None (just text) |
| **Heading** | None |
| **Description** | "No opportunities detected yet." |
| **CTA** | None |

### 8.11 Settings Load Error

| Aspect | Detail |
|--------|--------|
| **Where** | Settings page (when data fetch fails) |
| **Illustration** | None |
| **Heading** | None |
| **Description** | "Unable to load settings." |
| **CTA** | None (centered text, page is mostly empty) |

---

## Appendix A: Tab System Mapping

Every dashboard page uses the `PageTabs` component with unique URL param keys:

| Page | paramKey | Default Tab | Variant |
|------|----------|-------------|---------|
| Dashboard | `dt` | `overview` | primary |
| Climate Twin | `tt` | `overview` | primary |
| Results | `rt` | `overview` | primary |
| Goals | `gt` | `active` | primary |
| Settings | `st` | `profile` | secondary |
| Simulator | `sim` | `scenarios` | primary |

This ensures users can bookmark specific tabs, share links to specific views, and use browser back/forward navigation within pages.

## Appendix B: Color Token Reference

```
:root {
  --background: oklch(0.99 0.002 150);
  --foreground: oklch(0.18 0.01 155);
  --primary: oklch(0.58 0.15 162);
  --primary-foreground: oklch(0.99 0.01 160);
  --muted: oklch(0.965 0.004 150);
  --muted-foreground: oklch(0.52 0.012 155);
  --border: oklch(0.91 0.004 150);
  --radius: 0.75rem;
}

.dark {
  --background: oklch(0.165 0.008 155);
  --foreground: oklch(0.97 0.005 155);
  --primary: oklch(0.72 0.17 162);
  --primary-foreground: oklch(0.16 0.02 162);
  --muted: oklch(0.24 0.01 155);
  --muted-foreground: oklch(0.71 0.012 155);
  --border: oklch(1 0 0 / 10%);
}
```

## Appendix C: Data Flow Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Next.js App Router                       │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │Marketing │  │   Auth   │  │Dashboard │  │  Dashboard    │ │
│  │ Page (/) │  │ /login   │  │ (groups) │  │  Pages       │ │
│  └──────────┘  │ /register│  └──────────┘  │              │ │
│       │        │ /onboard │       │         │ /dashboard   │ │
│  ┌────┴───┐    └──────────┘  ┌────┴──────┐  │ /twin        │ │
│  │Session │         │        │ Server    │  │ /results     │ │
│  │ Check  │         │        │ Component │  │ /goals       │ │
│  └────────┘    ┌────┴───┐    │ (data     │  │ /simulator   │ │
│                │ Auth   │    │  fetch)   │  │ /negotiator  │ │
│                │ Forms  │    └────┬──────┘  │ /settings    │ │
│                │ (client│         │         │ /upload      │ │
│                │  comp) │    ┌────┴──────┐  └──────────────┘ │
│                └────────┘    │ Client    │                    │
│                              │ Component │                    │
│                              │ (PageTabs │                    │
│                              │  + data)  │                    │
│                              └───────────┘                    │
│                                                               │
│  Services Layer (server-only):                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ getDashboardData() │ getTwinData() │ getResultsData()    │ │
│  │ getGoalsData()     │ getSettingsData()                    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                           │                                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    Prisma / PostgreSQL                    │ │
│  │  User · Scan · Detection · Appliance · Goal · AIConv     │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```
