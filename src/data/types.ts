/* ============================================================
 *  Shared domain types for Solnix FinOps AI
 * ============================================================ */

export type ApplicantStatus =
  | 'APPROVED'
  | 'FLAGGED'
  | 'DENIED'
  | 'PENDING'
  | 'OVERRIDDEN';

export type LoanState =
  | 'APPLIED'
  | 'APPROVED'
  | 'FLAGGED'
  | 'DENIED'
  | 'PENDING'
  | 'OVERRIDDEN'
  | 'DISBURSING'
  | 'DISBURSED'
  | 'SERVICING'
  | 'CLOSED'
  | 'DEFAULTED';

export type ApplicantCategory = 'Personal' | 'Business' | 'Micro-Lending' | 'Consumer';

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  isBounce?: boolean;
}

export type AuditAgent =
  | 'Identity Agent'
  | 'Risk Agent'
  | 'Disbursement Agent'
  | 'Servicing Agent'
  | 'HITL Reviewer'
  | 'OneMoney AA'
  | 'System'
  | 'Borrower';

export type AuditCategory =
  | 'IDENTITY'
  | 'CONSENT'
  | 'UNDERWRITING'
  | 'HITL'
  | 'DISBURSEMENT'
  | 'SERVICING'
  | 'COMPLIANCE';

export interface AuditLogEntry {
  timestamp: string;
  agent: AuditAgent;
  action: string;
  category?: AuditCategory;
}

export interface GlobalAuditEntry {
  id: string;
  timestamp: string;
  applicantId?: string;
  applicantName?: string;
  actor: string;
  category: AuditCategory;
  action: string;
}

/* ============ Servicing ============ */

export type EMIStatus = 'PAID' | 'DUE' | 'OVERDUE' | 'UPCOMING' | 'WAIVED';

export interface EMIInstallment {
  number: number;
  dueDate: string;     // ISO date
  amount: number;
  principal: number;
  interest: number;
  status: EMIStatus;
  paidDate?: string;
}

export interface ServicingDetails {
  disbursedAt?: string;
  disbursedAmount: number;
  outstandingPrincipal: number;
  totalRepaid: number;
  emisPaid: number;
  emisRemaining: number;
  emisTotal: number;
  nextEmiDate?: string;
  nextEmiAmount?: number;
  daysOverdue?: number;
  onTimeStreak: number;
  currentBalance: number;       // current AA-observed bank balance
  riskScore?: number;           // 0–100 servicing risk
  schedule: EMIInstallment[];
}

/* ============ Disbursement ============ */

export interface DisbursementRecord {
  stage: 'MANDATE_PENDING' | 'PENNY_DROP' | 'CONTRACT_SIGN' | 'READY_TO_RELEASE' | 'DISBURSED';
  emandateStatus: 'PENDING' | 'AWAITING' | 'VERIFIED' | 'FAILED';
  pennyDropStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
  contractStatus: 'PENDING' | 'SENT' | 'SIGNED';
  beneficiaryAccount: string;
  beneficiaryIfsc: string;
  beneficiaryBank: string;
  scheduledFor?: string;
  releasedAt?: string;
}

/* ============ Consent ============ */

export interface ConsentRecord {
  id: string;
  applicantId: string;
  fipName: string;
  bankAccount: string;
  issuedAt: string;
  expiresAt: string;
  scope: string[];
  purpose: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  revokedAt?: string;
  revokedBy?: 'Borrower' | 'System';
}

/* ============ Reviewers ============ */

export interface Reviewer {
  id: string;
  name: string;
  initials: string;
  role: 'Reviewer' | 'Senior Reviewer' | 'Approver';
  activeCases: number;
  avgMinsToReview: number;
  overrideApprovalRate: number; // 0..1
  available: boolean;
}

/* ============ Policy ============ */

export interface PolicyConfig {
  id: string;
  name: string;
  version: number;
  effectiveDate: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  cibilMin: number;
  cibilFlagBelow: number;
  dtiMax: number;
  dtiFlagAbove: number;
  autoApproveThreshold: number;
  hitlSlaMinutes: number;
  maxTicketSize: Record<ApplicantCategory, number>;
  bouncesAllowed: number;
}

/* ============ Nudges ============ */

export type NudgeType = 'LOW_BALANCE' | 'OVERDUE_GRACE' | 'SECOND_MISSED' | 'AT_RISK';

export interface NudgeAlert {
  id: string;
  applicantId: string;
  type: NudgeType;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  daysToEmi?: number;
  emiAmount: number;
  currentBalance: number;
  generatedAt: string;
  status: 'PENDING' | 'NUDGE_SENT' | 'RESOLVED' | 'ESCALATED';
  channelSent?: 'WhatsApp' | 'SMS' | 'Email';
  message: string;
}

/* ============ Applicant ============ */

export interface Applicant {
  id: string;
  name: string;
  employer?: string;
  loanPurpose?: string;
  cibil: number;
  income: number;
  existingDebt: number;
  requestedAmount: number;
  tenureMonths: number;
  category: ApplicantCategory;
  status: ApplicantStatus;
  loanState?: LoanState;
  affordabilityScore: number;
  confidence?: number;
  reason: string;
  hitlReason?: string;
  redFlags?: string[];
  analysisSummary?: string;
  transactions: Transaction[];
  applicationDate: string;
  flaggedAt?: string;
  processingTime: string;
  auditTrail?: AuditLogEntry[];

  /* HITL */
  assignedReviewerId?: string;
  reviewerNotes?: string;

  /* Disbursement / servicing */
  servicing?: ServicingDetails;
  disbursement?: DisbursementRecord;
  consent?: ConsentRecord;

  /* Borrower contact (for the borrower portal demo) */
  phone?: string;
  email?: string;
}
