import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Applicant, DisbursementRecord } from '../data/types';
import { PageHeader } from './PageHeader';
import {
  CheckCircle, Clock, FileSignature, ShieldCheck, ArrowRight,
  Banknote, AlertCircle, Mail,
} from 'lucide-react';

const STAGES: Array<{ key: DisbursementRecord['stage']; label: string; description: string }> = [
  { key: 'MANDATE_PENDING',   label: 'E-Mandate Setup',        description: 'NACH mandate created · awaiting bank registration' },
  { key: 'PENNY_DROP',        label: 'Penny-Drop Verification', description: 'Beneficiary account confirmed via ₹1 transfer' },
  { key: 'CONTRACT_SIGN',     label: 'Loan Contract Signed',   description: 'E-sign via Aadhaar OTP completed' },
  { key: 'READY_TO_RELEASE',  label: 'Ready to Release',       description: 'All checks passed · awaiting ops approval' },
  { key: 'DISBURSED',         label: 'Funds Released',         description: 'NEFT/IMPS transfer initiated' },
];

const STAGE_LABEL: Record<DisbursementRecord['stage'], string> = Object.fromEntries(
  STAGES.map(s => [s.key, s.label])
) as Record<DisbursementRecord['stage'], string>;

const formatShortINR = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
};

const stageProgress = (stage: DisbursementRecord['stage']) =>
  STAGES.findIndex(s => s.key === stage);

const checkBadge = (status: 'PENDING' | 'AWAITING' | 'VERIFIED' | 'FAILED' | 'PENDING' | 'SENT' | 'SIGNED') => {
  if (status === 'VERIFIED' || status === 'SIGNED') return <span className="inline-flex items-center gap-1 text-[10px] font-data uppercase tracking-label text-success bg-success-bg border border-success-bd rounded-sm px-1.5 py-0.5"><CheckCircle size={10} /> {status}</span>;
  if (status === 'FAILED') return <span className="inline-flex items-center gap-1 text-[10px] font-data uppercase tracking-label text-danger bg-danger-bg border border-danger-bd rounded-sm px-1.5 py-0.5"><AlertCircle size={10} /> {status}</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-data uppercase tracking-label text-ink-3 bg-surface-2 border border-border rounded-sm px-1.5 py-0.5"><Clock size={10} /> {status}</span>;
};

export const DisbursementView: React.FC = () => {
  const { applicants, advanceDisbursement, releaseFunds } = useApp();

  const queue = useMemo(
    () => applicants.filter(a =>
      (a.status === 'APPROVED' || a.status === 'OVERRIDDEN') &&
      a.disbursement &&
      a.disbursement.stage !== 'DISBURSED'
    ).sort((a, b) => stageProgress(b.disbursement!.stage) - stageProgress(a.disbursement!.stage)),
    [applicants]
  );

  const recentlyDisbursed = useMemo(
    () => applicants.filter(a => a.disbursement?.stage === 'DISBURSED' && a.disbursement.releasedAt)
      .sort((a, b) => (b.disbursement!.releasedAt! > a.disbursement!.releasedAt! ? 1 : -1))
      .slice(0, 6),
    [applicants]
  );

  const totalInFlight = queue.reduce((s, a) => s + a.requestedAmount, 0);
  const readyToRelease = queue.filter(a => a.disbursement?.stage === 'READY_TO_RELEASE').length;

  const [selectedId, setSelectedId] = useState<string>(queue[0]?.id ?? '');
  const selected = queue.find(a => a.id === selectedId) ?? queue[0];

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-7xl w-full">
      <PageHeader
        title="Disbursement Queue"
        subtitle={`${queue.length} approved loans in the disbursement pipeline · ${formatShortINR(totalInFlight)} in flight`}
      />

      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Metric label="Total in flight" value={formatShortINR(totalInFlight)} icon={<Banknote size={14} />} />
        <Metric label="Ready to release" value={readyToRelease.toString()} icon={<CheckCircle size={14} className="text-success" />} />
        <Metric label="Awaiting e-mandate" value={queue.filter(a => a.disbursement?.stage === 'MANDATE_PENDING').length.toString()} icon={<FileSignature size={14} />} />
        <Metric label="Penny-drop pending" value={queue.filter(a => a.disbursement?.stage === 'PENNY_DROP').length.toString()} icon={<ShieldCheck size={14} className="text-aa-teal" />} />
        <Metric label="Contracts pending" value={queue.filter(a => a.disbursement?.stage === 'CONTRACT_SIGN').length.toString()} icon={<Mail size={14} />} />
      </div>

      {queue.length === 0 ? (
        <EmptyQueue />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

          {/* Queue list */}
          <aside className="md:col-span-5 bg-surface border border-border rounded-xl shadow-warm-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0">Disbursement Pipeline</h3>
              <span className="text-[10px] font-data tabular text-ink-3">{queue.length} in queue</span>
            </div>
            <div className="flex flex-col">
              {queue.map(a => (
                <button
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className={[
                    'text-left p-4 border-b border-border last:border-b-0 transition-colors cursor-pointer focus-ring',
                    selected?.id === a.id ? 'bg-accent-bg/60' : 'bg-surface hover:bg-surface-2',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-data text-[11px] text-accent tabular">{a.id}</span>
                    <span className="text-[10px] font-data uppercase tracking-label text-accent bg-accent-bg border border-accent rounded-sm px-1.5 py-0.5">
                      {STAGE_LABEL[a.disbursement!.stage]}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-medium text-ink-1 text-[14px]">{a.name}</span>
                      <span className="text-[11px] text-ink-3">{a.employer ?? '—'} · {a.category}</span>
                    </div>
                    <span className="font-data text-[14px] tabular text-ink-1">{formatShortINR(a.requestedAmount)}</span>
                  </div>

                  {/* Inline progress bar */}
                  <div className="mt-2 flex gap-1">
                    {STAGES.map((s, idx) => {
                      const cur = stageProgress(a.disbursement!.stage);
                      return (
                        <div
                          key={s.key}
                          className={`h-1 flex-1 rounded-sm ${idx <= cur ? 'bg-accent' : 'bg-surface-2 border border-border'}`}
                        />
                      );
                    })}
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* Detail */}
          {selected && (
            <section className="md:col-span-7 bg-surface border border-border rounded-xl shadow-warm-sm flex flex-col overflow-hidden">
              <div className="border-b border-border p-5 flex items-start justify-between gap-4">
                <div>
                  <span className="font-data text-[11px] text-accent tabular tracking-tight-data">{selected.id}</span>
                  <h3 className="font-display text-[22px] text-ink-1 m-0 leading-none mt-0.5">{selected.name}</h3>
                  <span className="text-[11px] text-ink-3">{selected.employer ?? '—'} · {selected.loanPurpose}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-data uppercase tracking-label text-ink-3 block">Loan amount</span>
                  <span className="font-display text-[22px] text-ink-1 tabular tracking-tight-data">{formatShortINR(selected.requestedAmount)}</span>
                </div>
              </div>

              <div className="p-5 flex flex-col gap-5">
                {/* Stages */}
                <div>
                  <div className="text-[10px] font-data uppercase tracking-label text-ink-3 mb-2.5">Disbursement Stages</div>
                  <ol className="m-0 p-0 list-none border border-border rounded-md overflow-hidden">
                    {STAGES.map((s, i) => {
                      const cur = stageProgress(selected.disbursement!.stage);
                      const isComplete = i < cur || (i === cur && s.key === 'DISBURSED');
                      const isActive = i === cur && s.key !== 'DISBURSED';
                      const isPending = i > cur;
                      return (
                        <li
                          key={s.key}
                          className={[
                            'flex items-center gap-3 px-3.5 py-2.5 border-b border-border last:border-b-0',
                            isActive ? 'bg-accent-bg' : '',
                          ].join(' ')}
                        >
                          <span className="w-5 h-5 flex items-center justify-center shrink-0">
                            {isComplete && <CheckCircle size={16} className="text-success" />}
                            {isActive && <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />}
                            {isPending && <span className="w-2.5 h-2.5 rounded-full border border-border-2 bg-surface" />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className={['text-[13px] leading-tight', isPending ? 'text-ink-3' : 'text-ink-1 font-medium'].join(' ')}>
                              {s.label}
                            </div>
                            <div className={['text-[11px] leading-tight mt-0.5', isPending ? 'text-ink-4' : 'text-ink-3'].join(' ')}>
                              {s.description}
                            </div>
                          </div>
                          {isComplete && i === stageProgress(selected.disbursement!.stage) && selected.disbursement?.releasedAt && (
                            <span className="font-data tabular text-[11px] text-ink-3">
                              {new Date(selected.disbursement.releasedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </div>

                {/* Verification statuses */}
                <div>
                  <div className="text-[10px] font-data uppercase tracking-label text-ink-3 mb-2.5">Verification Status</div>
                  <div className="grid grid-cols-3 gap-2.5">
                    <VerifyCell label="E-Mandate" status={selected.disbursement!.emandateStatus} icon={<FileSignature size={12} />} />
                    <VerifyCell label="Penny-Drop" status={selected.disbursement!.pennyDropStatus} icon={<ShieldCheck size={12} />} />
                    <VerifyCell label="Contract" status={selected.disbursement!.contractStatus} icon={<Mail size={12} />} />
                  </div>
                </div>

                {/* Beneficiary */}
                <div>
                  <div className="text-[10px] font-data uppercase tracking-label text-ink-3 mb-2.5">Beneficiary Account</div>
                  <div className="border border-border rounded-md p-3.5 flex flex-col gap-1.5 text-[12px]">
                    <Row k="Bank" v={selected.disbursement!.beneficiaryBank} />
                    <Row k="Account" v={selected.disbursement!.beneficiaryAccount} mono />
                    <Row k="IFSC"    v={selected.disbursement!.beneficiaryIfsc} mono />
                    <Row k="Channel" v="IMPS · instant" />
                    <Row k="Reference" v={`SLNX-${selected.id}-DISB`} mono />
                  </div>
                </div>
              </div>

              {/* Sticky actions */}
              <div className="border-t border-border bg-surface p-4 flex gap-2">
                {selected.disbursement!.stage !== 'READY_TO_RELEASE' && selected.disbursement!.stage !== 'DISBURSED' && (
                  <button
                    onClick={() => advanceDisbursement(selected.id)}
                    className="flex-1 h-10 rounded-md border border-border text-ink-2 text-[12px] font-medium hover:bg-surface-2 flex items-center justify-center gap-1.5 cursor-pointer focus-ring"
                  >
                    Advance to next stage <ArrowRight size={13} />
                  </button>
                )}
                {selected.disbursement!.stage === 'READY_TO_RELEASE' && (
                  <button
                    onClick={() => releaseFunds(selected.id)}
                    className="flex-1 h-10 rounded-md bg-accent text-surface text-[12px] font-medium hover:bg-accent-2 flex items-center justify-center gap-1.5 cursor-pointer focus-ring shadow-warm-sm"
                  >
                    <Banknote size={14} /> Release {formatShortINR(selected.requestedAmount)} now
                  </button>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Recently disbursed */}
      {recentlyDisbursed.length > 0 && (
        <div className="bg-surface border border-border rounded-xl shadow-warm-sm overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0">Recently Released</h3>
            <span className="text-[10px] font-data tabular text-ink-3">{recentlyDisbursed.length}</span>
          </div>
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="bg-surface-2 border-b border-border text-[10px] font-data uppercase tracking-label text-ink-3">
                <th className="py-2 px-4 text-left font-medium">ID</th>
                <th className="py-2 px-4 text-left font-medium">Borrower</th>
                <th className="py-2 px-4 text-right font-medium">Amount</th>
                <th className="py-2 px-4 text-left font-medium">Bank</th>
                <th className="py-2 px-4 text-right font-medium">Released</th>
              </tr>
            </thead>
            <tbody>
              {recentlyDisbursed.map(a => (
                <RecentRow key={a.id} a={a} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-2 shadow-warm-sm">
    <span className="text-[10px] font-data uppercase tracking-label text-ink-3 flex items-center gap-1.5">{icon} {label}</span>
    <span className="font-display text-[22px] text-ink-1 leading-none tracking-tight-data tabular">{value}</span>
  </div>
);

const VerifyCell: React.FC<{ label: string; status: any; icon: React.ReactNode }> = ({ label, status, icon }) => (
  <div className="border border-border rounded-md p-3 flex flex-col gap-1.5">
    <span className="text-[10px] font-data uppercase tracking-label text-ink-3 flex items-center gap-1">{icon} {label}</span>
    <div>{checkBadge(status)}</div>
  </div>
);

const Row: React.FC<{ k: string; v: string; mono?: boolean }> = ({ k, v, mono }) => (
  <div className="flex justify-between items-center">
    <span className="text-ink-3">{k}</span>
    <span className={mono ? 'font-data tabular text-ink-1 font-medium' : 'text-ink-1 font-medium'}>{v}</span>
  </div>
);

const EmptyQueue: React.FC = () => (
  <div className="bg-surface border border-border rounded-xl p-12 text-center shadow-warm-sm max-w-xl mx-auto mt-4 flex flex-col items-center gap-3">
    <div className="w-14 h-14 rounded-md bg-success-bg border border-success-bd text-success flex items-center justify-center">
      <CheckCircle size={26} />
    </div>
    <h3 className="font-display text-[20px] m-0 text-ink-1">Nothing pending</h3>
    <p className="text-[13px] text-ink-3 max-w-sm leading-relaxed m-0">No approved loans waiting for disbursement.</p>
  </div>
);

const RecentRow: React.FC<{ a: Applicant }> = ({ a }) => (
  <tr className="border-b border-border last:border-b-0 row-stripe">
    <td className="py-2 px-4 font-data text-[12px] text-accent">{a.id}</td>
    <td className="py-2 px-4 text-ink-1 font-medium">{a.name}</td>
    <td className="py-2 px-4 text-right font-data tabular text-ink-1">{formatShortINR(a.requestedAmount)}</td>
    <td className="py-2 px-4 text-ink-2">{a.disbursement?.beneficiaryBank}</td>
    <td className="py-2 px-4 text-right font-data tabular text-[11px] text-ink-3">
      {a.disbursement?.releasedAt
        ? new Date(a.disbursement.releasedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
        : '—'}
    </td>
  </tr>
);
