import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Applicant } from '../data/types';
import { explainFlag } from './anomalyExplainer';
import {
  Plus, Search, CheckCircle, AlertTriangle, XCircle, Clock,
  ChevronRight, ShieldCheck, Database, History, X, ArrowUpRight,
  TrendingUp, AlertCircle, FileText, Sparkles, Info, SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';

const formatINR = (n: number) => '₹' + n.toLocaleString('en-IN');
const formatShortINR = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
};

const StatusBadge: React.FC<{ status: Applicant['status']; size?: 'sm' | 'md' }> = ({ status, size = 'sm' }) => {
  const base = size === 'md'
    ? 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-data uppercase tracking-label border'
    : 'inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-data uppercase tracking-label border';

  switch (status) {
    case 'APPROVED':
      return <span className={`${base} bg-success-bg text-success border-success-bd`}><CheckCircle size={size === 'md' ? 12 : 10} />Auto-Approved</span>;
    case 'OVERRIDDEN':
      return <span className={`${base} bg-accent-bg text-accent border-accent`}><CheckCircle size={size === 'md' ? 12 : 10} />Override</span>;
    case 'FLAGGED':
      return <span className={`${base} bg-warning-bg text-warning border-warning-bd`}><AlertTriangle size={size === 'md' ? 12 : 10} />HITL Flagged</span>;
    case 'DENIED':
      return <span className={`${base} bg-danger-bg text-danger border-danger-bd`}><XCircle size={size === 'md' ? 12 : 10} />Denied</span>;
    case 'PENDING':
      return <span className={`${base} bg-surface-2 text-ink-2 border-border`}><Clock size={size === 'md' ? 12 : 10} />Docs Requested</span>;
    default:
      return null;
  }
};

// Tiny 5-bar CIBIL indicator
const CibilBars: React.FC<{ score: number }> = ({ score }) => {
  // Map 300–900 → 0–5 bars
  const filled = Math.max(0, Math.min(5, Math.round((score - 300) / 120)));
  const color = score >= 750 ? 'bg-success' : score >= 650 ? 'bg-warning' : 'bg-danger';
  return (
    <span className="inline-flex items-end gap-[2px] ml-2 align-middle" aria-hidden>
      {[0, 1, 2, 3, 4].map(i => (
        <span
          key={i}
          className={`w-[3px] rounded-sm ${i < filled ? color : 'bg-border-2'}`}
          style={{ height: `${6 + i * 2}px` }}
        />
      ))}
    </span>
  );
};

// Sparkline for approved portfolio trend (mock static SVG)
const Sparkline: React.FC<{ color: string }> = ({ color }) => (
  <svg width="64" height="20" viewBox="0 0 64 20" className="opacity-80">
    <polyline
      points="0,15 8,13 16,14 24,10 32,11 40,7 48,9 56,5 64,4"
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ScoreCell: React.FC<{ score: number }> = ({ score }) => {
  const tone = score >= 80 ? 'border-l-success text-success' : score >= 50 ? 'border-l-warning text-warning' : 'border-l-danger text-danger';
  return (
    <span className={`inline-flex items-center justify-end gap-2 font-data tabular ${tone} border-l-2 pl-2`}>
      <span className="font-medium text-ink-1">{score}</span>
      <span className="text-[10px] text-ink-3">/100</span>
    </span>
  );
};

export const ConsoleView: React.FC = () => {
  const { applicants, setView, setActiveApplicant, activeApplicant, handleHITLAction } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | Applicant['status']>('ALL');

  const totalCount = applicants.length;
  const approvedCount = applicants.filter(a => a.status === 'APPROVED' || a.status === 'OVERRIDDEN').length;
  const flaggedCount = applicants.filter(a => a.status === 'FLAGGED').length;
  const deniedCount = applicants.filter(a => a.status === 'DENIED').length;
  const totalDisbursed = applicants
    .filter(a => a.status === 'APPROVED' || a.status === 'OVERRIDDEN')
    .reduce((s, a) => s + a.requestedAmount, 0);

  const filtered = applicants.filter(app => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Lock body scroll when detail panel is open
  useEffect(() => {
    if (activeApplicant) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [activeApplicant]);

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-7xl mx-auto w-full">

      {/* Page header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] leading-tight m-0 text-ink-1">Operations Console</h1>
          <p className="text-[13px] text-ink-3 mt-1">Live underwriting pipeline · {totalCount} applications across the past 9 days.</p>
        </div>
        <button
          onClick={() => setView('pipeline')}
          className="h-9 px-3.5 bg-accent hover:bg-accent-2 text-surface rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-all shadow-warm-sm focus-ring cursor-pointer"
        >
          <Plus size={15} /> Process New Loan
        </button>
      </div>

      {/* Weighted stat cards: Total | Approved (wide) | HITL (highlighted) | Denied */}
      <div className="grid grid-cols-2 md:grid-cols-12 gap-4">

        <div className="md:col-span-3 bg-surface border border-border rounded-xl p-6 h-[112px] flex flex-col justify-between shadow-warm-sm">
          <span className="text-[10px] font-data uppercase tracking-label text-ink-3">Total Applications</span>
          <div className="flex items-end justify-between">
            <span className="font-display text-[32px] text-ink-1 leading-none tracking-tight-data tabular">{totalCount}</span>
            <span className="text-[10px] font-data uppercase tracking-label text-ink-3">Live</span>
          </div>
        </div>

        <div className="md:col-span-4 bg-surface border border-border rounded-xl p-6 h-[112px] flex flex-col justify-between shadow-warm-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-data uppercase tracking-label text-ink-3">Approved Portfolio</span>
            <Sparkline color="var(--color-success)" />
          </div>
          <div className="flex items-end justify-between">
            <span className="font-display text-[32px] text-ink-1 leading-none tracking-tight-data tabular">{approvedCount}</span>
            <span className="text-[11px] font-data tabular text-success flex items-center gap-1">
              <TrendingUp size={12} /> {formatShortINR(totalDisbursed)} disbursed
            </span>
          </div>
        </div>

        <button
          onClick={() => setView('hitl')}
          className="md:col-span-3 bg-warning-bg border border-warning-bd rounded-xl p-6 h-[112px] flex flex-col justify-between shadow-warm-sm text-left hover:brightness-[0.99] transition-all focus-ring cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-data uppercase tracking-label text-warning">HITL Exceptions</span>
            <AlertTriangle size={14} className="text-warning" />
          </div>
          <div className="flex items-end justify-between">
            <span className="font-display text-[32px] text-warning leading-none tracking-tight-data tabular">{flaggedCount}</span>
            <span className="text-[11px] font-medium text-warning flex items-center gap-1">
              Review queue <ArrowUpRight size={12} />
            </span>
          </div>
        </button>

        <div className="md:col-span-2 bg-surface border border-border rounded-xl p-6 h-[112px] flex flex-col justify-between shadow-warm-sm">
          <span className="text-[10px] font-data uppercase tracking-label text-ink-3">Rejected</span>
          <div className="flex items-end justify-between">
            <span className="font-display text-[32px] text-ink-1 leading-none tracking-tight-data tabular">{deniedCount}</span>
            <span className="text-[10px] font-data uppercase tracking-label text-danger">Denied</span>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-surface border border-border rounded-xl shadow-warm-sm flex flex-col flex-1 overflow-hidden">

        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="font-display text-[18px] text-ink-1">Loan Book</span>
            <span className="text-[11px] font-data tracking-label uppercase text-ink-3">· {filtered.length} of {totalCount}</span>
          </div>

          <div className="flex gap-2 items-center w-full sm:w-auto">
            <div className="flex border border-border rounded-md overflow-hidden text-[11px] font-data uppercase tracking-label">
              {(['ALL', 'APPROVED', 'FLAGGED', 'DENIED'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1.5 cursor-pointer transition-colors ${statusFilter === s ? 'bg-ink-1 text-surface' : 'bg-surface text-ink-3 hover:text-ink-1'}`}
                >
                  {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" size={14} />
              <input
                type="text"
                placeholder="Search applicant or ID…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-60 h-9 pl-8 pr-3 rounded-md bg-surface-2 border border-border focus-ring text-ink-1 text-[13px] placeholder:text-ink-3"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-2 border-b border-border text-[10px] font-data uppercase tracking-label text-ink-3">
                <th className="py-2.5 px-4 font-medium">ID</th>
                <th className="py-2.5 px-4 font-medium">Borrower</th>
                <th className="py-2.5 px-4 font-medium">Category</th>
                <th className="py-2.5 px-4 font-medium text-right">Amount</th>
                <th className="py-2.5 px-4 font-medium text-right">CIBIL</th>
                <th className="py-2.5 px-4 font-medium text-right">Affordability</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
                <th className="py-2.5 px-4 font-medium text-right">Processed in</th>
                <th className="py-2.5 px-4 font-medium text-right w-8"></th>
              </tr>
            </thead>
            <tbody className="text-[13px] text-ink-1">
              {filtered.map(app => (
                <tr
                  key={app.id}
                  onClick={() => setActiveApplicant(app)}
                  className="row-stripe row-hover border-b border-border last:border-b-0 cursor-pointer h-[44px]"
                >
                  <td className="py-0 px-4 font-data text-[12px] text-accent">{app.id}</td>
                  <td className="py-0 px-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-ink-1">{app.name}</span>
                      {app.employer && (
                        <span className="text-[11px] text-ink-3">{app.employer}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-0 px-4">
                    <span className="text-[11px] font-data uppercase tracking-label text-ink-2 border border-border rounded-sm px-1.5 py-0.5">
                      {app.category}
                    </span>
                  </td>
                  <td className="py-0 px-4 text-right font-data tabular text-ink-1">{formatShortINR(app.requestedAmount)}</td>
                  <td className="py-0 px-4 text-right">
                    <span className="font-data tabular text-ink-1">{app.cibil}</span>
                    <CibilBars score={app.cibil} />
                  </td>
                  <td className="py-0 px-4 text-right">
                    <ScoreCell score={app.affordabilityScore} />
                  </td>
                  <td className="py-0 px-4"><StatusBadge status={app.status} /></td>
                  <td className="py-0 px-4 text-right font-data tabular text-[12px] text-ink-2">{app.processingTime}</td>
                  <td className="py-0 px-4 text-right text-ink-3"><ChevronRight size={14} /></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-ink-3 text-[13px]">
                    No loan applications match this query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel — slides in from right */}
      {activeApplicant && (
        <ApplicantDetail
          applicant={activeApplicant}
          onClose={() => setActiveApplicant(null)}
          onGotoHITL={() => { setActiveApplicant(null); setView('hitl'); }}
          onApprove={() => handleHITLAction(activeApplicant.id, { action: 'APPROVED', comment: 'Approved from Console quick-action' })}
          onDeny={() => handleHITLAction(activeApplicant.id, { action: 'DENIED', comment: 'Denied from Console quick-action' })}
          onRequestDocs={() => handleHITLAction(activeApplicant.id, { action: 'REQUEST_DOCS', comment: 'Docs requested from Console' })}
        />
      )}
    </div>
  );
};

/* ---------- Applicant Detail Panel ---------- */

const ApplicantDetail: React.FC<{
  applicant: Applicant;
  onClose: () => void;
  onGotoHITL: () => void;
  onApprove: () => void;
  onDeny: () => void;
  onRequestDocs: () => void;
}> = ({ applicant: app, onClose, onGotoHITL, onApprove, onDeny, onRequestDocs }) => {
  const [confirmingDisburse, setConfirmingDisburse] = useState(false);
  const [disbursed, setDisbursed] = useState(false);

  const dti = Math.round(((app.existingDebt + (app.requestedAmount / app.tenureMonths)) / app.income) * 100);
  const monthlyEmi = Math.round(app.requestedAmount / app.tenureMonths);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      <div className="absolute inset-0 bg-ink-1/30 backdrop-blur-[2px]" onClick={onClose} />
      <aside
        className="relative w-full max-w-[480px] bg-surface h-full flex flex-col border-l border-border shadow-warm-xl animate-slide-in"
        role="dialog"
        aria-modal="true"
      >
        {/* Sticky header */}
        <div className="sticky top-0 bg-surface border-b border-border h-[72px] flex items-center justify-between px-6 z-10">
          <div className="flex flex-col gap-0.5">
            <span className="font-data text-[11px] text-accent tracking-tight-data">{app.id}</span>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-[22px] text-ink-1 m-0 leading-none">{app.name}</h3>
            </div>
            <span className="text-[11px] text-ink-3 mt-0.5">
              {app.employer ?? '—'} {app.loanPurpose ? `· ${app.loanPurpose}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-data uppercase tracking-label text-ink-3">
              <Clock size={11} /> {app.processingTime}
            </span>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-md hover:bg-surface-2 text-ink-3 flex items-center justify-center cursor-pointer focus-ring"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">

          {/* Status banner */}
          <div className="flex items-center justify-between">
            <StatusBadge status={app.status} size="md" />
            {app.status === 'FLAGGED' && (
              <button
                onClick={onGotoHITL}
                className="text-[11px] font-medium text-warning hover:underline flex items-center gap-1 cursor-pointer"
              >
                Open in HITL queue <ArrowUpRight size={12} />
              </button>
            )}
          </div>

          {/* Score triptych */}
          <div className="grid grid-cols-3 border border-border rounded-xl overflow-hidden">
            <Triptych
              label="CIBIL"
              value={`${app.cibil}`}
              meta={
                <span className="inline-flex items-center gap-1 text-[10px] text-ink-3 mt-1">
                  <CibilBars score={app.cibil} />
                </span>
              }
            />
            <Triptych
              label="Declared Income"
              value={formatShortINR(app.income)}
              meta={<span className="text-[10px] font-data uppercase tracking-label text-ink-3 mt-1">per month</span>}
              borderL
            />
            <Triptych
              label="Affordability"
              value={`${app.affordabilityScore}`}
              tone={app.affordabilityScore >= 80 ? 'success' : app.affordabilityScore >= 50 ? 'warning' : 'danger'}
              meta={<span className="text-[10px] font-data uppercase tracking-label text-ink-3 mt-1">of 100</span>}
              borderL
            />
          </div>

          {/* AI underwriting summary */}
          <Section icon={<BrainIcon />} title="AI Credit Underwriting Summary">
            <div className="border-l-2 border-accent pl-4 flex flex-col gap-3">
              <div>
                <p className="text-[10px] font-data uppercase tracking-label text-ink-3 mb-1">Key Findings</p>
                <p className="text-[13px] text-ink-1 leading-relaxed m-0">{app.analysisSummary ?? 'Awaiting underwriting analysis logs.'}</p>
              </div>
              <div>
                <p className="text-[10px] font-data uppercase tracking-label text-ink-3 mb-1">Decision Rationale</p>
                <p className="text-[13px] text-ink-2 leading-relaxed m-0">{app.reason}</p>
              </div>
            </div>
          </Section>

          {/* Red flags with anomaly explainer */}
          {app.redFlags && app.redFlags.length > 0 && (
            <Section icon={<AlertCircle size={14} className="text-danger" />} title="Red Flags">
              <div className="flex flex-col gap-1.5">
                {app.redFlags.map((flag, idx) => (
                  <RedFlagExplain key={idx} flag={flag} />
                ))}
              </div>
            </Section>
          )}

          {/* Counterfactual slider */}
          <CounterfactualSection app={app} />

          {/* Loan params grid */}
          <Section icon={<FileText size={14} className="text-ink-3" />} title="Loan Parameters">
            <div className="grid grid-cols-2 gap-3">
              <Cell label="Requested Amount" value={formatINR(app.requestedAmount)} />
              <Cell label="Tenure" value={`${app.tenureMonths} months`} />
              <Cell label="Monthly EMI (est.)" value={formatINR(monthlyEmi)} />
              <Cell label="DTI Ratio" value={`${dti}%`} tone={dti > 45 ? 'danger' : dti > 30 ? 'warning' : 'success'} />
            </div>
          </Section>

          {/* Transactions */}
          <Section
            icon={<Database size={14} className="text-aa-teal" />}
            title="Verified Bank Transactions"
            badge={<OneMoneyBadge />}
          >
            <div className="border border-border rounded-md overflow-hidden">
              <table className="w-full text-[12px] border-collapse">
                <tbody>
                  {app.transactions.map((tx, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-border last:border-b-0 ${tx.isBounce ? 'bg-danger-bg' : ''}`}
                    >
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
                        {tx.isBounce && <div className="text-[10px] font-data uppercase tracking-label text-danger mt-0.5">ACH Failure</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Audit trail */}
          {app.auditTrail && app.auditTrail.length > 0 && (
            <Section icon={<History size={14} className="text-ink-3" />} title="Audit Trail">
              <ol className="flex flex-col gap-2.5 m-0 p-0 list-none">
                {app.auditTrail.map((entry, idx) => (
                  <li key={idx} className="flex gap-3 text-[12px]">
                    <span className="font-data text-[10px] text-ink-3 tabular pt-0.5 min-w-[58px]">
                      {new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
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

          {disbursed && (
            <div className="bg-success-bg border border-success-bd rounded-md p-3 flex items-center gap-2 text-[12px] text-success">
              <CheckCircle size={14} /> Disbursement initiated · ₹{app.requestedAmount.toLocaleString('en-IN')} transferred to verified beneficiary.
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 bg-surface border-t border-border px-6 py-3 flex items-center gap-2">
          {app.status === 'APPROVED' || app.status === 'OVERRIDDEN' ? (
            confirmingDisburse ? (
              <>
                <span className="text-[12px] text-ink-2 flex-1">Disburse {formatINR(app.requestedAmount)}?</span>
                <button
                  onClick={() => setConfirmingDisburse(false)}
                  className="h-9 px-3 rounded-md border border-border text-ink-2 text-[12px] font-medium hover:bg-surface-2 cursor-pointer"
                >Cancel</button>
                <button
                  onClick={() => { setDisbursed(true); setConfirmingDisburse(false); }}
                  className="h-9 px-3 rounded-md bg-success text-surface text-[12px] font-medium hover:opacity-90 cursor-pointer"
                >Confirm</button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="h-9 px-3 rounded-md border border-border text-ink-2 text-[12px] font-medium hover:bg-surface-2 cursor-pointer"
                >Close</button>
                <div className="flex-1" />
                <button
                  disabled={disbursed}
                  onClick={() => setConfirmingDisburse(true)}
                  className="h-9 px-3.5 rounded-md bg-accent text-surface text-[12px] font-medium flex items-center gap-1.5 hover:bg-accent-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-warm-sm focus-ring"
                >
                  <ShieldCheck size={13} /> {disbursed ? 'Disbursed' : 'Initiate Disbursement'}
                </button>
              </>
            )
          ) : app.status === 'FLAGGED' ? (
            <>
              <button
                onClick={onDeny}
                className="flex-1 h-9 rounded-md border border-danger-bd text-danger text-[12px] font-medium hover:bg-danger-bg cursor-pointer"
              >Reject</button>
              <button
                onClick={onRequestDocs}
                className="flex-1 h-9 rounded-md border border-border text-ink-2 text-[12px] font-medium hover:bg-surface-2 cursor-pointer"
              >Request Docs</button>
              <button
                onClick={onApprove}
                className="flex-1 h-9 rounded-md bg-accent text-surface text-[12px] font-medium hover:bg-accent-2 cursor-pointer focus-ring"
              >Override Approve</button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="h-9 px-3 rounded-md border border-border text-ink-2 text-[12px] font-medium hover:bg-surface-2 cursor-pointer"
              >Close</button>
              <div className="flex-1" />
              <span className="text-[11px] font-data uppercase tracking-label text-ink-3">
                {app.status === 'DENIED' ? 'No actions available' : 'Awaiting docs'}
              </span>
            </>
          )}
        </div>
      </aside>
    </div>
  );
};

/* ---------- Small subcomponents ---------- */

const Triptych: React.FC<{
  label: string;
  value: string;
  meta?: React.ReactNode;
  tone?: 'success' | 'warning' | 'danger';
  borderL?: boolean;
}> = ({ label, value, meta, tone, borderL }) => {
  const valueClass = tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : tone === 'danger' ? 'text-danger' : 'text-ink-1';
  return (
    <div className={`px-4 py-3 flex flex-col ${borderL ? 'border-l border-border' : ''}`}>
      <span className="text-[10px] font-data uppercase tracking-label text-ink-3">{label}</span>
      <span className={`font-display text-[24px] leading-none tracking-tight-data mt-1.5 tabular ${valueClass}`}>{value}</span>
      {meta}
    </div>
  );
};

const Section: React.FC<{ icon?: React.ReactNode; title: string; badge?: React.ReactNode; children: React.ReactNode }> = ({ icon, title, badge, children }) => (
  <section className="flex flex-col gap-2.5">
    <header className="flex items-center justify-between">
      <h4 className="m-0 text-[10px] font-data uppercase tracking-label text-ink-3 flex items-center gap-1.5">
        {icon}{title}
      </h4>
      {badge}
    </header>
    {children}
  </section>
);

const Cell: React.FC<{ label: string; value: string; tone?: 'success' | 'warning' | 'danger' }> = ({ label, value, tone }) => {
  const toneClass = tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : tone === 'danger' ? 'text-danger' : 'text-ink-1';
  return (
    <div className="border border-border rounded-md p-3 flex flex-col">
      <span className="text-[10px] font-data uppercase tracking-label text-ink-3">{label}</span>
      <span className={`font-data tabular text-[15px] font-medium mt-1 ${toneClass}`}>{value}</span>
    </div>
  );
};

const OneMoneyBadge: React.FC = () => (
  <span className="inline-flex items-center gap-1 text-[10px] font-data uppercase tracking-label text-aa-teal bg-aa-teal-bg border border-aa-teal-bd rounded-sm px-1.5 py-0.5">
    <ShieldCheck size={10} /> Verified via OneMoney AA
  </span>
);

const BrainIcon: React.FC = () => (
  <span className="text-accent inline-flex"><FileText size={14} /></span>
);

/* ---------- Red-flag with inline explainer ---------- */
const RedFlagExplain: React.FC<{ flag: string }> = ({ flag }) => {
  const [open, setOpen] = useState(false);
  const explanation = explainFlag(flag);
  return (
    <div className="border border-danger-bd rounded-md bg-danger-bg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full p-2.5 flex items-center gap-2 text-left text-[12px] text-danger cursor-pointer"
      >
        <AlertCircle size={12} className="shrink-0" />
        <span className="flex-1">{flag}</span>
        <span className="text-[10px] font-data uppercase tracking-label flex items-center gap-1">
          <Info size={10} /> {open ? 'hide' : 'explain'}
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-danger-bd/60 text-[12px] text-ink-1 leading-relaxed bg-surface flex flex-col gap-2">
          <div>
            <p className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0 mb-0.5">{explanation.title}</p>
            <p className="m-0">{explanation.detail}</p>
          </div>
          <div className="border-l-2 border-accent pl-3">
            <p className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0 mb-0.5">Reviewer guidance</p>
            <p className="m-0 text-ink-2">{explanation.suggestion}</p>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- Counterfactual: re-score on the fly ---------- */
const CounterfactualSection: React.FC<{ app: Applicant }> = ({ app }) => {
  const [open, setOpen] = useState(false);
  const [incomeDelta, setIncomeDelta] = useState(0);          // %
  const [debtDelta, setDebtDelta] = useState(0);              // %
  const [cibilDelta, setCibilDelta] = useState(0);            // ±points

  const projected = useMemo(() => {
    const income = Math.round(app.income * (1 + incomeDelta / 100));
    const debt = Math.max(0, Math.round(app.existingDebt * (1 + debtDelta / 100)));
    const cibil = Math.max(300, Math.min(900, app.cibil + cibilDelta));
    const monthlyEmi = Math.round(app.requestedAmount / app.tenureMonths);
    const dti = Math.round(((debt + monthlyEmi) / income) * 100);

    // Roughly mirror the deterministic scoring in services/gemini.ts
    let score = 50;
    score += Math.max(0, Math.min(30, ((cibil - 500) / 350) * 30));
    score += Math.max(0, Math.min(30, (1 - dti / 100) * 30));
    const bounces = app.transactions.filter(t => t.isBounce).length;
    score -= bounces * 20;
    score = Math.max(0, Math.min(100, Math.round(score)));

    const decision = cibil < 600 || bounces > 0 ? 'DENIED'
                   : dti > 45 ? 'FLAGGED'
                   : cibil < 700 ? 'FLAGGED'
                   : 'APPROVED';

    return { income, debt, cibil, dti, score, decision };
  }, [app, incomeDelta, debtDelta, cibilDelta]);

  const reset = () => { setIncomeDelta(0); setDebtDelta(0); setCibilDelta(0); };
  const dirty = incomeDelta !== 0 || debtDelta !== 0 || cibilDelta !== 0;

  const decisionTone = projected.decision === 'APPROVED' ? 'text-success' : projected.decision === 'FLAGGED' ? 'text-warning' : 'text-danger';

  return (
    <Section
      icon={<SlidersHorizontal size={14} className="text-accent" />}
      title="Counterfactual · what if?"
      badge={
        <button
          onClick={() => setOpen(o => !o)}
          className="text-[11px] text-accent hover:text-accent-2 font-medium flex items-center gap-1 cursor-pointer"
        >
          <Sparkles size={11} /> {open ? 'Hide' : 'Try a scenario'}
        </button>
      }
    >
      {open ? (
        <div className="border border-border rounded-md p-4 flex flex-col gap-4 bg-surface-2">
          <p className="text-[11px] text-ink-3 m-0 leading-relaxed">
            Adjust the inputs to see how the score and decision would shift. Useful for borrowers near the boundary, or for stress-testing approvals.
          </p>

          <DeltaSlider
            label="Income"
            delta={incomeDelta}
            setDelta={setIncomeDelta}
            min={-25} max={50} step={5}
            unit="%"
            originalLabel={`₹${app.income.toLocaleString('en-IN')}/mo`}
            projectedLabel={`₹${projected.income.toLocaleString('en-IN')}/mo`}
          />

          <DeltaSlider
            label="Existing EMI"
            delta={debtDelta}
            setDelta={setDebtDelta}
            min={-50} max={50} step={5}
            unit="%"
            originalLabel={`₹${app.existingDebt.toLocaleString('en-IN')}/mo`}
            projectedLabel={`₹${projected.debt.toLocaleString('en-IN')}/mo`}
          />

          <DeltaSlider
            label="CIBIL"
            delta={cibilDelta}
            setDelta={setCibilDelta}
            min={-80} max={80} step={10}
            unit=""
            originalLabel={`${app.cibil}`}
            projectedLabel={`${projected.cibil}`}
            isAbsolute
          />

          <div className="grid grid-cols-3 border border-border rounded-md bg-surface overflow-hidden">
            <Triptych label="Projected DTI" value={`${projected.dti}%`} tone={projected.dti > 45 ? 'danger' : projected.dti > 30 ? 'warning' : 'success'} />
            <div className="border-l border-border">
              <Triptych label="Projected score" value={`${projected.score}`} tone={projected.score >= 80 ? 'success' : projected.score >= 50 ? 'warning' : 'danger'} />
            </div>
            <div className="border-l border-border px-4 py-3 flex flex-col">
              <span className="text-[10px] font-data uppercase tracking-label text-ink-3">Projected decision</span>
              <span className={`font-display text-[20px] leading-none tracking-tight-data mt-1.5 ${decisionTone}`}>{projected.decision}</span>
              {dirty && (
                <span className={`text-[10px] font-data uppercase tracking-label mt-1 ${projected.decision === app.status ? 'text-ink-3' : 'text-accent'}`}>
                  {projected.decision === app.status ? 'no change' : `was ${app.status}`}
                </span>
              )}
            </div>
          </div>

          {dirty && (
            <button
              onClick={reset}
              className="self-start text-[11px] text-ink-3 hover:text-ink-1 font-medium flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={11} /> Reset to actuals
            </button>
          )}
        </div>
      ) : (
        <p className="text-[12px] text-ink-3 m-0 italic">
          Want to know "what if the borrower's income were 10% higher?" Open the simulator and slide.
        </p>
      )}
    </Section>
  );
};

const DeltaSlider: React.FC<{
  label: string;
  delta: number;
  setDelta: (v: number) => void;
  min: number; max: number; step: number;
  unit: string;
  originalLabel: string;
  projectedLabel: string;
  isAbsolute?: boolean;
}> = ({ label, delta, setDelta, min, max, step, unit, originalLabel, projectedLabel, isAbsolute }) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-data uppercase tracking-label text-ink-3">{label}</span>
      <span className="font-data tabular text-[11px] text-accent font-medium">
        {delta > 0 ? '+' : ''}{delta}{isAbsolute ? ' pts' : unit}
      </span>
    </div>
    <input
      type="range"
      min={min} max={max} step={step}
      value={delta}
      onChange={e => setDelta(Number(e.target.value))}
      className="w-full accent-[var(--color-accent)] cursor-pointer"
    />
    <div className="flex justify-between text-[10px] font-data tabular text-ink-3">
      <span>was {originalLabel}</span>
      <span className={delta !== 0 ? 'text-ink-1 font-medium' : ''}>→ {projectedLabel}</span>
    </div>
  </div>
);
