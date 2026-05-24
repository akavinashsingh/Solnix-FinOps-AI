import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Applicant } from '../data/types';
import { PageHeader } from './PageHeader';
import { Donut, LegendList, Histogram, BarChart, Sparkline } from './charts';
import { BarChart3, Users, TrendingUp, Banknote, AlertTriangle, ShieldCheck } from 'lucide-react';

const formatShortINR = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
};

const dtiOf = (a: Applicant) =>
  Math.round(((a.existingDebt + (a.requestedAmount / a.tenureMonths)) / a.income) * 100);

export const AnalyticsView: React.FC = () => {
  const { applicants } = useApp();

  /* --------- Status distribution --------- */
  const statusSegments = useMemo(() => ([
    { label: 'Approved',  value: applicants.filter(a => a.status === 'APPROVED').length, tone: 'success' as const },
    { label: 'Override',  value: applicants.filter(a => a.status === 'OVERRIDDEN').length, tone: 'accent' as const },
    { label: 'Flagged',   value: applicants.filter(a => a.status === 'FLAGGED').length, tone: 'warning' as const },
    { label: 'Denied',    value: applicants.filter(a => a.status === 'DENIED').length, tone: 'danger' as const },
    { label: 'Pending',   value: applicants.filter(a => a.status === 'PENDING').length, tone: 'neutral' as const },
  ].filter(s => s.value > 0)), [applicants]);

  const totalApps = applicants.length;
  const approvalRate = Math.round(((applicants.filter(a => a.status === 'APPROVED' || a.status === 'OVERRIDDEN').length) / totalApps) * 100);
  const totalDisbursed = applicants
    .filter(a => a.servicing)
    .reduce((s, a) => s + (a.servicing!.disbursedAmount), 0);
  const totalOutstanding = applicants
    .filter(a => a.servicing)
    .reduce((s, a) => s + a.servicing!.outstandingPrincipal, 0);
  const defaulted = applicants.filter(a => a.loanState === 'DEFAULTED').length;
  const servicing = applicants.filter(a => a.loanState === 'SERVICING').length;
  const defaultRate = servicing + defaulted > 0 ? Math.round((defaulted / (servicing + defaulted)) * 100 * 10) / 10 : 0;

  /* --------- CIBIL histogram --------- */
  const cibilBins = useMemo(() => {
    const bins = [
      { label: '<600', range: [0, 600],   count: 0 },
      { label: '6-65', range: [600, 650], count: 0 },
      { label: '6-7',  range: [650, 700], count: 0 },
      { label: '7-75', range: [700, 750], count: 0 },
      { label: '7-8',  range: [750, 800], count: 0 },
      { label: '8+',   range: [800, 999], count: 0 },
    ];
    for (const a of applicants) {
      for (const b of bins) {
        if (a.cibil >= b.range[0] && a.cibil < b.range[1]) { b.count++; break; }
      }
    }
    return bins.map(b => ({ label: b.label, count: b.count }));
  }, [applicants]);

  /* --------- DTI histogram --------- */
  const dtiBins = useMemo(() => {
    const bins = [
      { label: '<20',  range: [0, 20],   count: 0 },
      { label: '20-3', range: [20, 30],  count: 0 },
      { label: '30-4', range: [30, 40],  count: 0 },
      { label: '40-5', range: [40, 50],  count: 0 },
      { label: '50+',  range: [50, 999], count: 0 },
    ];
    for (const a of applicants) {
      const d = dtiOf(a);
      for (const b of bins) {
        if (d >= b.range[0] && d < b.range[1]) { b.count++; break; }
      }
    }
    return bins.map(b => ({ label: b.label, count: b.count }));
  }, [applicants]);

  /* --------- Category breakdown with avg ticket --------- */
  const categoryBreakdown = useMemo(() => {
    const acc = new Map<string, { count: number; total: number; defaulted: number }>();
    for (const a of applicants) {
      const entry = acc.get(a.category) ?? { count: 0, total: 0, defaulted: 0 };
      entry.count++;
      entry.total += a.requestedAmount;
      if (a.loanState === 'DEFAULTED') entry.defaulted++;
      acc.set(a.category, entry);
    }
    return Array.from(acc.entries()).map(([cat, v]) => ({
      label: cat,
      value: v.count,
      avgTicket: Math.round(v.total / Math.max(1, v.count)),
      defaultRate: Math.round((v.defaulted / Math.max(1, v.count)) * 100),
      tone: ('accent' as const),
    }));
  }, [applicants]);

  /* --------- Borrower segmentation --------- */
  const segments = useMemo(() => {
    const buckets = {
      'Prime salaried':  { count: 0, criteria: 'CIBIL ≥ 750 · DTI < 30%' },
      'Near-prime':      { count: 0, criteria: 'CIBIL 700-749 · DTI < 40%' },
      'Sub-prime':       { count: 0, criteria: 'CIBIL 650-699 or DTI 40-50%' },
      'Thin file':       { count: 0, criteria: 'CIBIL < 650 or thin bureau' },
      'High variance':   { count: 0, criteria: 'Freelance / self-employed' },
      'Distressed':      { count: 0, criteria: 'Default / serious delinquency' },
    };
    for (const a of applicants) {
      if (a.loanState === 'DEFAULTED') buckets['Distressed'].count++;
      else if (a.employer?.includes('Self-employed') || a.employer?.includes('Freelance')) buckets['High variance'].count++;
      else if (a.cibil >= 750 && dtiOf(a) < 30) buckets['Prime salaried'].count++;
      else if (a.cibil >= 700 && dtiOf(a) < 40) buckets['Near-prime'].count++;
      else if (a.cibil >= 650) buckets['Sub-prime'].count++;
      else buckets['Thin file'].count++;
    }
    return Object.entries(buckets).map(([label, v]) => ({ label, ...v }));
  }, [applicants]);

  /* --------- Employer concentration (top 6) --------- */
  const employerConcentration = useMemo(() => {
    const acc = new Map<string, number>();
    for (const a of applicants) {
      const key = a.employer ?? '—';
      acc.set(key, (acc.get(key) ?? 0) + 1);
    }
    return Array.from(acc.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([emp, count]) => ({ label: emp.length > 14 ? emp.slice(0, 14) + '…' : emp, value: count, tone: 'accent' as const }));
  }, [applicants]);

  /* --------- Cohort by category, mocked monthly approval-rate trend --------- */
  const monthlyVolume = [22, 28, 31, 35, 38, 42];   // mock
  const monthlyApproval = [62, 68, 71, 76, 81, 83]; // mock

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-7xl w-full">
      <PageHeader
        title="Portfolio Analytics"
        subtitle={`${totalApps} applications · ${formatShortINR(totalDisbursed)} disbursed · ${approvalRate}% approval rate`}
      />

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Total applications" value={totalApps.toString()} sub={`${applicants.filter(a => (Date.now() - new Date(a.applicationDate).getTime()) < 7 * 86400000).length} this week`} icon={<Users size={14} />} trend={monthlyVolume} />
        <KPI label="Approval rate"      value={`${approvalRate}%`}    sub="auto + override" icon={<ShieldCheck size={14} />} trend={monthlyApproval} tone="success" />
        <KPI label="Outstanding book"   value={formatShortINR(totalOutstanding)} sub={`${servicing} active loans`} icon={<Banknote size={14} />} trend={[120, 135, 148, 162, 175, 188]} />
        <KPI label="Default rate"       value={`${defaultRate}%`}     sub={`${defaulted} defaulted of ${servicing + defaulted}`} icon={<AlertTriangle size={14} />} trend={[2.1, 2.0, 1.8, 2.2, 1.6, defaultRate]} tone={defaultRate > 2 ? 'warning' : 'success'} />
      </div>

      {/* Row 1: status donut + CIBIL hist + DTI hist */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        <div className="md:col-span-4 bg-surface border border-border rounded-xl shadow-warm-sm p-5">
          <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0 mb-4">Decision distribution</h3>
          <div className="flex items-center gap-4">
            <Donut segments={statusSegments} centerValue={`${approvalRate}%`} centerLabel="Approved" size={140} />
            <div className="flex-1">
              <LegendList items={statusSegments} />
            </div>
          </div>
        </div>

        <div className="md:col-span-4 bg-surface border border-border rounded-xl shadow-warm-sm p-5">
          <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0 mb-3">CIBIL distribution</h3>
          <Histogram bins={cibilBins} tone="accent" height={140} />
          <div className="flex justify-between text-[10px] font-data uppercase tracking-label text-ink-3 mt-2">
            <span>Sub-prime</span>
            <span>Prime</span>
          </div>
        </div>

        <div className="md:col-span-4 bg-surface border border-border rounded-xl shadow-warm-sm p-5">
          <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0 mb-3">DTI distribution</h3>
          <Histogram bins={dtiBins} tone="warning" height={140} />
          <div className="flex justify-between text-[10px] font-data uppercase tracking-label text-ink-3 mt-2">
            <span>Low leverage</span>
            <span>Over-leveraged</span>
          </div>
        </div>
      </div>

      {/* Row 2: category + employer concentration */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7 bg-surface border border-border rounded-xl shadow-warm-sm p-5">
          <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0 mb-3">Category breakdown</h3>
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-border text-[10px] font-data uppercase tracking-label text-ink-3">
                <th className="py-2 text-left font-medium">Category</th>
                <th className="py-2 text-right font-medium">Applications</th>
                <th className="py-2 text-right font-medium">Avg ticket</th>
                <th className="py-2 text-right font-medium">Default rate</th>
                <th className="py-2 text-left font-medium pl-4">Volume share</th>
              </tr>
            </thead>
            <tbody>
              {categoryBreakdown.map(c => {
                const pct = Math.round((c.value / totalApps) * 100);
                return (
                  <tr key={c.label} className="border-b border-border last:border-b-0">
                    <td className="py-2.5 text-ink-1 font-medium">{c.label}</td>
                    <td className="py-2.5 text-right font-data tabular text-ink-1">{c.value}</td>
                    <td className="py-2.5 text-right font-data tabular text-ink-1">{formatShortINR(c.avgTicket)}</td>
                    <td className={`py-2.5 text-right font-data tabular ${c.defaultRate > 5 ? 'text-danger' : c.defaultRate > 2 ? 'text-warning' : 'text-success'}`}>{c.defaultRate}%</td>
                    <td className="py-2.5 pl-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden border border-border">
                          <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] font-data tabular text-ink-3 w-9 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="md:col-span-5 bg-surface border border-border rounded-xl shadow-warm-sm p-5">
          <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0 mb-3">Employer concentration (top 6)</h3>
          <BarChart data={employerConcentration} height={180} valueFormatter={v => `${v}`} />
          <p className="text-[11px] text-ink-3 mt-2 m-0 italic">Watch single-employer exposure above 15% — a single layoff event would hit multiple loans.</p>
        </div>
      </div>

      {/* Row 3: segmentation + trend */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7 bg-surface border border-border rounded-xl shadow-warm-sm p-5">
          <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0 mb-3 flex items-center gap-1.5">
            <Users size={13} /> Borrower segmentation
          </h3>
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-border text-[10px] font-data uppercase tracking-label text-ink-3">
                <th className="py-2 text-left font-medium">Segment</th>
                <th className="py-2 text-left font-medium">Criteria</th>
                <th className="py-2 text-right font-medium">Borrowers</th>
                <th className="py-2 text-left font-medium pl-4">Share</th>
              </tr>
            </thead>
            <tbody>
              {segments.map(s => {
                const pct = Math.round((s.count / totalApps) * 100);
                return (
                  <tr key={s.label} className="border-b border-border last:border-b-0">
                    <td className="py-2.5 text-ink-1 font-medium">{s.label}</td>
                    <td className="py-2.5 text-ink-3 text-[11px]">{s.criteria}</td>
                    <td className="py-2.5 text-right font-data tabular text-ink-1">{s.count}</td>
                    <td className="py-2.5 pl-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden border border-border">
                          <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] font-data tabular text-ink-3 w-9 text-right">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="md:col-span-5 bg-surface border border-border rounded-xl shadow-warm-sm p-5 flex flex-col gap-4">
          <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0 flex items-center gap-1.5">
            <TrendingUp size={13} /> Approval rate · 6-month trend
          </h3>
          <Sparkline points={monthlyApproval} tone="success" height={80} />
          <div className="flex justify-between text-[10px] font-data tabular text-ink-3">
            {['Dec','Jan','Feb','Mar','Apr','May'].map(m => <span key={m}>{m}</span>)}
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0 mb-2 flex items-center gap-1.5">
              <BarChart3 size={13} /> Volume · 6-month trend
            </h3>
            <Sparkline points={monthlyVolume} tone="accent" height={60} />
            <div className="flex justify-between text-[10px] font-data tabular text-ink-3 mt-1">
              {['Dec','Jan','Feb','Mar','Apr','May'].map(m => <span key={m}>{m}</span>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KPI: React.FC<{
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  trend: number[];
  tone?: 'success' | 'warning' | 'danger';
}> = ({ label, value, sub, icon, trend, tone }) => {
  const sparkTone = tone ?? 'accent';
  const toneClass = tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : tone === 'danger' ? 'text-danger' : 'text-ink-1';
  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-warm-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-data uppercase tracking-label text-ink-3 flex items-center gap-1.5">{icon} {label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className={`font-display text-[28px] leading-none tracking-tight-data tabular ${toneClass}`}>{value}</span>
        <div className="w-20"><Sparkline points={trend} tone={sparkTone} height={28} /></div>
      </div>
      <span className="text-[10px] font-data tabular text-ink-3">{sub}</span>
    </div>
  );
};
