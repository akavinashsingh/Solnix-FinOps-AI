import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { ViewState } from '../context/AppContext';
import type { Applicant } from '../data/types';
import {
  Search, ArrowRight, LayoutDashboard, BrainCircuit, Shield,
  Banknote, Wallet, Bell, BarChart3, FileSliders, Scale, User,
  CheckCircle, AlertTriangle, XCircle,
} from 'lucide-react';

/* ============================================================
 *  Natural-language filter parser.
 *
 *  Supports: status keywords ("flagged", "approved", "denied"),
 *  category names ("personal loans", "business", "consumer", "micro"),
 *  recency ("today", "this week", "this month", "yesterday"),
 *  numeric predicates ("DTI > 40%", "CIBIL < 700", "amount > 5 lakh"),
 *  servicing keywords ("low balance", "overdue", "default"),
 *  and direct ID / name match ("APP-002", "Priya").
 * ============================================================ */

interface ParsedQuery {
  statuses?: Applicant['status'][];
  loanStates?: Applicant['loanState'][];
  categories?: Applicant['category'][];
  recencyDays?: number;
  cibilOp?: { op: '<' | '>' | '<=' | '>='; value: number };
  dtiOp?:   { op: '<' | '>' | '<=' | '>='; value: number };
  amountOp?:{ op: '<' | '>' | '<=' | '>='; value: number };
  lowBalance?: boolean;
  overdue?: boolean;
  defaulted?: boolean;
  textTokens: string[];
}

function parseQuery(q: string): ParsedQuery {
  const lower = q.toLowerCase();
  const tokens = lower.split(/\s+/).filter(Boolean);
  const out: ParsedQuery = { textTokens: [] };

  if (/\b(flag(ged)?|hitl)\b/.test(lower)) out.statuses = ['FLAGGED'];
  if (/\bapproved\b/.test(lower))         out.statuses = ['APPROVED', 'OVERRIDDEN'];
  if (/\b(denied|rejected)\b/.test(lower)) out.statuses = ['DENIED'];
  if (/\bpending\b/.test(lower))          out.statuses = ['PENDING'];

  if (/\bpersonal\b/.test(lower))          out.categories = ['Personal'];
  if (/\bbusiness\b/.test(lower))          out.categories = [...(out.categories ?? []), 'Business'] as Applicant['category'][];
  if (/\bconsumer\b/.test(lower))          out.categories = [...(out.categories ?? []), 'Consumer'] as Applicant['category'][];
  if (/\bmicro(-?lending)?\b/.test(lower)) out.categories = [...(out.categories ?? []), 'Micro-Lending'] as Applicant['category'][];

  if (/\btoday\b/.test(lower))          out.recencyDays = 1;
  if (/\byesterday\b/.test(lower))      out.recencyDays = 2;
  if (/\bthis\s+week\b/.test(lower))    out.recencyDays = 7;
  if (/\bthis\s+month\b/.test(lower))   out.recencyDays = 30;

  const numericRe = /\b(cibil|dti|amount)\s*(>=|<=|>|<|=)\s*(\d+(?:\.\d+)?)\s*(%|lakh|l|cr|crore|k)?/gi;
  let m: RegExpExecArray | null;
  while ((m = numericRe.exec(lower)) !== null) {
    const field = m[1];
    const rawOp: string = m[2];
    let value = parseFloat(m[3]);
    const unit = (m[4] ?? '').toLowerCase();
    if (unit === 'lakh' || unit === 'l') value *= 100000;
    if (unit === 'cr' || unit === 'crore') value *= 10000000;
    if (unit === 'k') value *= 1000;
    const opNormal: '<' | '>' | '<=' | '>=' =
      rawOp === '=' ? '>=' : (rawOp as '<' | '>' | '<=' | '>=');
    const payload = { op: opNormal, value };
    if (field === 'cibil')  out.cibilOp = payload;
    if (field === 'dti')    out.dtiOp = payload;
    if (field === 'amount') out.amountOp = payload;
  }

  if (/\blow\s+balance\b/.test(lower))   out.lowBalance = true;
  if (/\boverdue\b/.test(lower))         out.overdue = true;
  if (/\bdefault(ed)?\b/.test(lower))    out.defaulted = true;

  // Remaining text tokens for fuzzy name/id matching (drop control words)
  const drop = new Set([
    'flagged','flag','hitl','approved','denied','rejected','pending',
    'personal','business','consumer','micro','micro-lending',
    'today','yesterday','this','week','month','loan','loans','low','balance','overdue','default','defaulted',
    'show','me','find','all','with','and','or','dti','cibil','amount','>',  '<', '>=','<=','=', '%','lakh','l','cr','crore','k',
  ]);
  out.textTokens = tokens.filter(t => !drop.has(t));
  return out;
}

function compareOp(op: '<' | '>' | '<=' | '>=', a: number, b: number): boolean {
  switch (op) {
    case '<':  return a <  b;
    case '<=': return a <= b;
    case '>':  return a >  b;
    case '>=': return a >= b;
  }
}

function dtiOf(app: Applicant): number {
  return Math.round(((app.existingDebt + (app.requestedAmount / app.tenureMonths)) / app.income) * 100);
}

function applyParsed(apps: Applicant[], parsed: ParsedQuery): Applicant[] {
  return apps.filter(app => {
    if (parsed.statuses && !parsed.statuses.includes(app.status)) return false;
    if (parsed.categories && !parsed.categories.includes(app.category)) return false;
    if (parsed.recencyDays) {
      const days = (Date.now() - new Date(app.applicationDate).getTime()) / 86400000;
      if (days > parsed.recencyDays) return false;
    }
    if (parsed.cibilOp  && !compareOp(parsed.cibilOp.op, app.cibil, parsed.cibilOp.value)) return false;
    if (parsed.dtiOp    && !compareOp(parsed.dtiOp.op,   dtiOf(app), parsed.dtiOp.value)) return false;
    if (parsed.amountOp && !compareOp(parsed.amountOp.op, app.requestedAmount, parsed.amountOp.value)) return false;
    if (parsed.lowBalance) {
      if (!app.servicing || !app.servicing.nextEmiAmount) return false;
      if (app.servicing.currentBalance >= app.servicing.nextEmiAmount) return false;
    }
    if (parsed.overdue) {
      if (!app.servicing || !app.servicing.daysOverdue || app.servicing.daysOverdue <= 0) return false;
    }
    if (parsed.defaulted) {
      if (app.loanState !== 'DEFAULTED') return false;
    }
    if (parsed.textTokens.length > 0) {
      const blob = `${app.id} ${app.name} ${app.employer ?? ''}`.toLowerCase();
      if (!parsed.textTokens.every(t => blob.includes(t))) return false;
    }
    return true;
  });
}

/* ============================================================
 *  Quick-jump nav commands
 * ============================================================ */

const NAV_COMMANDS: Array<{ keywords: string[]; view: ViewState; label: string; icon: React.ReactNode }> = [
  { keywords: ['console', 'dashboard'],            view: 'console',      label: 'Operations Console',  icon: <LayoutDashboard size={14} /> },
  { keywords: ['pipeline', 'underwrite', 'apply'], view: 'pipeline',     label: 'Underwriting Pipeline', icon: <BrainCircuit size={14} /> },
  { keywords: ['hitl', 'review', 'flagged'],       view: 'hitl',         label: 'HITL Exception Queue', icon: <Shield size={14} /> },
  { keywords: ['disburse', 'release'],             view: 'disbursement', label: 'Disbursement Queue',  icon: <Banknote size={14} /> },
  { keywords: ['servicing', 'portfolio', 'active'],view: 'servicing',    label: 'Servicing Portfolio', icon: <Wallet size={14} /> },
  { keywords: ['nudge', 'collection', 'reminder'], view: 'nudge',        label: 'Predictive Nudges',   icon: <Bell size={14} /> },
  { keywords: ['analytics', 'chart', 'report'],    view: 'analytics',    label: 'Portfolio Analytics', icon: <BarChart3 size={14} /> },
  { keywords: ['policy', 'rules', 'playback'],     view: 'policy',       label: 'Policy & Playback',   icon: <FileSliders size={14} /> },
  { keywords: ['compliance', 'audit', 'consent'],  view: 'compliance',   label: 'Audit & Consent',     icon: <Scale size={14} /> },
  { keywords: ['borrower', 'portal'],              view: 'borrower',     label: 'Borrower Portal',     icon: <User size={14} /> },
];

/* ============================================================
 *  Component
 * ============================================================ */

const StatusDot: React.FC<{ status: Applicant['status'] }> = ({ status }) => {
  if (status === 'APPROVED' || status === 'OVERRIDDEN') return <CheckCircle size={11} className="text-success" />;
  if (status === 'FLAGGED') return <AlertTriangle size={11} className="text-warning" />;
  if (status === 'DENIED')  return <XCircle size={11} className="text-danger" />;
  return <span className="w-2 h-2 rounded-full bg-ink-3" />;
};

export const CommandPalette: React.FC = () => {
  const { cmdkOpen, setCmdkOpen, applicants, setView, setActiveApplicant } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cmdkOpen) {
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      setQuery('');
    }
  }, [cmdkOpen]);

  const parsed = useMemo(() => parseQuery(query), [query]);

  const matchedApplicants = useMemo(() => {
    if (!query.trim()) return [];
    return applyParsed(applicants, parsed).slice(0, 8);
  }, [applicants, parsed, query]);

  const matchedNav = useMemo(() => {
    const t = query.toLowerCase().trim();
    if (!t) return NAV_COMMANDS.slice(0, 4);
    return NAV_COMMANDS
      .filter(c => c.keywords.some(k => k.includes(t) || t.includes(k)) || c.label.toLowerCase().includes(t))
      .slice(0, 4);
  }, [query]);

  if (!cmdkOpen) return null;

  const jumpToApplicant = (a: Applicant) => {
    setActiveApplicant(a);
    setView('console');
    setCmdkOpen(false);
  };

  const jumpToView = (v: ViewState) => {
    setView(v);
    setCmdkOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink-1/30 backdrop-blur-[2px]" onClick={() => setCmdkOpen(false)} />

      <div
        className="relative w-full max-w-xl bg-surface border border-border rounded-lg shadow-warm-xl flex flex-col overflow-hidden animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Input */}
        <div className="border-b border-border flex items-center gap-2 px-4 h-12">
          <Search size={16} className="text-ink-3" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Filter applicants in natural language, or jump to a view…"
            className="flex-1 bg-transparent border-0 text-[14px] text-ink-1 placeholder:text-ink-3 focus:outline-none"
          />
          <span className="text-[10px] font-data uppercase tracking-label text-ink-3 border border-border rounded-sm px-1 py-0.5">esc</span>
        </div>

        {/* Parsed filter chips */}
        {query && (parsed.statuses || parsed.categories || parsed.recencyDays || parsed.dtiOp || parsed.cibilOp || parsed.amountOp || parsed.lowBalance || parsed.overdue || parsed.defaulted) && (
          <div className="px-4 py-2 bg-surface-2 border-b border-border flex flex-wrap gap-1.5 text-[10px] font-data uppercase tracking-label">
            {parsed.statuses?.map(s => <Chip key={s}>{s}</Chip>)}
            {parsed.categories?.map(c => <Chip key={c}>{c}</Chip>)}
            {parsed.recencyDays && <Chip>last {parsed.recencyDays}d</Chip>}
            {parsed.cibilOp  && <Chip>CIBIL {parsed.cibilOp.op} {parsed.cibilOp.value}</Chip>}
            {parsed.dtiOp    && <Chip>DTI {parsed.dtiOp.op} {parsed.dtiOp.value}%</Chip>}
            {parsed.amountOp && <Chip>Amount {parsed.amountOp.op} ₹{parsed.amountOp.value.toLocaleString('en-IN')}</Chip>}
            {parsed.lowBalance && <Chip>low balance</Chip>}
            {parsed.overdue    && <Chip>overdue</Chip>}
            {parsed.defaulted  && <Chip>defaulted</Chip>}
          </div>
        )}

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">

          {/* Applicant matches */}
          {matchedApplicants.length > 0 && (
            <div className="py-2">
              <div className="px-4 text-[10px] font-data uppercase tracking-label text-ink-3 mb-1">Applicants · {matchedApplicants.length}</div>
              {matchedApplicants.map(a => (
                <button
                  key={a.id}
                  onClick={() => jumpToApplicant(a)}
                  className="w-full text-left px-4 py-2 hover:bg-surface-2 flex items-center gap-3 cursor-pointer"
                >
                  <StatusDot status={a.status} />
                  <span className="font-data text-[11px] text-accent w-[58px] tabular">{a.id}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-ink-1 truncate font-medium">{a.name}</div>
                    <div className="text-[11px] text-ink-3 truncate">{a.employer ?? '—'} · {a.category} · ₹{a.requestedAmount.toLocaleString('en-IN')}</div>
                  </div>
                  <span className="font-data text-[10px] tabular text-ink-3">CIBIL {a.cibil}</span>
                  <ArrowRight size={12} className="text-ink-3" />
                </button>
              ))}
            </div>
          )}

          {/* Nav matches */}
          {matchedNav.length > 0 && (
            <div className="py-2 border-t border-border">
              <div className="px-4 text-[10px] font-data uppercase tracking-label text-ink-3 mb-1">Jump to</div>
              {matchedNav.map(n => (
                <button
                  key={n.view}
                  onClick={() => jumpToView(n.view)}
                  className="w-full text-left px-4 py-2 hover:bg-surface-2 flex items-center gap-3 cursor-pointer"
                >
                  <span className="text-ink-3">{n.icon}</span>
                  <span className="flex-1 text-[13px] text-ink-1">{n.label}</span>
                  <ArrowRight size={12} className="text-ink-3" />
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {query && matchedApplicants.length === 0 && matchedNav.length === 0 && (
            <div className="px-4 py-8 text-center text-[12px] text-ink-3">
              No matches. Try: <span className="font-data text-ink-2">flagged personal loans</span>,{' '}
              <span className="font-data text-ink-2">low balance</span>,{' '}
              <span className="font-data text-ink-2">DTI &gt; 40%</span>.
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="border-t border-border bg-surface-2 px-4 py-2 flex items-center gap-3 text-[10px] font-data uppercase tracking-label text-ink-3">
          <span>↵ open</span>
          <span>↑↓ navigate</span>
          <span className="ml-auto">Try: <span className="text-ink-2">flagged this week</span></span>
        </div>
      </div>
    </div>
  );
};

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="text-[10px] font-data uppercase tracking-label text-accent bg-accent-bg border border-accent rounded-sm px-1.5 py-0.5">
    {children}
  </span>
);
