# Solnix FinOps AI

> B2B autonomous-underwriting console for Banks, NBFCs, and Insurance firms. Built on the RBI Account Aggregator stack with Human-in-the-Loop fallbacks for every edge case.

The product story lives in [`context.md`](context.md). The visual spec lives in [`docs/agents/design.md`](docs/agents/design.md). This README is the engineering quick-start.

---

## Stack

| Layer       | Tooling                                                   |
| ----------- | --------------------------------------------------------- |
| Frontend    | React 19 · TypeScript · Vite 8 · Tailwind v4 · lucide-react |
| State       | Single React Context (`src/context/AppContext.tsx`)       |
| LLM         | Gemini 2.5 Flash (browser fetch, with deterministic local fallback) |
| Charts      | Hand-rolled SVG (`src/components/charts.tsx`) — no dependency |

> ⚠ The Gemini API key is currently consumed client-side via `VITE_GEMINI_API_KEY`. This is fine for the sandbox demo but must move server-side before any real deployment — see "Known limitations" below.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

Optional — to use live Gemini 2.5 Flash underwriting instead of the local fallback:

```bash
echo "VITE_GEMINI_API_KEY=your-key-here" > .env.local
npm run dev
```

Without a key, every underwriting call uses the deterministic `simulateUnderwriting` fallback in [`src/services/gemini.ts`](src/services/gemini.ts).

### Scripts

```bash
npm run dev       # vite dev server with HMR
npm run build     # tsc -b && vite build
npm run preview   # serve the production build locally
npm run lint      # eslint
```

There is no test runner configured yet (Vitest + React Testing Library is the recommended next step).

---

## What's in the UI

The shell is a left-sidebar dashboard with a Cmd+K command palette in the top header. Ten views grouped by workflow:

### Underwriting
- **Operations Console** — loan-book table, weighted KPI cards, applicant detail panel with counterfactual slider and anomaly explainer.
- **Underwriting Pipeline** — application form with document drop-zone, OneMoney AA consent screen, animated 6-step pipeline (Identity → AA Consent → AA Fetch → AI Analysis → Report → Decision), decision card.
- **HITL Exception Queue** — flagged-case review with reviewer assignment, live SLA timer, mandatory override-comment modal, policy playback, expandable anomaly explainer on every red flag.

### Operations
- **Disbursement Queue** — 5-stage release pipeline (E-Mandate → Penny-Drop → Contract Sign → Ready-to-Release → Disbursed) with stage-advance and "Release ₹X" CTA.
- **Servicing Portfolio** — active loans with EMI calendar, outstanding/repaid KPIs, health stacked bar, due-in-7-days panel.
- **Predictive Nudges** — auto-derived alerts when balance < EMI within 3 days of due; WhatsApp/SMS/Email send actions with template preview, escalate-to-collections.

### Risk · Policy
- **Portfolio Analytics** — donut + histograms (CIBIL / DTI distributions), category breakdown, borrower segmentation (Prime / Near-prime / Sub-prime / Thin file / High variance / Distressed), employer concentration, 6-month trends.
- **Policy & Playback** — slider-based editor for CIBIL min, DTI ceilings, auto-approve threshold, HITL SLA, bounce tolerance, per-category ticket caps. Live playback replays the policy against every historical applicant and shows the outcome shifts.

### Compliance
- **Audit & Consent** — global audit log with category filters, CSV export, consent ledger with DPDP-style revocation flow.

### Demo
- **Borrower Portal** — preview the customer-facing experience: application timeline, EMI schedule, document downloads, self-service top-up offer when on-time streak ≥ 3.

### Cmd+K command palette

Triggers with ⌘K / Ctrl+K. Natural-language filter parses statuses, categories, recency, and numeric predicates:

```
flagged personal loans this week
DTI > 40%
CIBIL < 700
low balance
overdue
amount > 5 lakh
APP-007
```

Also a quick-jump to any view ("go to nudges", "policy", "analytics").

---

## Project layout

```
src/
├── App.tsx                    # Sidebar shell + view router + Cmd+K mount
├── main.tsx
├── index.css                  # Tailwind v4 @theme tokens + keyframes
│
├── context/
│   └── AppContext.tsx         # All app state: applicants, reviewers, policies,
│                              # nudges, audit log, pipeline orchestration
│
├── data/
│   ├── types.ts               # Shared domain types
│   ├── mockApplicants.ts      # 30 applicants with EMI schedules, audit trails
│   └── mockOps.ts             # Reviewers, policies, derived nudges, global audit
│
├── services/
│   └── gemini.ts              # Gemini 2.5 Flash + local fallback underwriting
│
└── components/
    ├── ConsoleView.tsx        # Operations dashboard + slide-in detail panel
    ├── PipelineView.tsx       # Underwriting pipeline (form → animation → decision)
    ├── HITLView.tsx           # Human-in-the-Loop review queue
    ├── DisbursementView.tsx
    ├── ServicingView.tsx
    ├── NudgeView.tsx
    ├── AnalyticsView.tsx
    ├── PolicyView.tsx
    ├── ComplianceView.tsx
    ├── BorrowerView.tsx
    ├── CommandPalette.tsx     # Cmd+K with NL filter parser
    ├── PageHeader.tsx         # Shared page-header component
    ├── charts.tsx             # Hand-rolled SVG charts
    └── anomalyExplainer.tsx   # Pattern→explanation dictionary for red flags
```

---

## Design system

All typography, colour, spacing, shadow, and radius tokens are defined in [`src/index.css`](src/index.css) under `:root {}` and exposed to Tailwind via `@theme`. The full system is documented in [`docs/agents/design.md`](docs/agents/design.md). Highlights:

- **Fonts:** Instrument Serif (display / large numbers), DM Sans (UI body), DM Mono (data, IDs, amounts).
- **Palette:** warm canvas `#FAFAF8`, ink scale `#1A1916 → #B8B5AC`, deep navy accent `#1B3A6B`, semantic green/amber/red bordered badges, OneMoney AA teal `#0F766E`.
- **Spacing:** 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 px scale only.
- **Radii:** 4 / 6 / 10 / 14 — no pill shapes on primary actions.

---

## Known limitations

These are deliberate scoping decisions for the demo, not bugs.

1. **No persistence.** Applicants live in React state — a refresh resets to the seeded mock data.
2. **No backend.** Every "agent" runs in the browser. The Gemini call is the only real network request and it goes directly from the client.
3. **Gemini key on the client.** `VITE_*` is inlined into the bundle at build time. For production, proxy through a Cloudflare Worker / Vercel Edge Function.
4. **No tests.** Vitest + React Testing Library is the recommended next step; the underwriting state machine and HITL transitions are the most valuable surfaces to cover.
5. **Pre-release deps.** React 19, Vite 8, Tailwind 4, TypeScript ~6.0.2 — pin to stable versions before going to production.

---

## Agent skills

The `.agents/` directory and `skills-lock.json` mirror Matt Pocock's skill pack. They are agent workflow tools, not application code. See [`docs/agents/`](docs/agents/) for conventions:

- [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md) — GitHub as the issue tracker.
- [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md) — canonical triage labels.
- [`docs/agents/domain.md`](docs/agents/domain.md) — how skills consume domain docs (`context.md`).

---

## License & contact

© 2026 SolnixMedia. All rights reserved.

Support: **business@solnixmedia.com**
Location: 5th Floor, Draper Startup House, Gachibowli, Hyderabad.
