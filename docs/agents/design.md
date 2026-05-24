# Solnix FinOps AI — Design System & Redesign Document

**Version:** 1.1
**Author:** Intern Design Brief
**Status:** Phases 0–5 shipped (see "Implementation status" below)
**Target:** Production-grade dashboard for Bank/NBFC executive demo

---

## Implementation status (2026-05-24)

All six phases (0 through 5) defined in this document have been implemented. The redesign also expanded beyond the original scope:

| Phase    | Status     | Notes                                                                                              |
| -------- | ---------- | -------------------------------------------------------------------------------------------------- |
| Phase 0  | ✅ Shipped  | "Mock"/"Fallback" labels removed, table padded to 30 rows, processing time visible, denied summaries added, loan amount column. |
| Phase 1  | ✅ Shipped  | DM Sans / Instrument Serif / DM Mono fully applied. Type scale + tracking utilities in [`src/index.css`](../../src/index.css). |
| Phase 2  | ✅ Shipped  | Warm canvas palette + bordered semantic badges + OneMoney AA teal token (`#0F766E`).               |
| Phase 3  | ✅ Shipped  | 52 px navbar (replaced with sidebar — see below), 88 px stat cards, 44 px table rows, 480 px slide-in panel, JSON editor replaced with structured form. |
| Phase 4  | ✅ Shipped  | 6-step pipeline animation (Identity → AA Consent → AA Fetch → AI Analysis → Report → Decision) with per-step elapsed timing and a running total counter. |
| Phase 5  | ✅ Shipped  | Slide-in transitions, CIBIL 5-bar indicator, affordability score left-border, audit log, applicant subtitles, HITL confidence gauge with threshold marker. |

### Beyond the original brief

The redesign also added the following surfaces that were not in the original phase list:

- **Sidebar navigation** — top tabs replaced with a grouped left sidebar to accommodate 10 views.
- **Cmd+K command palette** with natural-language applicant filter (status, category, recency, numeric predicates, servicing flags, ID/name match) and view-jump shortcuts.
- **Disbursement Queue** — 5-stage release pipeline (E-Mandate → Penny-Drop → Contract Sign → Ready-to-Release → Disbursed).
- **Servicing Portfolio** — active-loan dashboard with EMI calendar and health stacked bar.
- **Predictive Nudge Queue** — auto-derived alerts when balance < EMI within 3 days of due; WhatsApp / SMS / Email send actions with template previews.
- **HITL upgrades** — reviewer assignment, live SLA timer, mandatory override-comment modal, policy playback, anomaly explainer popovers on every red flag.
- **Policy editor** with live playback that re-runs the entire applicant list under a draft policy and shows outcome shifts.
- **Portfolio Analytics** — hand-rolled SVG donut + histograms (CIBIL / DTI) + category and employer breakdowns + borrower segmentation (Prime / Near-prime / Sub-prime / Thin file / High variance / Distressed).
- **Compliance** — global audit log with category filters and CSV export, plus a DPDP-style consent revocation flow.
- **Borrower Portal** — preview of the customer-facing experience with application timeline, EMI schedule, and self-service top-up offer.
- **Counterfactual slider** on the applicant detail panel — adjust income / EMI / CIBIL deltas and see the projected DTI, score, and decision recompute live.
- **Document upload** in the pipeline — drag a PDF/image and the form pre-fills (Gemini Vision in production; deterministic mock when no API key is configured).

The full project-wide quick-start lives in [`README.md`](../../README.md). What follows below is the original design brief, preserved unchanged.

---

---

## 0. Design Philosophy

The current prototype looks like what it is: a first-pass AI-generated dashboard.
The goal of this document is to transform it into something that looks like it was built by a senior product team at a Series B fintech — not assembled in an afternoon.

**The north star:** When an executive opens this dashboard, they should feel the same confidence they feel opening Bloomberg Terminal or Salesforce — *"this is serious software."*

**Aesthetic direction:** Refined editorial. Think Financial Times meets Linear.app.  
- Warm off-white backgrounds (not cold grey)  
- Ink-dark typography with real typographic hierarchy  
- One sharp accent color (deep indigo-blue) used sparingly  
- Monospaced elements only for data/IDs — everything else in a premium serif or sharp sans  
- Micro-interactions that feel mechanical, not bouncy  
- Zero gradients on backgrounds. Zero rounded pill buttons on primary actions.

---

## 1. What's Wrong Right Now — Honest Audit

### 1.1 Typography (Critical)

| Element | Current State | Problem |
|---|---|---|
| Font family | System default / generic sans | No personality. Could be any SaaS app. |
| Heading weight | Medium everywhere | No hierarchy. Everything competes. |
| Data numbers | Same font as labels | Numbers should feel different — heavier, tabular |
| App name "Solnix FinOps AI" | Regular weight | Should command attention |
| Status labels | Mixed case styles | Inconsistent — some caps, some title case |
| Body text | 14px uniform | Too uniform — no rhythm |

**Root cause:** No typography system was defined before building. The AI just used defaults.

---

### 1.2 Color (Critical)

| Problem | Detail |
|---|---|
| Background is cold gray (#F3F4F6 equivalent) | Feels sterile. Premium apps use warm off-whites. |
| Status green is a flat CSS green | No depth. Looks like a traffic light. |
| Stat cards are pure white with gray border | Zero visual weight. Nothing draws the eye. |
| Blue accent is a generic indigo | Used in 10,000 SaaS apps. |
| Dark mode inconsistency | Screens 1–5 light, 6–8 dark. Pick one. |
| "AI Offline Mock" orange dot | Screams "this is fake." Must die. |

---

### 1.3 Layout & Spacing (High)

| Problem | Detail |
|---|---|
| Four stat cards are equal-width boxes | No visual hierarchy. The most important number (HITL Exceptions) looks the same as the least important. |
| Table rows have too much row height | Wastes vertical space. Can't see enough rows at once. |
| Sidebar on HITL screen has no visual separation from content | Feels like two divs placed next to each other, not a designed layout. |
| Pipeline screen is a two-column form | Looks like a settings page, not an agentic pipeline. |
| Nav items have no active indicator weight | Active tab looks almost the same as inactive. |
| No consistent spacing scale | Elements are placed at arbitrary pixel values. |

---

### 1.4 Credibility-Killing Details (Critical — Fix Before Demo)

These will be noticed immediately by executives and kill trust:

1. **"AI Offline Mock"** — visible on every screen in the navbar. This tells the audience the AI isn't real.
2. **"Simulating AI (Offline Local Fallback)"** — on the pipeline screen. Same problem.
3. **Only 4 rows in the operations table** — looks like test data, not a real loan book.
4. **No processing time shown** — the core value prop ("72hrs → 4 mins") is never shown on screen.
5. **No OneMoney / AA verification badge** — the data authenticity story is never told visually.
6. **Raw JSON editor visible** — appropriate for developers, alarming for executives.
7. **Dark/light mode mix** — inconsistent across screens suggests the product is unfinished.
8. **Denied case has no AI summary** — the approved case has a full AI summary. The denied case just shows raw transactions and red banners. Asymmetric and incomplete.

---

### 1.5 Missing Moments (High)

These are things that should exist but don't:

- No processing animation when the pipeline runs (the most dramatic moment of the demo)
- No "Processed in 3m 42s" timing shown after analysis
- No Approve/Disburse CTA on the approved applicant view
- No running balance or AA verification badge on transaction list
- No agent confidence visual (gauge/bar) on the flagged applicant view
- No audit log trail on any screen
- No empty state for the flagged queue when no exceptions exist

---

## 2. Design System — Define Once, Use Everywhere

### 2.1 Font Stack

```css
/* Display / Brand — headings, app name, large numbers */
font-family: 'Instrument Serif', 'Playfair Display', Georgia, serif;

/* Interface — nav, labels, body, buttons */
font-family: 'DM Sans', 'Geist', 'Plus Jakarta Sans', sans-serif;

/* Data — IDs, scores, amounts, timestamps */
font-family: 'DM Mono', 'Geist Mono', 'IBM Plex Mono', monospace;
```

**Rationale:**
- Instrument Serif brings editorial gravitas to large numbers and headings
- DM Sans is clean, readable, and less ubiquitous than Inter
- DM Mono gives financial data the tabular precision it deserves

**Type Scale:**
```
--text-xs:   11px / 1.4  — timestamps, badges, meta
--text-sm:   13px / 1.5  — table cells, secondary labels
--text-base: 15px / 1.6  — body, nav items
--text-lg:   18px / 1.4  — section headings
--text-xl:   24px / 1.2  — page titles
--text-2xl:  32px / 1.1  — stat card numbers (Instrument Serif)
--text-3xl:  48px / 1.0  — hero numbers (approved count, etc.)
```

**Letter spacing:**
```
Uppercase labels:  0.08em
Nav items:         0.01em
Stat numbers:     -0.02em  (tighten large numbers)
Body text:         0em
```

---

### 2.2 Color Palette

**Philosophy:** One warm neutral base. One sharp ink. One accent. Semantic colors for status only.

```css
/* Base */
--color-canvas:     #FAFAF8;   /* warm off-white — page background */
--color-surface:    #FFFFFF;   /* cards, panels */
--color-surface-2:  #F5F4F0;   /* table stripes, input backgrounds */
--color-border:     #E8E6DF;   /* all borders */
--color-border-2:   #D4D1C8;   /* stronger borders, dividers */

/* Ink (typography) */
--color-ink-1:      #1A1916;   /* primary text — near-black warm */
--color-ink-2:      #4A4843;   /* secondary text */
--color-ink-3:      #8A8780;   /* tertiary, placeholders */
--color-ink-4:      #B8B5AC;   /* disabled, timestamps */

/* Accent — use sparingly */
--color-accent:     #1B3A6B;   /* deep navy — primary actions, links */
--color-accent-2:   #2D5299;   /* hover state */
--color-accent-bg:  #EBF0FA;   /* accent background tint */

/* Semantic */
--color-success:    #166534;   /* approved text */
--color-success-bg: #F0FDF4;   /* approved background */
--color-success-bd: #BBF7D0;   /* approved border */

--color-warning:    #92400E;   /* flagged text */
--color-warning-bg: #FFFBEB;   /* flagged background */
--color-warning-bd: #FDE68A;   /* flagged border */

--color-danger:     #991B1B;   /* denied text */
--color-danger-bg:  #FFF5F5;   /* denied background */
--color-danger-bd:  #FECACA;   /* denied border */

--color-neutral:    #374151;   /* neutral badges */
--color-neutral-bg: #F9FAFB;

/* Data — affordability scores */
--score-high:       #166534;   /* 80-100 */
--score-mid:        #92400E;   /* 50-79 */
--score-low:        #991B1B;   /* 0-49 */
```

---

### 2.3 Spacing Scale

```css
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-5:   20px
--space-6:   24px
--space-8:   32px
--space-10:  40px
--space-12:  48px
--space-16:  64px
```

All padding, margin, and gap values must come from this scale.  
Never use arbitrary values like `padding: 14px` or `margin: 22px`.

---

### 2.4 Border Radius

```css
--radius-sm:   4px   /* tags, badges, inputs */
--radius-md:   6px   /* buttons, small cards */
--radius-lg:   10px  /* panels, modals */
--radius-xl:   14px  /* stat cards */
```

**Rule:** No `border-radius: 9999px` pill shapes on buttons.  
Primary action buttons are `--radius-md`. Only tags/badges are pills.

---

### 2.5 Shadow System

```css
--shadow-sm:  0 1px 2px rgba(26,25,22,0.06);
--shadow-md:  0 4px 12px rgba(26,25,22,0.08), 0 1px 3px rgba(26,25,22,0.04);
--shadow-lg:  0 12px 32px rgba(26,25,22,0.10), 0 2px 6px rgba(26,25,22,0.04);
--shadow-xl:  0 24px 48px rgba(26,25,22,0.12), 0 4px 12px rgba(26,25,22,0.06);
```

Warm-tinted shadows only. No blue or purple-tinted shadows.

---

### 2.6 Component Library (Defined)

#### Buttons

```
Primary:    bg accent, white text, radius-md, 36px height, 14px DM Sans medium
Secondary:  bg surface-2, ink-1 text, border border-2, same sizing
Danger:     bg danger-bg, danger text, border danger-bd
Ghost:      no background, no border, ink-2 text, hover ink-1

Never use: rounded pill primary buttons, gradient buttons, shadow buttons
```

#### Status Badges

```
Auto-Approved:   bg success-bg, text success, border success-bd, radius-sm, 11px caps DM Mono
HITL Flagged:    bg warning-bg, text warning, border warning-bd
Denied:          bg danger-bg, text danger, border danger-bd
Processing:      bg accent-bg, text accent, animated dot
```

#### Stat Cards

```
Height: 88px
Padding: space-6
Border: 1px border
Shadow: shadow-sm
Background: surface

Layout: label (top, ink-3, text-xs, uppercase, 0.08em tracking)
        number (middle, ink-1, text-2xl/3xl, Instrument Serif, tabular-nums)
        indicator (bottom right, colored, text-xs)

No colored backgrounds on stat cards. All white with one colored indicator.
```

#### Table

```
Header: surface-2 background, ink-3 text, text-xs uppercase, 0.08em tracking
Rows: 44px height, border-bottom border, hover surface-2 transition 100ms
ID column: DM Mono text-sm accent color
Number columns (CIBIL, Score): DM Mono text-sm, tabular-nums, right-aligned
Text columns: DM Sans text-sm ink-1
Status column: badge component
Action column: ghost button "View report"

Stripe: every even row gets surface-2 at 60% opacity
```

#### Sidebar Panel (Applicant Detail)

```
Width: 480px (fixed)
Slides in from right: transform translateX(100%) → translateX(0), 200ms ease-out
Background: surface
Shadow: shadow-xl on left edge
Header: sticky, height 64px, border-bottom, app-id in DM Mono accent, name in text-xl ink-1
```

---

## 3. Screen-by-Screen Redesign Plan

### Screen A — Navigation Bar

**Current:** Generic nav with logo, 3 text tabs, and the credibility-killing "AI Offline Mock" orange dot.

**New design:**
```
Height: 52px (not 64px — tighter, more professional)
Background: surface (#FFFFFF) with border-bottom
Left: Logo mark (SF square, 28px) + "Solnix" in DM Sans 500 + "FinOps" in Instrument Serif italic + [FIU TSP] badge in DM Mono text-xs
Center: Three tabs — Operations Console | Underwriting Pipeline | HITL Exception Queue
        Active tab: ink-1, border-bottom 2px accent, font-weight 500
        Inactive: ink-3, no border, font-weight 400
Right: Remove "AI Offline Mock" entirely. Replace with:
        [● Sandbox] — small neutral badge, ink-3
        [◐] dark mode toggle (optional)
```

---

### Screen B — Operations Console (Main Dashboard)

**Current:** 4 stat cards + table with 4 rows. Feels empty.

**New stat cards:**

Replace equal-width stat cards with a **weighted layout**:
```
[  Total Applications  ] [  Approved Portfolio  ] [  HITL Exceptions ⚠  ] [  Rejected  ]
[        wide          ] [        wide          ] [     HIGHLIGHTED     ] [   normal   ]
```

HITL Exceptions card gets a subtle `warning-bg` tint and a "Review →" action built in.
Approved Portfolio card shows a small sparkline trend (mock, static SVG).

**New table:**
- Pad to 10 rows of realistic mock data
- Add **Loan Amount (₹)** column between Category and CIBIL
- Add **Processing Time** column (shows "3m 42s", "4m 11s" etc.) — this is the value prop on screen
- Tighten row height from ~56px to 44px
- Use DM Mono for ID, CIBIL, Affordability Score, Amount, Processing Time
- Right-align all numeric columns
- Remove "View Report" button — make the entire row clickable with a chevron icon at the right

---

### Screen C — Applicant Detail Panel (Approved — Rahul Sharma)

**Current:** Scrollable modal-like panel. Good content, poor structure.

**New layout:**
```
Header (sticky):
  [APP-001 in DM Mono accent]
  [Rahul Sharma in text-xl]
  [Auto-Approved badge] [Processed in 3m 42s — small, ink-3]
  [× close]

Section 1 — Score triptych (3 columns):
  CIBIL / Declared Income / Affordability Score
  Numbers in Instrument Serif text-2xl
  Labels in text-xs uppercase ink-3

Section 2 — AI Credit Underwriting Summary:
  Subtle left border in accent color (4px)
  Key Findings in text-sm ink-1
  Decision Rationale in text-sm ink-2
  Each finding as a clean prose paragraph, not a bulleted list

Section 3 — Verified Transactions:
  "Verified via OneMoney AA" badge at section header (teal, small)
  Transactions in a compact table — DM Mono amounts, right-aligned
  Credits in success color, debits in ink-2
  Red highlight on any suspicious transactions

Section 4 — Loan Parameters:
  2-column grid: Amount | Tenure | Monthly Obligation | DTI
  All numbers in DM Mono

Footer (sticky):
  [Reject Application — ghost danger] [Request Docs — secondary] [Initiate Disbursement — primary]
```

---

### Screen D — HITL Exception Queue

**Current:** Best screen. Needs minor polish.

**Changes:**
```
Left sidebar: Add timestamp "Flagged at 10:32 AM" and "Assigned to: Credit Review Team"
              Add a confidence gauge bar (67% shown as a progress bar with 80% threshold marker)
Main panel:  Add "Agent Confidence" as a visual metric at top — not buried in text
             Add "Audit Trail" collapsible section at bottom
             Three buttons: Reject | Request Docs | Approve Override — already good
```

---

### Screen E — Underwriting Pipeline (Most Needs Work)

**Current:** Two-column form with JSON editor. Looks like a developer tools page.

**New design — completely replace with:**

```
Left: Applicant Presets (keep — it's good)
      Remove "Simulating AI (Offline Local Fallback)" label

Right: Replace JSON editor entirely with:
  
  CONFIGURE APPLICATION
  ┌─────────────────────────────────────────┐
  │  Applicant Name    │  CIBIL Score       │
  │  Avg Monthly Income│  Existing EMIs     │
  │  Requested Amount  │  Loan Tenure       │
  │  Borrowing Category (dropdown)          │
  └─────────────────────────────────────────┘
  
  Below form:
  DATA SOURCE
  ● OneMoney Account Aggregator (live consent simulation)
  Bank Statement: HDFC Bank xxxx4521 (mock)
  Consent validity: 24 hours from initiation
  
  [Initiate Autonomous Underwriting — full width primary button]

When button is clicked → replace right panel with:

  PIPELINE PROCESSING
  ┌────────────────────────────────────────┐
  │ ✓ Identity verification        0.8s   │
  │ ✓ AA consent initiated         1.2s   │
  │ ✓ Bank data fetched            2.1s   │
  │ ⟳ AI credit analysis...              │  ← animated spinner
  │ ○ Generating underwriting report      │
  │ ○ Final decision                      │
  └────────────────────────────────────────┘
  
  Elapsed: 00:03 ←→ counting up
```

This replaces the JSON with something an executive will understand and be impressed by.

---

## 4. Redesign Phases — Follow In Order

---

### Phase 0 — Credibility Fixes (Do This First — 1 Hour)
*These are blocking issues. Do not show the prototype to anyone until these are done.*

- [ ] Remove "AI Offline Mock" from navbar entirely
- [ ] Remove "Simulating AI (Offline Local Fallback)" from pipeline screen
- [ ] Add 6 more rows to operations table (total 10 rows)
- [ ] Fix dark/light mode — commit to light mode everywhere
- [ ] Add "Processed in Xm Ys" to approved applicant panel
- [ ] Add "Initiate Disbursement" CTA to approved panel footer
- [ ] Add AI Summary section to denied case (Amit Verma) — match approved case structure
- [ ] Add loan amount column to operations table

**Exit criteria:** A non-technical person could watch you demo this and not know it's a prototype.

---

### Phase 1 — Typography System (2–3 Hours)
*Install fonts, define CSS variables, apply consistently.*

- [ ] Install DM Sans, DM Mono, Instrument Serif from Google Fonts
- [ ] Define all CSS variables from section 2.1 and 2.2 in a single `:root {}` block
- [ ] Apply Instrument Serif to: stat card numbers, applicant name in detail panel, page section titles
- [ ] Apply DM Mono to: all IDs (APP-001), all amounts (₹), all scores, all timestamps, CIBIL scores
- [ ] Apply DM Sans to: nav, table body, labels, buttons, badges
- [ ] Set uppercase + letter-spacing on all column headers and section labels
- [ ] Tighten tracking on large numbers (`letter-spacing: -0.02em`)
- [ ] Audit every text element — nothing should be using the browser default font

**Exit criteria:** Screenshot the dashboard and it should look like a different (better) product than today.

---

### Phase 2 — Color & Surface System (2 Hours)
*Warm up the entire palette. Replace cold grays.*

- [ ] Change page background from #F3F4F6 (cold gray) to #FAFAF8 (warm canvas)
- [ ] Change all card borders to #E8E6DF (warm border)
- [ ] Change all secondary text to #4A4843 (warm ink-2)
- [ ] Change all placeholder/label text to #8A8780 (warm ink-3)
- [ ] Replace flat green status badges with bordered success badge system
- [ ] Replace flat orange HITL badge with bordered warning badge system
- [ ] Replace flat red denied badge with bordered danger badge system
- [ ] Replace generic blue accent (#6366F1 or similar) with deep navy (#1B3A6B)
- [ ] Apply warm-tinted shadows to all cards and panels
- [ ] Add surface-2 (#F5F4F0) striping to table rows (even rows)
- [ ] HITL stat card: add subtle warning-bg tint (#FFFBEB)
- [ ] Verified transactions: add OneMoney AA badge in teal

**Exit criteria:** The color palette should feel like a premium document editor, not a developer tool.

---

### Phase 3 — Layout & Spacing Discipline (2 Hours)
*Apply spacing scale. Fix every arbitrary pixel value.*

- [ ] Navbar: reduce height to 52px, tighten padding
- [ ] Stat cards: standardize to 88px height, space-6 padding, shadow-sm
- [ ] Table rows: reduce to 44px height, 12px vertical padding
- [ ] Table headers: surface-2 background, space-3 vertical padding, uppercase labels
- [ ] Operations table: right-align all numeric columns (CIBIL, Score, Amount, Processing Time)
- [ ] Make entire table row clickable, remove individual "View Report" button
- [ ] Applicant detail panel: fix width at 480px, slide-in from right with CSS transition
- [ ] HITL screen sidebar: add visible left border (4px accent) to separate from content
- [ ] Replace JSON editor with clean form + data source section (see Screen E plan)
- [ ] Add consistent section dividers (1px border) between all major sections in panels

**Exit criteria:** Every pixel should feel intentional. No element should look placed by accident.

---

### Phase 4 — Pipeline Animation (2–3 Hours)
*This is the demo's key moment. Make it dramatic.*

- [ ] When "Initiate Autonomous Underwriting" is clicked:
  - Hide the form parameters
  - Show a full-panel step-by-step agent pipeline progress view
  - Steps appear sequentially with 600ms delay between each
  - Each completed step shows a checkmark + elapsed time
  - Current step shows an animated spinner
  - Pending steps are grayed out with a hollow circle
  - An elapsed timer counts up in DM Mono below the steps
- [ ] Final step completes → 400ms pause → panel transitions to decision screen
- [ ] Decision screen shows: status badge + score + one-line AI verdict
- [ ] "View Full Report" button → opens applicant detail panel

**Exit criteria:** The pipeline animation should be the most impressive 15 seconds of the demo.

---

### Phase 5 — Polish & Micro-interactions (1–2 Hours)
*The details that separate "impressive" from "production-grade."*

- [ ] Table row hover: surface-2 background transition, 100ms
- [ ] Applicant panel open: slide-in 200ms ease-out, subtle backdrop on main content
- [ ] Status badge hover: show tooltip with definition ("AI confidence > 80% — auto-approved")
- [ ] CIBIL score column: add a tiny 5-bar visual indicator next to the number
- [ ] Affordability score: add colored left border on the cell (green/amber/red) instead of just colored text
- [ ] Stat card "Review →" on HITL card: navigates directly to HITL Exception Queue tab
- [ ] Add a subtle `box-shadow: inset 0 -1px 0 border` on active nav tab (not just border-bottom)
- [ ] Applicant name in panel: add one-line "TCS · Personal Loan · 24 months" subtitle in ink-3
- [ ] Agent confidence on HITL screen: replace inline text with a horizontal progress bar with threshold marker at 80%
- [ ] Add "Audit log" section at bottom of approved panel showing: 3 timestamped agent actions

**Exit criteria:** Hand the laptop to someone who's never seen it. They should be able to navigate it confidently without any explanation.

---

## 5. What Not to Do

These are the mistakes the current build made. Don't repeat them in the redesign.

| Don't | Do instead |
|---|---|
| Pill-shaped primary buttons | Rectangular with radius-md (6px) |
| Purple/indigo gradients on cards | Flat surface, warm border, shadow-sm |
| Generic Inter or system font | DM Sans + Instrument Serif + DM Mono |
| Colored card backgrounds for stats | White cards, colored indicator text only |
| Equal-weight nav tabs | Active tab with border-bottom + font-weight 500 |
| Raw JSON in executive view | Step-by-step pipeline progress animation |
| Cold gray (#F3F4F6) backgrounds | Warm canvas (#FAFAF8) |
| "AI Offline Mock" / "Fallback" labels | Remove entirely |
| Flat CSS green/red status badges | Bordered semantic badges with bg + text + border |
| Bounce animations | Linear or ease-out only, max 200ms |
| Drop shadows with color tint | Warm-ink shadows only |
| Scattered micro-interactions | One focused animation: pipeline processing |

---

## 6. Font + Color Quick Reference Card

*(Cut this out and keep it open while building)*

```
FONT ROLES
──────────────────────────────────────────────
App headings, stat numbers:    Instrument Serif
Nav, labels, body, buttons:    DM Sans
IDs, amounts, scores, times:   DM Mono

COLOR ROLES
──────────────────────────────────────────────
Page background:    #FAFAF8
Cards / panels:     #FFFFFF
Secondary surface:  #F5F4F0
Border:             #E8E6DF

Primary text:       #1A1916
Secondary text:     #4A4843
Label / meta text:  #8A8780

Primary action:     #1B3A6B (deep navy)
Action hover:       #2D5299
Action bg tint:     #EBF0FA

Approved:           #166534 text / #F0FDF4 bg / #BBF7D0 border
HITL Flagged:       #92400E text / #FFFBEB bg / #FDE68A border
Denied:             #991B1B text / #FFF5F5 bg / #FECACA border
```

---

## 7. Demo Day Checklist

Before the executive demo, verify:

- [ ] No "Mock", "Fallback", "Offline", or "Simulating" text visible anywhere
- [ ] Light mode on all 3 screens
- [ ] Operations table has 10 rows
- [ ] Processing time visible on approved case
- [ ] Pipeline animation runs end-to-end without errors
- [ ] Applicant panel slides in smoothly on row click
- [ ] HITL queue shows at least 2 cases
- [ ] All fonts loaded (not falling back to system fonts)
- [ ] All numeric columns right-aligned
- [ ] OneMoney AA badge visible on transaction section
- [ ] "Initiate Disbursement" button visible on approved case
- [ ] Confidence bar visible on HITL screen
- [ ] Denied case has an AI summary section
- [ ] No browser console errors

---

*End of design.md — Follow phases 0 through 5 in order. Do not skip Phase 0.*
