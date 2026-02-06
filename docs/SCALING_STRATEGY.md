# Scaling Strategy: US Launch → LATAM Expansion

## Executive Summary

This document analyzes the infrastructure scaling strategy for Outia, evaluating whether additional caching layers (Upstash Redis/QStash) are needed, the geographic expansion roadmap, and the viability of alternative database architectures (SQLite/Turso).

**Conclusion:** Current Convex architecture with P0-P2 optimizations is sufficient for 5,000-10,000 active users. Additional infrastructure should only be added when specific metrics indicate necessity.

---

## 1. Upstash Redis/QStash Analysis

### Current State vs. With Upstash

| Consideration | Current State | With Upstash |
|---------------|---------------|--------------|
| **Caching** | Client-side AsyncStorage + Convex cache | Redundant |
| **Real-time** | Convex WebSocket native | No improvement |
| **Background jobs** | Convex crons (15 min) | QStash would be overkill |
| **Cost** | $0 (free tier) → $25/mo (growth) | +$10-30/mo additional |

### Recommendation: NOT NOW

With P0-P2 bandwidth optimizations implemented (~85-90% reduction), Convex should handle **5,000-10,000 active users** within the $25/month tier.

### When to Reconsider

**Add Upstash Redis when:**
- >10k concurrent users requiring rate limiting
- Global session caching needed
- P95 latency exceeds 200ms from LATAM

**Add QStash when:**
- Critical webhooks need guaranteed retry (e.g., Stripe payment webhooks)
- Complex async workflow orchestration required
- Background job failures are impacting user experience

---

## 2. Geographic Expansion Strategy

### Launch Phases

```
┌─────────────────────────────────────────────────────────────┐
│                    LAUNCH PHASES                            │
├─────────────────────────────────────────────────────────────┤
│  Phase 1: US Launch (0-6 months)                            │
│  ├── Single Convex deployment (us-east)                     │
│  ├── OpenWeatherMap: Full US coverage                       │
│  ├── HERE Traffic: Excellent US data                        │
│  └── Target: 1,000-5,000 users                              │
│                                                             │
│  Phase 2: LATAM Prep (6-12 months)                          │
│  ├── Validate API coverage in target countries              │
│  │   ├── Mexico: Good coverage                              │
│  │   ├── Brazil: Variable (major cities OK)                 │
│  │   └── Argentina/Chile: Limited traffic data              │
│  ├── Consider regional API alternatives                     │
│  └── Add i18n/l10n to native app                            │
│                                                             │
│  Phase 3: LATAM Launch (12+ months)                         │
│  ├── Evaluate if Convex latency is acceptable (~100-150ms)  │
│  ├── If needed: Add edge caching with Upstash               │
│  └── Target: 10,000-50,000 users                            │
└─────────────────────────────────────────────────────────────┘
```

### API Coverage Analysis by Region

| Region | OpenWeatherMap | HERE Traffic | Tomorrow.io |
|--------|----------------|--------------|-------------|
| **US (all states)** | Excellent | Excellent | Excellent |
| **Mexico** | Good | Good | Good |
| **Brazil** | Good | Variable (cities) | Good |
| **Argentina** | Good | Limited | Moderate |
| **Chile** | Good | Limited | Moderate |
| **Colombia** | Good | Variable | Moderate |

### LATAM Risks to Validate

1. **HERE Traffic** has limited coverage outside capital cities
2. **Tomorrow.io** may have less precision in LATAM
3. **Latency** from LATAM to Convex US (~100-150ms) is acceptable for this use case

### Mitigation Strategies

1. **Traffic Data Gaps:** Partner with local traffic APIs (Waze data, government feeds)
2. **Weather Precision:** Supplement with local meteorological services
3. **Latency:** Implement aggressive client-side caching for non-real-time data

---

## 3. Database Architecture Analysis

### SQLite/Turso Per-User Database Evaluation

| Architecture | Pros | Cons |
|--------------|------|------|
| **Convex (current)** | Real-time native, zero ops, auto-scaling | Vendor lock-in, cost scales with usage |
| **Turso per-user** | Data isolation, edge latency, GDPR-friendly | 100x complexity, no real-time, more code |

### When Per-User DB Makes Sense

- Regulations require data isolation (healthcare, fintech)
- Users have massive individual datasets (analytics platforms)
- Need <20ms latency globally
- Multi-tenant SaaS with strict data segregation

### Why NOT for Outia

1. **Shared Data Model:** Weather/traffic events are global, not per-user
2. **Real-time is Core:** Community voting and risk updates need WebSocket
3. **No Isolation Requirements:** No regulatory need for data segregation
4. **Complexity Cost:** Would require rewriting entire backend

### Recommendation: STAY WITH CONVEX

The current architecture is well-suited for Outia's requirements. Per-user databases would be significant over-engineering.

---

## 4. Recommended Architecture Evolution

### Current Architecture (Phase 1)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    Mobile App (Expo)                                        │
│         │                                                   │
│         │ WebSocket + HTTP                                  │
│         ▼                                                   │
│    ┌─────────────┐                                          │
│    │   Convex    │──────► External APIs                     │
│    │  (us-east)  │        ├── OpenWeatherMap                │
│    └─────────────┘        ├── HERE Traffic                  │
│                           └── Tomorrow.io                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Future Architecture (Phase 3, if needed)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    Mobile App (Expo)                                        │
│         │                                                   │
│         ▼                                                   │
│    ┌─────────────┐                                          │
│    │  Upstash    │◄──── Edge cache for read-heavy queries   │
│    │   Redis     │      (events, forecasts)                 │
│    └──────┬──────┘                                          │
│           │                                                 │
│           ▼                                                 │
│    ┌─────────────┐                                          │
│    │   Convex    │──────► External APIs                     │
│    │  (us-east)  │                                          │
│    └─────────────┘                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Decision Metrics

### When to Add Upstash Redis

| Metric | Threshold | Action |
|--------|-----------|--------|
| P95 API Latency | > 200ms | Add edge caching |
| Concurrent Users | > 10,000 | Add rate limiting |
| Cache Hit Ratio | < 60% | Evaluate caching strategy |

### When to Upgrade Convex Plan

| Metric | Threshold | Action |
|--------|-----------|--------|
| Bandwidth Usage | > 80% of plan | Upgrade or optimize |
| Function Calls | > 80% of plan | Upgrade or batch operations |
| Active Users | > 5,000 | Evaluate $25/mo plan |

### When to Consider Architecture Changes

| Metric | Threshold | Action |
|--------|-----------|--------|
| API Costs | > 30% of revenue | Aggressive caching, API alternatives |
| MAU | > 50,000 | Evaluate hybrid architecture |
| Latency (LATAM) | > 300ms consistently | Edge infrastructure |

---

## 6. Cost Projections

### Phase 1: US Launch (1,000-5,000 users)

| Service | Monthly Cost |
|---------|--------------|
| Convex | $0-25 |
| OpenWeatherMap | $0 (1,000 calls/day free) |
| HERE Traffic | $0 (5,000 calls/day free) |
| Tomorrow.io | $0-50 (depending on plan) |
| **Total** | **$0-75/month** |

### Phase 2: Growth (5,000-20,000 users)

| Service | Monthly Cost |
|---------|--------------|
| Convex | $25-100 |
| OpenWeatherMap | $40-100 |
| HERE Traffic | $0-100 |
| Tomorrow.io | $50-200 |
| Upstash (if needed) | $10-30 |
| **Total** | **$125-530/month** |

### Revenue Requirement

At $4-5/user/month subscription:
- **1,000 users:** $4,000-5,000/month revenue
- **5,000 users:** $20,000-25,000/month revenue
- **Margin:** 79-100% (infrastructure costs are minimal)

---

## 7. Action Items by Phase

### Phase 1: US Launch (Now)
- [x] Implement P0 bandwidth optimizations
- [x] Implement P1 bandwidth optimizations
- [x] Implement P2 bandwidth optimizations
- [ ] Monitor Convex dashboard metrics weekly
- [ ] Set up alerting for bandwidth/function thresholds
- [ ] Launch beta in US market

### Phase 2: LATAM Prep (6-12 months)
- [ ] Add i18n support to native app
- [ ] Test API coverage in Mexico, Brazil
- [ ] Evaluate regional traffic data sources
- [ ] Measure latency from LATAM to Convex
- [ ] Plan localization of content

### Phase 3: Scale (12+ months)
- [ ] Evaluate Upstash if latency > 200ms
- [ ] Consider regional API partnerships
- [ ] Optimize based on real usage patterns

---

## Appendix: Technology Comparison

### Caching Solutions

| Solution | Use Case | Latency | Cost |
|----------|----------|---------|------|
| **Convex (built-in)** | Real-time data | ~50-100ms | Included |
| **AsyncStorage** | Client-side persistence | <1ms | Free |
| **Upstash Redis** | Global edge cache | ~10-30ms | $10-100/mo |
| **Cloudflare KV** | Static edge data | ~10ms | $5-50/mo |

### Database Solutions

| Solution | Best For | Real-time | Complexity |
|----------|----------|-----------|------------|
| **Convex** | Real-time apps, rapid development | Native | Low |
| **Turso** | Edge-first, data isolation | Manual | High |
| **PlanetScale** | MySQL workloads, branches | Manual | Medium |
| **Supabase** | Postgres + Auth | Realtime extension | Medium |

---

*Document created: February 2026*
*Last updated: February 2026*
*Author: Architecture Analysis*
