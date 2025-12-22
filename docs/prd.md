---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
inputDocuments:
  - 'docs/analysis/product-brief-Koppen-2025-12-05.md'
  - 'docs/analysis/brainstorming-session-2025-12-05.md'
  - 'docs/analysis/research/technical-koppen-research-2025-12-05.md'
workflowType: 'prd'
lastStep: 11
project_name: 'Koppen'
user_name: 'NPope97'
date: '2025-12-05'
---

# Product Requirements Document - Koppen

**Author:** NPope97
**Date:** 2025-12-05

---

## Executive Summary

**Koppen** is an open-source, interactive climate classification visualization tool that transforms how people learn about climate systems. Instead of passive consumption of static maps and dense Wikipedia articles, users explore the Köppen-Geiger classification system interactively and create their own custom classification systems - learning through experimentation rather than reading.

The core insight driving this product: people don't understand that climate classification is a human-designed system with intentional trade-offs. By revealing the rules behind classifications and letting users modify them, Koppen turns climate science into an accessible, engaging sandbox.

**Target audience:** Climate enthusiasts on communities like r/geography and r/mapporn, students researching climate topics, and curious explorers who stumble upon shared maps.

**Business model:** Open-source, donation-supported (Ko-fi), with potential premium features in future phases.

**Success metric:** Shares and exports - maps that users create and distribute organically.

### What Makes This Special

1. **Classification sandbox** - Users don't just view climate zones; they build and modify classification systems, developing intuition through experimentation
2. **Rule transparency** - Every classification decision is explainable; users see exactly why a location is classified a certain way
3. **Export-first design** - Users can create and export specific maps that don't exist elsewhere (e.g., "all Mediterranean climates globally"), driving organic sharing
4. **Zero friction** - No login, no tracking, no barriers to learning; just open the tool and explore
5. **URL-as-save-file** - Custom classification rules encoded in shareable URLs; no backend storage needed

## Project Classification

**Technical Type:** Web Application (SPA)
**Domain:** Scientific / Educational
**Complexity:** Medium

This is a browser-based interactive visualization tool built on scientific climate data. Key technical considerations include:

- Accurate implementation of Köppen-Geiger classification rules (Beck et al. 2018)
- Performant rendering of global climate data at 0.25° resolution
- Client-side computation for real-time classification updates
- Static hosting compatibility for low operational costs

## Success Criteria

### User Success

| User Type | Success Moment | Measurable Indicator |
|-----------|----------------|---------------------|
| **Enthusiast** | "I finally understand why Köppen drew the line there" | Creates custom classification, exports comparison map |
| **Student** | "This is exactly what I need for my report" | Exports regional/filtered map, views climate profile |
| **Casual Explorer** | "I didn't know that about my city's climate" | Clicks beyond landing, views 3+ climate types |

**Core User Success Criteria:**
- Users can explore the Köppen map and understand why any location has its classification
- Users can create custom classification systems with immediate visual feedback
- Users can export shareable maps that didn't exist before (e.g., "all Mediterranean climates globally")
- Users experience at least one "aha moment" about how climate classification works

### Business Success

| Timeframe | Success Looks Like |
|-----------|-------------------|
| **3 months** | Tool is live, stable, shared on r/geography and r/mapporn. Organic traffic, positive feedback, first donations. |
| **12 months** | Steady user trickle via search and social. Occasional Reddit posts featuring Koppen-generated maps. Donations cover hosting costs. Clear understanding of what features users want. |
| **Long-term** | A cited resource for climate education. Featured in geography classrooms. A project worth being proud of. |

**Key Business Metrics:**
- **Primary:** Shares & Exports (organic reach indicator)
- **Secondary:** Ko-fi donations (sustainability indicator)
- **Tertiary:** Time on site (engagement indicator)

### Technical Success

- Classification calculations complete in under 100ms for real-time slider feedback
- Initial map load under 3 seconds on typical connections
- Works on all modern browsers without plugins
- Static hosting compatible (Vercel/Netlify/GitHub Pages)
- URL-encoded rules remain shareable and decodable indefinitely

### Measurable Outcomes

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Export rate** | >5% of sessions | Export clicks / page views |
| **Share URL generation** | >2% of sessions | URL generations / page views |
| **Engagement depth** | >60% view 3+ zones | Click tracking on climate profiles |
| **Bounce rate** | <50% | Time on site >30 seconds |

Note: Privacy-respecting aggregate tracking only (Plausible or Umami).

## Product Scope

### MVP - Minimum Viable Product

**Must ship for launch:**
1. Interactive 2D Köppen map (zoom, scroll, click)
2. Clean legend with all 30 climate types
3. Climate profiles: short description + classification rules for each type
4. Classification Builder:
   - Start from Köppen preset or scratch
   - Slider adjustments with live map updates
   - Compare tab (custom vs original Köppen)
5. Export & Share:
   - PNG export (full resolution, with watermark)
   - Filter by climate type or region before export
   - Shareable URL encoding classification rules
   - JSON import/export for ruleset backup
6. Donation button (Ko-fi) in top bar

**Explicitly NOT MVP:**
- "Find my climate" geolocation
- Rich profiles (agriculture, biomes, example cities)
- Data overlay layers
- Time machine / historical climates
- Challenge mode / scoring
- Worldbuilding / planetary modeling
- User accounts or server-side storage

### Growth Features (Post-MVP)

**Phase 2 - Depth:**
- "Find my climate" geolocation hook
- Rich climate profiles with real-world context
- Data overlay layers (temperature, precipitation, climate drivers)
- "Surprise me" random discovery feature

**Phase 3 - Gamification:**
- Challenge mode (match biome maps with classification system)
- Scoring for accuracy + elegance
- Community gallery of classifications

### Vision (Future)

**Phase 4 - Premium:**
- Time machine (paleoclimate, future projections)
- Worldbuilding / planetary modeling
- Advanced export options
- Potential subscription features for power users

## User Journeys

### Journey 1: Alex - The Classification Curious

Alex is a geography enthusiast who gets into heated Reddit debates about climate and biomes. They've read the Wikipedia article on Köppen climate three times but still can't explain *why* the Mediterranean climate threshold is what it is. They feel like they're missing something fundamental.

One evening, Alex sees a post on r/mapporn showing a custom map of "everywhere with the same climate as San Francisco." The map is beautiful and specific - exactly the kind of thing Alex has searched for but never found. The comments say it was made with "Koppen" - some new tool. Alex clicks through.

The map loads instantly. San Francisco's climate - Csb, Mediterranean with cool summers - is highlighted globally. Alex clicks the legend entry and sees: **"Csb requires: driest summer month < 40mm AND < 1/3 of wettest winter month, AND warmest month < 22°C."** For the first time, it clicks - the thresholds aren't arbitrary. They're designed to capture something specific about seasonal patterns.

Alex clicks "Create" and enters the classification builder. Starting from the Köppen preset, they adjust the summer temperature threshold from 22°C to 20°C - just to see what happens. The map updates instantly. Suddenly, Portland and Seattle shift from Csb to Cfb. Alex realizes: *this is why Köppen drew the line at 22°C* - it captures the boundary between genuinely warm summers and cool oceanic summers.

An hour later, Alex has created a custom classification system that separates "true" Mediterranean climates from "maritime-influenced" ones. They export a side-by-side comparison, post it to r/geography with the caption "TIL why Köppen's Mediterranean threshold exists," and go to bed feeling like a climate insider instead of someone memorizing letters.

**Journey reveals requirements for:**
- Clickable legend with rule explanations
- Climate profiles showing exact thresholds
- Classification builder with live map updates
- Comparison mode (custom vs Köppen)
- Export to shareable image
- URL sharing capability

---

### Journey 2: Jordan - The Assignment Saver

Jordan is a sophomore taking an intro geography course. Their assignment is due tomorrow: "Explain one Köppen climate type, where it occurs, and what causes it." Wikipedia's Köppen page is overwhelming. They search "BSk climate explained simple" and find a Reddit comment linking to Koppen with: "just click on BSk in the legend - way easier than Wikipedia."

Jordan opens Koppen and clicks the legend entry for BSk (Cold Semi-Arid). A clean panel appears:

> **BSk - Cold Semi-Arid (Steppe)**
>
> **What it means:** Not enough rain for forests, too much for deserts. Grasslands and shrubs dominate.
>
> **Rule:** Annual precipitation between 50% and 100% of the aridity threshold, with mean annual temperature below 18°C.
>
> **Where it appears:** Central Asia, American Great Plains, Patagonia

Jordan toggles to see only BSk zones on the map - perfect for their report. They take a screenshot, paste it into their doc, and write: "The BSk climate is defined by the Köppen system as having precipitation between 50% and 100% of the calculated aridity threshold..."

The assignment is done in 20 minutes. Jordan bookmarks the site for future geography homework. Maybe next time they'll actually explore the classification builder.

**Journey reveals requirements for:**
- Click-to-select climate type in legend
- Climate profile panel with plain-language explanation
- Rule definition in accessible format
- Filter/isolate single climate type on map
- Easy screenshot/export for reports
- Works without creating an account

---

### Journey 3: Sam - The Two-Minute Wanderer

Sam sees a friend's Instagram story showing a map with the caption "My city has the same climate as Buenos Aires??? Mind blown." There's a link in bio. Sam taps it, curious but skeptical - they have maybe 2 minutes before something else grabs their attention.

The page loads fast. Sam sees a colorful world map with a clean legend. Their home city, Atlanta, is somewhere on the East Coast. They click on it. A panel pops up:

> **Cfa - Humid Subtropical**
>
> Hot, humid summers and mild winters with year-round precipitation. Also found in: Buenos Aires, Sydney, Shanghai, São Paulo.

Sam didn't know Atlanta's climate was the same as Shanghai's. That's actually interesting. They click on Sydney on the map - same color, same Cfa. Huh. They click on the legend to see what other climate types exist. There are 30 of them. Who knew?

Sam spends 4 minutes clicking around, learning that Mediterranean climates (Csa/Csb) only exist in five places on Earth and that there's a climate type (ET - Tundra) where the *warmest* month is below 10°C. They screenshot the Mediterranean climate map to send to their friend who's obsessed with California, then close the tab.

Total time: 6 minutes. Sam doesn't become a climate expert, but they learned something and shared it with someone else. Mission accomplished.

**Journey reveals requirements for:**
- Fast initial load (under 3 seconds)
- Intuitive click-to-explore interface
- Quick info panel with "also found in" comparisons
- Legend as exploration gateway
- Easy screenshot capability
- No friction (no signup, no loading screens, no tutorials)

---

### Journey 4: The Receiver - Opening a Shared Classification

Taylor receives a Discord message from Alex: "I made a classification system that shows where climate is actually similar to Mediterranean - check this out" with a Koppen URL.

Taylor clicks the link. The page loads showing two tabs: "Custom Classification" and "Original Köppen." The custom tab shows Alex's modified system with Mediterranean zones split into subcategories. The comparison tab shows standard Köppen for reference. A small info bar says: "Created by an anonymous user - you can modify this or create your own."

Taylor switches between tabs, noticing how Alex's version highlights subtle climate differences that Köppen lumps together. The rule panel shows exactly what thresholds Alex changed. Taylor clicks "Create Your Own" and starts modifying Alex's ruleset, curious if they can improve on it.

An hour later, Taylor has their own variant and shares it back to the Discord with "I think this works better for wine-growing regions..."

**Journey reveals requirements for:**
- URL-encoded classification rules that persist
- Comparison view (custom vs Köppen) on shared URLs
- Clear attribution that it's a custom ruleset
- "Create Your Own" fork capability
- Rule transparency on shared maps
- Import/modification of existing rulesets

---

### Journey Requirements Summary

| Capability Area | Supporting Journeys |
|-----------------|---------------------|
| **Interactive Map** | All journeys - core exploration |
| **Climate Profiles** | Alex, Jordan, Sam - understanding what classifications mean |
| **Rule Transparency** | Alex, Taylor - seeing exact thresholds |
| **Classification Builder** | Alex, Taylor - creating custom systems |
| **Live Map Updates** | Alex - real-time feedback on changes |
| **Comparison Mode** | Alex, Taylor - custom vs Köppen |
| **Export/Screenshot** | Alex, Jordan, Sam - taking content elsewhere |
| **URL Sharing** | Alex, Taylor - sharing custom work |
| **Filter by Climate Type** | Jordan - isolating specific zones |
| **Fast Loading** | Sam - preventing bounce |
| **No-Friction Exploration** | Sam - immediate engagement |
| **Ruleset Import/Fork** | Taylor - building on others' work |

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Pedagogical Innovation: Learning Through Creation**

Koppen challenges the dominant paradigm of climate education: passive consumption of maps and text. Instead of explaining classification rules, users discover them by experimenting with threshold adjustments and observing consequences.

This approach has precedent in other domains (sandbox games, physics simulators) but is novel for climate science education. The insight: *understanding emerges from building, not reading*.

**2. Technical Innovation: URL-as-Save-File**

Custom classification rulesets are encoded directly in shareable URLs using base64-encoded JSON. This eliminates:
- User accounts and authentication
- Server-side database storage
- Session management
- Privacy concerns around user data

The URL becomes the save file. Every share is a complete, self-contained state. This pattern enables zero-friction sharing without backend infrastructure.

**3. UX Innovation: Classification Sandbox**

Existing climate visualization tools are view-only. Koppen introduces a creation layer where users:
- Start from the Köppen preset or scratch
- Adjust thresholds with live map feedback
- Compare their system against the original
- Export and share their custom classifications

This transforms users from passive consumers to active creators, driving engagement and organic sharing.

**4. Transparency Innovation: Visible Design Decisions**

Most climate maps present classifications as facts. Koppen reveals them as *design decisions* with intentional trade-offs:
- Every threshold has a reason
- Every rule can be inspected
- Every classification is explainable

This demystifies climate science and builds genuine understanding.

### Market Context & Competitive Landscape

| Existing Solution | What It Does | What It Lacks |
|-------------------|--------------|---------------|
| **Wikipedia Köppen map** | Static reference | No interactivity, no rule explanation |
| **Vienna University Köppen Maps** | High-res academic maps | View-only, no creation |
| **Climate comparison sites** | "Match my city" tools | No classification understanding |
| **Weather apps** | Current conditions | No climate classification context |

**Gap:** No tool combines interactive exploration + rule transparency + custom creation + easy sharing.

### Validation Approach

| Innovation | Validation Method |
|------------|-------------------|
| **Learning through creation** | Track classification builder usage; survey users on "aha moments" |
| **URL-as-save-file** | Monitor share URL generation rate; test URL decode reliability |
| **Classification sandbox** | Track time in builder; compare retention vs explore-only users |
| **Rule transparency** | A/B test: profiles with vs without rule explanations |

**Primary validation metric:** Share/export rate. If users create and share, the innovation is working.

### Risk Mitigation

| Innovation Risk | Mitigation Strategy |
|-----------------|---------------------|
| **Users don't engage with creation** | Default to explore mode; progressive disclosure of builder |
| **URL encoding becomes unwieldy** | Limit ruleset complexity; compress aggressively |
| **Rule explanations overwhelm casual users** | Progressive disclosure: simple first, details on demand |
| **Sandbox is too complex** | Start with "tweak Köppen" not "build from scratch" |

**Fallback position:** Even if classification builder sees low adoption, the core interactive map with rule transparency still delivers value. The sandbox is additive, not essential.

## Web Application Technical Requirements

### Project-Type Overview

Koppen is a single-page application (SPA) that renders climate classification data interactively in the browser. The application prioritizes:
- **Client-side computation** for real-time classification updates
- **Static hosting compatibility** for minimal operational costs
- **Fast initial load** to prevent casual user bounce
- **No backend required** for MVP (data served as static assets)

### Browser Support Matrix

| Browser | Minimum Version | Priority | Notes |
|---------|-----------------|----------|-------|
| **Chrome** | 90+ | High | Primary development target |
| **Firefox** | 88+ | High | Full feature parity |
| **Safari** | 14+ | High | iOS/macOS users |
| **Edge** | 90+ | Medium | Chromium-based |
| **Mobile Chrome** | 90+ | High | Mobile sharing critical |
| **Mobile Safari** | 14+ | High | iOS sharing critical |

**Not Supported:** Internet Explorer (EOL), pre-Chromium Edge

**Feature Requirements:**
- ES6+ JavaScript (no transpilation to ES5)
- CSS Grid and Flexbox
- Canvas or WebGL for map rendering
- URL API for ruleset encoding/decoding

### Responsive Design Requirements

| Breakpoint | Target Devices | Layout Approach |
|------------|----------------|-----------------|
| **Desktop** (1024px+) | Primary experience | Full map + side panel for profiles/builder |
| **Tablet** (768-1023px) | Secondary | Map with collapsible panel |
| **Mobile** (< 768px) | Tertiary | Map-first, bottom sheet for profiles |

**Mobile Considerations:**
- Touch-friendly legend and climate selection
- Pinch-to-zoom on map
- Swipe gestures for panel navigation
- Export works on mobile (share to apps)

**MVP Focus:** Desktop-first with responsive fallback. Mobile experience should work but isn't optimized for first release.

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Initial Load (LCP)** | < 3 seconds | First meaningful paint with map visible |
| **Time to Interactive** | < 4 seconds | User can click map/legend |
| **Classification Update** | < 100ms | Slider adjustment → map re-render |
| **Export Generation** | < 2 seconds | PNG generation complete |

**Performance Strategy:**
- Pre-computed climate classifications as static GeoJSON
- Lazy-load classification builder (not needed on first view)
- Compressed tile layers for base map
- Client-side classification only for custom systems

### SEO Strategy

**SEO Priority: Low**

Users discover Koppen through:
1. Social media shares (Reddit, Discord, Twitter)
2. Direct links from other users
3. Organic search for specific queries

**Minimal SEO Requirements:**
- Semantic HTML with proper headings
- Meta description for social sharing
- Open Graph tags for link previews (map thumbnail)
- Title tag: "Koppen - Interactive Climate Classification Explorer"

**Not Needed for MVP:**
- Server-side rendering for SEO
- Dynamic meta tags per view
- Sitemap or structured data

### Accessibility Requirements

**Accessibility Level: WCAG 2.1 AA (Partial)**

| Requirement | Implementation | Priority |
|-------------|----------------|----------|
| **Keyboard navigation** | Tab through legend, Enter to select | High |
| **Color contrast** | Climate colors meet 4.5:1 for labels | High |
| **Screen reader** | ARIA labels for map regions | Medium |
| **Focus indicators** | Visible focus states on all controls | High |
| **Alt text** | Descriptions for exported images | Medium |

**MVP Scope:** Focus on keyboard navigation and color contrast. Full screen reader support can come in Phase 2.

### Technical Architecture

**Frontend Stack:**
- Vanilla JavaScript (no framework for MVP simplicity)
- Leaflet.js for interactive mapping
- GeoJSON for climate zone data
- CSS for styling (no preprocessor for MVP)

**Data Architecture:**
- Static GeoJSON file with pre-computed Köppen classifications
- Climate data at 0.25° resolution (~1.6M grid cells)
- Each cell includes: lat, lon, climate type, monthly T/P values
- Compressed to minimize load time (~5-10MB estimated)

**Hosting:**
- Static hosting (Vercel, Netlify, or GitHub Pages)
- CDN for GeoJSON and tile assets
- No backend server for MVP

### Implementation Considerations

**Build Process:**
- Simple bundler (Vite or esbuild) for production
- No complex build pipeline for MVP
- Single HTML file with embedded or linked JS/CSS

**Testing:**
- Manual browser testing across matrix
- Basic unit tests for classification logic
- Visual regression testing for map rendering (optional)

**Deployment:**
- Git-based deployment to static host
- Preview deployments for PRs
- Simple DNS setup (koppen.app or similar)

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Experience MVP - Deliver the complete "explore → create → share" experience with minimal overhead

**Strategic Rationale:**
- Core value is the interactive sandbox, not feature depth
- Early users are enthusiasts who tolerate rough edges
- Viral growth depends on shareable outputs, not feature completeness
- Donation model means no revenue pressure to over-build

**Resource Requirements:**
- Solo developer (user) with AI assistance
- Static hosting (~$0/month on free tier)
- Ko-fi for donations (0% platform fee)

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**

| Journey | MVP Support Level |
|---------|-------------------|
| Alex (Enthusiast) | Full - explore, create, compare, export, share |
| Jordan (Student) | Full - explore, filter, export |
| Sam (Explorer) | Full - explore, click, learn |
| Taylor (Receiver) | Full - open shared URL, compare, fork |

**Must-Have Capabilities:**

1. **Interactive Map**
   - Zoom, scroll, click on any location
   - Display all 30 Köppen climate types
   - Fast loading (< 3 seconds)

2. **Climate Legend & Profiles**
   - Clickable legend with all climate types
   - Profile panel: short description + classification rules
   - "Also found in" location comparisons

3. **Classification Builder**
   - "Create" button reveals builder interface
   - Start from Köppen preset or scratch
   - Threshold sliders with live map updates
   - Compare tab (custom vs original Köppen)

4. **Export & Share**
   - PNG export with watermark
   - Filter by climate type before export
   - Shareable URL encoding classification rules
   - JSON import/export for ruleset backup

5. **Monetization**
   - Ko-fi donation button in header

**Explicitly Deferred (NOT MVP):**
- "Find my climate" geolocation
- Rich profiles (agriculture, biomes, detailed examples)
- Data overlay layers (temperature, precipitation)
- Challenge mode / scoring
- Time machine / historical climates
- Worldbuilding / planetary modeling

### Post-MVP Features

**Phase 2 - Depth (Post-Launch Learning):**
- "Find my climate" geolocation hook
- Rich climate profiles with real-world context
- Data overlay layers (temperature, precipitation, climate drivers)
- "Surprise me" random discovery feature
- Improved mobile experience

**Phase 3 - Gamification:**
- Challenge mode (match biome maps with classification system)
- Scoring for accuracy + elegance
- Community gallery of shared classifications
- Leaderboards

**Phase 4 - Premium (If Demand Exists):**
- Time machine (paleoclimate, future projections)
- Worldbuilding / planetary modeling
- Advanced export options (vector formats, custom resolutions)
- Potential subscription tier for power users

### Risk Mitigation Strategy

**Technical Risks:**

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| GeoJSON too large for fast load | Medium | High | Compress aggressively; use TopoJSON; lazy-load detail levels |
| Classification calc too slow | Low | Medium | Pre-compute Köppen; only calculate custom on-demand |
| URL encoding breaks with complex rules | Low | Medium | Limit rule complexity; use compression |

**Market Risks:**

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Users don't engage with builder | Medium | Medium | Default to explore mode; builder is additive |
| No organic sharing happens | Medium | High | Focus on export quality; add watermark with URL |
| Reddit posts get ignored | Medium | Medium | Time posts well; engage authentically in comments |

**Resource Risks:**

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Lose motivation mid-project | Medium | High | Ship MVP fast; iterate based on feedback |
| Scope creep | Medium | Medium | Document boundaries clearly; resist "one more feature" |
| Hosting costs grow | Low | Low | Static hosting is essentially free at expected scale |

### MVP Definition of Done

The MVP is complete when:
- [ ] Map loads with all 30 Köppen climate types displayed
- [ ] Clicking any climate type shows profile with rules
- [ ] Classification builder allows threshold adjustments with live updates
- [ ] Compare mode shows custom vs original Köppen
- [ ] PNG export works with watermark
- [ ] URL sharing encodes and decodes rulesets correctly
- [ ] Ko-fi button is visible and functional
- [ ] Works on Chrome, Firefox, Safari (desktop + mobile)
- [ ] Initial load < 3 seconds on typical connection

## Functional Requirements

### Map Exploration

- **FR1:** Users can view an interactive 2D map displaying Köppen-Geiger climate classifications globally
- **FR2:** Users can zoom in and out of the map to explore different scales
- **FR3:** Users can pan/scroll the map to navigate to different regions
- **FR4:** Users can click on any location on the map to view its climate classification
- **FR5:** Users can identify climate types by color-coded regions on the map

### Climate Legend & Selection

- **FR6:** Users can view a legend showing all 30 Köppen climate types with their codes and names
- **FR7:** Users can click on any climate type in the legend to select it
- **FR8:** Users can filter the map to display only a single selected climate type
- **FR9:** Users can see which climate type is currently selected/highlighted

### Climate Profiles

- **FR10:** Users can view a profile panel for any selected climate type
- **FR11:** Users can read a short description of what the climate type means
- **FR12:** Users can view the exact classification rules/thresholds that define the climate type
- **FR13:** Users can see example locations that share the same climate classification
- **FR14:** Users can expand terminology within profiles to learn how classification terms are defined

### Classification Builder

- **FR15:** Users can access a classification builder interface via a "Create" button
- **FR16:** Users can start building from the standard Köppen preset
- **FR17:** Users can start building from scratch with blank rules
- **FR18:** Users can adjust temperature thresholds using sliders or input fields
- **FR19:** Users can adjust precipitation thresholds using sliders or input fields
- **FR20:** Users can see the map update in real-time as they adjust thresholds
- **FR21:** Users can name their custom classification system

### Comparison Mode

- **FR22:** Users can switch between viewing their custom classification and the original Köppen system
- **FR23:** Users can view custom and Köppen classifications in a tabbed interface
- **FR24:** Users can see which regions changed classification between systems
- **FR25:** Users can view the specific threshold differences between systems

### Export & Sharing

- **FR26:** Users can export the current map view as a PNG image
- **FR27:** Users can export a filtered map showing only selected climate types
- **FR28:** Exported images include a watermark with the Koppen tool attribution
- **FR29:** Users can generate a shareable URL that encodes their custom classification rules
- **FR30:** Users can open a shared URL to view someone else's custom classification
- **FR31:** Users can export their classification ruleset as a JSON file
- **FR32:** Users can import a JSON ruleset file to load a previous classification

### URL State Management

- **FR33:** The application state (current view, selected classification) is reflected in the URL
- **FR34:** Users can bookmark or share URLs that restore the exact application state
- **FR35:** Shared URLs open in comparison mode showing custom vs Köppen

### Forking & Iteration

- **FR36:** Users viewing a shared classification can create their own modified version
- **FR37:** Users can iterate on imported rulesets without affecting the original

### Monetization & Attribution

- **FR38:** Users can access a donation link (Ko-fi) from the header
- **FR39:** Users can view information about the open-source project

### Accessibility & Usability

- **FR40:** Users can navigate the legend and controls using keyboard only
- **FR41:** Users can identify climate types through accessible color contrast
- **FR42:** Screen reader users can access climate type information via ARIA labels

## Non-Functional Requirements

### Performance

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **NFR1: Initial Page Load** | < 3 seconds on 4G connection | Prevent casual user bounce |
| **NFR2: Time to Interactive** | < 4 seconds | User can explore immediately |
| **NFR3: Map Pan/Zoom Response** | < 50ms | Smooth, native-feeling interaction |
| **NFR4: Classification Update** | < 100ms after slider change | Real-time feedback is core to sandbox experience |
| **NFR5: Climate Profile Load** | < 200ms after click | Immediate response to exploration |
| **NFR6: PNG Export Generation** | < 2 seconds | Reasonable wait for file generation |
| **NFR7: URL Decode/Restore** | < 500ms | Shared links feel instant |

**Performance Budget:**
- Total JavaScript: < 200KB gzipped
- GeoJSON climate data: < 5MB gzipped (lazy-loadable)
- Initial HTML/CSS: < 50KB

### Accessibility

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **NFR8: WCAG Compliance** | Level AA (partial) | Educational tool should be broadly accessible |
| **NFR9: Keyboard Navigation** | All interactive elements reachable | Core functionality without mouse |
| **NFR10: Color Contrast** | 4.5:1 minimum for text | Climate type labels must be readable |
| **NFR11: Focus Indicators** | Visible on all focusable elements | Keyboard users can track position |
| **NFR12: Screen Reader Support** | Basic ARIA labels on map regions | Climate info available to screen readers |

**Accessibility Scope for MVP:**
- Full keyboard navigation
- Color contrast compliance
- Basic screen reader support
- Full screen reader optimization deferred to Phase 2

### Browser Compatibility

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **NFR13: Modern Browser Support** | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ | Cover 95%+ of target users |
| **NFR14: Mobile Browser Support** | Mobile Chrome/Safari on iOS 14+, Android 10+ | Enable mobile sharing |
| **NFR15: No Plugins Required** | Pure web technologies only | Zero friction |
| **NFR16: Graceful Degradation** | Core map viewing works without JS optimization | Basic fallback |

### Data Accuracy

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **NFR17: Classification Accuracy** | Match Beck et al. (2018) reference implementation | Scientific credibility |
| **NFR18: Spatial Resolution** | 0.25° grid (~28km at equator) | Sufficient detail for regional exploration |
| **NFR19: Climate Normal Period** | 1991-2020 (WMO standard) | Current, authoritative data |

### Privacy & Security

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **NFR20: No Personal Data Collection** | Zero PII stored or transmitted | Privacy-first design |
| **NFR21: Analytics** | Aggregate only (Plausible/Umami) | Privacy-respecting tracking |
| **NFR22: HTTPS Only** | All connections encrypted | Basic security hygiene |
| **NFR23: No Cookies Required** | Core functionality without cookies | GDPR simplicity |

### Maintainability

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **NFR24: Static Hosting Compatible** | Deploy to Vercel/Netlify/GitHub Pages | Low operational burden |
| **NFR25: No Backend Required** | All functionality client-side for MVP | Solo maintainability |
| **NFR26: Open Source License** | MIT or Apache 2.0 | Community contribution enabled |
