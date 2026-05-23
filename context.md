# Project Context: Solnix FinOps AI
**Organization:** SolnixMedia
**Role:** B2B Autonomous Financial Operator & Agentic Lending Infrastructure
**Inspired By:** Equal.in (https://www.equal.in/)
**Location:** 5th Floor, Draper Startup House, Gachibowli, Hyderabad.
**Support:** business@solnixmedia.com

---

## 1. WHY — The Problem We Are Solving

Traditional loan processing in Banks, NBFCs, and Insurance firms is:
- **Slow:** Takes 48–72 hours due to manual document verification and underwriting.
- **Fraud-prone:** Paper documents and self-declared income are easy to fake.
- **Expensive:** Requires large operations teams for routine decisioning.
- **Reactive:** Collections only happen after an EMI is missed, not before.
- **Opaque:** Borrowers get no visibility. Lenders have no audit trail.

SolnixMedia's answer is **Solnix FinOps AI** — an Autonomous Financial Operator that transforms manual, high-friction workflows into automated, agentic pipelines.

**Core Value Propositions:**
- Time Reduction: From 72-hour manual cycles to 4-minute autonomous cycles.
- Integrity: 100% authentic data via Account Aggregator (AA) rails — no fake documents possible.
- Proactive Management: Predictive nudges and automated collections before defaults happen.
- Safety First: Human-in-the-Loop (HITL) triggers for all anomalies and edge cases.

---

## 2. WHAT — What We Are Building

Solnix FinOps AI is not just a dashboard. It is an **Autonomous Operator** that handles the complete lifecycle of a financial product — from the moment a user starts an application to the moment the final EMI is paid.

It moves beyond "Digital Forms" into "Digital Decisions."

### The 4 Core Product Features (Inspired by Equal.in)

#### A. Financial Analytics
- Takes raw bank and transaction data and converts it into meaningful AI-powered insights.
- Identifies income stability, spending behavior, debt load, and red-flag patterns.
- Generates an **Affordability Score** based on real-time cash flow — not just static CIBIL history.
- Serves both lenders ("Should I approve this loan?") and borrowers ("What is my financial health?").

#### B. FinPro FIU TSP (Financial Information User — Technology Service Provider)
- Solnix acts as the **FIU** — the entity that requests and consumes a user's financial data.
- This module connects to the AA (Account Aggregator) network to request, receive, and process consented financial data.
- Powers the underwriting and credit decisioning pipeline.
- Think of it as the **"data requester"** side of the AA ecosystem.

#### C. FinShare FIP TSP (Financial Information Provider — Technology Service Provider)
- Helps Banks and NBFCs **become data providers** on the AA network.
- Enables FIs (Financial Institutions) to share their customers' data (with consent) to other FIUs on the network.
- Think of it as the **"data sender"** side — helping FIs plug into the AA ecosystem.

#### D. OneMoney AA Integration
- OneMoney is India's **RBI-regulated Account Aggregator** — the trusted, consent-driven middleman.
- It sits between the FIP (bank sharing data) and FIU (Solnix consuming data).
- No data moves without the user's explicit, revocable consent.
- This is the **backbone of the entire data pipeline** — the secure highway between banks and lenders.

### How All 4 Features Connect
```
User gives consent
      ↓
OneMoney AA (RBI-regulated trusted middleman)
      ↓
FinShare FIP TSP (bank/FI shares data)
      ↓
FinPro FIU TSP (Solnix receives & processes data)
      ↓
Financial Analytics (AI makes lending decision)
      ↓
Loan Approved / Denied / Flagged ✅
```

### The 4 AI Agents (Internal Architecture)

**Agent 1 — Identity & Onboarding Agent**
- Source: DigiLocker, CKYC, Biometric Liveness APIs.
- Extracts data from ID documents and verifies against government databases.
- If identity match > 95% → proceed to Financial Analysis. Else → trigger manual review.

**Agent 2 — Credit & Risk Agent (FinPro Analytics)**
- Source: OneMoney AA (FIU).
- Consumes raw JSON transaction data. Identifies salary credits, recurring debt, red-flag spending.
- Generates the Affordability Score based on real-time cash flow.

**Agent 3 — Disbursement Agent**
- Manages digital contract generation (E-sign) and initiates fund transfer via Razorpay or banking APIs.
- Only executes if Identity Agent AND Risk Agent have both signed off on the state.

**Agent 4 — Servicing & Collection Agent**
- Monitors loan state post-disbursal.
- Predictive Nudge: If bank balance < EMI amount 3 days before due date → trigger soft nudge.
- Automated multi-channel notifications (WhatsApp/SMS) for missed EMIs.

---

## 3. HOW — High-Level Approach (Summary)

*(Detailed technical docs, API specs, and workflow diagrams will be written separately.)*

- **Orchestration:** LangGraph for stateful multi-agent workflows.
- **Intelligence:** GPT-4o / Gemini 1.5 Pro for underwriting logic and intent analysis.
- **Backend:** FastAPI (Python) for high-performance async processing.
- **Frontend:** React + Tailwind CSS for the internal FinPro Console (for FIs).
- **Data Rails:** OneMoney API (AA), Razorpay (payments, disbursement, webhooks).
- **Compliance:** DPDP 2023 ready. All data fetches are time-bound and purpose-specific.

### Key Workflows (Overview)

**Workflow 1 — Onboarding Pipeline:**
User → Consent (AA) → Data Fetch (OneMoney) → Analysis (AI Agent) → Decision (Approve/Deny/Flag)

**Workflow 2 — Exception Protocol (HITL):**
IF Agent Confidence < 0.8 OR API Error → STOP Pipeline → Generate Intel Summary → Notify Human Admin

**Workflow 3 — Automated Reconciliation:**
Razorpay Webhook → Identify Transaction → Match to LoanID → Update Ledger → Notify User

### Coding Principles (For Reference)
- **Security First:** All PII encrypted. Never log raw financial data.
- **Agent Traceability:** Every LangGraph node decision must include a reasoning string for the audit log.
- **Graceful Degradation:** If AI fails, system locks and requires human intervention — never fails silently.
- **Compliance:** All data fetches are time-bound and purpose-specific (DPDP alignment).

---

## 4. Business Context

| Field | Detail |
|---|---|
| Company | SolnixMedia |
| Project | Solnix FinOps AI |
| Target Clients | Banks, NBFCs, Insurance Firms |
| Inspiration | Equal.in (https://www.equal.in/) |
| Location | 5th Floor, Draper Startup House, Gachibowli, Hyderabad |
| Support | business@solnixmedia.com |