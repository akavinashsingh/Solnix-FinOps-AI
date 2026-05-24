import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Applicant, PolicyConfig } from '../data/types';
import { explainFlag } from './anomalyExplainer';
import {
  CheckCircle, XCircle, AlertTriangle, ShieldCheck,
  HelpCircle, Sparkles, AlertCircle, Database, History, Inbox, Clock,
  UserCheck, Info, Play, RefreshCw,
} from 'lucide-react';
import { PageHeader } from './PageHeader';

const formatINR = (n: number) => '₹' + n.toLocaleString('en-IN');
const formatShortINR = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
};
const formatTime = (iso?: string) => iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

const dtiOf = (a: Applicant) => Math.round(((a.existingDebt + (a.requestedAmount / a.tenureMonths)) / a.income) * 100);

const ConfidenceGauge: React.FC<{ value: number; threshold?: number }> = ({ value, threshold = 80 }) => {
  const v = Math.max(0, Math.min(100, value));
  const tone = v >= threshold ? 'bg-success' : v >= 60 ? 'bg-warning' : 'bg-danger';
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-data uppercase tracking-label text-ink-3">Agent Confidence</span>
        <span className={`font-display text-[20px] tracking-tight-data tabular ${v >= threshold ? 'text-success' : v >= 60 ? 'text-warning' : 'text-danger'}`}>
          {v}<span className="text-[11px] text-ink-3 ml-1 font-data">/100</span>
        </span>
      </div>
      <div className="relative h-2 rounded-sm bg-surface-2 border border-border overflow-hidden">
        <div className={`h-full ${tone} transition-all duration-500`} style={{ width: `${v}%` }} />
        <div className="absolute top-[-3px] bottom-[-3px] w-px bg-ink-1/70" style={{ left: `${threshold}%` }} />
      </div>
      <div className="flex justify-between text-[10px] font-data uppercase tracking-label text-ink-3">
        <span>0</span>
        <span>Auto-approve · {threshold}%</span>
        <span>100</span>
      </div>
    </div>
  );
};

/* -------- SLA timer countdown -------- */
const SLATimer: React.FC<{ flaggedAt?: string; slaMinutes: number }> = ({ flaggedAt, slaMinutes }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!flaggedAt) return null;
  const flaggedMs = new Date(flaggedAt).getTime();
  const breachAt = flaggedMs + slaMinutes * 60 * 1000;
  const remainingMs = breachAt - now;
  const breached = remainingMs < 0;
  const mins = Math.floor(Math.abs(remainingMs) / 60000);
  const secs = Math.floor((Math.abs(remainingMs) % 60000) / 1000);
  const tone = breached ? 'text-danger' : remainingMs < 5 * 60 * 1000 ? 'text-warning' : 'text-success';
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-data tabular">
      <Clock size={11} className={tone} />
      <span className={tone}>
        {breached
          ? `SLA breached · ${mins}m ${String(secs).padStart(2, '0')}s ago`
          : `SLA in ${mins}m ${String(secs).padStart(2, '0')}s`}
      </span>
    </div>
  );
};

/* -------- Policy playback simulation -------- */
function simulatePolicy(app: Applicant, policy: PolicyConfig): 'APPROVED' | 'FLAGGED' | 'DENIED' {
  const dti = dtiOf(app);
  const bounces = app.transactions.filter(t => t.isBounce).length;
  if (app.cibil < policy.cibilMin) return 'DENIED';
  if (bounces > policy.bouncesAllowed) return 'DENIED';
  if (dti > policy.dtiMax) return 'DENIED';
  if (dti > policy.dtiFlagAbove || app.cibil < policy.cibilFlagBelow) return 'FLAGGED';
  if (app.affordabilityScore < policy.autoApproveThreshold) return 'FLAGGED';
  return 'APPROVED';
}

export const HITLView: React.FC = () => {
  const {
    applicants, reviewers, activePolicy, policies,
    assignReviewer, handleHITLAction, setView,
  } = useApp();

  const flagged = useMemo(() => applicants.filter(a => a.status === 'FLAGGED'), [applicants]);
  const [selectedId, setSelectedId] = useState<string>(flagged[0]?.id ?? '');
  const [actionInProgress, setActionInProgress] = useState<null | 'APPROVED' | 'DENIED' | 'REQUEST_DOCS'>(null);
  const [comment, setComment] = useState('');
  const [showPlayback, setShowPlayback] = useState(false);

  useEffect(() => {
    if (flagged.length === 0) {
      setSelectedId('');
      return;
    }
    if (!flagged.find(a => a.id === selectedId)) {
      setSelectedId(flagged[0].id);
    }
  }, [flagged, selectedId]);

  const activeApp = flagged.find(a => a.id === selectedId);

  const openConfirm = (action: 'APPROVED' | 'DENIED' | 'REQUEST_DOCS') => {
    setActionInProgress(action);
    setComment('');
  };
  const cancelConfirm = () => { setActionInProgress(null); setComment(''); };
  const submitConfirm = () => {
    if (!activeApp || !actionInProgress) return;
    if (comment.trim().length < 8) return;
    handleHITLAction(activeApp.id, {
      action: actionInProgress,
      comment: comment.trim(),
      reviewerId: activeApp.assignedReviewerId,
    });
    setActionInProgress(null);
    setComment('');
    const remaining = flagged.filter(a => a.id !== activeApp.id);
    setSelectedId(remaining[0]?.id ?? '');
  };

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-7xl w-full">
      <PageHeader
        title="HITL Exception Queue"
        subtitle={
          flagged.length > 0
            ? `${flagged.length} flagged · SLA ${activePolicy.hitlSlaMinutes} min · 4 reviewers online`
            : 'No pending exceptions. All pipelines executed cleanly.'
        }
        right={
          <button
            onClick={() => setView('console')}
            className="h-9 px-3 rounded-md border border-border text-ink-2 text-[12px] font-medium hover:bg-surface-2 cursor-pointer"
          >Back to console</button>
        }
      />

      {flagged.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

          {/* Queue */}
          <aside className="md:col-span-4 glass-card rounded-xl shadow-warm-md overflow-hidden flex flex-col hover:border-warning-bd/20 transition-all duration-300">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0">Flagged queue</h3>
              <span className="text-[10px] font-data tabular text-ink-3">{flagged.length} pending</span>
            </div>
            <div className="flex flex-col overflow-y-auto max-h-[560px]">
              {flagged.map(app => {
                const active = activeApp?.id === app.id;
                const reviewer = reviewers.find(r => r.id === app.assignedReviewerId);
                return (
                  <button
                    key={app.id}
                    onClick={() => setSelectedId(app.id)}
                    className={[
                      'text-left p-4 border-b border-border last:border-b-0 transition-colors cursor-pointer focus-ring',
                      active ? 'bg-warning-bg/60' : 'bg-surface hover:bg-surface-2',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-data text-[11px] text-accent tabular">{app.id}</span>
                      <span className="text-[10px] font-data uppercase tracking-label text-warning bg-warning-bg border border-warning-bd rounded-sm px-1.5 py-0.5">Review</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-medium text-ink-1 text-[14px]">{app.name}</span>
                    </div>
                    {app.employer && <div className="text-[11px] text-ink-3 mt-0.5">{app.employer}</div>}

                    <div className="flex justify-between text-[10px] font-data tabular text-ink-3 mt-2">
                      <span>CIBIL · <span className="text-ink-1">{app.cibil}</span></span>
                      <span>Score · <span className={`${(app.confidence ?? app.affordabilityScore) >= 70 ? 'text-warning' : 'text-danger'}`}>{app.confidence ?? app.affordabilityScore}%</span></span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <SLATimer flaggedAt={app.flaggedAt} slaMinutes={activePolicy.hitlSlaMinutes} />
                      {reviewer ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-data uppercase tracking-label text-accent bg-accent-bg border border-accent rounded-sm px-1.5 py-0.5">
                          <UserCheck size={10} /> {reviewer.initials}
                        </span>
                      ) : (
                        <span className="text-[10px] font-data uppercase tracking-label text-ink-3">Unassigned</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Detail */}
          {activeApp && (
            <section className="md:col-span-8 glass-panel rounded-xl shadow-warm-lg flex flex-col overflow-hidden">

              {/* Header */}
              <div className="border-b border-border p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="font-data text-[11px] text-accent tabular tracking-tight-data">{activeApp.id}</span>
                  <h3 className="font-display text-[22px] text-ink-1 m-0 leading-none">{activeApp.name}</h3>
                  <span className="text-[11px] text-ink-3">{activeApp.employer ?? '—'} {activeApp.loanPurpose ? `· ${activeApp.loanPurpose}` : ''}</span>
                </div>
                <div className="flex flex-col gap-1.5 sm:items-end">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-data uppercase tracking-label text-warning bg-warning-bg border border-warning-bd rounded-sm px-2 py-0.5 w-fit">
                    <AlertTriangle size={11} /> HITL Flagged
                  </span>
                  <SLATimer flaggedAt={activeApp.flaggedAt} slaMinutes={activePolicy.hitlSlaMinutes} />
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-300px)]">

                {/* Reviewer assignment */}
                <div className="bg-surface-2 border border-border rounded-md p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent text-surface flex items-center justify-center text-[12px] font-bold font-data shrink-0">
                      {reviewers.find(r => r.id === activeApp.assignedReviewerId)?.initials ?? '?'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-data uppercase tracking-label text-ink-3">Assigned reviewer</span>
                      <span className="text-[13px] font-medium text-ink-1">
                        {reviewers.find(r => r.id === activeApp.assignedReviewerId)?.name ?? 'Unassigned'}
                      </span>
                    </div>
                  </div>
                  <select
                    value={activeApp.assignedReviewerId ?? ''}
                    onChange={e => assignReviewer(activeApp.id, e.target.value)}
                    className="h-8 px-2 rounded-md border border-border bg-surface text-[12px] text-ink-1 cursor-pointer focus-ring"
                  >
                    <option value="">Unassigned</option>
                    {reviewers.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} · {r.activeCases} cases · {Math.round(r.overrideApprovalRate * 100)}% approve
                      </option>
                    ))}
                  </select>
                </div>

                {/* Confidence + facts */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center border border-border rounded-md p-4">
                  <div className="md:col-span-3">
                    <ConfidenceGauge value={activeApp.confidence ?? activeApp.affordabilityScore} threshold={activePolicy.autoApproveThreshold} />
                  </div>
                  <div className="md:col-span-2 grid grid-cols-2 gap-3 md:border-l md:border-border md:pl-4">
                    <KeyFact label="Requested" value={formatShortINR(activeApp.requestedAmount)} />
                    <KeyFact label="Income / mo" value={formatShortINR(activeApp.income)} />
                    <KeyFact label="CIBIL" value={`${activeApp.cibil}`} />
                    <KeyFact label="DTI" value={`${dtiOf(activeApp)}%`} tone={dtiOf(activeApp) > 45 ? 'danger' : dtiOf(activeApp) > 30 ? 'warning' : 'success'} />
                  </div>
                </div>

                {/* Banner */}
                <div className="p-4 rounded-md border border-warning-bd bg-warning-bg flex items-start gap-3">
                  <AlertTriangle className="shrink-0 mt-0.5 text-warning" size={18} />
                  <div>
                    <h4 className="text-[13px] font-medium text-warning m-0">Human intervention required</h4>
                    <p className="text-[12px] text-ink-2 mt-1 leading-relaxed m-0">
                      Agent confidence is below the {activePolicy.autoApproveThreshold}% auto-approve threshold of the {activePolicy.name} v{activePolicy.version}.
                    </p>
                  </div>
                </div>

                {/* Triggers with anomaly explainer */}
                {activeApp.redFlags && activeApp.redFlags.length > 0 && (
                  <Section icon={<AlertCircle size={14} className="text-danger" />} title="Triggers flagged by Risk Agent">
                    <div className="flex flex-col gap-1.5">
                      {activeApp.redFlags.map((flag, idx) => {
                        const explanation = explainFlag(flag);
                        return <RedFlag key={idx} flag={flag} explanation={explanation} />;
                      })}
                    </div>
                  </Section>
                )}

                {/* AI analysis */}
                <Section icon={<Sparkles size={14} className="text-accent" />} title="AI underwriting analysis">
                  <div className="border-l-2 border-accent pl-4 flex flex-col gap-3">
                    <div>
                      <p className="text-[10px] font-data uppercase tracking-label text-ink-3 mb-1">Cash flow summary</p>
                      <p className="text-[13px] text-ink-1 leading-relaxed m-0">{activeApp.analysisSummary}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-data uppercase tracking-label text-ink-3 mb-1">System rationale</p>
                      <p className="text-[13px] text-ink-2 leading-relaxed m-0">{activeApp.reason}</p>
                    </div>
                  </div>
                </Section>

                {/* Checklist */}
                <Section icon={<ShieldCheck size={14} className="text-success" />} title="Reviewer verification checklist">
                  <div className="bg-success-bg border border-success-bd rounded-md p-3.5 text-[12px] text-ink-1 leading-relaxed">
                    <p className="m-0 mb-1.5 text-success font-medium">Risk recommendations for override:</p>
                    <p className="m-0 text-ink-2">{activeApp.hitlReason || 'Validate bank deposits with co-applicant logs or secondary assets.'}</p>
                  </div>
                </Section>

                {/* Policy playback */}
                <Section
                  icon={<RefreshCw size={14} className="text-accent" />}
                  title="Policy playback"
                  right={
                    <button
                      onClick={() => setShowPlayback(v => !v)}
                      className="text-[11px] text-accent hover:text-accent-2 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Play size={11} /> {showPlayback ? 'Hide' : 'Replay against active + draft'}
                    </button>
                  }
                >
                  {showPlayback ? (
                    <div className="border border-border rounded-md overflow-hidden">
                      <table className="w-full text-[12px] border-collapse">
                        <thead>
                          <tr className="bg-surface-2 border-b border-border text-[10px] font-data uppercase tracking-label text-ink-3">
                            <th className="py-2 px-3 text-left font-medium">Policy</th>
                            <th className="py-2 px-3 text-left font-medium">Version</th>
                            <th className="py-2 px-3 text-left font-medium">Status</th>
                            <th className="py-2 px-3 text-right font-medium">Would decide</th>
                          </tr>
                        </thead>
                        <tbody>
                          {policies.map(p => {
                            const decision = simulatePolicy(activeApp, p);
                            const tone = decision === 'APPROVED' ? 'text-success' : decision === 'FLAGGED' ? 'text-warning' : 'text-danger';
                            return (
                              <tr key={p.id} className="border-b border-border last:border-b-0">
                                <td className="py-2 px-3 text-ink-1">{p.name}</td>
                                <td className="py-2 px-3 font-data tabular text-ink-2">v{p.version}</td>
                                <td className="py-2 px-3 text-[10px] font-data uppercase tracking-label text-ink-3">{p.status}</td>
                                <td className={`py-2 px-3 text-right font-data uppercase tracking-label text-[11px] ${tone}`}>{decision}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-[12px] text-ink-3 m-0">Click "Replay" to see how this applicant would be classified under each policy version — useful before activating a draft policy.</p>
                  )}
                </Section>

                {/* Metrics */}
                <Section title="Declared metrics">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCell label="Income" value={formatINR(activeApp.income)} />
                    <MetricCell label="Existing EMI" value={formatINR(activeApp.existingDebt)} />
                    <MetricCell label="New EMI" value={formatINR(Math.round(activeApp.requestedAmount / activeApp.tenureMonths))} />
                    <MetricCell label="DTI" value={`${dtiOf(activeApp)}%`} tone="warning" />
                  </div>
                </Section>

                {/* Transactions */}
                <Section
                  icon={<Database size={14} className="text-aa-teal" />}
                  title="Recent transactions"
                  right={
                    <span className="inline-flex items-center gap-1 text-[10px] font-data uppercase tracking-label text-aa-teal bg-aa-teal-bg border border-aa-teal-bd rounded-sm px-1.5 py-0.5">
                      <ShieldCheck size={10} /> Verified via OneMoney AA
                    </span>
                  }
                >
                  <div className="border border-border rounded-md overflow-hidden">
                    <table className="w-full text-[12px] border-collapse">
                      <tbody>
                        {activeApp.transactions.map((tx, idx) => (
                          <tr key={idx} className={`border-b border-border last:border-b-0 ${tx.isBounce ? 'bg-danger-bg' : ''}`}>
                            <td className="py-2.5 px-3">
                              <div className="flex flex-col">
                                <span className={`font-medium ${tx.isBounce ? 'text-danger' : 'text-ink-1'}`}>{tx.description}</span>
                                <span className="font-data text-[10px] text-ink-3 tabular">{tx.date}</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-data tabular text-[13px]">
                              <span className={tx.isBounce ? 'text-danger font-medium' : tx.type === 'credit' ? 'text-success font-medium' : 'text-ink-2'}>
                                {tx.type === 'credit' ? '+' : '−'} ₹{tx.amount.toLocaleString('en-IN')}
                              </span>
                              {tx.isBounce && <div className="text-[10px] font-data uppercase tracking-label text-danger mt-0.5">ACH failure</div>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Section>

                {/* Audit trail */}
                {activeApp.auditTrail && activeApp.auditTrail.length > 0 && (
                  <Section icon={<History size={14} className="text-ink-3" />} title="Audit trail">
                    <ol className="flex flex-col gap-2.5 m-0 p-0 list-none">
                      {activeApp.auditTrail.map((entry, idx) => (
                        <li key={idx} className="flex gap-3 text-[12px]">
                          <span className="font-data text-[10px] text-ink-3 tabular pt-0.5 min-w-[58px]">{formatTime(entry.timestamp)}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                          <span className="flex-1">
                            <span className="text-ink-1 font-medium">{entry.agent}</span>
                            <span className="text-ink-2"> · {entry.action}</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </Section>
                )}
              </div>

              {/* Action bar */}
              <div className="border-t border-border bg-surface p-4 flex gap-2">
                <button
                  onClick={() => openConfirm('DENIED')}
                  className="flex-1 h-10 rounded-md border border-danger-bd text-danger text-[12px] font-medium hover:bg-danger-bg flex items-center justify-center gap-1.5 cursor-pointer focus-ring"
                >
                  <XCircle size={14} /> Reject application
                </button>
                <button
                  onClick={() => openConfirm('REQUEST_DOCS')}
                  className="flex-1 h-10 rounded-md border border-border text-ink-2 text-[12px] font-medium hover:bg-surface-2 flex items-center justify-center gap-1.5 cursor-pointer focus-ring"
                >
                  <HelpCircle size={14} /> Request more docs
                </button>
                <button
                  onClick={() => openConfirm('APPROVED')}
                  className="flex-1 h-10 rounded-md bg-accent text-surface text-[12px] font-medium hover:bg-accent-2 flex items-center justify-center gap-1.5 cursor-pointer focus-ring shadow-warm-sm"
                >
                  <CheckCircle size={14} /> Override approve
                </button>
              </div>

              {/* Override-comment modal */}
              {actionInProgress && (
                <OverrideModal
                  action={actionInProgress}
                  applicant={activeApp}
                  comment={comment}
                  setComment={setComment}
                  onCancel={cancelConfirm}
                  onSubmit={submitConfirm}
                />
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------- Subcomponents ---------- */

const EmptyState: React.FC = () => (
  <div className="bg-surface border border-border rounded-xl p-12 text-center shadow-warm-sm max-w-xl mx-auto mt-6 flex flex-col items-center gap-3">
    <div className="w-14 h-14 rounded-md bg-success-bg border border-success-bd text-success flex items-center justify-center">
      <Inbox size={26} />
    </div>
    <h3 className="font-display text-[20px] m-0 text-ink-1">Queue cleared</h3>
    <p className="text-[13px] text-ink-3 max-w-sm leading-relaxed m-0">
      No active applications awaiting Human-in-the-Loop review. All credit pipelines executed successfully.
    </p>
  </div>
);

const Section: React.FC<{ icon?: React.ReactNode; title: string; right?: React.ReactNode; children: React.ReactNode }> = ({ icon, title, right, children }) => (
  <section className="flex flex-col gap-2.5">
    <header className="flex items-center justify-between">
      <h4 className="m-0 text-[10px] font-data uppercase tracking-label text-ink-3 flex items-center gap-1.5">{icon}{title}</h4>
      {right}
    </header>
    {children}
  </section>
);

const KeyFact: React.FC<{ label: string; value: string; tone?: 'success' | 'warning' | 'danger' }> = ({ label, value, tone }) => {
  const toneClass = tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : tone === 'danger' ? 'text-danger' : 'text-ink-1';
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-data uppercase tracking-label text-ink-3">{label}</span>
      <span className={`font-data tabular text-[15px] font-medium mt-0.5 ${toneClass}`}>{value}</span>
    </div>
  );
};

const MetricCell: React.FC<{ label: string; value: string; tone?: 'success' | 'warning' | 'danger' }> = ({ label, value, tone }) => {
  const toneClass = tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : tone === 'danger' ? 'text-danger' : 'text-ink-1';
  return (
    <div className="border border-border rounded-md p-3">
      <span className="text-[10px] font-data uppercase tracking-label text-ink-3 block">{label}</span>
      <span className={`font-data tabular text-[15px] font-medium mt-1 block ${toneClass}`}>{value}</span>
    </div>
  );
};

const RedFlag: React.FC<{ flag: string; explanation: { title: string; detail: string; suggestion: string } }> = ({ flag, explanation }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-danger-bd rounded-md bg-danger-bg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full p-2.5 flex items-center gap-2 text-left text-[12px] text-danger cursor-pointer focus-ring"
      >
        <AlertCircle size={12} className="shrink-0" />
        <span className="flex-1">{flag}</span>
        <span className="text-[10px] font-data uppercase tracking-label flex items-center gap-1">
          <Info size={10} /> {open ? 'hide' : 'explain'}
        </span>
      </button>
      <div className={['disclosure-content', open ? 'open' : ''].join(' ')}>
        <div>
          <div className="px-3 pb-3 pt-1 border-t border-danger-bd/60 text-[12px] text-ink-1 leading-relaxed flex flex-col gap-2 bg-surface">
            <div>
              <p className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0 mb-0.5">{explanation.title}</p>
              <p className="m-0">{explanation.detail}</p>
            </div>
            <div className="border-l-2 border-accent pl-3">
              <p className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0 mb-0.5">What a reviewer should check</p>
              <p className="m-0 text-ink-2">{explanation.suggestion}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OverrideModal: React.FC<{
  action: 'APPROVED' | 'DENIED' | 'REQUEST_DOCS';
  applicant: Applicant;
  comment: string;
  setComment: (v: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}> = ({ action, applicant, comment, setComment, onCancel, onSubmit }) => {
  const config = {
    APPROVED:     { label: 'Override approval', tone: 'accent',  description: 'You are overriding the AI recommendation and approving this loan. This action is permanent and audited.' },
    DENIED:       { label: 'Reject application', tone: 'danger',  description: 'You are denying this application. A denial letter will be issued to the borrower.' },
    REQUEST_DOCS: { label: 'Request additional documents', tone: 'neutral', description: 'You are requesting additional documents from the borrower. The application will remain in PENDING state.' },
  }[action];

  const valid = comment.trim().length >= 8;
  const modalRef = React.useRef<HTMLDivElement>(null);

  // Auto focus dialog first input/textarea on open
  useEffect(() => {
    const focusable = modalRef.current?.querySelectorAll('textarea, button');
    if (focusable && focusable.length > 0) {
      (focusable[0] as HTMLElement).focus();
    }
  }, []);

  // Trap focus inside modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex="0"]'
        );
        if (focusable.length === 0) return;
        const first = focusable[0] as HTMLElement;
        const last = focusable[focusable.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink-1/30 backdrop-blur-[2px]" onClick={onCancel} />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative w-full max-w-md bg-surface border border-border rounded-lg shadow-warm-xl p-6 flex flex-col gap-4 animate-scale-up"
      >
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-data uppercase tracking-label text-ink-3">{applicant.id} · {applicant.name}</span>
          <h3 id="modal-title" className="font-display text-[20px] m-0 text-ink-1">{config.label}</h3>
        </div>

        <p className="text-[12px] text-ink-2 leading-relaxed m-0">{config.description}</p>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="override-justification" className="text-[10px] font-data uppercase tracking-label text-ink-3">
            Reviewer justification <span className="text-danger">*</span> (min 8 chars · stored in audit log)
          </label>
          <textarea
            id="override-justification"
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={4}
            placeholder="e.g., Verified spouse's salary slips. DTI drops to 32% with co-applicant income included."
            className="w-full p-3 border border-border bg-surface-2 rounded-md text-[13px] text-ink-1 placeholder:text-ink-3 focus-ring resize-none"
            autoFocus
          />
          <div className="flex justify-between text-[10px] font-data text-ink-3">
            <span>{valid ? 'Ready to submit' : 'Add at least 8 characters of justification'}</span>
            <span className="tabular">{comment.length}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-md border border-border text-ink-2 text-[12px] font-medium hover:bg-surface-2 cursor-pointer"
          >Cancel</button>
          <button
            onClick={onSubmit}
            disabled={!valid}
            className={[
              'flex-1 h-10 rounded-md text-surface text-[12px] font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-ring',
              action === 'DENIED' ? 'bg-danger' : action === 'APPROVED' ? 'bg-accent hover:bg-accent-2' : 'bg-ink-1',
            ].join(' ')}
          >Confirm {action === 'APPROVED' ? 'Override' : action === 'DENIED' ? 'Rejection' : 'Request'}</button>
        </div>
      </div>
    </div>
  );
};
