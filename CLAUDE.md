# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Outia is a mobile-first risk intelligence app that combines weather and traffic data with community voting to provide real-time risk scores (0-100) for safe departure decisions. Built with Better-T-Stack.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Monorepo** | Turborepo | ^2.6.3 |
| **Web** | Next.js | ^16.1.1 |
| **Mobile** | Expo | ^54.0.1 |
| **React** | React | 19.1.0 (pinned) |
| **Backend** | Convex | ^1.31.2 |
| **Auth** | Clerk | ^6.31.5 (web), ^2.14.25 (native) |
| **Styling** | TailwindCSS | ^4.1.x |
| **Components** | shadcn/ui (web), HeroUI Native (mobile) | Latest |
| **AI** | Gemini 2.5 Flash | via @ai-sdk/google |

## Commands

```bash
# Development
npm run dev              # Start all apps (web, native, backend)
npm run dev:web          # Web only (localhost:3001)
npm run dev:native       # Mobile only (Expo)
npm run dev:server       # Backend only (Convex)

# Setup & Build
npm run dev:setup        # First-time Convex setup (follow prompts)
npm run build            # Production build all apps
npm run check-types      # TypeScript validation across monorepo
```

## Architecture

```
apps/
├── web/                        # Next.js 16 App Router
│   └── src/
│       ├── app/
│       │   ├── page.tsx        # Health check (/)
│       │   ├── dashboard/      # Auth-gated dashboard (/dashboard)
│       │   ├── ai/             # AI chat interface (/ai)
│       │   ├── privacy/        # Privacy policy (/privacy)
│       │   └── terms/          # Terms of service (/terms)
│       └── components/
│           ├── ui/             # shadcn/ui + Base UI components
│           └── providers.tsx   # Clerk + Convex + Theme providers
│
└── native/                     # Expo 54 Router
    └── app/
        ├── (onboarding)/       # Landing screen, value props
        ├── (auth)/             # sign-in, sign-up (Clerk OAuth)
        ├── (setup)/            # Location permissions, save locations
        └── (tabs)/             # Main app
            ├── index.tsx       # Overview dashboard (risk score)
            ├── map.tsx         # Interactive map with events
            ├── saved.tsx       # Saved routes management
            └── settings.tsx    # User settings

packages/
├── backend/convex/             # Convex serverless backend
│   ├── schema.ts               # 8 database tables
│   ├── users.ts                # User CRUD, preferences
│   ├── events.ts               # Weather/traffic events
│   ├── confirmations.ts        # Community voting
│   ├── riskScore.ts            # Risk calculation (0-100)
│   ├── gamification.ts         # Points, levels, badges, decay
│   ├── routes.ts               # Route management
│   ├── userLocations.ts        # Saved locations
│   ├── chat.ts                 # AI chat with agents
│   ├── auth.config.ts          # Clerk JWT validation
│   ├── integrations/           # weather.ts, traffic.ts
│   └── scheduled/              # dataFetcher.ts (10-min cron)
│
├── env/                        # Type-safe env validation (@outia/env)
│   └── src/
│       ├── web.ts              # Next.js env (NEXT_PUBLIC_*)
│       └── native.ts           # Expo env (EXPO_PUBLIC_*)
│
└── config/                     # Shared TypeScript configuration
    └── tsconfig.base.json      # Base TS config for all packages
```

## Database Schema (8 Tables)

| Table | Key Fields | Purpose |
|-------|-----------|---------|
| **users** | clerkId, email, tier (free/pro), onboardingCompleted | User accounts |
| **events** | type (weather/traffic), location, severity (1-5), confidenceScore, ttl | Active events |
| **userLocations** | userId, name, location (lat/lng), isDefault | Saved home/work |
| **confirmations** | eventId, userId, vote (still_active/cleared/not_exists) | Community votes |
| **routes** | userId, from/to locations, monitorDays, alertThreshold | Monitored routes |
| **riskSnapshots** | locationId, score (0-100), breakdown (weather/traffic/events) | Risk history |
| **userStats** | totalPoints, level (1-7), accuracy, streaks | Gamification stats |
| **userBadges** | badgeId, earnedAt, isActive | Earned badges |

## Risk Scoring Algorithm

Final score = weather(40%) + traffic(40%) + events(20%)

**Weather Score (0-100):**
- Precipitation: >10mm=30pts, >5mm=20pts, >1mm=10pts
- Wind: >60km/h=25pts, >40km/h=15pts, >25km/h=5pts
- Visibility: <200m=40pts, <500m=25pts, <1000m=10pts
- Severe alert: +50pts

**Traffic Score (0-100):**
- Jam factor: >7=40pts, >5=25pts, >3=10pts
- Incidents: +10pts each (max 30)
- Incident severity: severity × 5pts

**Classification:** low (<34) | medium (34-67) | high (>67)

## Gamification System

**7 Levels:**
| Level | Title | Points | Weekly Min Votes |
|-------|-------|--------|-----------------|
| 1 | Newcomer | 0 | 0 |
| 2 | Spotter | 500 | 3 |
| 3 | Route Guardian | 1,500 | 5 |
| 4 | Road Watcher | 4,000 | 8 |
| 5 | Traffic Sentinel | 10,000 | 12 |
| 6 | Storm Tracker | 25,000 | 15 |
| 7 | Community Legend | 50,000 | 20 |

**Points:** Base vote=5pts, First responder=+10pts, Accuracy bonus=+15pts

**Weekly Decay:** -10% if minimum votes not met, level downgrade after 2 inactive weeks

## Key Patterns

### Convex Backend
- All backend logic in `packages/backend/convex/`
- Mutations/queries with `mutation()` / `query()` wrappers
- Real-time subscriptions via `useQuery()` hooks
- Auth via Clerk JWT validation (`auth.config.ts`)
- Scheduled jobs: data fetcher (10 min), weekly decay (Sunday 00:00 UTC)

### Mobile (Expo)
- File-based routing with Expo Router
- Navigation flow: (onboarding) → (auth) → (setup) → (tabs)
- HeroUI Native + HugeIcons for UI
- Reanimated for animations (FadeIn, spring physics)
- expo-location for geolocation
- react-native-maps for map views
- expo-haptics for tactile feedback
- react-native-purchases (RevenueCat) for Pro subscriptions

### Web (Next.js)
- App Router with RSC (React Server Components)
- @base-ui/react for unstyled primitives (Button, Menu, Input)
- shadcn/ui components in `apps/web/src/components/ui/`
- next-themes for dark mode
- Clerk middleware in `apps/web/src/middleware.ts`
- Streamdown + shiki for AI chat markdown rendering

## External APIs

| API | Purpose | Integration File |
|-----|---------|-----------------|
| **OpenWeatherMap** | Current weather, alerts, hourly forecast | `integrations/weather.ts` |
| **Tomorrow.io** | Minute-by-minute nowcasting | `integrations/weather.ts` |
| **HERE Traffic** | Jam factor, incidents, route polylines | `integrations/traffic.ts` |
| **OpenStreetMap Nominatim** | Geocoding/reverse geocoding (mobile) | Location search in native app |

## Environment Variables

**Web (.env):**
```
NEXT_PUBLIC_CONVEX_URL=<convex-url>
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<clerk-key>
CLERK_SECRET_KEY=<clerk-secret>
```

**Native (.env):**
```
EXPO_PUBLIC_CONVEX_URL=<convex-url>
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=<clerk-key>
```

**Backend (.env.local):**
```
OPENWEATHERMAP_API_KEY=<key>
TOMORROW_IO_API_KEY=<key>
HERE_API_KEY=<key>
GOOGLE_GENERATIVE_AI_API_KEY=<key>
CLERK_JWT_ISSUER_DOMAIN=<domain>
```

## Path Aliases

- **Web:** `@/*` → `./src/*`
- **Native:** `@/*` → `./*`

## Key Files Reference

| File | Purpose |
|------|---------|
| `packages/backend/convex/schema.ts` | Database schema definitions |
| `packages/backend/convex/riskScore.ts` | Risk calculation logic |
| `packages/backend/convex/gamification.ts` | Points, levels, badges, decay |
| `packages/backend/convex/confirmations.ts` | Community voting logic |
| `apps/native/app/(tabs)/index.tsx` | Mobile dashboard/overview |
| `apps/native/app/(tabs)/map.tsx` | Interactive map with events |
| `apps/web/src/app/ai/page.tsx` | AI chat interface |
| `apps/web/src/components/providers.tsx` | Clerk + Convex provider setup |

## Design Documents

Implementation plans in `docs/plans/`:
- `2026-01-31-outia-mvp-design.md` - Core MVP architecture
- `2025-01-31-gamification-system-design.md` - Gamification with levels, badges, trust decay
