export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  isBounce?: boolean;
}

export interface Applicant {
  id: string;
  name: string;
  cibil: number;
  income: number; // Avg monthly income in INR
  existingDebt: number; // Monthly EMI obligations in INR
  requestedAmount: number;
  tenureMonths: number;
  category: 'Personal' | 'Business' | 'Micro-Lending' | 'Consumer';
  status: 'APPROVED' | 'FLAGGED' | 'DENIED' | 'PENDING' | 'OVERRIDDEN';
  affordabilityScore: number; // calculated 0 - 100
  reason: string;
  hitlReason?: string;
  redFlags?: string[];
  analysisSummary?: string;
  transactions: Transaction[];
  applicationDate: string;
}

export const mockApplicants: Applicant[] = [
  {
    id: "APP-001",
    name: "Rahul Sharma",
    cibil: 785,
    income: 150000,
    existingDebt: 12000,
    requestedAmount: 500000,
    tenureMonths: 24,
    category: "Personal",
    status: "APPROVED",
    affordabilityScore: 88,
    reason: "Strong cash flow with stable monthly salary credits from TCS. Debt-to-income ratio (DTI) is healthy at 8%. CIBIL score indicates excellent historical repayment behavior. Low credit utilization and zero negative balance warnings.",
    analysisSummary: "Verified salary credits of ₹1,50,000 on the 1st of every month. Avg monthly savings rate is 38%. Recurring expenses are stable. Underwriting criteria fully met.",
    redFlags: [],
    applicationDate: "2026-05-22",
    transactions: [
      { date: "2026-05-01", description: "TCS SALARY CRED", amount: 150000, type: "credit" },
      { date: "2026-05-03", description: "HDFC HOME LOAN EMI", amount: 12000, type: "debit" },
      { date: "2026-05-05", description: "D-MART SUPERMARKET", amount: 8500, type: "debit" },
      { date: "2026-05-10", description: "SWIGGY FOOD DELIVERY", amount: 1200, type: "debit" },
      { date: "2026-05-15", description: "INTEREST CREDIT HDFC", amount: 450, type: "credit" },
      { date: "2026-05-20", description: "ACT FIBERNET BILL", amount: 1199, type: "debit" }
    ]
  },
  {
    id: "APP-002",
    name: "Priya Mehta",
    cibil: 675,
    income: 85000,
    existingDebt: 15000,
    requestedAmount: 300000,
    tenureMonths: 12,
    category: "Business",
    status: "FLAGGED",
    affordabilityScore: 61,
    reason: "Freelance developer with highly irregular income credits. High cash flow variance detected (credits vary ±55% month-on-month). Three hard credit queries recorded in the past 45 days. Repayment capacity is tight with active monthly EMI commitments at 17.6% of declared average income.",
    hitlReason: "Verify freelance contract consistency and inspect the last 6 months of bank statement logs to confirm if the low-credit months are seasonal or indicate a downward cashflow trend.",
    analysisSummary: "Average monthly deposits of ₹85,000, but credits arrived on unpredictable dates (May 12th, Apr 28th, Mar 5th). Significant cash reserves drain around the 20th of each month. High credit card balance settlement spikes.",
    redFlags: [
      "High cash flow variance (>40%)",
      "Multiple credit inquiries in last 60 days",
      "Irregular monthly credit intervals"
    ],
    applicationDate: "2026-05-23",
    transactions: [
      { date: "2026-05-12", description: "UPWORK ESCROW CRD", amount: 45000, type: "credit" },
      { date: "2026-05-18", description: "CRED CC SETTLEMENT", amount: 28000, type: "debit" },
      { date: "2026-05-20", description: "EMI HDFC CAR LOAN", amount: 15000, type: "debit" },
      { date: "2026-05-22", description: "FIVERR PAYOUT", amount: 35000, type: "credit" }
    ]
  },
  {
    id: "APP-003",
    name: "Amit Verma",
    cibil: 540,
    income: 45000,
    existingDebt: 22000,
    requestedAmount: 150000,
    tenureMonths: 18,
    category: "Consumer",
    status: "DENIED",
    affordabilityScore: 24,
    reason: "Extremely high Debt-to-Income (DTI) ratio at 48.8%. Multiple insufficient balance transaction bounces (ACH return) detected in the active statement. CIBIL score is below the lending threshold of 600 due to past write-offs. Negative trend in average daily ledger balance.",
    analysisSummary: "Account holds a persistent low balance (under ₹2,000) for 18 days of the month. Two separate debit attempt failures due to insufficient funds. Severe over-leverage.",
    redFlags: [
      "CIBIL score below NBFC threshold (540 < 600)",
      "2x Insufficient Balance ACH Bounces in last 30 days",
      "Debt-to-Income ratio exceeds safety limit of 40%"
    ],
    applicationDate: "2026-05-21",
    transactions: [
      { date: "2026-05-02", description: "LOCAL SHOP CRD", amount: 25000, type: "credit" },
      { date: "2026-05-05", description: "ACH DEBIT BOUNCE", amount: 8000, type: "debit", isBounce: true },
      { date: "2026-05-10", description: "CASH WITHDRAWAL", amount: 15000, type: "debit" },
      { date: "2026-05-12", description: "ACH DEBIT BOUNCE", amount: 8000, type: "debit", isBounce: true },
      { date: "2026-05-20", description: "PAYTM TRANSFER CRD", amount: 12000, type: "credit" }
    ]
  },
  {
    id: "APP-004",
    name: "Arjun Singh",
    cibil: 815,
    income: 220000,
    existingDebt: 0,
    requestedAmount: 1000000,
    tenureMonths: 36,
    category: "Personal",
    status: "APPROVED",
    affordabilityScore: 96,
    reason: "Outstanding credit profile. Absolute zero active debt obligations. Highly stable, premium salary credits from Google India. Exceptional average daily balance. Excellent credit history with zero defaults.",
    analysisSummary: "Salary credit of ₹2,20,000 fully verified. Savings rate exceeds 65%. Liquidity is optimal for immediate disbursement.",
    redFlags: [],
    applicationDate: "2026-05-20",
    transactions: [
      { date: "2026-05-01", description: "GOOGLE SALARY CRED", amount: 220000, type: "credit" },
      { date: "2026-05-03", description: "MUTUAL FUND SIP", amount: 45000, type: "debit" },
      { date: "2026-05-07", description: "CRED CREDIT CARD", amount: 32000, type: "debit" },
      { date: "2026-05-15", description: "STOCK BROKER ADD", amount: 20000, type: "debit" }
    ]
  }
];
