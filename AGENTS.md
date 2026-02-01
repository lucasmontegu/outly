# AGENTS.md - Outly Monorepo Guidelines

## Build / Lint / Test Commands

```bash
# Development
npm run dev              # Start all apps in dev mode
npm run dev:web          # Start web app only (Next.js on port 3001)
npm run dev:native       # Start native app only (Expo)
npm run dev:server       # Start Convex backend only
npm run dev:setup        # Configure Convex backend

# Build
npm run build            # Build all packages and apps
npm run check-types      # Type-check all packages

# Turborepo filtering (run commands in specific packages)
turbo -F web dev         # Run dev for web app only
turbo -F native build    # Build native app only
turbo -F @outly/backend dev
```

**Note:** This project uses npm workspaces + Turborepo. No test framework is currently configured.

## Project Structure

```
outly/
├── apps/
│   ├── web/              # Next.js 16 web app
│   └── native/           # Expo/React Native app
├── packages/
│   ├── backend/          # Convex backend (serverless functions)
│   ├── config/           # Shared TypeScript configs
│   └── env/              # Environment variable validation
```

## Code Style Guidelines

### TypeScript Configuration
- Base config extends `@outly/config/tsconfig.base.json`
- Strict mode enabled with `noUnusedLocals`, `noUnusedParameters`
- `verbatimModuleSyntax: true` - use `import type` for type imports
- `noUncheckedIndexedAccess: true` - handle undefined index access

### Imports
- Use `import type` for type-only imports (enforced by verbatimModuleSyntax)
- Group imports: external libs → internal packages (`@outly/*`) → relative (`@/`)
- Use path aliases: `@/` for app-relative imports (configured in each app)
- Internal packages use `@outly/` prefix (e.g., `@outly/backend`, `@outly/env`)

### Naming Conventions
- **Components:** PascalCase (e.g., `RiskCircle`, `Button`)
- **Functions:** camelCase (e.g., `getRiskLevel`, `formatTimeAgo`)
- **Types/Interfaces:** PascalCase (e.g., `RiskLevel`, `UserLocation`)
- **Constants:** UPPER_SNAKE_CASE for true constants (e.g., `NAV_THEME`)
- **Files:** camelCase for utilities, PascalCase for components

### Component Patterns

**React Native (apps/native):**
- Use functional components with hooks
- Import React Native components from `react-native` (View, Text, StyleSheet)
- Use HeroUI Native components: `heroui-native` (e.g., `<Card>`)
- Icons from `@hugeicons/react-native` with `@hugeicons/core-free-icons`
- Navigation via `expo-router` (file-based routing)
- Styles via `StyleSheet.create()` with inline objects

**Next.js (apps/web):**
- Use Base UI components (`@base-ui/react`)
- Tailwind CSS for styling with `cn()` utility
- Components use `class-variance-authority` for variants
- Path alias `@/` maps to `./src/*`

### Backend (Convex)
- Schema defined in `packages/backend/convex/schema.ts`
- Use `v` validator from `convex/values` for type safety
- Queries/mutations in separate files under `convex/` directory
- Access via generated API: `import { api } from "@outly/backend/convex/_generated/api"`

### Styling

**Web (Tailwind CSS v4):**
- Utility-first with custom design tokens
- Use `cn()` from `@/lib/utils` for conditional classes
- Components use `class-variance-authority` for variant management
- Dark mode support via CSS variables

**Native (React Native + Uniwind):**
- Tailwind v4 via `uniwind` package
- StyleSheet for complex layouts, Tailwind classes where possible
- HeroUI Native for pre-built components

### Error Handling
- Use Zod for runtime validation (env vars, API inputs)
- Convex handles database errors automatically
- React Error Boundaries for component errors
- Optional chaining and nullish coalescing for safe access

### Environment Variables
- Defined in `packages/env/` with Zod schemas
- Web: `NEXT_PUBLIC_*` prefix for client-side vars
- Native: `EXPO_PUBLIC_*` prefix for client-side vars
- Never commit `.env` files

### Git Workflow
- Use conventional commits
- No pre-commit hooks configured
- Package manager: npm@11.7.0 (enforced)

## Dependencies

**Key Framework Versions:**
- React: 19.1.0 (enforced via overrides)
- React Native: 0.81.4
- Next.js: 16.1.1
- Expo: ^54.0.1
- Convex: ^1.31.2
- TypeScript: ^5
- Tailwind CSS: v4

## AI Agent Instructions

When modifying code:
1. Follow existing import ordering and grouping
2. Use `import type` for type imports
3. Respect strict TypeScript settings - no implicit any
4. Match existing component patterns for each platform
5. Use path aliases (`@/`, `@outly/*`) instead of relative paths
6. For UI changes, maintain consistency with existing design system
7. When adding Convex tables, update schema.ts and regenerate types
8. Test both web and native if shared code is modified
