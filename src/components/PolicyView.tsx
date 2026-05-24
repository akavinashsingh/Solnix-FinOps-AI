import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Applicant, PolicyConfig } from '../data/types';
import { PageHeader } from './PageHeader';
import { BarChart } from './charts';
import {
  FileSliders, Play, CheckCircle, AlertTriangle, XCircle,
  RotateCcw, ShieldCheck,
} from 'lucide-react';

const dtiOf = (a: Applicant) =>
  Math.round(((a.existingDebt + (a.requestedAmount / a.tenureMonths)) / a.income) * 100);

function simulate(app: Applicant, policy: PolicyConfig): 'APPROVED' | 'FLAGGED' | 'DENIED' {
  const dti = dtiOf(app);
  const bounces = app.transactions.filter(t => t.isBounce).length;
  if (app.cibil < policy.cibilMin) return 'DENIED';
  if (bounces > policy.bouncesAllowed) return 'DENIED';
  if (dti > policy.dtiMax) return 'DENIED';
  if (dti > policy.dtiFlagAbove || app.cibil < policy.cibilFlagBelow) return 'FLAGGED';
  if (app.affordabilityScore < policy.autoApproveThreshold) return 'FLAGGED';
  return 'APPROVED';
}

export const PolicyView: React.FC = () => {
  const { activePolicy, updateActivePolicy, applicants, policies } = useApp();

  // Local "draft" state — initialised from active policy, edits applied via Save
  const [draft, setDraft] = useState<PolicyConfig>(activePolicy);
  React.useEffect(() => { setDraft(activePolicy); }, [activePolicy.version]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(activePolicy);

  /* Playback: simulate every historical applicant under draft policy
     and compare to their actual outcome.                            */
  const playback = useMemo(() => {
    const counts = { APPROVED: 0, FLAGGED: 0, DENIED: 0 };
    const deltas: Array<{ app: Applicant; before: string; after: 'APPROVED' | 'FLAGGED' | 'DENIED' }> = [];
    for (const a of applicants) {
      const after = simulate(a, draft);
      counts[after]++;
      const before = a.status === 'OVERRIDDEN' ? 'APPROVED' : a.status === 'PENDING' ? 'FLAGGED' : a.status;
      if (before !== after) deltas.push({ app: a, before, after });
    }
    return { counts, deltas };
  }, [applicants, draft]);

  const totalApplicants = applicants.length;
  const approvedPct = Math.round((playback.counts.APPROVED / totalApplicants) * 100);
  const flaggedPct  = Math.round((playback.counts.FLAGGED  / totalApplicants) * 100);
  const deniedPct   = Math.round((playback.counts.DENIED   / totalApplicants) * 100);

  const chartData = [
    { label: 'Approved', value: playback.counts.APPROVED, tone: 'success' as const },
    { label: 'Flagged',  value: playback.counts.FLAGGED,  tone: 'warning' as const },
    { label: 'Denied',   value: playback.counts.DENIED,   tone: 'danger'  as const },
  ];

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-7xl w-full">
      <PageHeader
        title="Policy & Playback"
        subtitle={`${activePolicy.name} v${activePolicy.version} — active since ${activePolicy.effectiveDate}. Edit any threshold to see the live impact on your portfolio.`}
        right={
          <div className="flex gap-2">
            {dirty && (
              <button
                onClick={() => setDraft(activePolicy)}
                className="h-9 px-3 rounded-md border border-border text-ink-2 text-[12px] font-medium hover:bg-surface-2 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={13} /> Reset
              </button>
            )}
            <button
              onClick={() => updateActivePolicy(draft)}
              disabled={!dirty}
              className="h-9 px-3 rounded-md bg-accent text-surface text-[12px] font-medium hover:bg-accent-2 flex items-center gap-1.5 cursor-pointer focus-ring shadow-warm-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle size={13} /> Save & activate
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

        {/* Editor */}
        <section className="md:col-span-7 bg-surface border border-border rounded-xl shadow-warm-sm p-6 flex flex-col gap-5">

          <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0 flex items-center gap-1.5">
            <FileSliders size={13} /> Risk thresholds
          </h3>

          <SliderField
            label="CIBIL minimum (below = auto-deny)"
            value={draft.cibilMin}
            min={500} max={800} step={10}
            onChange={v => setDraft({ ...draft, cibilMin: v })}
            unit=""
          />

          <SliderField
            label="CIBIL flag-below (auto-flag for HITL)"
            value={draft.cibilFlagBelow}
            min={draft.cibilMin} max={850} step={10}
            onChange={v => setDraft({ ...draft, cibilFlagBelow: v })}
            unit=""
          />

          <SliderField
            label="DTI ceiling (above = auto-deny)"
            value={draft.dtiMax}
            min={30} max={75} step={1}
            onChange={v => setDraft({ ...draft, dtiMax: v })}
            unit="%"
          />

          <SliderField
            label="DTI flag-above (auto-flag for HITL)"
            value={draft.dtiFlagAbove}
            min={20} max={draft.dtiMax} step={1}
            onChange={v => setDraft({ ...draft, dtiFlagAbove: v })}
            unit="%"
          />

          <SliderField
            label="Auto-approve confidence threshold"
            value={draft.autoApproveThreshold}
            min={60} max={95} step={1}
            onChange={v => setDraft({ ...draft, autoApproveThreshold: v })}
            unit="%"
          />

          <SliderField
            label="HITL SLA (minutes before breach)"
            value={draft.hitlSlaMinutes}
            min={5} max={120} step={5}
            onChange={v => setDraft({ ...draft, hitlSlaMinutes: v })}
            unit="m"
          />

          <SliderField
            label="ACH/UPI bounces allowed (above = auto-deny)"
            value={draft.bouncesAllowed}
            min={0} max={5} step={1}
            onChange={v => setDraft({ ...draft, bouncesAllowed: v })}
            unit=""
          />

          {/* Max ticket size per category */}
          <div className="flex flex-col gap-2 mt-2">
            <span className="text-[10px] font-data uppercase tracking-label text-ink-3">Maximum ticket size by category</span>
            <div className="grid grid-cols-2 gap-3">
              {(['Personal', 'Business', 'Micro-Lending', 'Consumer'] as const).map(cat => (
                <label key={cat} className="flex items-center justify-between border border-border rounded-md p-2.5 text-[12px]">
                  <span className="text-ink-2">{cat}</span>
                  <input
                    type="number"
                    value={draft.maxTicketSize[cat]}
                    onChange={e => setDraft({
                      ...draft,
                      maxTicketSize: { ...draft.maxTicketSize, [cat]: Number(e.target.value) },
                    })}
                    className="w-28 bg-transparent border-0 text-right font-data tabular text-ink-1 font-medium focus:outline-none"
                  />
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Playback */}
        <aside className="md:col-span-5 flex flex-col gap-4">

          {/* Distribution chart */}
          <div className="bg-surface border border-border rounded-xl shadow-warm-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0 flex items-center gap-1.5">
                <Play size={13} /> Live playback · {totalApplicants} applicants
              </h3>
              {dirty && (
                <span className="text-[10px] font-data uppercase tracking-label text-warning bg-warning-bg border border-warning-bd rounded-sm px-1.5 py-0.5">Draft</span>
              )}
            </div>

            <BarChart data={chartData} height={140} valueFormatter={v => `${v}`} />

            <div className="grid grid-cols-3 gap-3 mt-3">
              <Stat label="Approved" value={`${approvedPct}%`} tone="success" />
              <Stat label="Flagged"  value={`${flaggedPct}%`}  tone="warning" />
              <Stat label="Denied"   value={`${deniedPct}%`}   tone="danger"  />
            </div>
          </div>

          {/* Outcome shifts */}
          <div className="bg-surface border border-border rounded-xl shadow-warm-sm p-5 flex flex-col gap-3">
            <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0">
              Outcome shifts · {playback.deltas.length} applicants
            </h3>

            {playback.deltas.length === 0 ? (
              <div className="text-[12px] text-ink-3 italic">No outcomes change under the draft policy — it produces the same decisions as the active one.</div>
            ) : (
              <ul className="m-0 p-0 list-none max-h-64 overflow-y-auto flex flex-col gap-1.5">
                {playback.deltas.slice(0, 12).map(d => {
                  const toneIcon = d.after === 'APPROVED' ? <CheckCircle size={11} className="text-success" /> : d.after === 'FLAGGED' ? <AlertTriangle size={11} className="text-warning" /> : <XCircle size={11} className="text-danger" />;
                  return (
                    <li key={d.app.id} className="flex items-center gap-2 text-[12px] border border-border rounded-md p-2">
                      <span className="font-data text-[10px] text-accent tabular w-[58px]">{d.app.id}</span>
                      <span className="flex-1 text-ink-1 truncate">{d.app.name}</span>
                      <span className="font-data text-[10px] uppercase tracking-label text-ink-3">{d.before}</span>
                      <span className="text-ink-3">→</span>
                      <span className="inline-flex items-center gap-1 font-data text-[10px] uppercase tracking-label text-ink-1">
                        {toneIcon} {d.after}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Policy versions */}
          <div className="bg-surface border border-border rounded-xl shadow-warm-sm p-5 flex flex-col gap-2">
            <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0">Policy versions</h3>
            <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
              {policies.map(p => (
                <li key={p.id} className="flex items-center gap-2 text-[12px] border border-border rounded-md p-2.5">
                  <ShieldCheck size={12} className={p.status === 'ACTIVE' ? 'text-success' : 'text-ink-3'} />
                  <div className="flex-1">
                    <div className="text-ink-1 font-medium">{p.name} <span className="font-data tabular text-ink-3">v{p.version}</span></div>
                    <div className="text-[10px] font-data text-ink-3 tabular">eff. {p.effectiveDate}</div>
                  </div>
                  <span className={[
                    'text-[10px] font-data uppercase tracking-label rounded-sm px-1.5 py-0.5 border',
                    p.status === 'ACTIVE'   ? 'bg-success-bg text-success border-success-bd' :
                    p.status === 'DRAFT'    ? 'bg-warning-bg text-warning border-warning-bd' :
                                              'bg-surface-2 text-ink-3 border-border',
                  ].join(' ')}>
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

const SliderField: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step, unit, onChange }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <label className="text-[10px] font-data uppercase tracking-label text-ink-3">{label}</label>
      <span className="font-data tabular text-[13px] text-ink-1 font-medium">{value}{unit}</span>
    </div>
    <input
      type="range"
      min={min} max={max} step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full accent-[var(--color-accent)] cursor-pointer"
    />
    <div className="flex justify-between text-[10px] font-data text-ink-3 tabular">
      <span>{min}{unit}</span>
      <span>{max}{unit}</span>
    </div>
  </div>
);

const Stat: React.FC<{ label: string; value: string; tone: 'success' | 'warning' | 'danger' }> = ({ label, value, tone }) => {
  const toneClass = tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : 'text-danger';
  return (
    <div className="border border-border rounded-md p-2.5">
      <div className="text-[10px] font-data uppercase tracking-label text-ink-3">{label}</div>
      <div className={`font-display text-[20px] leading-none tracking-tight-data tabular mt-1 ${toneClass}`}>{value}</div>
    </div>
  );
};
