import type {
  PolicyConfig, Reviewer, NudgeAlert, GlobalAuditEntry,
} from './types';
import { mockApplicants } from './mockApplicants';

/* ============================================================
 *  Reviewers
 * ============================================================ */

export const mockReviewers: Reviewer[] = [
  { id: 'REV-001', name: 'Asha Pillai',     initials: 'AP', role: 'Senior Reviewer', activeCases: 4, avgMinsToReview: 6.4, overrideApprovalRate: 0.68, available: true  },
  { id: 'REV-002', name: 'Ravi Subramanian', initials: 'RS', role: 'Reviewer',        activeCases: 6, avgMinsToReview: 8.1, overrideApprovalRate: 0.54, available: true  },
  { id: 'REV-003', name: 'Neha Sharma',     initials: 'NS', role: 'Reviewer',        activeCases: 5, avgMinsToReview: 7.2, overrideApprovalRate: 0.61, available: true  },
  { id: 'REV-004', name: 'Karthik Rao',     initials: 'KR', role: 'Approver',        activeCases: 2, avgMinsToReview: 4.8, overrideApprovalRate: 0.82, available: false },
];

/* ============================================================
 *  Policies
 * ============================================================ */

export const defaultPolicy: PolicyConfig = {
  id: 'POL-PROD-001',
  name: 'Standard Credit Policy',
  version: 4,
  effectiveDate: '2026-04-01',
  status: 'ACTIVE',
  cibilMin: 600,
  cibilFlagBelow: 700,
  dtiMax: 50,
  dtiFlagAbove: 45,
  autoApproveThreshold: 80,
  hitlSlaMinutes: 30,
  bouncesAllowed: 0,
  maxTicketSize: {
    'Personal':       2500000,
    'Business':       2000000,
    'Micro-Lending':   250000,
    'Consumer':        500000,
  },
};

export const mockPolicies: PolicyConfig[] = [
  defaultPolicy,
  { ...defaultPolicy, id: 'POL-DRAFT-005', name: 'Q3 Tighter Risk Draft', version: 5, status: 'DRAFT', effectiveDate: '2026-07-01', autoApproveThreshold: 85, dtiFlagAbove: 40, cibilFlagBelow: 720 },
  { ...defaultPolicy, id: 'POL-ARCH-003', name: 'Standard Credit Policy', version: 3, status: 'ARCHIVED', effectiveDate: '2025-12-01', autoApproveThreshold: 78, dtiFlagAbove: 50 },
];

/* ============================================================
 *  Predictive nudges — derived from applicants where balance
 *  is below the upcoming EMI within 3 days.
 * ============================================================ */

function generateNudges(): NudgeAlert[] {
  const out: NudgeAlert[] = [];
  for (const app of mockApplicants) {
    if (!app.servicing) continue;
    const s = app.servicing;
    if (!s.nextEmiDate || !s.nextEmiAmount) continue;

    const daysToEmi = Math.round((new Date(s.nextEmiDate).getTime() - Date.now()) / 86400000);

    // CRITICAL: already overdue
    if (s.daysOverdue && s.daysOverdue > 0) {
      out.push({
        id: `NDG-${app.id}-OVD`,
        applicantId: app.id,
        type: 'OVERDUE_GRACE',
        severity: 'CRITICAL',
        emiAmount: s.nextEmiAmount,
        currentBalance: s.currentBalance,
        generatedAt: new Date(Date.now() - s.daysOverdue * 86400000).toISOString(),
        status: 'PENDING',
        message: `EMI #${s.emisPaid + 1} is ${s.daysOverdue} days overdue. Multi-channel reminder + late-fee notification pending.`,
      });
      continue;
    }

    // WARNING: balance shortfall within 3 days of due
    if (daysToEmi >= 0 && daysToEmi <= 3 && s.currentBalance < s.nextEmiAmount) {
      out.push({
        id: `NDG-${app.id}-LB`,
        applicantId: app.id,
        type: 'LOW_BALANCE',
        severity: daysToEmi <= 1 ? 'CRITICAL' : 'WARNING',
        daysToEmi,
        emiAmount: s.nextEmiAmount,
        currentBalance: s.currentBalance,
        generatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        status: 'PENDING',
        message: daysToEmi === 0
          ? `EMI of ₹${s.nextEmiAmount.toLocaleString('en-IN')} due today. Balance ₹${s.currentBalance.toLocaleString('en-IN')} is insufficient — send proactive nudge.`
          : `EMI of ₹${s.nextEmiAmount.toLocaleString('en-IN')} due in ${daysToEmi} day(s). Balance ₹${s.currentBalance.toLocaleString('en-IN')} below threshold.`,
      });
      continue;
    }

    // INFO: balance shortfall further out
    if (daysToEmi > 0 && daysToEmi <= 7 && s.currentBalance < s.nextEmiAmount * 1.2) {
      out.push({
        id: `NDG-${app.id}-AR`,
        applicantId: app.id,
        type: 'AT_RISK',
        severity: 'INFO',
        daysToEmi,
        emiAmount: s.nextEmiAmount,
        currentBalance: s.currentBalance,
        generatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        status: 'PENDING',
        message: `EMI cushion below 20% safety margin. Monitor for further drop before sending nudge.`,
      });
    }
  }
  return out;
}

export const mockNudges: NudgeAlert[] = generateNudges();

/* ============================================================
 *  Global audit log — flattens per-applicant audit entries
 *  plus adds servicing + consent + policy actions.
 * ============================================================ */

function buildGlobalAuditLog(): GlobalAuditEntry[] {
  const entries: GlobalAuditEntry[] = [];

  for (const app of mockApplicants) {
    for (const e of app.auditTrail ?? []) {
      entries.push({
        id: `${app.id}-${e.timestamp}`,
        timestamp: e.timestamp,
        applicantId: app.id,
        applicantName: app.name,
        actor: e.agent,
        category: e.category ?? 'UNDERWRITING',
        action: e.action,
      });
    }

    // Servicing events
    if (app.servicing) {
      for (const emi of app.servicing.schedule) {
        if (emi.status === 'PAID' && emi.paidDate) {
          entries.push({
            id: `${app.id}-PAID-${emi.number}`,
            timestamp: `${emi.paidDate}T09:30:00Z`,
            applicantId: app.id,
            applicantName: app.name,
            actor: 'Servicing Agent',
            category: 'SERVICING',
            action: `EMI #${emi.number} collected · ₹${emi.amount.toLocaleString('en-IN')}`,
          });
        }
        if (emi.status === 'OVERDUE') {
          entries.push({
            id: `${app.id}-OVD-${emi.number}`,
            timestamp: `${emi.dueDate}T23:59:00Z`,
            applicantId: app.id,
            applicantName: app.name,
            actor: 'Servicing Agent',
            category: 'SERVICING',
            action: `EMI #${emi.number} marked OVERDUE`,
          });
        }
      }
    }
  }

  // Policy + system entries
  entries.push({
    id: 'POL-001-EFF',
    timestamp: '2026-04-01T00:00:00Z',
    actor: 'System',
    category: 'COMPLIANCE',
    action: `Policy ${defaultPolicy.name} v${defaultPolicy.version} activated`,
  });

  return entries.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
}

export const mockGlobalAudit: GlobalAuditEntry[] = buildGlobalAuditLog();
