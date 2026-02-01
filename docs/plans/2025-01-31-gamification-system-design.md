# Gamification System Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a trust/reputation system where users earn points, levels, and badges by validating hazards with accuracy.

**Architecture:** Accuracy-weighted point system with community consensus validation, weekly decay for inactivity, and tiered badges across milestones, accuracy, streaks, and special categories.

**Tech Stack:** Convex backend, React Native frontend, Convex cron jobs for weekly decay

---

## Core Mechanics

### Point System
- **Base points per vote:** 5 pts
- **First responder bonus:** +10 pts (being first to vote on an event)
- **Accuracy bonus:** +15 pts when vote matches community consensus
- **Badge bonuses:** One-time points when badge is earned

### Accuracy Calculation
- Determined by **community consensus** (majority vote wins)
- When event expires or gets 5+ votes, consensus is calculated
- Users matching majority get accuracy credit
- `accuracyPercent = correctVotes / totalVotes * 100`

---

## Level System

| Level | Title | Points Required | Weekly Minimum Votes |
|-------|-------|-----------------|---------------------|
| 1 | Newcomer | 0 | - |
| 2 | Spotter | 500 | 3 votes/week |
| 3 | Route Guardian | 1,500 | 5 votes/week |
| 4 | Road Watcher | 4,000 | 8 votes/week |
| 5 | Traffic Sentinel | 10,000 | 12 votes/week |
| 6 | Storm Tracker | 25,000 | 15 votes/week |
| 7 | Community Legend | 50,000 | 20 votes/week |

### Decay Rules (Weekly - Sunday midnight)
- **Below minimum votes:** -10% points
- **2 consecutive inactive weeks:** Downgrade 1 level + revoke streak badges
- **4 consecutive inactive weeks:** Downgrade 2 levels
- **Accuracy below 70% (min 20 votes):** -15% points
- **Floor:** Cannot drop below Level 1

---

## Badge System

### Milestone Badges
| Badge | Requirement | Points |
|-------|-------------|--------|
| First Steps | First 5 votes | +10 |
| Dedicated | 50 validations | +75 |
| Veteran | 250 validations | +300 |
| Elite Validator | 1,000 validations | +1,000 |

### Accuracy Badges
| Badge | Requirement | Points |
|-------|-------------|--------|
| Sharp Eye | 85%+ accuracy (min 50 votes) | +200 |
| Laser Focus | 95%+ accuracy (min 100 votes) | +500 |
| Untouchable | 98%+ accuracy (min 200 votes) | +1,500 |

### Streak Badges (Can be lost)
| Badge | Requirement | Points |
|-------|-------------|--------|
| Weekly Warrior | 7-day streak | +100 |
| Monthly Guardian | 30-day streak | +500 |
| Quarterly Legend | 90-day streak | +2,000 |

### Special Badges
| Badge | Requirement | Points |
|-------|-------------|--------|
| Storm Chaser | 50 weather validations | +150 |
| Traffic Master | 50 traffic validations | +150 |
| First Responder | Be first on 25 events | +300 |
| Comeback Kid | Recover from downgrade to same level | +100 |

---

## Data Model (Convex Schema)

```typescript
// User gamification stats
userStats: defineTable({
  userId: v.string(),

  // Points & Level
  totalPoints: v.number(),
  level: v.number(),

  // Accuracy tracking
  totalVotes: v.number(),
  correctVotes: v.number(),
  accuracyPercent: v.number(),

  // Activity tracking
  currentStreak: v.number(),
  longestStreak: v.number(),
  lastVoteDate: v.string(),
  votesThisWeek: v.number(),
  inactiveWeeks: v.number(),

  // Category stats
  weatherVotes: v.number(),
  trafficVotes: v.number(),
  firstResponderCount: v.number(),

  // Percentile
  percentileRank: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_points", ["totalPoints"])

// Earned badges
userBadges: defineTable({
  userId: v.string(),
  badgeId: v.string(),
  earnedAt: v.number(),
  isActive: v.boolean(),
})
  .index("by_user", ["userId"])
  .index("by_badge", ["badgeId"])
```

---

## Algorithm Flow

### On User Vote
1. Award base points (5 pts)
2. Check first responder bonus (+10 pts if first)
3. Update streak (reset if missed a day)
4. Track category (weather/traffic)
5. Increment weekly vote counter
6. Check and award new badges
7. Recalculate level

### On Consensus Reached (event expires or 5+ votes)
1. Determine majority vote
2. For each voter:
   - If matched majority: +1 correct vote, +15 bonus points
   - Recalculate accuracy percentage
3. Check and award accuracy badges

### Weekly Decay Job (Cron - Sundays)
1. For each user:
   - Check if met minimum votes for level
   - Apply point decay if not (-10%)
   - Downgrade level if 2+ inactive weeks
   - Apply accuracy penalty if below 70%
   - Reset weekly vote counter
2. Recalculate percentiles for all users

---

## UI Screen: "My Impact"

### Components
1. **Header** - Back button, title, help button
2. **Profile Badge** - Shield icon that changes per level
3. **Level Display** - Level number pill + title + percentile rank
4. **Progress Bar** - Points progress to next level
5. **Stats Cards** - Confirmations count + Accuracy percentage
6. **How It Works** - Explanation section
7. **Badge Showcase** - Recent badges with "See All" link

### Navigation
- Accessible from Settings screen
- "See All" badges → Badge collection screen
- Help (?) → Modal explaining system
