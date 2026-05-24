/* Mock applicants — extended with servicing, disbursement, and consent records.
   Types live in ./types.ts.  Older imports still work via the re-exports below. */

import type {
  Applicant, ApplicantCategory, AuditLogEntry, ConsentRecord,
  DisbursementRecord, EMIInstallment, ServicingDetails,
} from './types';

export type {
  Applicant, ApplicantCategory, AuditLogEntry, ConsentRecord,
  DisbursementRecord, EMIInstallment, ServicingDetails, Transaction,
} from './types';

const trail = (
  date: string,
  entries: Array<[string, AuditLogEntry['agent'], string, AuditLogEntry['category']?]>
): AuditLogEntry[] =>
  entries.map(([time, agent, action, category]) => ({
    timestamp: `${date}T${time}`,
    agent,
    action,
    category: category ?? 'UNDERWRITING',
  }));

/* ============================================================
 *  EMI schedule generator
 * ============================================================ */
function buildEmiSchedule(opts: {
  loanAmount: number;
  tenure: number;
  monthlyRatePct?: number;
  startDate: string;          // ISO; first EMI is one month after this
  paidEmis: number;           // how many EMIs already paid
  overdueEmis?: number;       // how many of the latest are overdue
}): { schedule: EMIInstallment[]; emi: number; outstanding: number; repaid: number } {
  const { loanAmount, tenure, monthlyRatePct = 1.4, startDate, paidEmis, overdueEmis = 0 } = opts;
  const r = monthlyRatePct / 100;
  const emi = Math.round((loanAmount * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1));

  const schedule: EMIInstallment[] = [];
  let outstanding = loanAmount;
  let repaid = 0;

  const start = new Date(startDate);

  for (let i = 1; i <= tenure; i++) {
    const due = new Date(start);
    due.setMonth(start.getMonth() + i);
    const interest = Math.round(outstanding * r);
    const principal = Math.min(outstanding, emi - interest);
    outstanding = Math.max(0, outstanding - principal);

    let status: EMIInstallment['status'] = 'UPCOMING';
    let paidDate: string | undefined;

    if (i <= paidEmis - overdueEmis) {
      status = 'PAID';
      const pd = new Date(due);
      pd.setDate(due.getDate() - Math.floor(Math.random() * 3));
      paidDate = pd.toISOString().split('T')[0];
      repaid += emi;
    } else if (i <= paidEmis) {
      status = 'OVERDUE';
    } else if (i === paidEmis + 1) {
      status = 'DUE';
    }

    schedule.push({
      number: i,
      dueDate: due.toISOString().split('T')[0],
      amount: emi,
      principal,
      interest,
      status,
      paidDate,
    });
  }

  // Recompute outstanding & repaid based on actually-paid EMIs
  const paid = schedule.filter(s => s.status === 'PAID');
  repaid = paid.reduce((s, x) => s + x.amount, 0);
  const principalPaid = paid.reduce((s, x) => s + x.principal, 0);
  outstanding = Math.max(0, loanAmount - principalPaid);

  return { schedule, emi, outstanding, repaid };
}

function buildServicing(opts: {
  loanAmount: number;
  tenure: number;
  startDate: string;
  paidEmis: number;
  overdueEmis?: number;
  currentBalance: number;
}): ServicingDetails {
  const { loanAmount, tenure, startDate, paidEmis, overdueEmis = 0, currentBalance } = opts;
  const { schedule, emi, outstanding, repaid } = buildEmiSchedule({
    loanAmount, tenure, startDate, paidEmis, overdueEmis,
  });

  const overdue = schedule.find(s => s.status === 'OVERDUE');
  const due = schedule.find(s => s.status === 'DUE');

  const onTimeStreak = (() => {
    // Walk backwards from last PAID, count consecutive on-time payments
    let count = 0;
    for (let i = schedule.length - 1; i >= 0; i--) {
      const s = schedule[i];
      if (s.status === 'PAID') count++;
      else if (s.status === 'OVERDUE') break;
      else continue;
    }
    return count;
  })();

  return {
    disbursedAt: startDate,
    disbursedAmount: loanAmount,
    outstandingPrincipal: outstanding,
    totalRepaid: repaid,
    emisPaid: paidEmis - overdueEmis,
    emisRemaining: tenure - paidEmis + overdueEmis,
    emisTotal: tenure,
    nextEmiDate: overdue?.dueDate ?? due?.dueDate,
    nextEmiAmount: emi,
    daysOverdue: overdue ? Math.floor((Date.now() - new Date(overdue.dueDate).getTime()) / 86400000) : undefined,
    onTimeStreak,
    currentBalance,
    riskScore: overdue ? 75 : currentBalance < emi ? 55 : 25,
    schedule,
  };
}

function makeConsent(applicantId: string, fipName: string, bankAccount: string, applicationDate: string): ConsentRecord {
  const issued = new Date(applicationDate);
  const expires = new Date(issued.getTime() + 24 * 3600 * 1000);
  return {
    id: `CON-${applicantId}`,
    applicantId,
    fipName,
    bankAccount,
    issuedAt: issued.toISOString(),
    expiresAt: expires.toISOString(),
    scope: ['Transactions', 'Balance', 'Profile'],
    purpose: 'Loan eligibility credit assessment',
    status: 'ACTIVE',
  };
}

function makeDisbursement(opts: Partial<DisbursementRecord> & { account: string; ifsc: string; bank: string; amount: number; }): DisbursementRecord {
  return {
    stage: opts.stage ?? 'READY_TO_RELEASE',
    emandateStatus: opts.emandateStatus ?? 'VERIFIED',
    pennyDropStatus: opts.pennyDropStatus ?? 'VERIFIED',
    contractStatus: opts.contractStatus ?? 'SIGNED',
    beneficiaryAccount: opts.account,
    beneficiaryIfsc: opts.ifsc,
    beneficiaryBank: opts.bank,
    scheduledFor: opts.scheduledFor,
    releasedAt: opts.releasedAt,
  };
}

/* ============================================================
 *  Mock applicants
 * ============================================================ */

export const mockApplicants: Applicant[] = [
  /* ====== APP-001 — Rahul Sharma (APPROVED, in SERVICING, on-time) ====== */
  {
    id: "APP-001",
    name: "Rahul Sharma",
    employer: "TCS",
    loanPurpose: "Personal Loan · 24 months",
    cibil: 785,
    income: 150000,
    existingDebt: 12000,
    requestedAmount: 500000,
    tenureMonths: 24,
    category: "Personal",
    status: "APPROVED",
    loanState: "SERVICING",
    affordabilityScore: 88,
    confidence: 94,
    phone: "+91 98201 12345",
    email: "rahul.sharma@example.com",
    reason: "Strong cash flow with stable monthly salary credits from TCS. DTI is healthy at 8%. CIBIL indicates excellent repayment behaviour.",
    analysisSummary: "Verified salary credits of ₹1,50,000 on the 1st of every month. Average monthly savings rate is 38% and recurring expenses are stable.",
    redFlags: [],
    applicationDate: "2025-11-22",
    processingTime: "3m 42s",
    auditTrail: trail("2025-11-22", [
      ["09:14:02Z", "Identity Agent", "DigiLocker handshake complete · Aadhaar match 99.2%", "IDENTITY"],
      ["09:14:48Z", "OneMoney AA", "Consent token issued · HDFC xxxx4521", "CONSENT"],
      ["09:16:11Z", "Risk Agent", "Affordability 88/100 · auto-approve threshold met", "UNDERWRITING"],
      ["09:17:44Z", "Disbursement Agent", "E-mandate signed · ₹5,00,000 released to HDFC xxxx4521", "DISBURSEMENT"],
    ]),
    transactions: [
      { date: "2026-05-01", description: "TCS SALARY CRED", amount: 150000, type: "credit" },
      { date: "2026-05-03", description: "HDFC HOME LOAN EMI", amount: 12000, type: "debit" },
      { date: "2026-05-05", description: "D-MART SUPERMARKET", amount: 8500, type: "debit" },
      { date: "2026-05-15", description: "INTEREST CREDIT HDFC", amount: 450, type: "credit" },
    ],
    consent: makeConsent("APP-001", "HDFC Bank", "xxxx4521", "2025-11-22"),
    disbursement: makeDisbursement({
      account: "xxxx4521", ifsc: "HDFC0001234", bank: "HDFC Bank", amount: 500000,
      stage: 'DISBURSED', releasedAt: "2025-11-23T11:00:00Z",
    }),
    servicing: buildServicing({
      loanAmount: 500000, tenure: 24, startDate: "2025-11-23", paidEmis: 6, currentBalance: 184000,
    }),
  },

  /* ====== APP-002 — Priya Mehta (FLAGGED, awaiting HITL) ====== */
  {
    id: "APP-002",
    name: "Priya Mehta",
    employer: "Upwork · Freelance",
    loanPurpose: "Business Capital · 12 months",
    cibil: 675,
    income: 85000,
    existingDebt: 15000,
    requestedAmount: 300000,
    tenureMonths: 12,
    category: "Business",
    status: "FLAGGED",
    loanState: "FLAGGED",
    affordabilityScore: 61,
    confidence: 67,
    phone: "+91 90220 33445",
    email: "priya.m@example.com",
    reason: "Freelance developer with highly irregular income credits. Cash flow variance ±55% month-on-month. Three hard credit queries in the past 45 days.",
    hitlReason: "Verify freelance contract consistency and inspect 6 months of statements to confirm if the low-credit months are seasonal. Consider a co-applicant.",
    analysisSummary: "Average monthly deposits of ₹85,000 but credits arrive on unpredictable dates (May 12th, Apr 28th, Mar 5th). Significant cash reserves drain around the 20th of each month.",
    redFlags: [
      "High cash flow variance (>40%)",
      "Multiple credit inquiries in last 60 days",
      "Irregular monthly credit intervals",
    ],
    applicationDate: "2026-05-23",
    flaggedAt: "2026-05-23T10:32:00Z",
    processingTime: "4m 11s",
    assignedReviewerId: "REV-002",
    auditTrail: trail("2026-05-23", [
      ["10:28:14Z", "Identity Agent", "PAN + Aadhaar verified · liveness 96%", "IDENTITY"],
      ["10:29:55Z", "OneMoney AA", "FIP consent obtained · ICICI xxxx7732", "CONSENT"],
      ["10:31:22Z", "Risk Agent", "Confidence 67% · below 80% threshold → flagged", "UNDERWRITING"],
      ["10:32:00Z", "System", "Routed to HITL queue · Credit Review Team", "HITL"],
    ]),
    transactions: [
      { date: "2026-05-12", description: "UPWORK ESCROW CRD", amount: 45000, type: "credit" },
      { date: "2026-05-18", description: "CRED CC SETTLEMENT", amount: 28000, type: "debit" },
      { date: "2026-05-20", description: "EMI HDFC CAR LOAN", amount: 15000, type: "debit" },
      { date: "2026-05-22", description: "FIVERR PAYOUT", amount: 35000, type: "credit" },
    ],
    consent: makeConsent("APP-002", "ICICI Bank", "xxxx7732", "2026-05-23"),
  },

  /* ====== APP-003 — Amit Verma (DENIED) ====== */
  {
    id: "APP-003",
    name: "Amit Verma",
    employer: "Self-employed · Retail",
    loanPurpose: "Consumer Durable EMI · 18 months",
    cibil: 540,
    income: 45000,
    existingDebt: 22000,
    requestedAmount: 150000,
    tenureMonths: 18,
    category: "Consumer",
    status: "DENIED",
    loanState: "DENIED",
    affordabilityScore: 24,
    confidence: 91,
    phone: "+91 81023 88991",
    reason: "Extremely high DTI at 48.8%. Multiple insufficient-balance ACH returns. CIBIL below threshold of 600 due to past write-offs.",
    analysisSummary: "Account holds a persistent low balance (under ₹2,000) for 18 days of the month. Two ACH bounces in the active statement. Severely over-leveraged.",
    redFlags: [
      "CIBIL score below NBFC threshold (540 < 600)",
      "2× insufficient-balance ACH bounces in last 30 days",
      "Debt-to-Income ratio exceeds safety limit of 40%",
    ],
    applicationDate: "2026-05-21",
    processingTime: "2m 58s",
    auditTrail: trail("2026-05-21", [
      ["14:02:11Z", "Identity Agent", "KYC complete · Aadhaar match 98.4%", "IDENTITY"],
      ["14:02:55Z", "OneMoney AA", "Consent token issued · SBI xxxx9023", "CONSENT"],
      ["14:04:31Z", "Risk Agent", "Bureau + bounces fail · auto-deny criteria", "UNDERWRITING"],
      ["14:05:09Z", "System", "Denial letter generated · borrower notified", "COMPLIANCE"],
    ]),
    transactions: [
      { date: "2026-05-02", description: "LOCAL SHOP CRD", amount: 25000, type: "credit" },
      { date: "2026-05-05", description: "ACH DEBIT BOUNCE", amount: 8000, type: "debit", isBounce: true },
      { date: "2026-05-10", description: "CASH WITHDRAWAL", amount: 15000, type: "debit" },
      { date: "2026-05-12", description: "ACH DEBIT BOUNCE", amount: 8000, type: "debit", isBounce: true },
    ],
    consent: makeConsent("APP-003", "SBI", "xxxx9023", "2026-05-21"),
  },

  /* ====== APP-004 — Arjun Singh (APPROVED, in SERVICING, perfect record) ====== */
  {
    id: "APP-004",
    name: "Arjun Singh",
    employer: "Google India",
    loanPurpose: "Personal Loan · 36 months",
    cibil: 815,
    income: 220000,
    existingDebt: 0,
    requestedAmount: 1000000,
    tenureMonths: 36,
    category: "Personal",
    status: "APPROVED",
    loanState: "SERVICING",
    affordabilityScore: 96,
    confidence: 97,
    phone: "+91 98765 12340",
    email: "arjun.singh@example.com",
    reason: "Outstanding credit profile. Zero active debt obligations. Premium salary credits from Google India.",
    analysisSummary: "Salary credit of ₹2,20,000 verified. Savings rate exceeds 65%. Liquidity is optimal.",
    redFlags: [],
    applicationDate: "2025-10-20",
    processingTime: "3m 15s",
    auditTrail: trail("2025-10-20", [
      ["11:01:22Z", "Identity Agent", "DigiLocker · Aadhaar match 99.6%", "IDENTITY"],
      ["11:02:14Z", "OneMoney AA", "Consent token issued · HDFC xxxx2210", "CONSENT"],
      ["11:04:01Z", "Risk Agent", "Affordability 96/100 · top decile", "UNDERWRITING"],
      ["11:04:37Z", "Disbursement Agent", "₹10,00,000 released to HDFC xxxx2210", "DISBURSEMENT"],
    ]),
    transactions: [
      { date: "2026-05-01", description: "GOOGLE SALARY CRED", amount: 220000, type: "credit" },
      { date: "2026-05-03", description: "MUTUAL FUND SIP", amount: 45000, type: "debit" },
    ],
    consent: makeConsent("APP-004", "HDFC Bank", "xxxx2210", "2025-10-20"),
    disbursement: makeDisbursement({
      account: "xxxx2210", ifsc: "HDFC0005678", bank: "HDFC Bank", amount: 1000000,
      stage: 'DISBURSED', releasedAt: "2025-10-21T10:30:00Z",
    }),
    servicing: buildServicing({
      loanAmount: 1000000, tenure: 36, startDate: "2025-10-21", paidEmis: 7, currentBalance: 412000,
    }),
  },

  /* ====== APP-005 — Deepika Nair (SERVICING, low-balance — eligible for NUDGE) ====== */
  {
    id: "APP-005",
    name: "Deepika Nair",
    employer: "Infosys",
    loanPurpose: "Personal Loan · 24 months",
    cibil: 720,
    income: 120000,
    existingDebt: 18000,
    requestedAmount: 400000,
    tenureMonths: 24,
    category: "Personal",
    status: "APPROVED",
    loanState: "SERVICING",
    affordabilityScore: 79,
    confidence: 86,
    phone: "+91 99887 76543",
    email: "deepika.n@example.com",
    reason: "Good credit profile with stable salary. DTI at 15% within acceptable range.",
    analysisSummary: "Monthly salary of ₹1,20,000 verified. Rent is largest fixed expense at ₹25,000.",
    redFlags: [],
    applicationDate: "2025-12-19",
    processingTime: "4m 03s",
    auditTrail: trail("2025-12-19", [
      ["09:44:02Z", "Identity Agent", "Aadhaar + PAN verified", "IDENTITY"],
      ["09:45:21Z", "OneMoney AA", "Consent token issued · Axis xxxx5511", "CONSENT"],
      ["09:47:18Z", "Risk Agent", "Affordability 79/100 · auto-approve", "UNDERWRITING"],
      ["09:48:02Z", "Disbursement Agent", "₹4,00,000 released to Axis xxxx5511", "DISBURSEMENT"],
    ]),
    transactions: [
      { date: "2026-05-01", description: "INFOSYS SALARY", amount: 120000, type: "credit" },
      { date: "2026-05-05", description: "RENT TRANSFER", amount: 25000, type: "debit" },
    ],
    consent: makeConsent("APP-005", "Axis Bank", "xxxx5511", "2025-12-19"),
    disbursement: makeDisbursement({
      account: "xxxx5511", ifsc: "UTIB0001100", bank: "Axis Bank", amount: 400000,
      stage: 'DISBURSED', releasedAt: "2025-12-20T11:00:00Z",
    }),
    servicing: buildServicing({
      loanAmount: 400000, tenure: 24, startDate: "2025-12-20", paidEmis: 5, currentBalance: 12500,
    }),
  },

  /* ====== APP-006 — Vikram Patel (DENIED) ====== */
  {
    id: "APP-006",
    name: "Vikram Patel",
    employer: "Self-employed · Trader",
    loanPurpose: "Consumer Durable EMI · 12 months",
    cibil: 590,
    income: 55000,
    existingDebt: 20000,
    requestedAmount: 200000,
    tenureMonths: 12,
    category: "Consumer",
    status: "DENIED",
    loanState: "DENIED",
    affordabilityScore: 31,
    confidence: 88,
    phone: "+91 78845 11223",
    reason: "High debt leverage with DTI exceeding 36%. CIBIL of 590 below institutional minimum.",
    analysisSummary: "Irregular salary credits, mostly via cash deposits which the AA cannot independently verify.",
    redFlags: ["CIBIL below 600", "DTI exceeds 36%", "Cash-only credits — unverifiable employer"],
    applicationDate: "2026-05-18",
    processingTime: "2m 44s",
    auditTrail: trail("2026-05-18", [
      ["13:11:02Z", "Identity Agent", "Aadhaar match 97.1%", "IDENTITY"],
      ["13:12:14Z", "OneMoney AA", "Consent token issued · BoB xxxx1812", "CONSENT"],
      ["13:13:55Z", "Risk Agent", "Bureau + DTI fail · auto-deny", "UNDERWRITING"],
    ]),
    transactions: [
      { date: "2026-05-03", description: "CASH DEPOSIT", amount: 30000, type: "credit" },
      { date: "2026-05-10", description: "EMI BAJAJ FINANCE", amount: 12000, type: "debit" },
    ],
    consent: makeConsent("APP-006", "Bank of Baroda", "xxxx1812", "2026-05-18"),
  },

  /* ====== APP-007 — Sneha Kapoor (FLAGGED — cash anomaly) ====== */
  {
    id: "APP-007",
    name: "Sneha Kapoor",
    employer: "Kapoor Textiles Pvt Ltd",
    loanPurpose: "Business Capital · 18 months",
    cibil: 710,
    income: 95000,
    existingDebt: 8000,
    requestedAmount: 350000,
    tenureMonths: 18,
    category: "Business",
    status: "FLAGGED",
    loanState: "FLAGGED",
    affordabilityScore: 72,
    confidence: 73,
    phone: "+91 91234 56789",
    reason: "Mixed signals in cash flow. Bureau score acceptable but a large unexplained cash deposit on May 8th breaks the pattern.",
    hitlReason: "Verify the source of the ₹2,00,000 cash deposit. If legitimate with matching invoice, confidence rises above threshold.",
    analysisSummary: "One anomalous high-value cash deposit inside a consistent salary + vendor-payment pattern. No bounces, no bureau queries.",
    redFlags: ["Unexplained large cash deposit"],
    applicationDate: "2026-05-17",
    flaggedAt: "2026-05-17T16:09:00Z",
    processingTime: "5m 27s",
    assignedReviewerId: "REV-001",
    auditTrail: trail("2026-05-17", [
      ["16:03:11Z", "Identity Agent", "GST + PAN verified · business entity", "IDENTITY"],
      ["16:04:50Z", "OneMoney AA", "Consent token issued · ICICI xxxx8801", "CONSENT"],
      ["16:08:14Z", "Risk Agent", "Confidence 73% · cash anomaly detected", "UNDERWRITING"],
      ["16:09:00Z", "System", "Routed to HITL queue", "HITL"],
    ]),
    transactions: [
      { date: "2026-05-01", description: "CLIENT INVOICE — TEXTILES", amount: 95000, type: "credit" },
      { date: "2026-05-08", description: "CASH DEPOSIT", amount: 200000, type: "credit" },
      { date: "2026-05-12", description: "VENDOR PAYMENT", amount: 45000, type: "debit" },
    ],
    consent: makeConsent("APP-007", "ICICI Bank", "xxxx8801", "2026-05-17"),
  },

  /* ====== APP-008 — Rajesh Gupta (SERVICING, on-time) ====== */
  {
    id: "APP-008",
    name: "Rajesh Gupta",
    employer: "HCL Technologies",
    loanPurpose: "Personal Loan · 36 months",
    cibil: 755,
    income: 180000,
    existingDebt: 25000,
    requestedAmount: 750000,
    tenureMonths: 36,
    category: "Personal",
    status: "APPROVED",
    loanState: "SERVICING",
    affordabilityScore: 84,
    confidence: 91,
    phone: "+91 98765 54321",
    email: "rajesh.gupta@example.com",
    reason: "Senior executive with excellent credit history. SBI home loan EMI accounts for bulk of existing debt and is current.",
    analysisSummary: "Verified salary of ₹1,80,000 with no interruptions. Existing SBI home loan EMI paid on time.",
    redFlags: [],
    applicationDate: "2025-12-16",
    processingTime: "3m 56s",
    auditTrail: trail("2025-12-16", [
      ["10:14:02Z", "Identity Agent", "Aadhaar + PAN verified", "IDENTITY"],
      ["10:15:28Z", "OneMoney AA", "Consent token issued · SBI xxxx4421", "CONSENT"],
      ["10:17:50Z", "Risk Agent", "Affordability 84/100 · auto-approve", "UNDERWRITING"],
      ["10:18:24Z", "Disbursement Agent", "₹7,50,000 released to SBI xxxx4421", "DISBURSEMENT"],
    ]),
    transactions: [
      { date: "2026-05-01", description: "HCL SALARY", amount: 180000, type: "credit" },
      { date: "2026-05-05", description: "HOME LOAN SBI", amount: 25000, type: "debit" },
    ],
    consent: makeConsent("APP-008", "SBI", "xxxx4421", "2025-12-16"),
    disbursement: makeDisbursement({
      account: "xxxx4421", ifsc: "SBIN0011223", bank: "SBI", amount: 750000,
      stage: 'DISBURSED', releasedAt: "2025-12-17T10:00:00Z",
    }),
    servicing: buildServicing({
      loanAmount: 750000, tenure: 36, startDate: "2025-12-17", paidEmis: 5, currentBalance: 92000,
    }),
  },

  /* ====== APP-009 — Meera Reddy (FLAGGED) ====== */
  {
    id: "APP-009",
    name: "Meera Reddy",
    employer: "Self-employed · Tailoring",
    loanPurpose: "Micro-Lending · 24 months",
    cibil: 640,
    income: 72000,
    existingDebt: 28000,
    requestedAmount: 250000,
    tenureMonths: 24,
    category: "Micro-Lending",
    status: "FLAGGED",
    loanState: "FLAGGED",
    affordabilityScore: 48,
    confidence: 62,
    phone: "+91 90909 80808",
    reason: "Micro-lending applicant with thin credit file. Two UPI mandates bounced. Existing EMI exposure may include informal lending.",
    hitlReason: "Verify if existing ₹28,000 EMI includes informal lending. Approve with reduced ticket if informal debt is < 50%.",
    analysisSummary: "Two bounced UPI mandates. Credit score is thin — most of borrower's lending has been informal.",
    redFlags: ["DTI would exceed 38%", "UPI mandate bounce detected", "Thin bureau file"],
    applicationDate: "2026-05-15",
    flaggedAt: "2026-05-15T11:48:00Z",
    processingTime: "4m 33s",
    assignedReviewerId: "REV-003",
    auditTrail: trail("2026-05-15", [
      ["11:42:11Z", "Identity Agent", "Aadhaar match 96.3%", "IDENTITY"],
      ["11:43:55Z", "OneMoney AA", "Consent token issued · Kotak xxxx3344", "CONSENT"],
      ["11:47:22Z", "Risk Agent", "Confidence 62% · UPI bounces detected", "UNDERWRITING"],
      ["11:48:00Z", "System", "Routed to HITL queue", "HITL"],
    ]),
    transactions: [
      { date: "2026-05-01", description: "SELF EMPLOYED CRD", amount: 72000, type: "credit" },
      { date: "2026-05-07", description: "UPI BOUNCE", amount: 5000, type: "debit", isBounce: true },
      { date: "2026-05-12", description: "RAW MATERIAL", amount: 22000, type: "debit" },
    ],
    consent: makeConsent("APP-009", "Kotak Mahindra Bank", "xxxx3344", "2026-05-15"),
  },

  /* ====== APP-010 — Ankit Joshi (SERVICING, in DISBURSING) ====== */
  {
    id: "APP-010",
    name: "Ankit Joshi",
    employer: "Microsoft India",
    loanPurpose: "Personal Loan · 48 months",
    cibil: 800,
    income: 250000,
    existingDebt: 15000,
    requestedAmount: 1200000,
    tenureMonths: 48,
    category: "Personal",
    status: "APPROVED",
    loanState: "DISBURSING",
    affordabilityScore: 92,
    confidence: 95,
    phone: "+91 97877 23456",
    email: "ankit.j@example.com",
    reason: "Premium applicant with exceptional profile. Salary comfortably above EMI with existing obligations factored in.",
    analysisSummary: "Salary credit fully verified each month. Existing EMI is a small SBI personal loan nearing closure.",
    redFlags: [],
    applicationDate: "2026-05-14",
    processingTime: "3m 08s",
    auditTrail: trail("2026-05-14", [
      ["08:14:02Z", "Identity Agent", "Aadhaar match 99.4%", "IDENTITY"],
      ["08:15:14Z", "OneMoney AA", "Consent token issued · HDFC xxxx9911", "CONSENT"],
      ["08:17:08Z", "Risk Agent", "Affordability 92/100 · auto-approve", "UNDERWRITING"],
      ["08:17:42Z", "Disbursement Agent", "E-mandate drafted · awaiting borrower sign", "DISBURSEMENT"],
    ]),
    transactions: [
      { date: "2026-05-01", description: "MICROSOFT SALARY", amount: 250000, type: "credit" },
      { date: "2026-05-04", description: "EMI SBI PL", amount: 15000, type: "debit" },
    ],
    consent: makeConsent("APP-010", "HDFC Bank", "xxxx9911", "2026-05-14"),
    disbursement: makeDisbursement({
      account: "xxxx9911", ifsc: "HDFC0009911", bank: "HDFC Bank", amount: 1200000,
      stage: 'CONTRACT_SIGN', emandateStatus: 'VERIFIED', pennyDropStatus: 'VERIFIED', contractStatus: 'SENT',
    }),
  },
];

/* ============================================================
 *  Generate additional historical loans for the servicing
 *  dashboard, nudge queue, and analytics views.
 * ============================================================ */

const EXTRA_NAMES = [
  ['APP-011','Kavya Iyer','TCS','Personal',780,140000,12000,450000,24,'SERVICING',6,182000,'+91 88880 11111','kavya.i@example.com','Personal Loan · 24 months'],
  ['APP-012','Nikhil Bose','Wipro','Personal',745,135000,8000,500000,36,'SERVICING',8,95000,'+91 88880 22222','nikhil.b@example.com','Personal Loan · 36 months'],
  ['APP-013','Aisha Khan','Flipkart','Business',790,200000,30000,800000,36,'SERVICING',4,310000,'+91 88880 33333','aisha.k@example.com','Business Capital · 36 months'],
  ['APP-014','Sanjay Rao','Self-employed','Micro-Lending',660,50000,12000,80000,12,'SERVICING',6,3200,'+91 88880 44444',undefined,'Micro-Lending · 12 months'],
  ['APP-015','Pooja Iyer','HDFC Bank','Personal',810,175000,22000,650000,30,'SERVICING',10,124000,'+91 88880 55555','pooja.i@example.com','Personal Loan · 30 months'],
  ['APP-016','Karan Mehta','Tech Mahindra','Personal',735,110000,16000,400000,24,'SERVICING',3,38000,'+91 88880 66666','karan.m@example.com','Personal Loan · 24 months'],
  ['APP-017','Lakshmi Sundaram','Self-employed','Business',705,90000,10000,250000,18,'SERVICING',2,18000,'+91 88880 77777',undefined,'Business Capital · 18 months'],
  ['APP-018','Vivek Khanna','Accenture','Personal',760,160000,18000,550000,30,'SERVICING',5,210000,'+91 88880 88888','vivek.k@example.com','Personal Loan · 30 months'],
  ['APP-019','Ritika Sen','Capgemini','Consumer',715,95000,8000,180000,18,'SERVICING',7,42000,'+91 88880 99999','ritika.s@example.com','Consumer Durable · 18 months'],
  ['APP-020','Manish Trivedi','Self-employed','Micro-Lending',625,48000,15000,90000,18,'SERVICING',4,2100,'+91 88881 00000',undefined,'Micro-Lending · 18 months'],
  ['APP-021','Sara Pinto','Adobe India','Personal',805,210000,0,950000,36,'CLOSED',36,388000,'+91 88881 11111','sara.p@example.com','Personal Loan · 36 months'],
  ['APP-022','Ravi Kumar','Self-employed','Consumer',595,38000,9000,60000,12,'DEFAULTED',2,800,'+91 88881 22222',undefined,'Consumer Durable · 12 months'],
  ['APP-023','Aanya Verma','Zomato','Business',730,120000,15000,300000,24,'DISBURSED',1,67000,'+91 88881 33333','aanya.v@example.com','Business Capital · 24 months'],
  ['APP-024','Rohan Desai','Bajaj Allianz','Personal',770,165000,12000,500000,24,'DISBURSING',0,0,'+91 88881 44444','rohan.d@example.com','Personal Loan · 24 months'],
  ['APP-025','Tanvi Joshi','Infosys','Personal',740,125000,14000,350000,24,'SERVICING',9,76000,'+91 88881 55555','tanvi.j@example.com','Personal Loan · 24 months'],
  ['APP-026','Harish Patil','Self-employed','Business',680,82000,18000,200000,18,'SERVICING',3,8500,'+91 88881 66666',undefined,'Business Capital · 18 months'],
  ['APP-027','Smita Roy','Cognizant','Consumer',725,98000,7000,150000,12,'SERVICING',6,55000,'+91 88881 77777','smita.r@example.com','Consumer Durable · 12 months'],
  ['APP-028','Aditya Bhatt','IBM India','Personal',795,210000,20000,750000,36,'SERVICING',8,295000,'+91 88881 88888','aditya.b@example.com','Personal Loan · 36 months'],
  ['APP-029','Geetha Krishnan','Self-employed','Micro-Lending',670,62000,16000,120000,18,'SERVICING',5,6800,'+91 88881 99999',undefined,'Micro-Lending · 18 months'],
  ['APP-030','Prateek Anand','Mphasis','Personal',755,155000,18000,520000,30,'SERVICING',7,156000,'+91 88882 00000','prateek.a@example.com','Personal Loan · 30 months'],
] as const;

const EMPLOYERS_TO_BANK: Record<string, { fip: string; ifsc: string; bankAccount: string }> = {
  'TCS':            { fip: 'HDFC Bank',          ifsc: 'HDFC0004444', bankAccount: 'xxxx1011' },
  'Wipro':          { fip: 'ICICI Bank',         ifsc: 'ICIC0005555', bankAccount: 'xxxx1012' },
  'Flipkart':       { fip: 'HDFC Bank',          ifsc: 'HDFC0007777', bankAccount: 'xxxx1013' },
  'Self-employed':  { fip: 'Kotak Mahindra Bank',ifsc: 'KKBK0001111', bankAccount: 'xxxx1014' },
  'HDFC Bank':      { fip: 'HDFC Bank',          ifsc: 'HDFC0001020', bankAccount: 'xxxx1015' },
  'Tech Mahindra':  { fip: 'Axis Bank',          ifsc: 'UTIB0001020', bankAccount: 'xxxx1016' },
  'Accenture':      { fip: 'Citi Bank',          ifsc: 'CITI0000001', bankAccount: 'xxxx1018' },
  'Capgemini':      { fip: 'Yes Bank',           ifsc: 'YESB0000010', bankAccount: 'xxxx1019' },
  'Adobe India':    { fip: 'SBI',                ifsc: 'SBIN0008080', bankAccount: 'xxxx1021' },
  'Zomato':         { fip: 'ICICI Bank',         ifsc: 'ICIC0003030', bankAccount: 'xxxx1023' },
  'Bajaj Allianz':  { fip: 'Axis Bank',          ifsc: 'UTIB0003030', bankAccount: 'xxxx1024' },
  'Infosys':        { fip: 'Axis Bank',          ifsc: 'UTIB0001100', bankAccount: 'xxxx1025' },
  'Cognizant':      { fip: 'HDFC Bank',          ifsc: 'HDFC0005050', bankAccount: 'xxxx1027' },
  'IBM India':      { fip: 'HDFC Bank',          ifsc: 'HDFC0006060', bankAccount: 'xxxx1028' },
  'Mphasis':        { fip: 'SBI',                ifsc: 'SBIN0009999', bankAccount: 'xxxx1030' },
};

for (const row of EXTRA_NAMES) {
  const [id, name, employer, category, cibil, income, debt, amount, tenure, state, paidEmis, balance, phone, email, purpose] = row;
  const employerKey = employer in EMPLOYERS_TO_BANK ? employer : 'Self-employed';
  const bank = EMPLOYERS_TO_BANK[employerKey] ?? EMPLOYERS_TO_BANK['Self-employed'];
  const startDate = new Date(2025, 7 + (paidEmis as number) % 4, 5 + (paidEmis as number) % 20).toISOString().split('T')[0];

  const overdueEmis = state === 'DEFAULTED' ? 2 : (balance as number) < 10000 && state === 'SERVICING' ? 0 : 0;
  const servicing = state === 'DISBURSING' ? undefined : buildServicing({
    loanAmount: amount as number,
    tenure: tenure as number,
    startDate,
    paidEmis: paidEmis as number,
    overdueEmis,
    currentBalance: balance as number,
  });

  const status: Applicant['status'] = state === 'DEFAULTED' ? 'APPROVED' : state === 'DISBURSING' ? 'APPROVED' : 'APPROVED';
  const dti = Math.round(((debt as number) + ((amount as number) / (tenure as number))) / (income as number) * 100);
  const score = state === 'DEFAULTED' ? 38 : Math.max(55, Math.min(96, 85 - dti / 2 + ((cibil as number) - 700) / 10));

  mockApplicants.push({
    id: id as string,
    name: name as string,
    employer: employer as string,
    loanPurpose: purpose as string,
    cibil: cibil as number,
    income: income as number,
    existingDebt: debt as number,
    requestedAmount: amount as number,
    tenureMonths: tenure as number,
    category: category as ApplicantCategory,
    status,
    loanState: state as Applicant['loanState'],
    affordabilityScore: Math.round(score),
    confidence: Math.round(score) + 4,
    phone: phone as string,
    email: email as (string | undefined),
    reason: state === 'DEFAULTED'
      ? `Loan defaulted at month ${paidEmis}. Borrower's bank balance has been consistently below the EMI threshold.`
      : `Approved at underwriting with strong cash-flow profile. DTI ${dti}%.`,
    analysisSummary: state === 'DEFAULTED'
      ? `Persistent low-balance pattern detected during servicing. Account has been flagged for collections.`
      : `Verified salary credits and stable expense pattern. CIBIL ${cibil}, DTI ${dti}%.`,
    redFlags: state === 'DEFAULTED' ? ['Default after month ' + paidEmis, 'Multiple low-balance events'] : [],
    applicationDate: startDate,
    processingTime: `${3 + (paidEmis as number) % 3}m ${10 + (paidEmis as number) * 4}s`,
    auditTrail: trail(startDate, [
      ["09:14:02Z", "Identity Agent", "DigiLocker handshake complete", "IDENTITY"],
      ["09:14:48Z", "OneMoney AA", `Consent token issued · ${bank.fip} ${bank.bankAccount}`, "CONSENT"],
      ["09:16:11Z", "Risk Agent", `Affordability ${Math.round(score)}/100`, "UNDERWRITING"],
      ["09:17:44Z", "Disbursement Agent", `₹${(amount as number).toLocaleString('en-IN')} released`, "DISBURSEMENT"],
    ]),
    transactions: [
      { date: "2026-05-01", description: `${employer.toUpperCase()} SALARY`, amount: income as number, type: "credit" },
      { date: "2026-05-05", description: "RENT TRANSFER", amount: Math.round((income as number) * 0.18), type: "debit" },
    ],
    consent: makeConsent(id as string, bank.fip, bank.bankAccount, startDate),
    disbursement: makeDisbursement({
      account: bank.bankAccount, ifsc: bank.ifsc, bank: bank.fip, amount: amount as number,
      stage: state === 'DISBURSING' ? 'MANDATE_PENDING' : 'DISBURSED',
      emandateStatus: state === 'DISBURSING' ? 'AWAITING' : 'VERIFIED',
      pennyDropStatus: state === 'DISBURSING' ? 'PENDING' : 'VERIFIED',
      contractStatus: state === 'DISBURSING' ? 'PENDING' : 'SIGNED',
      releasedAt: state === 'DISBURSING' ? undefined : startDate + 'T11:00:00Z',
    }),
    servicing,
  });
}
