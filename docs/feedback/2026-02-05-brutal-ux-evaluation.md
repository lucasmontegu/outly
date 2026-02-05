# Brutal UX Evaluation - February 5, 2026

**Overall Score: 4/10** — NOT worth $4.99/month in current state.

**Core Problem:** Outia is a data dashboard, not a decision assistant. Shows WHAT (risk 100) but not SO WHAT (18 min late) or NOW WHAT (take Route B).

---

## Screen-by-Screen Scores

| Screen | Score | Key Issue |
|--------|-------|-----------|
| Home | 5/10 | Semi-ring decorative, "LEAVE IN 1H 45M" ambiguous, no primary CTA |
| Home Scrolled | 3/10 | 3 identical alerts destroy trust, "124 to 1440" incomprehensible |
| Map + Vote | 6/10 | Best screen, but voting lacks incentives and vote counts |
| Saved Routes | 7/10 | Clean but "No Changes" label is wrong, no current risk shown |
| Settings | 6/10 | Standard, "My Impact" buried, PRO value unclear |
| Map Alt | 5/10 | Minimized card lacks context and priority |

---

## 7 Uninstall Triggers

1. **Google Maps + Weather = free** — 80% of functionality without paying
2. **"LEAVE IN 1H 45M" is confusing** — If I'm late because I misread, goodbye
3. **3 identical alerts** — Looks bugged, destroys credibility
4. **No driving mode** — Useless while driving, still need Waze
5. **Score without context** — "Risk 100" doesn't tell me "18 min late"
6. **No voice guidance** — Looking at phone while driving is dangerous
7. **Gamification without purpose** — 969 lines of code for invisible badges

---

## Information Hierarchy Problems

### Prominent but doesn't matter:
- "Good afternoon, Lucas" — Wastes prime real estate on pleasantries
- Semi-ring diagram — 30% of hero, adds zero info beyond the number
- Giant "LEAVE IN" text — Unclear if actionable or FYI

### Buried but critical:
- Why the score is 100 — Hidden in scrollable cards
- Community confidence — Only visible on individual map events
- Route-specific risk — Should show risk PER ROUTE
- Historical accuracy — No "yesterday we said 85, actual was 91"

---

## Critical Missing Features

### Decision Automation (not just data):
- "Set alarm for optimal departure"
- "Notify me when score drops below 60"
- "Add 15min buffer" toggle

### Route Intelligence:
- Alternative route comparison with ETAs
- Real-time rerouting suggestions
- Historical patterns ("Mondays at 7am average 78")

### Trust Indicators:
- Accuracy tracking ("87% accurate this month")
- Source transparency ("3 police reports, 47 community votes, NOAA alert")
- Community size ("1,247 active drivers in your area")

### Integration Gaps:
- Calendar integration ("Meeting at 9am, alert at optimal time")
- ETA impact in minutes ("+18 min delay on your route")
- Navigation app handoff ("Open in Waze" with optimal route)

---

## Visual Design Issues (Score: 5/10)

| Issue | Current | Fix |
|-------|---------|-----|
| Semi-ring gauge | Cramped 200px, dated feel | Full-circle 280px with animated gradient |
| Brand color (#1A1464) | Barely visible | Use in headers, gradients, surfaces |
| All cards identical | White + shadow 0.06 | Differentiate with accent borders, colors |
| Timeline chips | 64px, boring rectangles | 80px with gradients + icons |
| Typography | Max 24px, all semibold | Titles 40px, bold/regular contrast |
| Shadows | 0.06 opacity = invisible | 0.12 minimum |
| No visual identity | Looks like generic template | Create signature geometric motif |

---

## Marketing Positioning

### Current Problem:
"Risk Intelligence for Drivers" is too abstract. Nobody understands what "risk score" means.

### Correct Positioning:
> **"The app that tells you when to leave."**

- **App Store subtitle:** "Know Exactly When to Leave"
- **Elevator pitch:** "Waze helps once you're in the car. Outia tells you when to get in."
- **Target audience:** Commuters with 20-60 min drives in weather-variable cities

### Fake Social Proof Alert:
Paywall says "2,400+ users, 4.9 rating" — Apple may reject. Remove immediately.

---

## Monetization Assessment

### Current paywall features are weak:
- "Smart Departure Advisor" — Free version already shows departure time
- "7-Day Risk Forecast" — Nobody plans commutes 7 days ahead
- "Priority Safety Alerts" — Undefined vs. regular alerts

### Recommended pricing: $2.99/mo (not $4.99)

| Free | PRO ($2.99/mo) |
|------|-----------------|
| 1 saved route | Unlimited routes |
| Risk score + departure time | ETA impact in minutes |
| Basic morning alert | Smart departure notifications |
| Map with events | Historical analytics |
| | Home screen widget |
| | Route comparison |

---

## The 3 Features That Justify Charging

### 1. Smart Departure Notifications (P0)
Push notification at the perfect time: "Leave for work in 15 min — conditions optimal until 8:15 AM." Backend already has `getForecast`.

### 2. ETA Impact Calculator (P0)
Replace abstract risk score with real minutes: "Normal: 30 min -> Today: 47 min (+17 min delay)." Connect with HERE Routing API.

### 3. Route Comparison View (P1)
Side-by-side: "Route A: 32 min (clear) Recommended | Route B: 50 min (+18 delay)." Show which path is fastest TODAY.

---

## Driver Persona Failures

### Morning Routine (6am, need to leave by 7):
App says "LEAVE IN 1H 45M" — confusing. Does it mean leave at 7:45? What if I MUST leave at 7?

**What drivers need:** "If you leave now (6am): 45 min + high risk. If you leave at 7:40: 30 min + medium risk."

### En Route (2 seconds to glance):
No driving mode. No glanceable info. No voice. Useless while driving.

### Decision Quality:
Risk score 100 but "leave in 1h 45m" — contradictory. No trade-off clarity, no alternatives, no ETA impact.

### vs. Waze (8 years of usage):
Waze: real-time rerouting, voice, police alerts, gas prices. Outia: a number in a circle. The delta is NOT worth $5/month.

---

## Evaluation Sources

- UX Research Agent: Screen-by-screen usability analysis
- Product Manager Agent: Driver persona journey mapping
- Business Analyst Agent: Game-changing features identification
- Marketing Agent: Positioning and monetization assessment
- Frontend Engineer Agent: Visual design critique

**Date:** February 5, 2026
**Methodology:** 5 parallel expert evaluations against daily driver persona
