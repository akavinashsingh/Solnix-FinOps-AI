import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { NudgeAlert } from '../data/types';
import { PageHeader } from './PageHeader';
import {
  Bell, MessageCircle, Mail, Smartphone, ArrowRight, CheckCircle,
  AlertTriangle, AlertCircle, Clock, Zap, TrendingDown,
} from 'lucide-react';

const formatINR = (n: number) => '₹' + n.toLocaleString('en-IN');

const severityTone: Record<NudgeAlert['severity'], { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  INFO:     { bg: 'bg-accent-bg',  text: 'text-accent',  border: 'border-accent',     icon: <AlertCircle size={11} /> },
  WARNING:  { bg: 'bg-warning-bg', text: 'text-warning', border: 'border-warning-bd', icon: <AlertTriangle size={11} /> },
  CRITICAL: { bg: 'bg-danger-bg',  text: 'text-danger',  border: 'border-danger-bd',  icon: <Zap size={11} /> },
};

const typeLabel: Record<NudgeAlert['type'], string> = {
  LOW_BALANCE:    'Low balance · pre-due',
  OVERDUE_GRACE:  'Overdue · in grace window',
  SECOND_MISSED:  'Second missed EMI',
  AT_RISK:        'At-risk · monitor',
};

export const NudgeView: React.FC = () => {
  const { nudges, applicants, sendNudge, resolveNudge, escalateNudge, setActiveApplicant } = useApp();

  const pending  = nudges.filter(n => n.status === 'PENDING');
  const sent     = nudges.filter(n => n.status === 'NUDGE_SENT');
  const resolved = nudges.filter(n => n.status === 'RESOLVED');
  const escalated= nudges.filter(n => n.status === 'ESCALATED');

  const [filter, setFilter] = useState<'PENDING' | 'NUDGE_SENT' | 'RESOLVED' | 'ESCALATED' | 'ALL'>('PENDING');
  const filtered = useMemo(() => {
    if (filter === 'ALL') return nudges;
    return nudges.filter(n => n.status === filter);
  }, [nudges, filter]);

  const findApp = (id: string) => applicants.find(a => a.id === id);

  // Top stats
  const critical = pending.filter(n => n.severity === 'CRITICAL').length;
  const warning  = pending.filter(n => n.severity === 'WARNING').length;
  const totalAtRisk = pending.reduce((s, n) => s + n.emiAmount, 0);

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-7xl w-full">
      <PageHeader
        title="Predictive Nudges"
        subtitle={`${pending.length} preventable defaults detected · ${formatINR(totalAtRisk)} at risk · stop the miss before it happens`}
      />

      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric tone="danger"  icon={<Zap size={14} />}            label="Critical (due today)" value={critical} />
        <Metric tone="warning" icon={<AlertTriangle size={14} />}  label="Warning (due in 1–3d)" value={warning} />
        <Metric tone="neutral" icon={<MessageCircle size={14} />}  label="Nudges sent" value={sent.length} />
        <Metric tone="success" icon={<CheckCircle size={14} />}    label="Resolved" value={resolved.length + escalated.length} />
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-warm-sm overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0 flex items-center gap-1.5">
            <Bell size={13} /> Nudge queue
          </h3>
          <div className="flex border border-border rounded-md overflow-hidden text-[11px] font-data uppercase tracking-label">
            {([
              ['PENDING',   'Pending',  pending.length],
              ['NUDGE_SENT','Sent',     sent.length],
              ['ESCALATED', 'Escalated',escalated.length],
              ['RESOLVED',  'Resolved', resolved.length],
              ['ALL',       'All',      nudges.length],
            ] as const).map(([key, label, count]) => (
              <button
                key={key}
                onClick={() => setFilter(key as typeof filter)}
                className={`px-2.5 py-1.5 cursor-pointer flex items-center gap-1 ${filter === key ? 'bg-ink-1 text-surface' : 'bg-surface text-ink-3 hover:text-ink-1'}`}
              >
                {label}<span className="font-data tabular">{count}</span>
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center text-[13px] text-ink-3 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-md bg-success-bg border border-success-bd text-success flex items-center justify-center">
              <CheckCircle size={24} />
            </div>
            <p className="m-0">No nudges in this bucket.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filtered.map(n => {
              const app = findApp(n.applicantId);
              if (!app) return null;
              const tone = severityTone[n.severity];
              return (
                <div key={n.id} className="border-b border-border last:border-b-0 p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-9 h-9 shrink-0 rounded-md ${tone.bg} ${tone.border} border ${tone.text} flex items-center justify-center`}>
                        {tone.icon}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-data uppercase tracking-label ${tone.text} ${tone.bg} ${tone.border} border rounded-sm px-1.5 py-0.5`}>{n.severity}</span>
                          <button
                            onClick={() => setActiveApplicant(app)}
                            className="text-[13px] font-medium text-ink-1 hover:text-accent cursor-pointer"
                          >
                            {app.name} <span className="font-data text-[11px] text-accent ml-1">{app.id}</span>
                          </button>
                          <span className="text-[10px] font-data uppercase tracking-label text-ink-3">{typeLabel[n.type]}</span>
                        </div>
                        <p className="text-[12px] text-ink-2 mt-1 leading-relaxed m-0">{n.message}</p>
                      </div>
                    </div>

                    {/* Status chip */}
                    <div className="text-right text-[10px] font-data uppercase tracking-label text-ink-3 flex flex-col items-end gap-1 shrink-0">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(n.generatedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {n.status === 'NUDGE_SENT' && n.channelSent && (
                        <span className="text-aa-teal">Sent via {n.channelSent}</span>
                      )}
                      {n.status === 'ESCALATED' && <span className="text-danger">Escalated</span>}
                      {n.status === 'RESOLVED' && <span className="text-success">Resolved</span>}
                    </div>
                  </div>

                  {/* Facts strip */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border border-border rounded-md bg-surface-2 p-3 text-[11px]">
                    <Fact label="Borrower" value={app.name} />
                    <Fact label="EMI amount" value={formatINR(n.emiAmount)} mono />
                    <Fact
                      label="Current balance"
                      value={formatINR(n.currentBalance)}
                      mono
                      tone={n.currentBalance < n.emiAmount ? 'danger' : 'success'}
                    />
                    <Fact
                      label="Shortfall"
                      value={formatINR(Math.max(0, n.emiAmount - n.currentBalance))}
                      mono
                      tone={n.currentBalance < n.emiAmount ? 'danger' : 'ink'}
                    />
                  </div>

                  {/* Channel preview */}
                  {n.status === 'PENDING' && (
                    <div className="border border-border rounded-md p-3 flex flex-col gap-2 bg-surface-2">
                      <span className="text-[10px] font-data uppercase tracking-label text-ink-3">Preview · WhatsApp template</span>
                      <p className="text-[12px] text-ink-1 leading-relaxed m-0 italic">
                        "Hi {app.name.split(' ')[0]}, this is Solnix. Your EMI of {formatINR(n.emiAmount)} is due
                        {n.daysToEmi !== undefined ? ` in ${n.daysToEmi} day${n.daysToEmi === 1 ? '' : 's'}` : ' soon'} and your balance is currently low.
                        Tap here to add funds or schedule a transfer. We can also restructure if needed."
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  {n.status === 'PENDING' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => sendNudge(n.id, 'WhatsApp')}
                        className="h-8 px-3 rounded-md bg-accent text-surface text-[11px] font-medium hover:bg-accent-2 flex items-center gap-1.5 cursor-pointer focus-ring"
                      >
                        <MessageCircle size={12} /> Send WhatsApp
                      </button>
                      <button
                        onClick={() => sendNudge(n.id, 'SMS')}
                        className="h-8 px-3 rounded-md border border-border bg-surface text-ink-2 text-[11px] font-medium hover:bg-surface-2 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Smartphone size={12} /> SMS
                      </button>
                      <button
                        onClick={() => sendNudge(n.id, 'Email')}
                        className="h-8 px-3 rounded-md border border-border bg-surface text-ink-2 text-[11px] font-medium hover:bg-surface-2 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Mail size={12} /> Email
                      </button>
                      <button
                        onClick={() => escalateNudge(n.id)}
                        className="h-8 px-3 rounded-md border border-danger-bd bg-surface text-danger text-[11px] font-medium hover:bg-danger-bg flex items-center gap-1.5 cursor-pointer"
                      >
                        <TrendingDown size={12} /> Escalate to collections
                      </button>
                      <div className="flex-1" />
                      <button
                        onClick={() => resolveNudge(n.id)}
                        className="h-8 px-3 rounded-md border border-border bg-surface text-ink-3 text-[11px] font-medium hover:bg-surface-2 flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle size={12} /> Mark resolved
                      </button>
                    </div>
                  )}

                  {n.status === 'NUDGE_SENT' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => resolveNudge(n.id)}
                        className="h-8 px-3 rounded-md border border-border bg-surface text-ink-2 text-[11px] font-medium hover:bg-surface-2 flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle size={12} /> Mark resolved
                      </button>
                      <button
                        onClick={() => setActiveApplicant(app)}
                        className="h-8 px-3 rounded-md border border-border bg-surface text-ink-2 text-[11px] font-medium hover:bg-surface-2 flex items-center gap-1.5 cursor-pointer"
                      >
                        Open applicant <ArrowRight size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const Metric: React.FC<{ tone: 'danger' | 'warning' | 'success' | 'neutral'; icon: React.ReactNode; label: string; value: number }> = ({ tone, icon, label, value }) => {
  const toneClass =
    tone === 'danger'  ? 'bg-danger-bg border-danger-bd text-danger' :
    tone === 'warning' ? 'bg-warning-bg border-warning-bd text-warning' :
    tone === 'success' ? 'bg-success-bg border-success-bd text-success' :
                         'bg-surface border-border text-ink-1';
  return (
    <div className={`border rounded-xl p-4 flex flex-col gap-2 shadow-warm-sm ${toneClass}`}>
      <span className="text-[10px] font-data uppercase tracking-label flex items-center gap-1.5 opacity-80">{icon} {label}</span>
      <span className="font-display text-[28px] leading-none tracking-tight-data tabular">{value}</span>
    </div>
  );
};

const Fact: React.FC<{ label: string; value: string; mono?: boolean; tone?: 'success' | 'danger' | 'ink' }> = ({ label, value, mono, tone }) => {
  const toneClass = tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-ink-1';
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-data uppercase tracking-label text-ink-3">{label}</span>
      <span className={`${mono ? 'font-data tabular' : ''} ${toneClass} font-medium mt-0.5`}>{value}</span>
    </div>
  );
};
