# Outia Brand Guidelines

## Brand Positioning

**One-liner:** "Know exactly when to leave."

**Value Proposition:** Outia transforms departure anxiety into confidence with a single risk score (0-100) that combines weather, traffic, and community intelligence.

**Target User:** "The Responsible Planner" - Urban professionals (25-45) who value control, safety, and time optimization. They want to protect themselves and loved ones while maximizing their commute efficiency.

## Brand Personality

| Trait | Description |
|-------|-------------|
| **Trustworthy** | Data-driven, reliable, accurate |
| **Modern** | Tech-forward, clean, minimal |
| **Empowering** | Transforms anxiety into confidence |
| **Community-driven** | Collaborative, connected |

## Color Palette

### Primary Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Slate Blue** | `#2D3B5F` | Logo, headers, primary brand elements |
| **Electric Teal** | `#00B4D8` | CTAs, accents, interactive elements |
| **Deep Navy** | `#1A2332` | Dark mode backgrounds |

### Risk State Colors

| Level | Primary | Light | Dark | Usage |
|-------|---------|-------|------|-------|
| **Low (0-33)** | `#00C896` | `#E6F9F4` | `#008F6B` | Safe conditions |
| **Medium (34-66)** | `#F4A261` | `#FFF4ED` | `#E07B3C` | Caution advised |
| **High (67-100)** | `#E63946` | `#FDEBED` | `#C62634` | Avoid if possible |

### Neutral Scale (Slate)

```
50:  #F8FAFC  - Light backgrounds
100: #F1F5F9  - Card backgrounds
200: #E2E8F0  - Borders
300: #CBD5E1  - Disabled states
400: #94A3B8  - Placeholder text
500: #64748B  - Secondary text
600: #475569  - Body text
700: #334155  - Dark mode elevated
800: #1E293B  - Dark mode cards
900: #0F172A  - Dark mode primary
```

## Typography

### Font Stack

| Usage | Font | Weight | Notes |
|-------|------|--------|-------|
| **Headings** | Inter | 700-800 | Impact, modern |
| **Body** | System (SF Pro / Roboto) | 400-600 | Native feel |
| **Scores** | JetBrains Mono | 700 | Data display |

### Scale

| Name | Size | Usage |
|------|------|-------|
| `xs` | 11px | Labels, captions |
| `sm` | 12px | Secondary text |
| `base` | 14px | Body text |
| `md` | 15px | Important body |
| `lg` | 16px | Large body |
| `xl` | 18px | Section titles |
| `2xl` | 20px | Card titles |
| `3xl` | 24px | Page titles |
| `4xl` | 28px | Hero subtitles |
| `5xl` | 32px | Hero titles |
| `8xl` | 56px | Risk scores |

## Iconography

**Style:** Duotone (two-tone with transparency)

**Library:** [Phosphor Icons](https://phosphoricons.com/) or HugeIcons

**Metáforas:**
- Weather: Cloud, Sun, Storm icons
- Traffic: Car, Road, Alert icons
- Community: User group, Vote icons
- Risk: Shield with state indicators

## Voice & Tone

### Principles

1. **Specific over vague:** "Leave 10 min early" > "Plan ahead"
2. **Empowering over alarming:** "You can avoid delays" > "Major traffic jam"
3. **Solutions over problems:** "Take Route B" > "Route A is blocked"

### Copy Examples

| Context | ❌ Before | ✅ After |
|---------|----------|---------|
| CTA | "Get Started — It's Free" | "See My Risk Score" |
| Hero | "Smart alerts for safer journeys" | "Know exactly when to leave" |
| Risk High | "High Risk: Dangerous" | "Plan extra time today" |

### Risk Communication

| Level | Badge Text | Tone | Sample Message |
|-------|------------|------|----------------|
| Low (0-33) | "LOW RISK" | Reassuring | "Clear conditions ahead. Safe travels!" |
| Medium (34-66) | "MEDIUM RISK" | Informative | "Light rain expected. Leave 10 min earlier." |
| High (67-100) | "HIGH RISK" | Actionable | "Major delays expected. Consider alternate routes." |

## UI Patterns

### Cards

- Background: `#FFFFFF` (light) / `#1E293B` (dark)
- Border radius: `16px`
- Shadow: `0 2px 8px rgba(0,0,0,0.06)`
- Padding: `16px`

### Buttons

- Primary: Electric Teal (`#00B4D8`)
- Border radius: `12px`
- Height: `56px` (large) / `44px` (default)
- Font weight: `700`

### Risk Circle

- Size: `200-220px` (dashboard) / `160-180px` (compact)
- Inner background: `#0F172A` (dark center)
- Outer ring: Risk color with glow effect
- Score font: `56-64px`, bold, white
- Animation: Score counting + color interpolation

## Animation Principles

### Timing

| Duration | Usage |
|----------|-------|
| `100ms` | Instant feedback |
| `150ms` | Micro-interactions |
| `250ms` | Standard transitions |
| `400ms` | Page transitions |
| `600ms` | Score counting |

### Spring Config

```typescript
// Snappy (buttons, toggles)
{ damping: 20, stiffness: 400 }

// Bouncy (celebrations, badges)
{ damping: 12, stiffness: 300 }

// Gentle (page transitions)
{ damping: 15, stiffness: 200 }
```

### Haptic Feedback

| Event | Haptic | Intensity |
|-------|--------|-----------|
| Button tap | Light | Short |
| Vote submitted | Success | Double |
| Risk change | Level-based | Varies |
| Pull to refresh | Light | Quick |

## Implementation

All design tokens are centralized in:
```
apps/native/lib/design-tokens.ts
```

Import and use:
```typescript
import { colors, spacing, typography, borderRadius } from '@/lib/design-tokens';
```

## Files Reference

| File | Purpose |
|------|---------|
| `/lib/design-tokens.ts` | Design system tokens |
| `/components/risk-circle.tsx` | Animated risk circle |
| `/lib/haptics.ts` | Haptic feedback system |
| `/app/(onboarding)/index.tsx` | First user touchpoint |
| `/app/(tabs)/index.tsx` | Main dashboard |
