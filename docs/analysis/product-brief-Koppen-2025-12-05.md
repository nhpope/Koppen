---
stepsCompleted: [1, 2, 3, 4, 5, 6]
workflowComplete: true
inputDocuments:
  - 'docs/analysis/brainstorming-session-2025-12-05.md'
  - 'docs/analysis/research/technical-koppen-research-2025-12-05.md'
  - 'docs/Koppen.md'
workflowType: 'product-brief'
lastStep: 0
project_name: 'Koppen'
user_name: 'NPope97'
date: '2025-12-05'
---

# Product Brief: Koppen

**Date:** 2025-12-05
**Author:** NPope97

---

## Executive Summary

**Koppen** is an open-source, interactive climate classification tool that teaches users how climate systems work by letting them explore and create their own classification systems. Unlike static maps or dense Wikipedia articles, Koppen reveals the *design decisions* behind climate classification - showing users not just *what* the Köppen-Geiger zones are, but *why* the thresholds exist and what trade-offs they represent.

The core insight: people don't understand that climate classification is a human-designed system with intentional compromises. By giving users a sandbox to experiment with classification rules, Koppen transforms passive learning into active discovery. Users build intuition about climate by playing, not reading.

No login required. No tracking. Just learning. Supported by optional donations from users who want others to have the same experience.

---

## Core Vision

### Problem Statement

People confidently discuss climate without understanding the fundamental classification systems that define it. They treat Köppen-Geiger as immutable truth rather than a designed model with intentional trade-offs. This leads to frustrating, uninformed debates and widespread climate illiteracy.

### Problem Impact

- Climate discussions suffer from basic misunderstandings
- Students memorize letter codes without grasping underlying logic
- Curious people bounce off dense academic resources
- No accessible path from "interested" to "actually understands"

### Why Existing Solutions Fall Short

| Solution | Limitation |
|----------|------------|
| Wikipedia / textbooks | Passive, dense, no interactivity |
| Static Köppen maps | Show zones but not *why* |
| Existing web tools | View-only, no creation or rule exploration |
| "My Perfect Climate" | Personal preference matching, no education |

None let users *play* with the rules. None reveal the design decisions. None connect classification choices to real-world consequences.

### Proposed Solution

An interactive web tool where users:
1. **Explore** the existing Köppen-Geiger map with rich, layered explanations
2. **Understand** the exact rules and thresholds that define each climate type
3. **Create** their own classification systems by adjusting parameters
4. **Compare** their systems against Köppen to see trade-offs
5. **Share** their discoveries to spark others' learning

Learning happens through creation, not consumption.

### Emotional Journey

| Stage | User Feels |
|-------|------------|
| **Curiosity** | "What's *my* climate type?" |
| **Clarity** | "Oh, THAT'S why these thresholds exist" |
| **Ownership** | "I made a system that works better for X" |
| **Sharing** | "You won't believe what I discovered" |

Users feel like climate insiders, not students being graded.

### Key Differentiators

1. **Learn by creating** - Understanding emerges from building, not reading
2. **Rule transparency** - See exactly why any location gets its classification
3. **Trade-off revelation** - Grasp that all classification involves design choices
4. **No friction** - No login, no tracking, no barriers to learning
5. **Open source** - Climate literacy is a public good (MIT/Apache 2.0 license)
6. **Sustainable simplicity** - Coffee button, not paywalls

---

## Target Users

### Primary User: The Climate Enthusiast

**Persona: "Alex"**

- **Where they are:** r/geography, r/mapporn, weather forums, climate Twitter/X
- **Motivation:** Wants to *actually understand* climate systems, not just look at pretty maps. Values being the person who knows what they're talking about in discussions.
- **Current frustration:** Can't find specific maps (e.g., "all Mediterranean climates globally"), existing tools are view-only and don't explain *why* classifications exist.

**Triggers for visiting Koppen:**
- Sees a shared map on Reddit/social that looks interesting
- Wants to create a specific map that doesn't exist online
- Researching for fun / following a curiosity rabbit hole
- Preparing for a discussion with actual facts

**What makes them stay:**
- Can create the exact map they were looking for
- Learns something unexpected about how classification works
- Has an "aha" moment worth sharing

**What makes them share:**
- Created something unique (custom filtered export)
- Discovered something surprising about a familiar place
- Wants to educate or impress others

**Success moment:** Exports a custom map of a single climate type, posts it to r/mapporn, gets upvotes, and someone asks "where did you make this?"

---

### Secondary User: The Student

**Persona: "Jordan"**

- **Where they are:** Doing homework, writing a geography paper
- **Motivation:** Needs to understand and report on a specific climate type or region
- **Current frustration:** Wikipedia is dense, textbooks are dry, can't find good visuals for presentations

**What they need from Koppen:**
- Click on a climate type → get clear explanation with real-world context
- Export a clean regional map for their report/presentation
- Understand what the classification *means* in practice (agriculture, biomes)

**Success moment:** Finds exactly the info they need, exports a map, cites Koppen in their paper.

**Conversion potential:** If the tool is fun enough, they become an enthusiast.

---

### Tertiary User: The Casual Explorer

**Persona: "Sam"**

- **Where they are:** Clicked a link from Reddit, Twitter, or a friend's share
- **Motivation:** 2 minutes of curiosity - "what's my climate type?"
- **Attention span:** Short - will bounce if not immediately engaged

**What hooks them:**
- "Find your climate" geolocation on landing
- One-click reveals something interesting about their location
- Surprising facts ("Your city has the same climate as Buenos Aires!")

**Success moment:** Learns one interesting thing, maybe clicks around a bit more, possibly shares with a friend.

**Conversion potential:** If they hit an "aha" moment, they may return and go deeper.

---

### User Journey

| Stage | Enthusiast (Alex) | Student (Jordan) | Explorer (Sam) |
|-------|-------------------|------------------|----------------|
| **Discovery** | Reddit share, search for specific map | Google for homework help | Social share, friend's link |
| **First action** | Click around map, explore legend | Search for specific climate type | "Find my climate" |
| **Core engagement** | Build custom classification, compare to Köppen | Read explanation, export for report | Click a few climates, read tooltips |
| **Aha moment** | "So THAT'S why Köppen drew the line there" | "Now I actually understand this" | "I didn't know that about my city" |
| **Share/Return** | Exports custom map, shares to Reddit | Bookmarks for future reference | Maybe shares, maybe forgets |

---

## Success Metrics

### North Star Metric

**Shares & Exports** - The number of maps exported or shared via URL.

This metric captures:
- Users found enough value to *take something with them*
- Content is spreading organically (each export is potential marketing)
- The tool is producing something that didn't exist before

---

### User Success Indicators

| User Type | Success Behavior | Indicator |
|-----------|------------------|-----------|
| **Enthusiast** | Creates and exports custom maps | Export count, classification builder usage |
| **Student** | Finds info, exports for report | Climate profile views, regional exports |
| **Explorer** | Discovers something interesting | "Find my climate" usage, clicks beyond landing |

---

### Engagement Signals (Lightweight Tracking)

Since this is open-source with no login, keep tracking minimal and privacy-respecting:

- **Page views** - Basic traffic (via simple analytics like Plausible or Umami)
- **Export clicks** - How many maps are being downloaded
- **Share URL generations** - How many custom classifications are being shared
- **Time on site** - Are people exploring or bouncing?

No user accounts. No tracking cookies. Just aggregate counts.

---

### Business Objectives

| Objective | Approach |
|-----------|----------|
| **Sustainability** | Donation button visible but not pushy; let it happen organically |
| **Growth** | Organic via Reddit shares, map exports with watermark |
| **Cost control** | Static hosting, minimal backend, low operational overhead |

---

### What Success Looks Like

**3 months:** Tool is live, stable, and shared on r/geography and r/mapporn. Some organic traffic, a few donations, positive feedback.

**12 months:** Steady trickle of users finding it via search and social. Occasional posts featuring Koppen-generated maps. Donations cover hosting costs. Learned what features people actually want.

**Long-term:** A useful, cited resource for climate education. Maybe featured in geography classrooms. A project you're proud of.

---

## MVP Scope

### Core Features

1. **Interactive Köppen Map**
   - 2D map with zoom/scroll/click
   - Clean legend with all climate types
   - Click any zone → see classification details

2. **Climate Profiles (Lightweight)**
   - Short description of each climate type
   - Classification rules/thresholds that define it

3. **Classification Builder**
   - "Create" button reveals builder interface
   - Start from Köppen preset or scratch
   - Sliders to adjust thresholds → live map updates
   - Compare tab: your system vs original Köppen

4. **Export & Share**
   - Download PNG (full-res, with watermark)
   - Filter by climate type or region before export
   - Shareable URL encodes classification rules
   - Import JSON config to reload previous work

5. **Basics**
   - Donation button (Ko-fi) in top bar
   - No login required

---

### Out of Scope for MVP

- "Find my climate" geolocation
- Rich climate profiles (agriculture, biomes, example cities)
- Data overlay layers (temperature, precipitation, etc.)
- Time machine (historical climates)
- Challenge mode / scoring
- Worldbuilding / planetary modeling
- User accounts or saved classifications (server-side)

---

### MVP Success Criteria

The MVP is successful if:
- Users can explore the Köppen map and understand classifications
- Users can create custom classification systems and see live results
- Users can export and share their maps
- Organic sharing happens on Reddit (r/geography, r/mapporn)
- A few donations trickle in

---

### Future Vision

**Phase 2 - Depth:**
- "Find my climate" geolocation hook
- Rich climate profiles with real-world context
- Data overlay layers

**Phase 3 - Gamification:**
- Challenge mode (match biome maps)
- Scoring for accuracy + elegance
- Community gallery of classifications

**Phase 4 - Premium:**
- Time machine (paleoclimate, future projections)
- Worldbuilding / planetary modeling
