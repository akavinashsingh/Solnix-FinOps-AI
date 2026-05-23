# Agent Instructions

Guidelines and command references for developing the Solnix FinOps AI project.

## Project Structure
- Backend: FastAPI (Python)
- Frontend: React + Tailwind CSS (Vite/Next.js)

## Commands

### Build & Run
- Backend: `uvicorn main:app --reload` (or your preferred server runner once backend is structured)
- Frontend: `npm run dev` (once React app is structured)

### Tests
- Backend: `pytest`
- Frontend: `npm test`

## Agent skills

### Issue tracker

Issues and PRDs live as GitHub issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical triage roles mapped to standard labels (e.g., `needs-triage`, `ready-for-agent`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo using `context.md` at the root. See `docs/agents/domain.md`.
