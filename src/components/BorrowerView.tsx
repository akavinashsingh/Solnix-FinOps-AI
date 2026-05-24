import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Applicant } from '../data/types';
import { PageHeader } from './PageHeader';
import {
  CheckCircle, Clock, AlertTriangle, ShieldCheck, Download,
  Banknote, CalendarDays, FileText, Phone, Mail, Sparkles, ArrowRight, Plus,
  TrendingUp,
} from 'lucide-react';

const formatINR = (n: number) => '₹' + n.toLocaleString('en-IN');
const formatShortINR = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
};

const APPLICATION_STEPS = [
  { key: 'aadhaar',   label: 'Identity verification',  description: 'Aadhaar + PAN linked' },
  { key: 'aa',        label: 'Bank account consent',   description: 'OneMoney handshake complete' },
  { key: 'review',    label: 'Underwriting in progress', description: 'AI agents reviewing your profile' },
  { key: 'decision',  label: 'Decision',                description: 'Loan approved or returned for review' },
  { key: 'sign',      label: 'Sign loan contract',     description: 'E-sign with Aadhaar OTP' },
  { key: 'disburse',  label: 'Funds disbursed',         description: 'Money in your account' },
];

const applicationStepIndex = (a: Applicant): number => {
  switch (a.status) {
    case 'PENDING':
    case 'FLAGGED': return 2;
    case 'DENIED':  return 3;
    case 'APPROVED':
    case 'OVERRIDDEN':
      if (a.loanState === 'SERVICING' || a.loanState === 'DISBURSED' || a.loanState === 'CLOSED') return 6;
      if (a.loanState === 'DISBURSING') return 4;
      return 3;
    default: return 0;
  }
};

export const BorrowerView: React.FC = () => {
  const { applicants, borrowerApplicantId, setBorrowerApplicantId } = useApp();
  const [topupOpen, setTopupOpen] = useState(false);

  const borrower = applicants.find(a => a.id === borrowerApplicantId) ?? applicants[0];

  const completedSteps = useMemo(() => applicationStepIndex(borrower), [borrower]);

  // Borrowers worth offering as views: prefer ones with a name (i.e., actual people) and recognisable lifecycle
  const borrowerOptions = applicants.slice(0, 30);

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-5xl w-full mx-auto">

      <PageHeader
        title="Borrower Portal"
        subtitle="Preview the experience your customer sees · same data, borrower-facing wording"
        right={
          <select
            value={borrower.id}
            onChange={e => setBorrowerApplicantId(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-surface text-[12px] text-ink-1 cursor-pointer focus-ring"
          >
            {borrowerOptions.map(a => (
              <option key={a.id} value={a.id}>{a.name} · {a.id}</option>
            ))}
          </select>
        }
      />

      {/* Hero greeting */}
      <div className="bg-surface border border-border rounded-2xl shadow-warm-sm p-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-accent-bg text-accent flex items-center justify-center font-display text-[22px] tracking-tight-data">
          {borrower.name.split(' ').map(s => s[0]).slice(0, 2).join('')}
        </div>
        <div className="flex-1">
          <h2 className="font-display text-[26px] m-0 leading-tight text-ink-1">Hello, {borrower.name.split(' ')[0]}.</h2>
          <p className="text-[13px] text-ink-3 mt-1 m-0">Here's a snapshot of your loan with Solnix.</p>
        </div>
        <div className="hidden md:flex flex-col items-end gap-1">
          {borrower.phone && <span className="text-[11px] text-ink-3 flex items-center gap-1"><Phone size={11} /> {borrower.phone}</span>}
          {borrower.email && <span className="text-[11px] text-ink-3 flex items-center gap-1"><Mail size={11} /> {borrower.email}</span>}
        </div>
      </div>

      {/* Application progress timeline */}
      <section className="bg-surface border border-border rounded-xl shadow-warm-sm p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0 flex items-center gap-1.5">
            <Sparkles size={13} className="text-accent" /> Your application
          </h3>
          {borrower.status === 'APPROVED' && borrower.loanState === 'SERVICING' && (
            <span className="text-[10px] font-data uppercase tracking-label text-success bg-success-bg border border-success-bd rounded-sm px-2 py-0.5">
              Active loan
            </span>
          )}
          {borrower.status === 'FLAGGED' && (
            <span className="text-[10px] font-data uppercase tracking-label text-warning bg-warning-bg border border-warning-bd rounded-sm px-2 py-0.5">
              Under review
            </span>
          )}
          {borrower.status === 'DENIED' && (
            <span className="text-[10px] font-data uppercase tracking-label text-danger bg-danger-bg border border-danger-bd rounded-sm px-2 py-0.5">
              Not approved
            </span>
          )}
        </div>

        <ol className="m-0 p-0 list-none border border-border rounded-md overflow-hidden">
          {APPLICATION_STEPS.map((step, i) => {
            const isDone = i < completedSteps;
            const isActive = i === completedSteps && borrower.status !== 'DENIED';
            const isDenied = borrower.status === 'DENIED' && i === 3;

            return (
              <li
                key={step.key}
                className={[
                  'flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0',
                  isActive ? 'bg-accent-bg' : '',
                  isDenied ? 'bg-danger-bg' : '',
                ].join(' ')}
              >
                <span className="w-5 h-5 shrink-0 flex items-center justify-center">
                  {isDone && <CheckCircle size={16} className="text-success" />}
                  {isActive && <Clock size={16} className="text-accent animate-pulse" />}
                  {isDenied && <AlertTriangle size={16} className="text-danger" />}
                  {!isDone && !isActive && !isDenied && <span className="w-2.5 h-2.5 rounded-full border border-border-2 bg-surface" />}
                </span>
                <div className="flex-1">
                  <div className={['text-[13px] leading-tight', isDone || isActive ? 'text-ink-1 font-medium' : 'text-ink-3'].join(' ')}>
                    {isDenied ? 'Application not approved' : step.label}
                  </div>
                  <div className="text-[11px] text-ink-3 mt-0.5">
                    {isDenied
                      ? 'We were unable to extend a loan offer at this time. You can re-apply in 90 days.'
                      : step.description}
                  </div>
                </div>
                {isDone && i < APPLICATION_STEPS.length - 1 && (
                  <span className="text-[10px] font-data tabular text-ink-3">Done</span>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* Active loan details */}
      {borrower.servicing && (
        <>
          <section className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <Card
              className="md:col-span-4"
              icon={<Banknote size={13} />}
              label="Outstanding"
              value={formatShortINR(borrower.servicing.outstandingPrincipal)}
              sub={`of ${formatShortINR(borrower.servicing.disbursedAmount)} disbursed`}
              tone="accent"
            />
            <Card
              className="md:col-span-4"
              icon={<CalendarDays size={13} />}
              label="Next EMI"
              value={borrower.servicing.nextEmiAmount ? formatINR(borrower.servicing.nextEmiAmount) : '—'}
              sub={borrower.servicing.nextEmiDate ? `due ${new Date(borrower.servicing.nextEmiDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}` : 'no upcoming EMI'}
              tone={(borrower.servicing.daysOverdue ?? 0) > 0 ? 'danger' : 'success'}
            />
            <Card
              className="md:col-span-4"
              icon={<TrendingUp size={13} />}
              label="On-time streak"
              value={`${borrower.servicing.onTimeStreak} EMIs`}
              sub={`${borrower.servicing.emisPaid}/${borrower.servicing.emisTotal} paid`}
              tone={borrower.servicing.onTimeStreak > 0 ? 'success' : 'warning'}
            />
          </section>

          {/* EMI schedule preview */}
          <section className="bg-surface border border-border rounded-xl shadow-warm-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0">EMI schedule · next 6</h3>
              <button className="text-[11px] text-accent hover:text-accent-2 font-medium flex items-center gap-1 cursor-pointer">
                <Download size={11} /> Download statement
              </button>
            </div>
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="bg-surface-2 border-b border-border text-[10px] font-data uppercase tracking-label text-ink-3">
                  <th className="py-2 px-4 text-left font-medium">#</th>
                  <th className="py-2 px-4 text-left font-medium">Due date</th>
                  <th className="py-2 px-4 text-right font-medium">Amount</th>
                  <th className="py-2 px-4 text-right font-medium">Principal</th>
                  <th className="py-2 px-4 text-right font-medium">Interest</th>
                  <th className="py-2 px-4 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {borrower.servicing.schedule.slice(0, Math.max(6, borrower.servicing.emisPaid + 4)).map(emi => (
                  <tr key={emi.number} className="border-b border-border last:border-b-0">
                    <td className="py-2 px-4 font-data tabular text-ink-2">{emi.number}</td>
                    <td className="py-2 px-4 font-data tabular text-ink-1">{emi.dueDate}</td>
                    <td className="py-2 px-4 text-right font-data tabular text-ink-1">{formatINR(emi.amount)}</td>
                    <td className="py-2 px-4 text-right font-data tabular text-ink-3">{formatINR(emi.principal)}</td>
                    <td className="py-2 px-4 text-right font-data tabular text-ink-3">{formatINR(emi.interest)}</td>
                    <td className="py-2 px-4">
                      {emi.status === 'PAID' && <span className="text-[10px] font-data uppercase tracking-label text-success bg-success-bg border border-success-bd rounded-sm px-1.5 py-0.5">Paid {emi.paidDate ? `· ${emi.paidDate}` : ''}</span>}
                      {emi.status === 'DUE' && <span className="text-[10px] font-data uppercase tracking-label text-accent bg-accent-bg border border-accent rounded-sm px-1.5 py-0.5">Due next</span>}
                      {emi.status === 'OVERDUE' && <span className="text-[10px] font-data uppercase tracking-label text-warning bg-warning-bg border border-warning-bd rounded-sm px-1.5 py-0.5">Overdue</span>}
                      {emi.status === 'UPCOMING' && <span className="text-[10px] font-data uppercase tracking-label text-ink-3">Upcoming</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Top-up offer (if good standing) */}
          {borrower.servicing.onTimeStreak >= 3 && (
            <TopupOffer
              applicant={borrower}
              open={topupOpen}
              setOpen={setTopupOpen}
            />
          )}
        </>
      )}

      {/* Documents */}
      <section className="bg-surface border border-border rounded-xl shadow-warm-sm p-5 flex flex-col gap-3">
        <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0">Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <DocCard label="Loan agreement"     subtext="Signed · Aadhaar OTP" />
          <DocCard label="Sanction letter"    subtext="Issued at disbursal" />
          <DocCard label="Repayment schedule" subtext="Updated every EMI" />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface border border-border rounded-xl shadow-warm-sm p-4 flex items-center justify-between text-[11px] text-ink-3">
        <div className="flex items-center gap-2"><ShieldCheck size={12} className="text-aa-teal" /> Your data is shared only with Solnix FinOps AI under your active OneMoney consent.</div>
        <button className="text-accent hover:underline cursor-pointer">Manage consents</button>
      </footer>
    </div>
  );
};

/* ---------- Subcomponents ---------- */

const Card: React.FC<{
  className?: string;
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone?: 'success' | 'warning' | 'danger' | 'accent';
}> = ({ className, icon, label, value, sub, tone }) => {
  const toneClass =
    tone === 'success' ? 'text-success' :
    tone === 'warning' ? 'text-warning' :
    tone === 'danger'  ? 'text-danger' :
    tone === 'accent'  ? 'text-accent' :
                         'text-ink-1';
  return (
    <div className={`bg-surface border border-border rounded-xl p-5 shadow-warm-sm flex flex-col gap-2 ${className ?? ''}`}>
      <span className="text-[10px] font-data uppercase tracking-label text-ink-3 flex items-center gap-1.5">{icon} {label}</span>
      <span className={`font-display text-[26px] leading-none tracking-tight-data tabular ${toneClass}`}>{value}</span>
      <span className="text-[11px] font-data tabular text-ink-3">{sub}</span>
    </div>
  );
};

const DocCard: React.FC<{ label: string; subtext: string }> = ({ label, subtext }) => (
  <div className="border border-border rounded-md p-3.5 flex items-center gap-3 hover:bg-surface-2 cursor-pointer">
    <div className="w-9 h-9 rounded-md bg-surface-2 border border-border flex items-center justify-center text-ink-3">
      <FileText size={16} />
    </div>
    <div className="flex-1">
      <div className="text-[13px] text-ink-1 font-medium">{label}</div>
      <div className="text-[11px] text-ink-3">{subtext}</div>
    </div>
    <Download size={14} className="text-ink-3" />
  </div>
);

const TopupOffer: React.FC<{ applicant: Applicant; open: boolean; setOpen: (b: boolean) => void }> = ({ applicant, open, setOpen }) => {
  const eligibleAmount = Math.min(applicant.requestedAmount * 0.4, 500000);
  const [requested, setRequested] = useState(Math.round(eligibleAmount * 0.5));
  const tenure = 24;
  const monthlyEmi = Math.round(requested / tenure);

  return (
    <section className="bg-aa-teal-bg border border-aa-teal-bd rounded-xl shadow-warm-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-md bg-surface border border-aa-teal-bd text-aa-teal flex items-center justify-center"><Plus size={16} /></div>
          <div>
            <h3 className="font-display text-[18px] m-0 text-ink-1">You're eligible for a top-up</h3>
            <p className="text-[12px] text-ink-2 mt-1 m-0 leading-relaxed">
              Based on your {applicant.servicing!.onTimeStreak}-EMI on-time streak, we can offer up to {formatINR(eligibleAmount)} additional credit at the same rate — no fresh paperwork required.
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="h-8 px-3 rounded-md bg-aa-teal text-surface text-[11px] font-medium cursor-pointer shrink-0"
        >{open ? 'Hide' : 'Explore'}</button>
      </div>

      {open && (
        <div className="border-t border-aa-teal-bd pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-data uppercase tracking-label text-ink-3">Top-up amount</label>
            <input
              type="range"
              min={20000} max={eligibleAmount} step={5000}
              value={requested}
              onChange={e => setRequested(Number(e.target.value))}
              className="w-full accent-[var(--color-aa-teal)]"
            />
            <div className="flex justify-between text-[10px] font-data tabular text-ink-3">
              <span>{formatINR(20000)}</span>
              <span>{formatINR(eligibleAmount)}</span>
            </div>
            <div className="font-display text-[24px] text-ink-1 tabular tracking-tight-data">{formatINR(requested)}</div>
          </div>

          <div className="border border-aa-teal-bd rounded-md bg-surface p-3 flex flex-col gap-1.5 text-[12px]">
            <Row k="Top-up amount"   v={formatINR(requested)} />
            <Row k="Tenure"          v={`${tenure} months`} />
            <Row k="New EMI"         v={`${formatINR((applicant.servicing!.nextEmiAmount ?? 0) + monthlyEmi)}/mo`} />
            <Row k="Interest rate"   v="14.4% p.a. (same as existing)" />
            <Row k="Processing fee"  v={formatINR(Math.round(requested * 0.01))} />
            <button className="mt-2 h-9 rounded-md bg-aa-teal text-surface text-[12px] font-medium cursor-pointer flex items-center justify-center gap-1.5">
              Continue with top-up <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

const Row: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div className="flex justify-between items-center">
    <span className="text-ink-3">{k}</span>
    <span className="text-ink-1 font-medium font-data tabular">{v}</span>
  </div>
);
