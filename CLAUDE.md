# Agent Instructions

Guidelines and command references for developing the Solnix FinOps AI project.

## Project Structure

Currently frontend-only. The product story in [`context.md`](context.md) describes a fuller stack (FastAPI backend, LangGraph orchestration, OneMoney + Razorpay integrations) — those are not yet built.

- **Frontend:** React 19 + TypeScript + Vite 8 + Tailwind v4 (single SPA)
- **State:** React Context (`src/context/AppContext.tsx`) — no external store
- **LLM:** Gemini 2.5 Flash via `src/services/gemini.ts`, with a deterministic local fallback when no API key is configured

See [`README.md`](README.md) for the full quick-start, view inventory, and project layout.

## Commands

### Build & run
- `npm install` — install dependencies
- `npm run dev` — Vite dev server with HMR on http://localhost:5173
- `npm run build` — type-check (`tsc -b`) and produce a production bundle
- `npm run preview` — serve the production bundle locally
- `npm run lint` — eslint

### Tests
No test runner is configured yet. Recommended next step: **Vitest + React Testing Library**, prioritising the underwriting state machine in `AppContext.runUnderwritingPipeline` and the HITL action transitions.

### Environment
- `VITE_GEMINI_API_KEY` — optional. When set, the underwriting pipeline calls Gemini 2.5 Flash live; otherwise it uses the local fallback in [`src/services/gemini.ts`](src/services/gemini.ts). Note: Vite inlines `VITE_*` vars into the client bundle — this key is suitable only for sandbox demos, not production.

## Adding a new view

1. Create `src/components/MyView.tsx`.
2. Add the view key to the `ViewState` union in [`src/context/AppContext.tsx`](src/context/AppContext.tsx).
3. Register the view in the sidebar groups and the router switch inside [`src/App.tsx`](src/App.tsx).
4. (Optional) Wire a Cmd+K shortcut by adding to the `NAV_COMMANDS` list in [`src/components/CommandPalette.tsx`](src/components/CommandPalette.tsx).

## Design system

All design tokens (typography, palette, spacing, radii, shadows, keyframes) live in [`src/index.css`](src/index.css) under `:root {}` and are exposed to Tailwind via `@theme`. The full system + rationale is in [`docs/agents/design.md`](docs/agents/design.md). When styling new UI, draw from these tokens — do not introduce new colours or arbitrary pixel values.

**Theming:** dark mode is the default. Light mode is opted in by adding the `.light` class to `<html>` — see the theme switcher in [`src/App.tsx`](src/App.tsx) (Sun/Moon icon in the top header, persists to `localStorage` under `solnix-theme`). When writing components, rely on the semantic tokens (`text-ink-1`, `bg-surface`, `border-border`, `text-accent`, etc.) rather than hard-coding hex values — the same component will render correctly in both modes.

**Glass + glow effects** (`.glass-panel`, `.shadow-glow-success`, `.shadow-glow-accent`) are dark-mode only; they are flattened to plain surfaces under `.light` to keep the warm-paper aesthetic readable. Same with backdrop-blur.

**A11y baseline:** use `focus-ring` on every interactive surface, give every icon-only button an `aria-label`, and respect `prefers-reduced-motion` (already handled globally in `index.css`).

## Mock data

- [`src/data/types.ts`](src/data/types.ts) — domain types (Applicant, Loan, Reviewer, Policy, Consent, Nudge, Audit).
- [`src/data/mockApplicants.ts`](src/data/mockApplicants.ts) — 30 applicants with EMI schedules, transactions, audit trails.
- [`src/data/mockOps.ts`](src/data/mockOps.ts) — reviewers, policy versions, derived nudges, global audit log.

## Agent skills

### Issue tracker
Issues and PRDs live as GitHub issues. See [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md).

### Triage labels
Canonical triage roles mapped to standard labels (e.g., `needs-triage`, `ready-for-agent`). See [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md).

### Domain docs
Single-context repo using `context.md` at the root. See [`docs/agents/domain.md`](docs/agents/domain.md).
