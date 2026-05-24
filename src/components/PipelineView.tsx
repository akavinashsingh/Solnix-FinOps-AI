import React, { useMemo, useState } from 'react';
import { useApp, PIPELINE_STEPS } from '../context/AppContext';
import { mockApplicants } from '../data/mockApplicants';
import type { Applicant, Transaction } from '../data/mockApplicants';
import {
  ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle,
  AlertCircle, Plus, Minus, Loader2, BrainCircuit, FileUp, FileText,
  Sparkles, X,
} from 'lucide-react';

const PRESET_NAMES = ['Rahul Sharma', 'Priya Mehta', 'Amit Verma', 'Arjun Singh'] as const;
type PresetName = typeof PRESET_NAMES[number];

const PRESET_LABEL: Record<PresetName, { tone: 'success' | 'warning' | 'danger'; label: string }> = {
  'Rahul Sharma': { tone: 'success', label: 'Auto-Approve' },
  'Priya Mehta':  { tone: 'warning', label: 'HITL Flag' },
  'Amit Verma':   { tone: 'danger',  label: 'Reject' },
  'Arjun Singh':  { tone: 'success', label: 'Auto-Approve' },
};

const formatINR = (n: number) => '₹' + n.toLocaleString('en-IN');
const formatElapsed = (ms: number) => {
  const totalSeconds = ms / 1000;
  return totalSeconds.toFixed(1) + 's';
};
const formatStepElapsed = (ms?: number) => {
  if (typeof ms !== 'number') return '—';
  return (ms / 1000).toFixed(1) + 's';
};

export const PipelineView: React.FC = () => {
  const {
    setView, pipelineStage, setPipelineStage,
    currentStepIndex, stepElapsed, elapsedMs,
    runUnderwritingPipeline, activeApplicant, resetPipeline,
  } = useApp();

  // Form state
  const [name, setName] = useState('Priya Mehta');
  const [cibil, setCibil] = useState(675);
  const [income, setIncome] = useState(85000);
  const [existingDebt, setExistingDebt] = useState(15000);
  const [requestedAmount, setRequestedAmount] = useState(300000);
  const [tenureMonths, setTenureMonths] = useState(12);
  const [category, setCategory] = useState<Applicant['category']>('Business');
  const [transactions, setTransactions] = useState<Transaction[]>([
    { date: '2026-05-12', description: 'UPWORK ESCROW CRD', amount: 45000, type: 'credit' },
    { date: '2026-05-18', description: 'CRED CC SETTLEMENT', amount: 28000, type: 'debit' },
    { date: '2026-05-20', description: 'EMI HDFC CAR LOAN', amount: 15000, type: 'debit' },
    { date: '2026-05-22', description: 'FIVERR PAYOUT', amount: 35000, type: 'credit' },
  ]);

  const loadPreset = (presetName: PresetName) => {
    const preset = mockApplicants.find(a => a.name === presetName);
    if (!preset) return;
    setName(preset.name);
    setCibil(preset.cibil);
    setIncome(preset.income);
    setExistingDebt(preset.existingDebt);
    setRequestedAmount(preset.requestedAmount);
    setTenureMonths(preset.tenureMonths);
    setCategory(preset.category);
    setTransactions(preset.transactions.map(t => ({ ...t })));
  };

  const monthlyEmi = useMemo(
    () => (tenureMonths > 0 ? Math.round(requestedAmount / tenureMonths) : 0),
    [requestedAmount, tenureMonths]
  );
  const dti = useMemo(
    () => (income > 0 ? Math.round(((existingDebt + monthlyEmi) / income) * 100) : 0),
    [existingDebt, monthlyEmi, income]
  );

  const handleStart = () => setPipelineStage('consent');
  const handleApproveConsent = () =>
    runUnderwritingPipeline({
      name, cibil, income, existingDebt, requestedAmount, tenureMonths, category, transactions,
    });

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full">

      {/* Page header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => { resetPipeline(); setView('console'); }}
          className="w-9 h-9 rounded-md border border-border bg-surface text-ink-2 hover:bg-surface-2 flex items-center justify-center cursor-pointer focus-ring"
          aria-label="Back to console"
        >
          <ArrowLeft size={15} />
        </button>
        <div>
          <h1 className="font-display text-[28px] leading-tight m-0 text-ink-1">Underwriting Pipeline</h1>
          <p className="text-[13px] text-ink-3 mt-1">Configure an application and execute the autonomous agent stack end-to-end.</p>
        </div>
      </div>

      {pipelineStage === 'idle' && (
        <IdleStage
          name={name} setName={setName}
          cibil={cibil} setCibil={setCibil}
          income={income} setIncome={setIncome}
          existingDebt={existingDebt} setExistingDebt={setExistingDebt}
          requestedAmount={requestedAmount} setRequestedAmount={setRequestedAmount}
          tenureMonths={tenureMonths} setTenureMonths={setTenureMonths}
          category={category} setCategory={setCategory}
          transactions={transactions} setTransactions={setTransactions}
          monthlyEmi={monthlyEmi} dti={dti}
          loadPreset={loadPreset}
          onStart={handleStart}
        />
      )}

      {pipelineStage === 'consent' && (
        <ConsentStage
          onReject={() => setPipelineStage('idle')}
          onApprove={handleApproveConsent}
        />
      )}

      {pipelineStage === 'processing' && (
        <ProcessingStage
          currentStepIndex={currentStepIndex}
          stepElapsed={stepElapsed}
          elapsedMs={elapsedMs}
          applicantName={name}
        />
      )}

      {pipelineStage === 'complete' && activeApplicant && (
        <CompleteStage
          applicant={activeApplicant}
          elapsedMs={elapsedMs}
          onBackToConsole={() => { resetPipeline(); setView('console'); }}
          onGotoHITL={() => { resetPipeline(); setView('hitl'); }}
          onRunAnother={() => { resetPipeline(); }}
        />
      )}
    </div>
  );
};

/* ============================================================ */
/*                        Idle stage                            */
/* ============================================================ */

const IdleStage: React.FC<{
  name: string; setName: (v: string) => void;
  cibil: number; setCibil: (v: number) => void;
  income: number; setIncome: (v: number) => void;
  existingDebt: number; setExistingDebt: (v: number) => void;
  requestedAmount: number; setRequestedAmount: (v: number) => void;
  tenureMonths: number; setTenureMonths: (v: number) => void;
  category: Applicant['category']; setCategory: (v: Applicant['category']) => void;
  transactions: Transaction[]; setTransactions: (v: Transaction[]) => void;
  monthlyEmi: number; dti: number;
  loadPreset: (preset: PresetName) => void;
  onStart: () => void;
}> = (p) => {
  const updateTx = (idx: number, patch: Partial<Transaction>) => {
    p.setTransactions(p.transactions.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  };
  const removeTx = (idx: number) => p.setTransactions(p.transactions.filter((_, i) => i !== idx));
  const addTx = () => p.setTransactions([
    ...p.transactions,
    { date: new Date().toISOString().split('T')[0], description: 'NEW TRANSACTION', amount: 0, type: 'credit' },
  ]);

  const nameErr = !p.name.trim();
  const cibilErr = p.cibil < 300 || p.cibil > 900;
  const incomeErr = p.income <= 0;
  const debtErr = p.existingDebt < 0;
  const amountErr = p.requestedAmount <= 0;
  const tenureErr = p.tenureMonths < 1 || p.tenureMonths > 120;
  const hasErr = nameErr || cibilErr || incomeErr || debtErr || amountErr || tenureErr;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

      {/* Presets sidebar */}
      <aside className="md:col-span-4 glass-card rounded-xl p-5 flex flex-col gap-3 shadow-warm-sm">
        <div>
          <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0">Applicant Presets</h3>
          <p className="text-[12px] text-ink-3 mt-1">Load a profile that exercises a specific underwriting outcome.</p>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          {PRESET_NAMES.map(preset => {
            const meta = PRESET_LABEL[preset];
            const active = p.name === preset;
            const toneClasses =
              meta.tone === 'success' ? 'bg-success-bg text-success border-success-bd' :
              meta.tone === 'warning' ? 'bg-warning-bg text-warning border-warning-bd' :
                                        'bg-danger-bg text-danger border-danger-bd';
            return (
              <button
                key={preset}
                onClick={() => p.loadPreset(preset)}
                className={[
                  'text-left p-3 rounded-md border text-[13px] font-medium flex justify-between items-center cursor-pointer transition-colors',
                  active
                    ? 'border-accent bg-accent-bg text-accent'
                    : 'border-border hover:bg-surface-2 text-ink-1',
                ].join(' ')}
              >
                <span>{preset}</span>
                <span className={`text-[10px] font-data uppercase tracking-label px-1.5 py-0.5 rounded-sm border ${toneClasses}`}>
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
          <h4 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0">Data Source</h4>
          <div className="flex items-start gap-2 text-[12px]">
            <ShieldCheck size={14} className="text-aa-teal mt-0.5 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="text-ink-1 font-medium">OneMoney Account Aggregator</span>
              <span className="text-ink-3">RBI-regulated · live consent simulation</span>
            </div>
          </div>
          <div className="flex justify-between text-[11px] mt-2">
            <span className="text-ink-3">FIP</span>
            <span className="font-data tabular text-ink-1">HDFC Bank xxxx4521</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-ink-3">Scope</span>
            <span className="text-ink-1">6 months · read-only</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-ink-3">Validity</span>
            <span className="text-ink-1">24 hours from initiation</span>
          </div>
        </div>
      </aside>

      {/* Form */}
      <section className="md:col-span-8 glass-panel rounded-xl p-6 shadow-warm-lg flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0">Configure Application</h3>
          <span className="text-[11px] font-data tabular text-ink-3">Est. monthly EMI · <span className="text-ink-1">{formatINR(p.monthlyEmi)}</span></span>
        </div>

        <DocumentDropZone onExtracted={(d) => {
          if (d.name) p.setName(d.name);
          if (d.cibil) p.setCibil(d.cibil);
          if (d.income) p.setIncome(d.income);
          if (d.existingDebt) p.setExistingDebt(d.existingDebt);
        }} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Applicant Name" full>
            <input
              type="text"
              autocomplete="name"
              value={p.name}
              onChange={e => p.setName(e.target.value)}
              className={["form-input", nameErr ? "border-danger focus:border-danger" : ""].join(' ')}
              aria-invalid={nameErr}
              aria-describedby={nameErr ? "name-error" : undefined}
            />
            {nameErr && <span id="name-error" className="text-[11px] text-danger mt-1">Name is required</span>}
          </Field>

          <Field label="CIBIL Bureau Score">
            <input
              type="number" min={300} max={900}
              value={p.cibil}
              onChange={e => p.setCibil(Number(e.target.value))}
              className={["form-input font-data tabular", cibilErr ? "border-danger focus:border-danger" : ""].join(' ')}
              aria-invalid={cibilErr}
              aria-describedby={cibilErr ? "cibil-error" : undefined}
            />
            {cibilErr && <span id="cibil-error" className="text-[11px] text-danger mt-1">Must be between 300 and 900</span>}
          </Field>

          <Field label="Avg Monthly Income (₹)">
            <input
              type="number"
              value={p.income}
              onChange={e => p.setIncome(Number(e.target.value))}
              className={["form-input font-data tabular", incomeErr ? "border-danger focus:border-danger" : ""].join(' ')}
              aria-invalid={incomeErr}
              aria-describedby={incomeErr ? "income-error" : undefined}
            />
            {incomeErr && <span id="income-error" className="text-[11px] text-danger mt-1">Income must be greater than ₹0</span>}
          </Field>

          <Field label="Existing Monthly EMIs (₹)">
            <input
              type="number"
              value={p.existingDebt}
              onChange={e => p.setExistingDebt(Number(e.target.value))}
              className={["form-input font-data tabular", debtErr ? "border-danger focus:border-danger" : ""].join(' ')}
              aria-invalid={debtErr}
              aria-describedby={debtErr ? "debt-error" : undefined}
            />
            {debtErr && <span id="debt-error" className="text-[11px] text-danger mt-1">Debt cannot be negative</span>}
          </Field>

          <Field label="Requested Amount (₹)">
            <input
              type="number"
              value={p.requestedAmount}
              onChange={e => p.setRequestedAmount(Number(e.target.value))}
              className={["form-input font-data tabular", amountErr ? "border-danger focus:border-danger" : ""].join(' ')}
              aria-invalid={amountErr}
              aria-describedby={amountErr ? "amount-error" : undefined}
            />
            {amountErr && <span id="amount-error" className="text-[11px] text-danger mt-1">Amount must be greater than ₹0</span>}
          </Field>

          <Field label="Tenure (months)">
            <input
              type="number" min={1} max={120}
              value={p.tenureMonths}
              onChange={e => p.setTenureMonths(Number(e.target.value))}
              className={["form-input font-data tabular", tenureErr ? "border-danger focus:border-danger" : ""].join(' ')}
              aria-invalid={tenureErr}
              aria-describedby={tenureErr ? "tenure-error" : undefined}
            />
            {tenureErr && <span id="tenure-error" className="text-[11px] text-danger mt-1">Must be between 1 and 120 months</span>}
          </Field>

          <Field label="Borrowing Category" full>
            <select
              value={p.category}
              onChange={e => p.setCategory(e.target.value as Applicant['category'])}
              className="form-input cursor-pointer"
            >
              <option value="Personal">Personal Loan</option>
              <option value="Business">Business Capital</option>
              <option value="Micro-Lending">Micro-Lending Portfolio</option>
              <option value="Consumer">Consumer Durable EMI</option>
            </select>
          </Field>
        </div>

        {/* Computed strip */}
        <div className="border border-border rounded-md p-3 flex flex-wrap items-center justify-between gap-3 bg-surface-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-data uppercase tracking-label text-ink-3">Estimated EMI</span>
            <span className="font-data tabular text-[15px] font-medium text-ink-1">{formatINR(p.monthlyEmi)}/mo</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-data uppercase tracking-label text-ink-3">Combined DTI</span>
            <span className={`font-data tabular text-[15px] font-medium ${p.dti > 45 ? 'text-danger' : p.dti > 30 ? 'text-warning' : 'text-success'}`}>
              {p.dti}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-data uppercase tracking-label text-ink-3">CIBIL Tier</span>
            <span className={`font-data tabular text-[15px] font-medium ${p.cibil >= 750 ? 'text-success' : p.cibil >= 650 ? 'text-warning' : 'text-danger'}`}>
              {p.cibil >= 750 ? 'Prime' : p.cibil >= 650 ? 'Sub-prime' : 'Deep sub-prime'}
            </span>
          </div>
        </div>

        {/* Transactions editor (structured) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0">Bank Statement Transactions</h4>
            <button
              onClick={addTx}
              className="text-[11px] text-accent hover:text-accent-2 font-medium flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} /> Add row
            </button>
          </div>

          <div className="border border-border rounded-md overflow-hidden overflow-x-auto">
            <table className="w-full text-[12px] border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-surface-2 border-b border-border text-[10px] font-data uppercase tracking-label text-ink-3">
                  <th className="py-2 px-3 font-medium text-left">Date</th>
                  <th className="py-2 px-3 font-medium text-left">Description</th>
                  <th className="py-2 px-3 font-medium text-right">Amount</th>
                  <th className="py-2 px-3 font-medium">Type</th>
                  <th className="py-2 px-3 font-medium text-center w-8"></th>
                </tr>
              </thead>
              <tbody>
                {p.transactions.map((tx, idx) => (
                  <tr key={idx} className="border-b border-border last:border-b-0">
                    <td className="py-1.5 px-3 w-[120px]">
                      <input
                        type="date"
                        value={tx.date}
                        onChange={e => updateTx(idx, { date: e.target.value })}
                        className="bg-transparent border-0 font-data text-[11px] tabular text-ink-1 focus:outline-none"
                      />
                    </td>
                    <td className="py-1.5 px-3">
                      <input
                        type="text"
                        value={tx.description}
                        onChange={e => updateTx(idx, { description: e.target.value })}
                        className="bg-transparent border-0 text-[12px] text-ink-1 w-full focus:outline-none"
                      />
                    </td>
                    <td className="py-1.5 px-3 text-right">
                      <input
                        type="number"
                        value={tx.amount}
                        onChange={e => updateTx(idx, { amount: Number(e.target.value) })}
                        className="bg-transparent border-0 font-data tabular text-[12px] text-ink-1 text-right w-24 focus:outline-none"
                      />
                    </td>
                    <td className="py-1.5 px-3">
                      <select
                        value={tx.type}
                        onChange={e => updateTx(idx, { type: e.target.value as 'credit' | 'debit' })}
                        className="bg-transparent border-0 text-[11px] text-ink-2 cursor-pointer focus:outline-none"
                      >
                        <option value="credit">credit</option>
                        <option value="debit">debit</option>
                      </select>
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      <button
                        onClick={() => removeTx(idx)}
                        className="text-ink-3 hover:text-danger cursor-pointer"
                        aria-label="Remove transaction"
                      ><Minus size={12} /></button>
                    </td>
                  </tr>
                ))}
                {p.transactions.length === 0 && (
                  <tr><td colSpan={5} className="py-3 text-center text-[12px] text-ink-3">No transactions — add at least one row.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <button
          onClick={p.onStart}
          disabled={hasErr || p.transactions.length === 0}
          className="mt-2 h-11 w-full rounded-md bg-accent hover:bg-accent-2 text-surface text-[14px] font-medium flex items-center justify-center gap-2 transition-colors shadow-warm-sm focus-ring cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Initiate Autonomous Underwriting <ArrowRight size={15} />
        </button>
      </section>

      {/* Local form-input style (Tailwind v4 friendly) */}
      <style>{`
        .form-input {
          width: 100%;
          height: 38px;
          padding: 0 12px;
          background: rgba(18, 20, 29, 0.7);
          border: 1px solid var(--color-border-2);
          border-radius: 6px;
          color: var(--color-ink-1);
          font-size: 13px;
          transition: border-color 150ms ease-out, box-shadow 150ms ease-out;
        }
        .form-input:focus-visible {
          outline: none;
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25), 0 0 8px rgba(99, 102, 241, 0.15);
        }
      `}</style>
    </div>
  );
};

const Field: React.FC<{ label: string; full?: boolean; children: React.ReactNode }> = ({ label, full, children }) => (
  <label className={`flex flex-col gap-1.5 ${full ? 'col-span-2' : 'col-span-2 sm:col-span-1'}`}>
    <span className="text-[10px] font-data uppercase tracking-label text-ink-3">{label}</span>
    {children}
  </label>
);

/* ============================================================
 *  Document drop zone
 *
 *  Accepts a PDF / image, simulates Gemini Vision extraction
 *  (since we don't have a key by default), and emits the fields
 *  to pre-fill the application form.
 * ============================================================ */

interface ExtractedFields {
  name?: string;
  cibil?: number;
  income?: number;
  existingDebt?: number;
}

const DocumentDropZone: React.FC<{ onExtracted: (fields: ExtractedFields) => void }> = ({ onExtracted }) => {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedFields | null>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setExtracted(null);
    setExtracting(true);
    // Simulated extraction — in production this would call Gemini Vision
    setTimeout(() => {
      const fakeFields: ExtractedFields = (() => {
        const lower = f.name.toLowerCase();
        if (lower.includes('priya') || lower.includes('upwork'))      return { name: 'Priya Mehta',  cibil: 675, income: 85000,  existingDebt: 15000 };
        if (lower.includes('amit')  || lower.includes('verma'))       return { name: 'Amit Verma',   cibil: 540, income: 45000,  existingDebt: 22000 };
        if (lower.includes('rahul') || lower.includes('tcs'))         return { name: 'Rahul Sharma', cibil: 785, income: 150000, existingDebt: 12000 };
        // Generic: derive plausible numbers from the file size
        const seed = f.size % 100;
        return {
          name: 'Document Borrower',
          cibil: 680 + Math.round(seed * 1.4),
          income: 75000 + Math.round(seed * 800),
          existingDebt: 8000 + Math.round(seed * 220),
        };
      })();
      setExtracted(fakeFields);
      setExtracting(false);
    }, 1600);
  };

  const apply = () => {
    if (!extracted) return;
    onExtracted(extracted);
    setExtracted(null);
    setFile(null);
  };

  const reset = () => {
    setFile(null);
    setExtracted(null);
    setExtracting(false);
  };

  if (extracted) {
    return (
      <div className="border border-aa-teal-bd bg-aa-teal-bg rounded-md p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-aa-teal" />
            <h4 className="m-0 text-[12px] font-medium text-ink-1">Extracted from {file?.name}</h4>
          </div>
          <button onClick={reset} className="text-ink-3 hover:text-ink-1 cursor-pointer"><X size={14} /></button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[12px]">
          {extracted.name         && <ExtractedField label="Name"     value={extracted.name} />}
          {extracted.cibil        && <ExtractedField label="CIBIL"    value={String(extracted.cibil)} mono />}
          {extracted.income       && <ExtractedField label="Income"   value={`₹${extracted.income.toLocaleString('en-IN')}/mo`} mono />}
          {extracted.existingDebt && <ExtractedField label="EMIs"     value={`₹${extracted.existingDebt.toLocaleString('en-IN')}/mo`} mono />}
        </div>

        <div className="flex gap-2">
          <button
            onClick={reset}
            className="h-9 px-3 rounded-md border border-border bg-surface text-ink-2 text-[12px] font-medium hover:bg-surface-2 cursor-pointer"
          >Discard</button>
          <button
            onClick={apply}
            className="flex-1 h-9 rounded-md bg-aa-teal text-surface text-[12px] font-medium cursor-pointer flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 size={13} /> Apply to form
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
      }}
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          document.getElementById('dropzone-file-input')?.click();
        }
      }}
      aria-label="Drop statement file zone. Press Enter or Space to open file browser."
      className={[
        'border-2 border-dashed rounded-md p-4 flex items-center gap-3 transition-colors focus-ring',
        dragOver ? 'border-accent bg-accent-bg' : 'border-border bg-surface-2',
      ].join(' ')}
    >
      <div className="w-9 h-9 rounded-md bg-surface border border-border text-accent flex items-center justify-center shrink-0">
        {extracting ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-ink-1 font-medium">
          {extracting
            ? `Extracting from ${file?.name ?? 'document'}…`
            : 'Drop statement files here or press Enter to browse'}
        </div>
        <div className="text-[11px] text-ink-3 mt-0.5 truncate">
          {extracting
            ? 'Gemini Vision reading fields · name, CIBIL, income, EMIs'
            : 'PDF, JPG, or PNG · we auto-extract name, income, and EMIs'}
        </div>
      </div>
      {!extracting && (
        <label className="h-9 px-3 rounded-md bg-accent text-surface text-[12px] font-medium hover:bg-accent-2 cursor-pointer flex items-center gap-1.5">
          <FileText size={13} /> Browse
          <input
            id="dropzone-file-input"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>
      )}
    </div>
  );
};

const ExtractedField: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="border border-border bg-surface rounded-md p-2">
    <div className="text-[10px] font-data uppercase tracking-label text-ink-3">{label}</div>
    <div className={`${mono ? 'font-data tabular' : ''} text-ink-1 font-medium mt-0.5`}>{value}</div>
  </div>
);

/* ============================================================ */
/*                       Consent stage                          */
/* ============================================================ */

const ConsentStage: React.FC<{ onReject: () => void; onApprove: () => void }> = ({ onReject, onApprove }) => (
  <div className="flex justify-center items-start py-8">
    <div className="w-full max-w-md bg-surface border border-border rounded-xl shadow-warm-lg p-6 flex flex-col gap-5 animate-scale-up">

      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-data uppercase tracking-label text-aa-teal bg-aa-teal-bg border border-aa-teal-bd rounded-sm px-2 py-0.5">
          <ShieldCheck size={11} /> OneMoney AA Consent Rail
        </span>
        <span className="text-[10px] font-data uppercase tracking-label text-ink-3">RBI Regulated</span>
      </div>

      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <div className="w-14 h-14 rounded-xl bg-aa-teal-bg border border-aa-teal-bd flex items-center justify-center text-aa-teal">
          <ShieldCheck size={28} />
        </div>
        <h3 className="font-display text-[22px] leading-tight text-ink-1 m-0">Consented financial share request</h3>
        <p className="text-[13px] text-ink-3 leading-relaxed max-w-sm m-0">
          <span className="text-ink-1 font-medium">Solnix FinOps AI (FIU)</span> requests a single, read-only fetch of 6 months of bank statements.
        </p>
      </div>

      <dl className="border border-border rounded-md divide-y divide-border bg-surface-2 m-0">
        <Row k="Purpose" v="Loan Eligibility Credit Assessment" />
        <Row k="Access Period" v="Single Fetch · read-only" />
        <Row k="Data Scope" v="Transactions · Balance Statements" />
        <Row k="Validity" v="24 hours" />
      </dl>

      <div className="flex gap-2">
        <button
          onClick={onReject}
          className="flex-1 h-10 rounded-md border border-border text-ink-2 text-[12px] font-medium hover:bg-surface-2 cursor-pointer"
        >Reject</button>
        <button
          onClick={onApprove}
          className="flex-1 h-10 rounded-md bg-aa-teal text-surface text-[12px] font-medium hover:opacity-90 cursor-pointer focus-ring"
        >Approve consent</button>
      </div>
    </div>
  </div>
);

const Row: React.FC<{ k: string; v: string }> = ({ k, v }) => (
  <div className="flex justify-between items-center px-3 py-2 text-[12px]">
    <dt className="text-ink-3 m-0">{k}</dt>
    <dd className="text-ink-1 font-medium m-0">{v}</dd>
  </div>
);

/* ============================================================ */
/*                     Processing stage                         */
/* ============================================================ */

const ProcessingStage: React.FC<{
  currentStepIndex: number;
  stepElapsed: number[];
  elapsedMs: number;
  applicantName: string;
}> = ({ currentStepIndex, stepElapsed, elapsedMs, applicantName }) => (
  <div className="flex justify-center items-start py-6">
    <div className="w-full max-w-lg bg-surface border border-border rounded-xl shadow-warm-lg p-6 flex flex-col gap-5 animate-scale-up">

      {/* Hidden screen-reader announcer for pipeline step updates */}
      <div className="sr-only" aria-live="polite">
        {currentStepIndex >= 0 && currentStepIndex < PIPELINE_STEPS.length
          ? `Current step: ${PIPELINE_STEPS[currentStepIndex].label} is executing.`
          : 'Pipeline is preparing to run.'}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit size={16} className="text-accent" />
          <h3 className="font-display text-[18px] m-0 leading-none">Pipeline Processing</h3>
        </div>
        <span className="text-[10px] font-data uppercase tracking-label text-ink-3">
          Underwriting · {applicantName}
        </span>
      </div>

      <p className="text-[12px] text-ink-3 leading-relaxed m-0">
        Solnix FinOps agents are executing in sequence. This is what would take a manual ops team 48–72 hours.
      </p>

      {/* Steps */}
      <ol className="m-0 p-0 list-none border border-border rounded-md overflow-hidden">
        {PIPELINE_STEPS.map((step, i) => {
          const isComplete = i < currentStepIndex || (i === currentStepIndex && stepElapsed[i] !== undefined);
          const isActive = i === currentStepIndex && stepElapsed[i] === undefined;
          const isPending = i > currentStepIndex;
          const elapsed = stepElapsed[i];

          return (
            <li
              key={step.key}
              className={[
                'flex items-center gap-3 px-3.5 py-2.5 border-b border-border last:border-b-0',
                isActive ? 'bg-accent-bg' : '',
              ].join(' ')}
            >
              <span className="w-5 h-5 flex items-center justify-center shrink-0">
                {isComplete && <CheckCircle2 size={16} className="text-success" />}
                {isActive && <Loader2 size={16} className="text-accent animate-spin" />}
                {isPending && <span className="w-2.5 h-2.5 rounded-full border border-border-2 bg-surface" />}
              </span>

              <div className="flex-1 min-w-0">
                <div className={[
                  'text-[13px] leading-tight',
                  isComplete ? 'text-ink-1 font-medium' : isActive ? 'text-ink-1 font-medium' : 'text-ink-3',
                ].join(' ')}>
                  {step.label}
                </div>
                <div className={['text-[11px] leading-tight mt-0.5', isPending ? 'text-ink-4' : 'text-ink-3'].join(' ')}>
                  {step.description}
                </div>
              </div>

              <span className={[
                'font-data tabular text-[11px] tracking-tight-data',
                isComplete ? 'text-ink-2' : isActive ? 'text-accent' : 'text-ink-4',
              ].join(' ')}>
                {isComplete ? formatStepElapsed(elapsed) : isActive ? 'running…' : '—'}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Elapsed total */}
      <div className="flex items-baseline justify-between border-t border-border pt-4">
        <span className="text-[10px] font-data uppercase tracking-label text-ink-3">Elapsed</span>
        <span className="font-display text-[28px] leading-none tracking-tight-data tabular text-ink-1">
          {formatElapsed(elapsedMs)}
        </span>
      </div>
    </div>
  </div>
);

/* ============================================================ */
/*                       Complete stage                         */
/* ============================================================ */

const CompleteStage: React.FC<{
  applicant: Applicant;
  elapsedMs: number;
  onBackToConsole: () => void;
  onGotoHITL: () => void;
  onRunAnother: () => void;
}> = ({ applicant, elapsedMs, onBackToConsole, onGotoHITL, onRunAnother }) => {
  const decisionTone =
    applicant.status === 'APPROVED' ? { bg: 'bg-success-bg', text: 'text-success', border: 'border-success-bd' } :
    applicant.status === 'FLAGGED'  ? { bg: 'bg-warning-bg', text: 'text-warning', border: 'border-warning-bd' } :
                                       { bg: 'bg-danger-bg',  text: 'text-danger',  border: 'border-danger-bd'  };

  const decisionHeading =
    applicant.status === 'APPROVED' ? 'Pre-Approved' :
    applicant.status === 'FLAGGED'  ? 'HITL Review Required' :
                                       'Application Denied';

  const decisionIcon =
    applicant.status === 'APPROVED' ? <CheckCircle2 size={28} /> :
    applicant.status === 'FLAGGED'  ? <AlertTriangle size={28} /> :
                                       <AlertCircle size={28} />;

  const dti = Math.round(((applicant.existingDebt + (applicant.requestedAmount / applicant.tenureMonths)) / applicant.income) * 100);

  return (
    <div className="flex justify-center items-start py-6">
      <div className="w-full max-w-xl bg-surface border border-border rounded-xl shadow-warm-lg p-6 flex flex-col gap-5 animate-scale-up">

        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="font-data text-[11px] text-accent tracking-tight-data">{applicant.id}</span>
          <span className="text-[10px] font-data uppercase tracking-label text-ink-3">
            Processed in <span className="text-ink-1">{formatElapsed(elapsedMs)}</span>
          </span>
        </div>

        {/* Decision band */}
        <div className={`flex items-center gap-4 p-4 rounded-md border ${decisionTone.bg} ${decisionTone.border}`}>
          <div className={`w-12 h-12 rounded-md bg-surface border ${decisionTone.border} ${decisionTone.text} flex items-center justify-center`}>
            {decisionIcon}
          </div>
          <div className="flex-1">
            <h3 className={`font-display text-[22px] leading-tight m-0 ${decisionTone.text}`}>{decisionHeading}</h3>
            <p className="text-[12px] text-ink-2 mt-1 leading-relaxed m-0">{applicant.reason}</p>
          </div>
        </div>

        {/* Stats triptych */}
        <div className="grid grid-cols-3 border border-border rounded-md overflow-hidden">
          <div className="px-4 py-3 flex flex-col">
            <span className="text-[10px] font-data uppercase tracking-label text-ink-3">Affordability</span>
            <span className={`font-display text-[24px] leading-none tracking-tight-data tabular mt-1.5 ${
              applicant.affordabilityScore >= 80 ? 'text-success' : applicant.affordabilityScore >= 50 ? 'text-warning' : 'text-danger'
            }`}>{applicant.affordabilityScore}</span>
            <span className="text-[10px] font-data uppercase tracking-label text-ink-3 mt-1">of 100</span>
          </div>
          <div className="px-4 py-3 flex flex-col border-l border-border">
            <span className="text-[10px] font-data uppercase tracking-label text-ink-3">CIBIL</span>
            <span className="font-display text-[24px] leading-none tracking-tight-data tabular mt-1.5 text-ink-1">{applicant.cibil}</span>
            <span className="text-[10px] font-data uppercase tracking-label text-ink-3 mt-1">bureau</span>
          </div>
          <div className="px-4 py-3 flex flex-col border-l border-border">
            <span className="text-[10px] font-data uppercase tracking-label text-ink-3">DTI</span>
            <span className={`font-display text-[24px] leading-none tracking-tight-data tabular mt-1.5 ${
              dti > 45 ? 'text-danger' : dti > 30 ? 'text-warning' : 'text-success'
            }`}>{dti}%</span>
            <span className="text-[10px] font-data uppercase tracking-label text-ink-3 mt-1">leverage</span>
          </div>
        </div>

        {/* AI narrative */}
        <div className="border-l-2 border-accent pl-4 flex flex-col gap-2">
          <p className="text-[10px] font-data uppercase tracking-label text-ink-3 m-0">AI Underwriter Narrative</p>
          <p className="text-[13px] text-ink-1 leading-relaxed m-0">{applicant.analysisSummary}</p>
        </div>

        {/* Red flags */}
        {applicant.redFlags && applicant.redFlags.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {applicant.redFlags.map((flag, idx) => (
              <div key={idx} className="text-[12px] px-3 py-2 rounded-sm bg-danger-bg text-danger border border-danger-bd flex gap-2 items-center">
                <AlertCircle size={12} /> {flag}
              </div>
            ))}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <button
            onClick={onRunAnother}
            className="h-10 px-3.5 rounded-md border border-border text-ink-2 text-[12px] font-medium hover:bg-surface-2 cursor-pointer"
          >Run another</button>
          <div className="flex-1" />
          {applicant.status === 'FLAGGED' && (
            <button
              onClick={onGotoHITL}
              className="h-10 px-3.5 rounded-md bg-warning text-surface text-[12px] font-medium hover:opacity-90 cursor-pointer focus-ring"
            >Open HITL queue</button>
          )}
          <button
            onClick={onBackToConsole}
            className="h-10 px-3.5 rounded-md bg-accent text-surface text-[12px] font-medium flex items-center gap-1.5 hover:bg-accent-2 cursor-pointer focus-ring shadow-warm-sm"
          >
            View in Console <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
