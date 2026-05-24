import React, { createContext, useContext, useEffect, useState } from 'react';
import { mockApplicants } from '../data/mockApplicants';
import { mockGlobalAudit, mockNudges, mockPolicies, mockReviewers } from '../data/mockOps';
import { underwriteApplicant } from '../services/gemini';
import type {
  Applicant, AuditLogEntry, ConsentRecord, GlobalAuditEntry, NudgeAlert,
  PolicyConfig, Reviewer, Transaction,
} from '../data/types';

export type ViewState =
  | 'console'
  | 'pipeline'
  | 'hitl'
  | 'disbursement'
  | 'servicing'
  | 'nudge'
  | 'analytics'
  | 'policy'
  | 'compliance'
  | 'borrower';

export type PipelineStage = 'idle' | 'consent' | 'processing' | 'complete';

export type PipelineStepKey =
  | 'identity'
  | 'aa_consent'
  | 'aa_fetch'
  | 'ai_analysis'
  | 'report'
  | 'decision';

export interface PipelineStep {
  key: PipelineStepKey;
  label: string;
  description: string;
}

export const PIPELINE_STEPS: PipelineStep[] = [
  { key: 'identity',    label: 'Identity verification',         description: 'CKYC · DigiLocker · liveness check' },
  { key: 'aa_consent',  label: 'AA consent initiated',          description: 'OneMoney handshake · token issued' },
  { key: 'aa_fetch',    label: 'Bank data fetched',             description: '6 months of FIP statements pulled' },
  { key: 'ai_analysis', label: 'AI credit analysis',            description: 'Cash flow · DTI · anomaly scan' },
  { key: 'report',      label: 'Generating underwriting report', description: 'Narrative · red flags · rationale' },
  { key: 'decision',    label: 'Final decision',                description: 'Approve · Flag · Deny' },
];

export interface ApplicationFormData {
  name: string;
  cibil: number;
  income: number;
  existingDebt: number;
  requestedAmount: number;
  tenureMonths: number;
  category: Applicant['category'];
  transactions: Transaction[];
}

export interface HITLActionInput {
  action: 'APPROVED' | 'DENIED' | 'REQUEST_DOCS';
  comment: string;
  reviewerId?: string;
}

interface AppContextType {
  view: ViewState;
  setView: (view: ViewState) => void;
  applicants: Applicant[];
  setApplicants: React.Dispatch<React.SetStateAction<Applicant[]>>;
  activeApplicant: Applicant | null;
  setActiveApplicant: (applicant: Applicant | null) => void;

  /* Underwriting pipeline */
  pipelineStage: PipelineStage;
  setPipelineStage: (stage: PipelineStage) => void;
  currentStepIndex: number;
  stepElapsed: number[];
  elapsedMs: number;
  runUnderwritingPipeline: (form: ApplicationFormData) => Promise<void>;
  resetPipeline: () => void;
  geminiStatus: boolean;

  /* HITL */
  reviewers: Reviewer[];
  assignReviewer: (applicantId: string, reviewerId: string) => void;
  handleHITLAction: (applicantId: string, input: HITLActionInput) => void;

  /* Policies */
  policies: PolicyConfig[];
  activePolicy: PolicyConfig;
  updateActivePolicy: (patch: Partial<PolicyConfig>) => void;

  /* Nudges */
  nudges: NudgeAlert[];
  sendNudge: (nudgeId: string, channel: 'WhatsApp' | 'SMS' | 'Email') => void;
  resolveNudge: (nudgeId: string) => void;
  escalateNudge: (nudgeId: string) => void;

  /* Disbursement */
  advanceDisbursement: (applicantId: string) => void;
  releaseFunds: (applicantId: string) => void;

  /* Compliance */
  globalAudit: GlobalAuditEntry[];
  revokeConsent: (applicantId: string) => void;

  /* Conversational query (Cmd+K) */
  cmdkOpen: boolean;
  setCmdkOpen: (open: boolean) => void;

  /* Borrower portal */
  borrowerApplicantId: string;
  setBorrowerApplicantId: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const STEP_DELAYS_MS: Record<PipelineStepKey, number> = {
  identity: 800,
  aa_consent: 700,
  aa_fetch: 1100,
  ai_analysis: 0,
  report: 600,
  decision: 400,
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<ViewState>('console');
  const [applicants, setApplicants] = useState<Applicant[]>(mockApplicants);
  const [activeApplicant, setActiveApplicant] = useState<Applicant | null>(null);

  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('idle');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [stepElapsed, setStepElapsed] = useState<number[]>([]);
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  const [reviewers] = useState<Reviewer[]>(mockReviewers);
  const [policies, setPolicies] = useState<PolicyConfig[]>(mockPolicies);
  const [nudges, setNudges] = useState<NudgeAlert[]>(mockNudges);
  const [globalAudit, setGlobalAudit] = useState<GlobalAuditEntry[]>(mockGlobalAudit);

  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [borrowerApplicantId, setBorrowerApplicantId] = useState<string>('APP-001');

  const geminiKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) || '';
  const geminiStatus = typeof geminiKey === 'string' && geminiKey.trim().length > 0;

  const activePolicy = policies.find(p => p.status === 'ACTIVE') ?? policies[0];

  const resetPipeline = () => {
    setPipelineStage('idle');
    setCurrentStepIndex(-1);
    setStepElapsed([]);
    setElapsedMs(0);
  };

  const appendGlobalAudit = (entry: GlobalAuditEntry) =>
    setGlobalAudit(prev => [entry, ...prev]);

  /* ============================================================
   *  Cmd+K global shortcut
   * ============================================================ */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdkOpen(open => !open);
      } else if (e.key === 'Escape') {
        setCmdkOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /* ============================================================
   *  Underwriting pipeline
   * ============================================================ */
  const runUnderwritingPipeline = async (form: ApplicationFormData) => {
    setPipelineStage('processing');
    setCurrentStepIndex(-1);
    setStepElapsed([]);
    setElapsedMs(0);

    const startedAt = Date.now();
    const elapsedTimer = window.setInterval(() => setElapsedMs(Date.now() - startedAt), 100);
    const completed: number[] = [];

    try {
      for (let i = 0; i < PIPELINE_STEPS.length; i++) {
        const step = PIPELINE_STEPS[i];
        setCurrentStepIndex(i);
        const stepStart = Date.now();

        if (step.key === 'ai_analysis') {
          const analysis = await underwriteApplicant(
            form.name, form.cibil, form.income, form.existingDebt,
            form.requestedAmount, form.tenureMonths, form.transactions
          );
          completed[i] = Date.now() - stepStart;
          setStepElapsed([...completed]);

          for (let j = i + 1; j < PIPELINE_STEPS.length; j++) {
            const next = PIPELINE_STEPS[j];
            setCurrentStepIndex(j);
            const tickStart = Date.now();
            await sleep(STEP_DELAYS_MS[next.key]);
            completed[j] = Date.now() - tickStart;
            setStepElapsed([...completed]);
          }

          window.clearInterval(elapsedTimer);
          const totalMs = Date.now() - startedAt;
          setElapsedMs(totalMs);

          const newId = `APP-${String(applicants.length + 1).padStart(3, '0')}`;
          const applicationDate = new Date().toISOString().split('T')[0];
          const flaggedAt = analysis.decision === 'FLAGGED' ? new Date().toISOString() : undefined;

          const audit: AuditLogEntry[] = [
            { timestamp: new Date(startedAt + completed[0]).toISOString(), agent: 'Identity Agent', action: 'CKYC + DigiLocker handshake complete', category: 'IDENTITY' },
            { timestamp: new Date(startedAt + completed[0] + completed[1]).toISOString(), agent: 'OneMoney AA', action: 'Consent token issued · 6-month read scope', category: 'CONSENT' },
            { timestamp: new Date(startedAt + completed[0] + completed[1] + completed[2]).toISOString(), agent: 'Risk Agent', action: `Affordability ${analysis.affordabilityScore}/100 evaluated`, category: 'UNDERWRITING' },
          ];
          if (analysis.decision === 'FLAGGED') {
            audit.push({ timestamp: new Date(startedAt + totalMs).toISOString(), agent: 'System', action: 'Routed to HITL queue · Credit Review Team', category: 'HITL' });
          } else if (analysis.decision === 'APPROVED') {
            audit.push({ timestamp: new Date(startedAt + totalMs).toISOString(), agent: 'Disbursement Agent', action: 'E-mandate drafted · awaiting borrower sign', category: 'DISBURSEMENT' });
          } else {
            audit.push({ timestamp: new Date(startedAt + totalMs).toISOString(), agent: 'System', action: 'Denial letter generated · borrower notified', category: 'COMPLIANCE' });
          }

          const processingSeconds = Math.max(1, Math.round(totalMs / 1000));
          const processingTime = processingSeconds >= 60
            ? `${Math.floor(processingSeconds / 60)}m ${String(processingSeconds % 60).padStart(2, '0')}s`
            : `0m ${String(processingSeconds).padStart(2, '0')}s`;

          const consent: ConsentRecord = {
            id: `CON-${newId}`,
            applicantId: newId,
            fipName: 'HDFC Bank',
            bankAccount: 'xxxx4521',
            issuedAt: new Date(startedAt).toISOString(),
            expiresAt: new Date(startedAt + 24 * 3600 * 1000).toISOString(),
            scope: ['Transactions', 'Balance', 'Profile'],
            purpose: 'Loan eligibility credit assessment',
            status: 'ACTIVE',
          };

          const newApplicant: Applicant = {
            id: newId,
            name: form.name,
            cibil: form.cibil,
            income: form.income,
            existingDebt: form.existingDebt,
            requestedAmount: form.requestedAmount,
            tenureMonths: form.tenureMonths,
            category: form.category,
            status: analysis.decision,
            loanState: analysis.decision,
            affordabilityScore: analysis.affordabilityScore,
            confidence: analysis.decision === 'FLAGGED'
              ? Math.min(79, Math.max(55, analysis.affordabilityScore + 5))
              : Math.min(99, Math.max(80, analysis.affordabilityScore + 5)),
            reason: analysis.reason,
            hitlReason: analysis.hitlReason,
            redFlags: analysis.redFlags,
            analysisSummary: analysis.analysisSummary,
            transactions: form.transactions,
            applicationDate,
            flaggedAt,
            processingTime,
            auditTrail: audit,
            consent,
          };

          setApplicants(prev => [newApplicant, ...prev]);
          setActiveApplicant(newApplicant);
          appendGlobalAudit({
            id: `${newId}-${audit[audit.length - 1].timestamp}`,
            timestamp: audit[audit.length - 1].timestamp,
            applicantId: newId,
            applicantName: form.name,
            actor: audit[audit.length - 1].agent,
            category: audit[audit.length - 1].category ?? 'UNDERWRITING',
            action: audit[audit.length - 1].action,
          });
          setPipelineStage('complete');
          return;
        }

        await sleep(STEP_DELAYS_MS[step.key]);
        completed[i] = Date.now() - stepStart;
        setStepElapsed([...completed]);
      }
    } catch (error) {
      console.error('Pipeline failure:', error);
      window.clearInterval(elapsedTimer);
      resetPipeline();
    }
  };

  /* ============================================================
   *  HITL actions
   * ============================================================ */
  const assignReviewer = (applicantId: string, reviewerId: string) => {
    setApplicants(prev => prev.map(a => a.id === applicantId ? { ...a, assignedReviewerId: reviewerId } : a));
  };

  const handleHITLAction = (applicantId: string, input: HITLActionInput) => {
    const stamp = new Date().toISOString();
    const reviewerName = reviewers.find(r => r.id === input.reviewerId)?.name ?? 'HITL Reviewer';

    setApplicants(prev => prev.map(app => {
      if (app.id !== applicantId) return app;
      let newStatus: Applicant['status'] = app.status;
      let newLoanState: Applicant['loanState'] = app.loanState;
      let actionLabel = '';
      if (input.action === 'APPROVED') {
        newStatus = 'OVERRIDDEN';
        newLoanState = 'DISBURSING';
        actionLabel = 'Approved override · loan moves to disbursement queue';
      } else if (input.action === 'DENIED') {
        newStatus = 'DENIED';
        newLoanState = 'DENIED';
        actionLabel = 'Denied override · borrower notified';
      } else if (input.action === 'REQUEST_DOCS') {
        newStatus = 'PENDING';
        newLoanState = 'PENDING';
        actionLabel = 'Additional documents requested from borrower';
      }
      const noteSuffix = input.comment ? ` — ${reviewerName}: "${input.comment}"` : '';
      const nextAudit: AuditLogEntry[] = [
        ...(app.auditTrail ?? []),
        { timestamp: stamp, agent: 'HITL Reviewer', action: actionLabel + noteSuffix, category: 'HITL' },
      ];
      return { ...app, status: newStatus, loanState: newLoanState, reviewerNotes: input.comment, auditTrail: nextAudit };
    }));

    setActiveApplicant(prev => {
      if (!prev || prev.id !== applicantId) return prev;
      let newStatus: Applicant['status'] = prev.status;
      if (input.action === 'APPROVED') newStatus = 'OVERRIDDEN';
      else if (input.action === 'DENIED') newStatus = 'DENIED';
      else if (input.action === 'REQUEST_DOCS') newStatus = 'PENDING';
      return { ...prev, status: newStatus };
    });

    const app = applicants.find(a => a.id === applicantId);
    appendGlobalAudit({
      id: `${applicantId}-HITL-${stamp}`,
      timestamp: stamp,
      applicantId,
      applicantName: app?.name,
      actor: reviewerName,
      category: 'HITL',
      action: input.action === 'APPROVED' ? 'Override approved' : input.action === 'DENIED' ? 'Override denied' : 'Documents requested',
    });
  };

  /* ============================================================
   *  Policy
   * ============================================================ */
  const updateActivePolicy = (patch: Partial<PolicyConfig>) => {
    setPolicies(prev => prev.map(p => p.status === 'ACTIVE' ? { ...p, ...patch } : p));
    appendGlobalAudit({
      id: `POL-EDIT-${new Date().toISOString()}`,
      timestamp: new Date().toISOString(),
      actor: 'Admin',
      category: 'COMPLIANCE',
      action: `Policy updated: ${Object.keys(patch).join(', ')}`,
    });
  };

  /* ============================================================
   *  Nudges
   * ============================================================ */
  const sendNudge = (nudgeId: string, channel: 'WhatsApp' | 'SMS' | 'Email') => {
    setNudges(prev => prev.map(n => n.id === nudgeId ? { ...n, status: 'NUDGE_SENT', channelSent: channel } : n));
    const n = nudges.find(x => x.id === nudgeId);
    if (n) {
      const app = applicants.find(a => a.id === n.applicantId);
      appendGlobalAudit({
        id: `${n.applicantId}-NUDGE-${Date.now()}`,
        timestamp: new Date().toISOString(),
        applicantId: n.applicantId,
        applicantName: app?.name,
        actor: 'Servicing Agent',
        category: 'SERVICING',
        action: `Nudge sent via ${channel}: ${n.message}`,
      });
    }
  };

  const resolveNudge = (nudgeId: string) => {
    setNudges(prev => prev.map(n => n.id === nudgeId ? { ...n, status: 'RESOLVED' } : n));
  };

  const escalateNudge = (nudgeId: string) => {
    setNudges(prev => prev.map(n => n.id === nudgeId ? { ...n, status: 'ESCALATED', severity: 'CRITICAL' } : n));
  };

  /* ============================================================
   *  Disbursement
   * ============================================================ */
  const advanceDisbursement = (applicantId: string) => {
    setApplicants(prev => prev.map(app => {
      if (app.id !== applicantId || !app.disbursement) return app;
      const order: Array<typeof app.disbursement.stage> = [
        'MANDATE_PENDING', 'PENNY_DROP', 'CONTRACT_SIGN', 'READY_TO_RELEASE', 'DISBURSED',
      ];
      const idx = order.indexOf(app.disbursement.stage);
      const next = order[Math.min(idx + 1, order.length - 1)];
      const d = { ...app.disbursement, stage: next };
      if (next === 'PENNY_DROP') d.emandateStatus = 'VERIFIED';
      if (next === 'CONTRACT_SIGN') d.pennyDropStatus = 'VERIFIED';
      if (next === 'READY_TO_RELEASE') d.contractStatus = 'SIGNED';
      return { ...app, disbursement: d };
    }));
  };

  const releaseFunds = (applicantId: string) => {
    const stamp = new Date().toISOString();
    setApplicants(prev => prev.map(app => {
      if (app.id !== applicantId || !app.disbursement) return app;
      return {
        ...app,
        loanState: 'SERVICING',
        disbursement: { ...app.disbursement, stage: 'DISBURSED', releasedAt: stamp },
      };
    }));
    const app = applicants.find(a => a.id === applicantId);
    if (app) {
      appendGlobalAudit({
        id: `${applicantId}-RELEASE-${stamp}`,
        timestamp: stamp,
        applicantId,
        applicantName: app.name,
        actor: 'Disbursement Agent',
        category: 'DISBURSEMENT',
        action: `₹${app.requestedAmount.toLocaleString('en-IN')} released to ${app.disbursement?.beneficiaryBank} ${app.disbursement?.beneficiaryAccount}`,
      });
    }
  };

  /* ============================================================
   *  Consent revocation (DPDP)
   * ============================================================ */
  const revokeConsent = (applicantId: string) => {
    const stamp = new Date().toISOString();
    setApplicants(prev => prev.map(app => {
      if (app.id !== applicantId || !app.consent) return app;
      return { ...app, consent: { ...app.consent, status: 'REVOKED', revokedAt: stamp, revokedBy: 'Borrower' } };
    }));
    const app = applicants.find(a => a.id === applicantId);
    if (app) {
      appendGlobalAudit({
        id: `${applicantId}-REVOKE-${stamp}`,
        timestamp: stamp,
        applicantId,
        applicantName: app.name,
        actor: 'Borrower',
        category: 'COMPLIANCE',
        action: 'Consent revoked · derived data scheduled for deletion (T+0 hours)',
      });
    }
  };

  return (
    <AppContext.Provider value={{
      view, setView,
      applicants, setApplicants,
      activeApplicant, setActiveApplicant,
      pipelineStage, setPipelineStage,
      currentStepIndex, stepElapsed, elapsedMs,
      runUnderwritingPipeline, resetPipeline, geminiStatus,
      reviewers, assignReviewer, handleHITLAction,
      policies, activePolicy, updateActivePolicy,
      nudges, sendNudge, resolveNudge, escalateNudge,
      advanceDisbursement, releaseFunds,
      globalAudit, revokeConsent,
      cmdkOpen, setCmdkOpen,
      borrowerApplicantId, setBorrowerApplicantId,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};
