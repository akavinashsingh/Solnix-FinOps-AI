import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { AuditCategory } from '../data/types';
import { PageHeader } from './PageHeader';
import {
  Scale, Download, ShieldCheck, AlertTriangle, X, Check, FileText,
} from 'lucide-react';

const CATEGORIES: AuditCategory[] = ['IDENTITY', 'CONSENT', 'UNDERWRITING', 'HITL', 'DISBURSEMENT', 'SERVICING', 'COMPLIANCE'];

export const ComplianceView: React.FC = () => {
  const { globalAudit, applicants, revokeConsent } = useApp();
  const [categoryFilter, setCategoryFilter] = useState<AuditCategory | 'ALL'>('ALL');
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);

  const filteredAudit = useMemo(
    () => globalAudit.filter(e => categoryFilter === 'ALL' || e.category === categoryFilter).slice(0, 150),
    [globalAudit, categoryFilter]
  );

  const consents = useMemo(
    () => applicants.filter(a => a.consent).sort((a, b) =>
      (a.consent!.status === 'ACTIVE' ? 0 : 1) - (b.consent!.status === 'ACTIVE' ? 0 : 1)
    ),
    [applicants]
  );

  const active = consents.filter(a => a.consent!.status === 'ACTIVE').length;
  const revoked = consents.filter(a => a.consent!.status === 'REVOKED').length;
  const expired = consents.filter(a => a.consent!.status === 'EXPIRED').length;

  const exportCsv = () => {
    const rows = [
      ['timestamp', 'applicantId', 'applicantName', 'actor', 'category', 'action'],
      ...filteredAudit.map(e => [
        e.timestamp,
        e.applicantId ?? '',
        e.applicantName ?? '',
        e.actor,
        e.category,
        e.action.replace(/"/g, '""'),
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solnix-audit-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-7xl w-full">
      <PageHeader
        title="Audit & Consent"
        subtitle="DPDP 2023 audit log · consent lifecycle · revocation workflow"
        right={
          <button
            onClick={exportCsv}
            className="h-9 px-3 rounded-md bg-accent text-surface text-[12px] font-medium hover:bg-accent-2 flex items-center gap-1.5 cursor-pointer focus-ring shadow-warm-sm"
          >
            <Download size={13} /> Export CSV
          </button>
        }
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric label="Audit entries"      value={globalAudit.length.toString()} icon={<FileText size={14} />} />
        <Metric label="Active consents"    value={active.toString()}            icon={<ShieldCheck size={14} className="text-aa-teal" />} />
        <Metric label="Revoked consents"   value={revoked.toString()}           icon={<X size={14} className="text-danger" />} tone="danger" />
        <Metric label="Expired consents"   value={expired.toString()}           icon={<AlertTriangle size={14} className="text-warning" />} tone="warning" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

        {/* Audit log */}
        <section className="md:col-span-7 bg-surface border border-border rounded-xl shadow-warm-sm overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0 flex items-center gap-1.5">
              <Scale size={13} /> Global audit log
            </h3>
            <div className="flex border border-border rounded-md overflow-hidden text-[10px] font-data uppercase tracking-label flex-wrap">
              {(['ALL', ...CATEGORIES] as const).map(c => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c as AuditCategory | 'ALL')}
                  className={`px-2 py-1.5 cursor-pointer ${categoryFilter === c ? 'bg-ink-1 text-surface' : 'bg-surface text-ink-3 hover:text-ink-1'}`}
                >{c.toLowerCase()}</button>
              ))}
            </div>
          </div>

          <div className="max-h-[640px] overflow-y-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead className="sticky top-0">
                <tr className="bg-surface-2 border-b border-border text-[10px] font-data uppercase tracking-label text-ink-3">
                  <th className="py-2 px-3 text-left font-medium w-[120px]">Time</th>
                  <th className="py-2 px-3 text-left font-medium">Category</th>
                  <th className="py-2 px-3 text-left font-medium">Actor</th>
                  <th className="py-2 px-3 text-left font-medium">Applicant</th>
                  <th className="py-2 px-3 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAudit.map(e => (
                  <tr key={e.id} className="border-b border-border last:border-b-0 hover:bg-surface-2 row-stripe">
                    <td className="py-2 px-3 font-data tabular text-[10px] text-ink-3 whitespace-nowrap">
                      {new Date(e.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 px-3">
                      <span className={[
                        'text-[10px] font-data uppercase tracking-label rounded-sm px-1.5 py-0.5 border',
                        e.category === 'COMPLIANCE'   ? 'bg-accent-bg text-accent border-accent' :
                        e.category === 'HITL'         ? 'bg-warning-bg text-warning border-warning-bd' :
                        e.category === 'DISBURSEMENT' ? 'bg-aa-teal-bg text-aa-teal border-aa-teal-bd' :
                        e.category === 'SERVICING'    ? 'bg-success-bg text-success border-success-bd' :
                                                        'bg-surface-2 text-ink-3 border-border',
                      ].join(' ')}>{e.category.toLowerCase()}</span>
                    </td>
                    <td className="py-2 px-3 text-ink-1">{e.actor}</td>
                    <td className="py-2 px-3 text-ink-3">
                      {e.applicantId ? <><span className="font-data text-[10px] text-accent tabular">{e.applicantId}</span> · {e.applicantName}</> : '—'}
                    </td>
                    <td className="py-2 px-3 text-ink-2">{e.action}</td>
                  </tr>
                ))}
                {filteredAudit.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-[12px] text-ink-3">No entries in this category.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Consents */}
        <aside className="md:col-span-5 bg-surface border border-border rounded-xl shadow-warm-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-aa-teal" /> Consent ledger
            </h3>
            <span className="text-[10px] font-data tabular text-ink-3">{consents.length} consents</span>
          </div>

          <div className="max-h-[640px] overflow-y-auto">
            {consents.map(a => {
              const c = a.consent!;
              return (
                <div key={c.id} className="p-3.5 border-b border-border last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-data text-[11px] text-accent tabular">{a.id}</span>
                      <span className="font-medium text-ink-1 text-[13px]">{a.name}</span>
                    </div>
                    <span className={[
                      'text-[10px] font-data uppercase tracking-label rounded-sm px-1.5 py-0.5 border',
                      c.status === 'ACTIVE'  ? 'bg-success-bg text-success border-success-bd' :
                      c.status === 'REVOKED' ? 'bg-danger-bg text-danger border-danger-bd' :
                                                'bg-surface-2 text-ink-3 border-border',
                    ].join(' ')}>{c.status}</span>
                  </div>
                  <div className="text-[11px] text-ink-3 mt-1">
                    {c.fipName} · {c.bankAccount}
                  </div>
                  <div className="flex justify-between text-[10px] font-data tabular text-ink-3 mt-1.5">
                    <span>Issued {new Date(c.issuedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                    <span>Expires {new Date(c.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                  </div>
                  {c.revokedAt && (
                    <div className="text-[10px] font-data text-danger mt-1">
                      Revoked {new Date(c.revokedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · by {c.revokedBy}
                    </div>
                  )}
                  {c.status === 'ACTIVE' && (
                    <button
                      onClick={() => setRevokeTarget(a.id)}
                      className="mt-2 text-[11px] text-danger hover:underline font-medium cursor-pointer flex items-center gap-1"
                    >
                      <X size={11} /> Revoke (borrower-initiated)
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* Revocation confirmation */}
      {revokeTarget && (
        <RevokeModal
          applicantId={revokeTarget}
          name={applicants.find(a => a.id === revokeTarget)?.name ?? ''}
          onCancel={() => setRevokeTarget(null)}
          onConfirm={() => { revokeConsent(revokeTarget); setRevokeTarget(null); }}
        />
      )}
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string; icon: React.ReactNode; tone?: 'success' | 'warning' | 'danger' }> = ({ label, value, icon, tone }) => {
  const toneClass = tone === 'danger' ? 'border-danger-bd bg-danger-bg text-danger' :
                    tone === 'warning' ? 'border-warning-bd bg-warning-bg text-warning' :
                                          'border-border bg-surface text-ink-1';
  return (
    <div className={`border rounded-xl p-4 flex flex-col gap-2 shadow-warm-sm ${toneClass}`}>
      <span className="text-[10px] font-data uppercase tracking-label flex items-center gap-1.5 opacity-80">{icon} {label}</span>
      <span className="font-display text-[28px] leading-none tracking-tight-data tabular">{value}</span>
    </div>
  );
};

const RevokeModal: React.FC<{ applicantId: string; name: string; onCancel: () => void; onConfirm: () => void }> = ({ applicantId, name, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-fade-in">
    <div className="absolute inset-0 bg-ink-1/30 backdrop-blur-[2px]" onClick={onCancel} />
    <div className="relative w-full max-w-md bg-surface border border-border rounded-lg shadow-warm-xl p-6 flex flex-col gap-4 animate-scale-up">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-md bg-danger-bg border border-danger-bd text-danger flex items-center justify-center"><X size={16} /></div>
        <div>
          <h3 className="font-display text-[18px] m-0 text-ink-1">Revoke consent for {name}?</h3>
          <span className="text-[10px] font-data uppercase tracking-label text-ink-3">{applicantId}</span>
        </div>
      </div>

      <div className="bg-surface-2 border border-border rounded-md p-3 text-[12px] text-ink-2 leading-relaxed flex flex-col gap-2">
        <p className="m-0">Under DPDP 2023, the borrower has the right to revoke their consent at any time. This action will:</p>
        <ul className="m-0 pl-5">
          <li>Stop all future AA data fetches against this account</li>
          <li>Schedule derived analytics data for deletion within 30 days</li>
          <li>Be permanently logged in the audit trail</li>
          <li>Generate a confirmation receipt for the borrower</li>
        </ul>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 h-10 rounded-md border border-border text-ink-2 text-[12px] font-medium hover:bg-surface-2 cursor-pointer"
        >Cancel</button>
        <button
          onClick={onConfirm}
          className="flex-1 h-10 rounded-md bg-danger text-surface text-[12px] font-medium cursor-pointer flex items-center justify-center gap-1.5"
        ><Check size={14} /> Confirm revocation</button>
      </div>
    </div>
  </div>
);
