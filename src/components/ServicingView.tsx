import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Applicant } from '../data/types';
import { PageHeader } from './PageHeader';
import { Sparkline, StackedBar, LegendList } from './charts';
import {
  Wallet, CalendarDays, AlertTriangle, CheckCircle, TrendingUp,
  ChevronRight, Clock, Banknote,
} from 'lucide-react';

const formatINR = (n: number) => '₹' + n.toLocaleString('en-IN');
const formatShortINR = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
};
const daysFromNow = (iso?: string) => iso ? Math.round((new Date(iso).getTime() - Date.now()) / 86400000) : 0;

export const ServicingView: React.FC = () => {
  const { applicants, setActiveApplicant } = useApp();

  const active = useMemo(
    () => applicants.filter(a => a.servicing && (a.loanState === 'SERVICING' || a.loanState === 'DEFAULTED' || a.loanState === 'DISBURSED' || a.loanState === 'CLOSED')),
    [applicants]
  );

  const totals = useMemo(() => {
    const totalDisbursed = active.reduce((s, a) => s + (a.servicing?.disbursedAmount ?? 0), 0);
    const totalOutstanding = active.reduce((s, a) => s + (a.servicing?.outstandingPrincipal ?? 0), 0);
    const totalRepaid = active.reduce((s, a) => s + (a.servicing?.totalRepaid ?? 0), 0);
    const overdueLoans = active.filter(a => (a.servicing?.daysOverdue ?? 0) > 0).length;
    const onTimeLoans = active.filter(a => !((a.servicing?.daysOverdue ?? 0) > 0) && a.loanState === 'SERVICING').length;
    const defaulted = active.filter(a => a.loanState === 'DEFAULTED').length;
    return { totalDisbursed, totalOutstanding, totalRepaid, overdueLoans, onTimeLoans, defaulted };
  }, [active]);

  const dueIn7 = useMemo(
    () => active.filter(a => {
      const d = daysFromNow(a.servicing?.nextEmiDate);
      return d >= 0 && d <= 7;
    }).sort((a, b) => daysFromNow(a.servicing?.nextEmiDate) - daysFromNow(b.servicing?.nextEmiDate)),
    [active]
  );

  const segments = [
    { label: 'On-time',    value: totals.onTimeLoans, tone: 'success' as const },
    { label: 'Overdue',    value: totals.overdueLoans, tone: 'warning' as const },
    { label: 'Defaulted',  value: totals.defaulted, tone: 'danger' as const },
    { label: 'Closed',     value: active.filter(a => a.loanState === 'CLOSED').length, tone: 'neutral' as const },
  ];

  // Mock repayment sparkline (last 6 months)
  const repaymentTrend = [62, 71, 68, 79, 84, 92];

  const [filter, setFilter] = useState<'ALL' | 'SERVICING' | 'OVERDUE' | 'DEFAULTED' | 'CLOSED'>('ALL');

  const filtered = useMemo(() => {
    if (filter === 'ALL') return active;
    if (filter === 'OVERDUE') return active.filter(a => (a.servicing?.daysOverdue ?? 0) > 0);
    return active.filter(a => a.loanState === filter);
  }, [active, filter]);

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-7xl w-full">
      <PageHeader
        title="Servicing Portfolio"
        subtitle={`${active.length} active loans · ${formatShortINR(totals.totalOutstanding)} outstanding · ${formatShortINR(totals.totalRepaid)} repaid to date`}
      />

      {/* Hero KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-12 gap-4">
        <div className="md:col-span-4 bg-surface border border-border rounded-xl p-5 shadow-warm-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-data uppercase tracking-label text-ink-3 flex items-center gap-1.5"><Wallet size={13} /> Total disbursed</span>
            <TrendingUp size={13} className="text-success" />
          </div>
          <div className="flex items-end justify-between">
            <span className="font-display text-[32px] text-ink-1 leading-none tracking-tight-data tabular">{formatShortINR(totals.totalDisbursed)}</span>
            <div className="w-24"><Sparkline points={repaymentTrend} tone="success" height={32} /></div>
          </div>
          <span className="text-[10px] font-data tabular text-ink-3">across {active.length} active loans</span>
        </div>

        <div className="md:col-span-3 bg-surface border border-border rounded-xl p-5 shadow-warm-sm flex flex-col gap-2">
          <span className="text-[10px] font-data uppercase tracking-label text-ink-3 flex items-center gap-1.5"><Banknote size={13} /> Outstanding</span>
          <span className="font-display text-[32px] text-ink-1 leading-none tracking-tight-data tabular">{formatShortINR(totals.totalOutstanding)}</span>
          <span className="text-[11px] font-data tabular text-ink-3">
            {Math.round((totals.totalRepaid / Math.max(1, totals.totalDisbursed)) * 100)}% repaid to date
          </span>
        </div>

        <div className="md:col-span-3 bg-warning-bg border border-warning-bd rounded-xl p-5 shadow-warm-sm flex flex-col gap-2">
          <span className="text-[10px] font-data uppercase tracking-label text-warning flex items-center gap-1.5"><AlertTriangle size={13} /> Overdue</span>
          <span className="font-display text-[32px] text-warning leading-none tracking-tight-data tabular">{totals.overdueLoans}</span>
          <span className="text-[11px] font-data tabular text-warning">loans flagged for collections</span>
        </div>

        <div className="md:col-span-2 bg-surface border border-border rounded-xl p-5 shadow-warm-sm flex flex-col gap-2">
          <span className="text-[10px] font-data uppercase tracking-label text-ink-3 flex items-center gap-1.5"><CheckCircle size={13} className="text-success" /> On-time</span>
          <span className="font-display text-[32px] text-ink-1 leading-none tracking-tight-data tabular">{totals.onTimeLoans}</span>
          <span className="text-[11px] font-data tabular text-success">healthy book</span>
        </div>
      </div>

      {/* Health band */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-warm-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="m-0 text-[10px] font-data uppercase tracking-label text-ink-3">Portfolio Health</h4>
          <span className="text-[10px] font-data tabular text-ink-3">{active.length} loans</span>
        </div>
        <StackedBar segments={segments} height={16} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-1">
          <LegendList items={segments} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

        {/* Due-in-7-days panel */}
        <aside className="md:col-span-5 bg-surface border border-border rounded-xl shadow-warm-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0 flex items-center gap-1.5">
              <CalendarDays size={13} /> EMIs due in next 7 days
            </h3>
            <span className="text-[10px] font-data tabular text-ink-3">{dueIn7.length}</span>
          </div>
          <div className="flex flex-col max-h-[400px] overflow-y-auto">
            {dueIn7.length === 0 ? (
              <div className="px-4 py-8 text-center text-[12px] text-ink-3">No EMIs due in the next week.</div>
            ) : dueIn7.map(a => {
              const d = daysFromNow(a.servicing?.nextEmiDate);
              const isOverdue = (a.servicing?.daysOverdue ?? 0) > 0;
              const isToday = d === 0;
              return (
                <button
                  key={a.id}
                  onClick={() => setActiveApplicant(a)}
                  className="text-left p-3.5 border-b border-border last:border-b-0 hover:bg-surface-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-data text-[11px] text-accent tabular">{a.id}</span>
                      <span className="font-medium text-ink-1 text-[13px]">{a.name}</span>
                    </div>
                    <span className="font-data tabular text-[13px] text-ink-1">{formatINR(a.servicing!.nextEmiAmount!)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[11px]">
                    <span className="text-ink-3">{a.employer ?? '—'} · {a.category}</span>
                    <span className={[
                      'font-data uppercase tracking-label',
                      isOverdue ? 'text-danger' : isToday ? 'text-warning' : 'text-ink-3',
                    ].join(' ')}>
                      {isOverdue ? `${a.servicing!.daysOverdue}d overdue` : isToday ? 'due today' : `due in ${d}d`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Portfolio table */}
        <section className="md:col-span-7 bg-surface border border-border rounded-xl shadow-warm-sm overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0">Active Portfolio</h3>
            <div className="flex border border-border rounded-md overflow-hidden text-[11px] font-data uppercase tracking-label">
              {(['ALL', 'SERVICING', 'OVERDUE', 'DEFAULTED', 'CLOSED'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-2.5 py-1.5 cursor-pointer ${filter === s ? 'bg-ink-1 text-surface' : 'bg-surface text-ink-3 hover:text-ink-1'}`}
                >
                  {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-[13px] border-collapse">
              <thead className="sticky top-0">
                <tr className="bg-surface-2 border-b border-border text-[10px] font-data uppercase tracking-label text-ink-3">
                  <th className="py-2.5 px-4 text-left font-medium">ID</th>
                  <th className="py-2.5 px-4 text-left font-medium">Borrower</th>
                  <th className="py-2.5 px-4 text-right font-medium">Outstanding</th>
                  <th className="py-2.5 px-4 text-right font-medium">Next EMI</th>
                  <th className="py-2.5 px-4 text-center font-medium">Progress</th>
                  <th className="py-2.5 px-4 text-center font-medium">Health</th>
                  <th className="py-2.5 px-4 text-right w-8"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <ServicingRow key={a.id} a={a} onClick={() => setActiveApplicant(a)} />
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-12 text-center text-ink-3 text-[13px]">No loans match this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

const ServicingRow: React.FC<{ a: Applicant; onClick: () => void }> = ({ a, onClick }) => {
  const s = a.servicing!;
  const progress = s.emisPaid / s.emisTotal;
  const isOverdue = (s.daysOverdue ?? 0) > 0;
  const isDefault = a.loanState === 'DEFAULTED';
  const isClosed = a.loanState === 'CLOSED';

  return (
    <tr onClick={onClick} className="border-b border-border row-stripe row-hover cursor-pointer">
      <td className="py-2.5 px-4 font-data text-[12px] text-accent">{a.id}</td>
      <td className="py-2.5 px-4">
        <div className="flex flex-col">
          <span className="font-medium text-ink-1">{a.name}</span>
          <span className="text-[11px] text-ink-3">{a.employer ?? '—'}</span>
        </div>
      </td>
      <td className="py-2.5 px-4 text-right font-data tabular text-ink-1">{formatINR(s.outstandingPrincipal)}</td>
      <td className="py-2.5 px-4 text-right">
        {isClosed ? (
          <span className="text-[11px] font-data uppercase tracking-label text-success">Closed</span>
        ) : (
          <div className="flex flex-col items-end">
            <span className="font-data tabular text-ink-1">{formatINR(s.nextEmiAmount!)}</span>
            <span className="text-[10px] font-data tabular text-ink-3">{s.nextEmiDate}</span>
          </div>
        )}
      </td>
      <td className="py-2.5 px-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden border border-border">
            <div className={`h-full ${isOverdue ? 'bg-warning' : isDefault ? 'bg-danger' : isClosed ? 'bg-success' : 'bg-accent'}`} style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <span className="text-[10px] font-data tabular text-ink-3 w-12 text-right">{s.emisPaid}/{s.emisTotal}</span>
        </div>
      </td>
      <td className="py-2.5 px-4 text-center">
        {isDefault ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-data uppercase tracking-label text-danger bg-danger-bg border border-danger-bd rounded-sm px-1.5 py-0.5">
            <AlertTriangle size={10} /> Default
          </span>
        ) : isOverdue ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-data uppercase tracking-label text-warning bg-warning-bg border border-warning-bd rounded-sm px-1.5 py-0.5">
            <Clock size={10} /> {s.daysOverdue}d
          </span>
        ) : isClosed ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-data uppercase tracking-label text-success bg-success-bg border border-success-bd rounded-sm px-1.5 py-0.5">
            <CheckCircle size={10} /> Closed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-data uppercase tracking-label text-success">
            <CheckCircle size={10} /> On-time
          </span>
        )}
      </td>
      <td className="py-2.5 px-4 text-right text-ink-3"><ChevronRight size={14} /></td>
    </tr>
  );
};
