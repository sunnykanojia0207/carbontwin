# Project Status

## Goal
Redesign the AI Carbon Negotiator with premium chat UI; align all pages to the app's design system; surface Gemini quota exhaustion with actionable UI; build manual editing for Upload & Detect fallback results; redesign the landing page with full feature catalog including the Dashboard.

## Constraints & Preferences
- Next.js 16 App Router, TypeScript 5, Tailwind CSS 4, shadcn/ui, Framer Motion
- PostgreSQL / SQLite + Prisma, NextAuth v4, Google Gemini AI (free-tier quota exhausted)
- Premium SaaS aesthetic: Linear/Stripe/Vercel/Notion inspired, large typography, strong hierarchy
- App design system: `text-2xl font-semibold tracking-tight` H1, Card-based empty states (`border-primary/30 bg-primary/5`), `bg-primary/15 rounded-full size-14` icons, `text-muted-foreground text-sm` body
- Landing page: editorial type, emerald + grid backdrop, custom generative visuals for each feature
- "use skills" — `design-taste-frontend`, `frontend-design` loaded
- Responsive: sidebar on desktop (fixed 256px), slide-over on mobile (animated spring)
- All states: loading, empty, streaming, error, quota-exhausted, edit mode for fallback results

## Progress
### Done
- Full AI Negotiator redesign (5 components): premium iMessage-style bubbles, react-markdown rendering, bouncing streaming dots, animated send button, visual starter cards with category colors, polished sidebar with smoother interactions, mobile AnimatePresence sheet
- Aligned Negotiator to app design system: `text-2xl font-semibold tracking-tight` H1, `Card border-primary/30 bg-primary/5` empty state, `bg-primary/15 rounded-full size-14` icon, `max-w-7xl` container
- Fixed duplicate "New" button in mobile header, reduced spacing throughout (padding, gap, hero icon size, empty state padding)
- Traced Upload & Detect fallback chain — Gemini free-tier quota causes `429 RESOURCE_EXHAUSTED` → `callVisionModel` fails → `detectAppliances` returns `DETECTION_FALLBACK` with `ok: true` → API saves generic data as a real scan
- Added `warning` field in `/api/detect` response when `model === 'fallback'`, saved detections as `PENDING` status, scan as `COMPLETED_WITH_WARNING`
- Added amber warning banner in `UploadDetectClient` when result.warning present: "AI detection is currently unavailable. The results below are generic estimates — click 'Edit' to adjust them."
- Built full manual editing for fallback results: `src/components/upload/editable-detection-results.tsx` with inline editing (name, type dropdown, watts, hours/day, real-time carbon recalculation), add/delete/save/cancel
- Created `PATCH /api/detect/[id]` endpoint — validates input, deletes old detections, creates new ones with `manuallyEdited: true`, updates scan to `COMPLETED`
- Replaced " burger" → "Burger" across 3 files (schema comment, seed data, marketing visual)
- Gemini API key confirmed valid but free-tier quota completely exhausted (tested with direct API call, got 429)
- Landing page redesigned to showcase Dashboard: added Dashboard mention to Solution footer, added "Explore your Dashboard" step in How It Works (now 4-step flow), updated Feature Highlights subtitle and title to reference Dashboard, strengthened Final CTA copy
- Build verified: `✓ Compiled successfully`, `✓ TypeScript (0 errors)`, `✓ 31 routes`

### In Progress
- None

### Blocked
- None

## Key Decisions
- Gemini quota exhaustion is the root cause of all AI fallbacks — code can't fix this, but warning banners + manual edit UI make the app useful without AI
- Landing page now covers 7 features explicitly (6 core capabilities + Dashboard hub) across all sections
- Editable detection results replace read-only results permanently — users always benefit from editing regardless of AI status
- Dashboard is positioned as the command center where all features converge, improving the user journey narrative

## Next Steps
- None at this time — all current tasks complete

## Critical Context
- Gemini API key is valid but free-tier quota completely exhausted — all AI features use deterministic fallbacks
- App has 7 core feature areas: Invisible Carbon Detector, Climate Twin, What-If Simulator, AI Carbon Negotiator, Sustainability Goals, Carbon Forecasting, Dashboard Hub
- App routes: `/` landing, `/dashboard`, `/goals`, `/negotiator`, `/twin`, `/simulator`, `/results`, `/upload`, `/settings`, `/onboarding`, plus auth pages
- Landing page structure: Hero → Problem → Solution (7 features) → Feature Highlights (6 deep-dive) → How It Works (4 steps) → AI Features → Technology → FAQ → Final CTA
- Build health: `✓ Compiled successfully`, `✓ TypeScript (0 errors)`, `✓ 31 routes`

## Relevant Files
- `src/app/page.tsx`: Landing page entry — composes all marketing sections
- `src/components/marketing/`: 12 components (hero, problem, solution, feature-highlights, how-it-works, ai-features, technology, faq, final-cta, site-nav, site-footer, section-heading) + `motion/reveal.tsx` + 6 visual components
- `src/components/negotiator/`: All 5 redesigned components (negotiator-client, chat-message, chat-input, suggested-prompts, conversations-panel)
- `src/app/api/detect/route.ts`: Updated with fallback warning in response
- `src/app/api/detect/[id]/route.ts`: PATCH endpoint for manual appliance edits
- `src/components/upload/editable-detection-results.tsx`: Inline edit mode for detection results
- `src/components/upload/upload-detect-client.tsx`: Uses EditableDetectionResults + warning banner
- `src/lib/ai/index.ts`: All AI functions with fallback paths
- `src/lib/ai/env.ts`: `AI_CONFIGURED = !!GEMINI_API_KEY`, `GEMINI_VISION_MODEL = 'gemini-2.0-flash'`
