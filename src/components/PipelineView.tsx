import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { mockApplicants } from '../data/mockApplicants';
import type { Transaction, Applicant } from '../data/mockApplicants';
import { 
  ArrowLeft, CheckCircle2, User, ShieldCheck, 
  Database, BrainCircuit, AlertTriangle, AlertCircle
} from 'lucide-react';

export const PipelineView: React.FC = () => {
  const { 
    setView, pipelineStage, setPipelineStage, 
    runUnderwritingPipeline, activeApplicant, geminiStatus 
  } = useApp();

  // Form states
  const [name, setName] = useState('Priya Mehta');
  const [cibil, setCibil] = useState(675);
  const [income, setIncome] = useState(85000);
  const [existingDebt, setExistingDebt] = useState(15000);
  const [requestedAmount, setRequestedAmount] = useState(300000);
  const [tenureMonths, setTenureMonths] = useState(12);
  const [category, setCategory] = useState<Applicant['category']>('Business');
  
  // Custom Transaction log editor
  const [transactionsJson, setTransactionsJson] = useState(JSON.stringify([
    { date: "2026-05-12", description: "UPWORK ESCROW CRD", amount: 45000, type: "credit" },
    { date: "2026-05-18", description: "CRED CC SETTLEMENT", amount: 28000, type: "debit" },
    { date: "2026-05-20", description: "EMI HDFC CAR LOAN", amount: 15000, type: "debit" },
    { date: "2026-05-22", description: "FIVERR PAYOUT", amount: 35000, type: "credit" }
  ], null, 2));

  const [jsonError, setJsonError] = useState('');

  // Load a preset applicant
  const loadPreset = (presetName: string) => {
    const preset = mockApplicants.find(a => a.name === presetName);
    if (preset) {
      setName(preset.name);
      setCibil(preset.cibil);
      setIncome(preset.income);
      setExistingDebt(preset.existingDebt);
      setRequestedAmount(preset.requestedAmount);
      setTenureMonths(preset.tenureMonths);
      setCategory(preset.category);
      // Format transactions to JSON string for editing
      const simplifiedTx = preset.transactions.map(({ date, description, amount, type, isBounce }) => ({
        date, description, amount, type, isBounce
      }));
      setTransactionsJson(JSON.stringify(simplifiedTx, null, 2));
      setJsonError('');
    }
  };

  const handleStartPipeline = async () => {
    try {
      JSON.parse(transactionsJson);
      setJsonError('');
      // Switch pipeline stage to consent screen
      setPipelineStage('consent');
    } catch (e) {
      setJsonError('Invalid JSON structure in Transaction Log editor.');
    }
  };

  const handleApproveConsent = async () => {
    const parsedTransactions = JSON.parse(transactionsJson) as Transaction[];
    runUnderwritingPipeline({
      name,
      cibil,
      income,
      existingDebt,
      requestedAmount,
      tenureMonths,
      category,
      transactions: parsedTransactions
    });
  };

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-4xl mx-auto w-full">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => {
            setPipelineStage('idle');
            setView('console');
          }}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 m-0">Autonomous Processing Pipeline</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Simulate client consent and execute real-time underwriting.</p>
        </div>
      </div>

      {pipelineStage === 'idle' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Preset Column */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-3 md:col-span-1 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Applicant Presets</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Select a predefined profile to quickly test the pipeline decision engine.</p>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => loadPreset('Rahul Sharma')}
                className={`text-left p-3 rounded-xl border text-sm font-semibold transition-all flex justify-between items-center cursor-pointer ${
                  name === 'Rahul Sharma' 
                    ? 'border-indigo-500 bg-indigo-50/20 text-indigo-600 dark:text-indigo-400' 
                    : 'border-slate-150 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>Rahul Sharma</span>
                <span className="text-xxs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-full font-bold">Auto-Approve</span>
              </button>
              
              <button 
                onClick={() => loadPreset('Priya Mehta')}
                className={`text-left p-3 rounded-xl border text-sm font-semibold transition-all flex justify-between items-center cursor-pointer ${
                  name === 'Priya Mehta' 
                    ? 'border-indigo-500 bg-indigo-50/20 text-indigo-600 dark:text-indigo-400' 
                    : 'border-slate-150 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>Priya Mehta</span>
                <span className="text-xxs px-2 py-0.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-full font-bold">HITL Flag</span>
              </button>

              <button 
                onClick={() => loadPreset('Amit Verma')}
                className={`text-left p-3 rounded-xl border text-sm font-semibold transition-all flex justify-between items-center cursor-pointer ${
                  name === 'Amit Verma' 
                    ? 'border-indigo-500 bg-indigo-50/20 text-indigo-600 dark:text-indigo-400' 
                    : 'border-slate-150 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>Amit Verma</span>
                <span className="text-xxs px-2 py-0.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-full font-bold">Reject</span>
              </button>

              <button 
                onClick={() => loadPreset('Arjun Singh')}
                className={`text-left p-3 rounded-xl border text-sm font-semibold transition-all flex justify-between items-center cursor-pointer ${
                  name === 'Arjun Singh' 
                    ? 'border-indigo-500 bg-indigo-50/20 text-indigo-600 dark:text-indigo-400' 
                    : 'border-slate-150 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>Arjun Singh</span>
                <span className="text-xxs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-full font-bold">Auto-Approve</span>
              </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${geminiStatus ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-xxs font-semibold text-slate-500 dark:text-slate-400">
                {geminiStatus ? 'Gemini 2.5 Flash API Connected' : 'Simulating AI (Offline Local Fallback)'}
              </span>
            </div>
          </div>

          {/* Form Editor Column */}
          <div className="glass-panel p-6 rounded-2xl md:col-span-2 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Configure Parameters</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Applicant Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-semibold"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">CIBIL Bureau Score</label>
                <input 
                  type="number" 
                  value={cibil} 
                  onChange={e => setCibil(Number(e.target.value))}
                  min={300}
                  max={900}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Avg Monthly Income (₹)</label>
                <input 
                  type="number" 
                  value={income} 
                  onChange={e => setIncome(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Existing Monthly EMIs (₹)</label>
                <input 
                  type="number" 
                  value={existingDebt} 
                  onChange={e => setExistingDebt(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Requested Amount (₹)</label>
                <input 
                  type="number" 
                  value={requestedAmount} 
                  onChange={e => setRequestedAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loan Tenure (Months)</label>
                <input 
                  type="number" 
                  value={tenureMonths} 
                  onChange={e => setTenureMonths(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-semibold"
                />
              </div>

              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Borrowing Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as Applicant['category'])}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 font-semibold"
                >
                  <option value="Personal">Personal Loan</option>
                  <option value="Business">Business Capital</option>
                  <option value="Micro-Lending">Micro-Lending Portfolio</option>
                  <option value="Consumer">Consumer Durable EMI</option>
                </select>
              </div>
            </div>

            {/* Custom transaction list */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Bank Statement Transactions (JSON Log)</label>
                <span className="text-xxs text-indigo-500 font-mono">Editable Array</span>
              </div>
              <textarea 
                rows={5}
                value={transactionsJson}
                onChange={e => setTransactionsJson(e.target.value)}
                className="w-full p-3 font-mono text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 dark:text-slate-350"
              />
              {jsonError && <span className="text-xs text-red-500 font-medium flex items-center gap-1"><AlertCircle size={12} /> {jsonError}</span>}
            </div>

            <button
              onClick={handleStartPipeline}
              className="mt-2 w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              Initiate Autonomous Underwriting
            </button>
          </div>
        </div>
      )}

      {/* Stage 1: OneMoney Account Aggregator Consent Modal */}
      {pipelineStage === 'consent' && (
        <div className="glass-panel max-w-md mx-auto rounded-3xl p-6 shadow-2xl flex flex-col gap-5 border border-indigo-100 dark:border-slate-850 animate-scale-up">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold px-3 py-1 bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 rounded-full border border-teal-100 dark:border-teal-900/50">
              OneMoney AA Consent Rail
            </span>
            <div className="text-xs font-mono font-bold text-slate-400">RBI Regulated</div>
          </div>

          <div className="text-center py-4">
            <div className="w-16 h-16 bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-teal-200 dark:border-teal-900/40">
              <ShieldCheck size={36} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Consented Financial Share Request</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 px-3 leading-relaxed">
              <strong>Solnix FinOps AI (FIU)</strong> requests digital read consent to fetch your 6-month bank savings statements.
            </p>
          </div>

          {/* Consent Details Card */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl flex flex-col gap-2.5 text-xs text-slate-600 dark:text-slate-300 border border-slate-150 dark:border-slate-850">
            <div className="flex justify-between"><span className="text-slate-400">Purpose</span><span className="font-semibold">Loan Eligibility Credit Assessment</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Access Period</span><span className="font-semibold">Single Fetch (Read-only)</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Data Scope</span><span className="font-semibold">Transactions Log, Balance Statements</span></div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setPipelineStage('idle')}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer"
            >
              Reject
            </button>
            <button
              onClick={handleApproveConsent}
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              Approve Consent & Share
            </button>
          </div>
        </div>
      )}

      {/* Stage 2: Underwriting Progress pipeline indicator */}
      {(pipelineStage === 'verifying_identity' || 
        pipelineStage === 'fetching_aa' || 
        pipelineStage === 'underwriting') && (
        <div className="glass-panel max-w-lg mx-auto rounded-3xl p-8 shadow-2xl flex flex-col gap-6 items-center text-center animate-pulse-slow">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-150 border-t-indigo-600 dark:border-indigo-950/40 dark:border-t-indigo-500 animate-spin flex items-center justify-center">
            {pipelineStage === 'underwriting' ? <BrainCircuit className="text-indigo-500" size={24} /> : <Database className="text-indigo-500" size={24} />}
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {pipelineStage === 'verifying_identity' && "Verifying Digital Identity..."}
              {pipelineStage === 'fetching_aa' && "Fetching Account Aggregator Statement Logs..."}
              {pipelineStage === 'underwriting' && "Executing Underwriting Risk Agent..."}
            </h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs leading-relaxed">
              {pipelineStage === 'verifying_identity' && "Connecting to CKYC and DigiLocker rails to verify applicant's biometric data and national ID credentials."}
              {pipelineStage === 'fetching_aa' && "Retrieving secured, consented XML bank statement logs from banking FIP provider via OneMoney AA middleware."}
              {pipelineStage === 'underwriting' && "Running credit models. Analyzing income cycles, debt leverage and scanning for ledger bounces using Gemini AI models."}
            </p>
          </div>

          {/* Underwriting Progress Pipeline Path */}
          <div className="w-full flex justify-between items-center relative mt-4 max-w-md">
            {/* Background line */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 dark:bg-slate-800 z-0" />
            
            {/* Step 1 */}
            <div className="flex flex-col items-center gap-2 z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                pipelineStage === 'verifying_identity' ? 'bg-indigo-600 text-white animate-pulse' : 'bg-emerald-500 text-white'
              }`}>
                {pipelineStage === 'verifying_identity' ? '1' : '✓'}
              </div>
              <span className="text-xxs font-semibold text-slate-500">Identity</span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center gap-2 z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                pipelineStage === 'verifying_identity' 
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400' 
                  : pipelineStage === 'fetching_aa' 
                    ? 'bg-indigo-600 text-white animate-pulse' 
                    : 'bg-emerald-500 text-white'
              }`}>
                {pipelineStage === 'verifying_identity' ? '2' : pipelineStage === 'fetching_aa' ? '2' : '✓'}
              </div>
              <span className="text-xxs font-semibold text-slate-500">Aggregator</span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center gap-2 z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                pipelineStage === 'underwriting' 
                  ? 'bg-indigo-600 text-white animate-pulse' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
              }`}>
                3
              </div>
              <span className="text-xxs font-semibold text-slate-500">Underwrite</span>
            </div>
          </div>
        </div>
      )}

      {/* Stage 3: Finished Pipeline Decision Card */}
      {pipelineStage === 'complete' && activeApplicant && (
        <div className="glass-panel max-w-xl mx-auto rounded-3xl p-6 shadow-2xl flex flex-col gap-6 animate-scale-up">
          
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">Assessment Complete: {activeApplicant.id}</span>
            <span className="text-xs text-slate-400">{activeApplicant.applicationDate}</span>
          </div>

          {/* Underwriting Result Header */}
          <div className="flex items-center gap-4 py-4 border-b border-slate-200 dark:border-slate-800/80">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
              activeApplicant.status === 'APPROVED' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/40' 
                : activeApplicant.status === 'FLAGGED'
                  ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900/40'
                  : 'bg-red-50 border-red-200 text-red-600 dark:bg-red-950/20 dark:border-red-900/40'
            }`}>
              {activeApplicant.status === 'APPROVED' && <CheckCircle2 size={32} />}
              {activeApplicant.status === 'FLAGGED' && <AlertTriangle size={32} />}
              {activeApplicant.status === 'DENIED' && <AlertCircle size={32} />}
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {activeApplicant.status === 'APPROVED' && "Pre-Approved ✅"}
                {activeApplicant.status === 'FLAGGED' && "HITL Review Required ⚠️"}
                {activeApplicant.status === 'DENIED' && "Application Denied ❌"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {activeApplicant.status === 'APPROVED' && "Decision autonomously issued by Risk Scorecard Agent. Contract generated."}
                {activeApplicant.status === 'FLAGGED' && "System confidence is low. Credit checks flagged anomalies for human verification."}
                {activeApplicant.status === 'DENIED' && "Score card parameters failed system criteria guidelines."}
              </p>
            </div>
          </div>

          {/* Score gauge and stats */}
          <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-150 dark:border-slate-850">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  className="text-slate-200 dark:text-slate-800"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`transition-all duration-1000 ${
                    activeApplicant.affordabilityScore >= 80 ? 'text-emerald-500' : activeApplicant.affordabilityScore >= 50 ? 'text-amber-500' : 'text-red-500'
                  }`}
                  strokeWidth="3.5"
                  strokeDasharray={`${activeApplicant.affordabilityScore}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-xl font-black text-slate-800 dark:text-slate-100">{activeApplicant.affordabilityScore}</span>
                <span className="text-xxs text-slate-400 font-semibold">Affordability</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Bureau Score</span><span className="font-semibold text-slate-700 dark:text-slate-350">{activeApplicant.cibil}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Leverage DTI</span><span className="font-semibold text-slate-700 dark:text-slate-350">
                {Math.round(((activeApplicant.existingDebt + (activeApplicant.requestedAmount / activeApplicant.tenureMonths)) / activeApplicant.income) * 100)}%
              </span></div>
              <div className="flex justify-between"><span className="text-slate-400">Requested Capital</span><span className="font-semibold text-slate-700 dark:text-slate-350">₹{activeApplicant.requestedAmount.toLocaleString()}</span></div>
            </div>
          </div>

          {/* Underwriting Reason */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BrainCircuit size={14} className="text-indigo-500 animate-pulse" /> Gemini AI Underwriter Narrative
            </h4>
            <div className="bg-slate-50 dark:bg-slate-900/30 p-4.5 rounded-2xl text-xs leading-relaxed text-slate-600 dark:text-slate-300 border border-slate-150 dark:border-slate-850">
              <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Analysis Summary:</p>
              <p className="mb-4">{activeApplicant.analysisSummary}</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Rationale:</p>
              <p>{activeApplicant.reason}</p>
            </div>
          </div>

          {/* Red flags */}
          {activeApplicant.redFlags && activeApplicant.redFlags.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">Warning Signs</h4>
              <div className="flex flex-col gap-1.5">
                {activeApplicant.redFlags.map((flag, idx) => (
                  <div key={idx} className="text-xxs px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/20 flex gap-1.5 items-center">
                    <AlertCircle size={10} />
                    {flag}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setPipelineStage('idle');
                setView('console');
              }}
              className="flex-1 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer"
            >
              Go to Lender Console
            </button>
            {activeApplicant.status === 'FLAGGED' && (
              <button
                onClick={() => {
                  setPipelineStage('idle');
                  setView('hitl');
                }}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Go to HITL Review Screen
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
