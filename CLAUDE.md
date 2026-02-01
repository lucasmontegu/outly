# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Outly is a mobile-first risk intelligence app that combines weather and traffic data with community voting to provide real-time risk scores (0-100) for safe departure decisions. Built with Better-T-Stack.

## Tech Stack

- **Monorepo**: Turborepo with npm workspaces
- **Web**: Next.js 16 + React 19 + shadcn/ui + TailwindCSS 4
- **Mobile**: Expo 54 + React Native 0.81 + HeroUI Native + Uniwind (Tailwind)
- **Backend**: Convex (serverless BaaS with real-time sync)
- **Auth**: Clerk (both web and mobile)
- **AI**: Gemini 2.5 Flash via Vercel AI SDK

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
├── web/                 # Next.js App Router
│   └── src/app/         # Routes: dashboard, AI chat
└── native/              # Expo Router (file-based navigation)
    └── app/             # Screens: (tabs), (auth), (onboarding)

packages/
├── backend/convex/      # Convex backend
│   ├── schema.ts        # Database tables: users, events, userLocations,
│   │                    # confirmations, routes, riskSnapshots, userStats, userBadges
│   ├── gamification.ts  # Points, levels, badges, decay mechanics
│   ├── riskScore.ts     # Risk calculation (0-100) from weather/traffic
│   ├── confirmations.ts # Community voting on events
│   ├── integrations/    # External APIs (weather.ts, traffic.ts)
│   └── scheduled/       # Cron jobs for data fetching (every 10 min)
└── env/                 # Type-safe env validation (t3-oss/env)
```

## Key Patterns

### Convex Backend
- All backend logic lives in `packages/backend/convex/`
- Mutations/queries are exported functions with `mutation()` / `query()` wrappers
- Real-time subscriptions via `useQuery()` hooks in frontend
- Auth uses Clerk JWT validation via `auth.config.ts`

### Mobile (Expo)
- File-based routing with Expo Router
- HeroUI Native for components (similar to shadcn)
- Styling with Uniwind (Tailwind for React Native)
- React version pinned to 19.1.0 in root package.json overrides

### Web (Next.js)
- App Router with React Server Components
- shadcn/ui components in `apps/web/src/components/ui/`
- Clerk middleware in `apps/web/src/middleware.ts`

## External APIs

- **Weather**: OpenWeatherMap + Tomorrow.io (nowcasting)
- **Traffic**: HERE Traffic API (Latin America coverage)
- **AI**: Google Gemini via `@ai-sdk/google`

## Environment Variables

Copy from `packages/backend/.env.local` to `apps/*/.env` after running `dev:setup`.

Required in apps:
- `NEXT_PUBLIC_CONVEX_URL` / `EXPO_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`

## Design Documents

Implementation plans and architecture decisions are in `docs/plans/`:
- `2026-01-31-outly-mvp-design.md` - Core MVP architecture
- `2025-01-31-gamification-system-design.md` - Gamification with levels, badges, trust decay
