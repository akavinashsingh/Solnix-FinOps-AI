import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, CheckCircle, XCircle, AlertTriangle, ShieldCheck, 
  HelpCircle, Sparkles, AlertCircle
} from 'lucide-react';

export const HITLView: React.FC = () => {
  const { applicants, handleHITLAction, setView } = useApp();
  
  // Find all flagged applications
  const flaggedApplicants = applicants.filter(app => app.status === 'FLAGGED');
  
  // Track selected flagged applicant
  const [selectedId, setSelectedId] = useState<string>(
    flaggedApplicants.length > 0 ? flaggedApplicants[0].id : ''
  );

  const activeApp = flaggedApplicants.find(a => a.id === selectedId) || flaggedApplicants[0];

  const handleActionClick = (action: 'APPROVED' | 'DENIED' | 'REQUEST_DOCS') => {
    if (activeApp) {
      handleHITLAction(activeApp.id, action);
      // Select next flagged applicant if available
      const remaining = flaggedApplicants.filter(a => a.id !== activeApp.id);
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
      } else {
        setSelectedId('');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* View Header */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setView('console')}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 m-0">HITL Exception Screen</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Evaluate edge cases and authorize human credit decisions.</p>
        </div>
      </div>

      {flaggedApplicants.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center shadow-sm max-w-xl mx-auto mt-6">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-900/30">
            <CheckCircle size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Queue Cleared!</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
            There are currently no active applications awaiting Human-in-the-Loop review. All credit pipelines executed successfully.
          </p>
          <button
            onClick={() => setView('console')}
            className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Back to Console
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          {/* Flagged applications sidebar list */}
          <div className="glass-panel rounded-2xl p-4 flex flex-col gap-3 shadow-sm md:col-span-1 h-[600px] overflow-y-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Flagged Queue ({flaggedApplicants.length})</span>
            
            <div className="flex flex-col gap-2">
              {flaggedApplicants.map(app => (
                <button
                  key={app.id}
                  onClick={() => setSelectedId(app.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1 cursor-pointer ${
                    (activeApp && activeApp.id === app.id)
                      ? 'border-amber-500 bg-amber-500/10 text-slate-800 dark:text-amber-400' 
                      : 'border-slate-150 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-700 dark:text-slate-350'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-mono text-xxs font-bold text-indigo-500 dark:text-indigo-400">{app.id}</span>
                    <span className="text-xxs px-2 py-0.5 bg-amber-50 dark:bg-amber-950/20 text-amber-500 border border-amber-200/50 dark:border-amber-900/30 rounded-full font-bold">Review</span>
                  </div>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{app.name}</span>
                  <div className="flex justify-between text-xxs text-slate-400 mt-1">
                    <span>Income: ₹{(app.income/1000).toFixed(0)}k</span>
                    <span>CIBIL: {app.cibil}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action details screen */}
          {activeApp && (
            <div className="glass-panel rounded-2xl shadow-sm md:col-span-2 flex flex-col overflow-hidden h-[600px]">
              
              {/* Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
                <div>
                  <span className="text-xs font-mono font-bold text-indigo-550 dark:text-indigo-400">{activeApp.id}</span>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-150 mt-0.5">{activeApp.name}</h3>
                </div>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 text-xs font-semibold">
                    CIBIL: {activeApp.cibil}
                  </span>
                  <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 text-xs font-semibold">
                    Category: {activeApp.category}
                  </span>
                </div>
              </div>

              {/* Exception Detail Body */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                
                {/* Exception Alert bar */}
                <div className="p-4 rounded-2xl border border-amber-250 bg-amber-500/10 text-amber-800 dark:text-amber-400 flex items-start gap-3">
                  <AlertTriangle className="shrink-0 mt-0.5 animate-bounce" size={18} />
                  <div>
                    <h4 className="text-sm font-bold">HUMAN INTERVENTION REQUIRED</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-350 mt-1 leading-relaxed">
                      AI Underwriter confidence fell to 67% (underwriting threshold: 80%). The risk engine flagged several inconsistencies in the transactions log that must be audited manually before loan disbursement.
                    </p>
                  </div>
                </div>

                {/* Flag list */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Triggers Flagged by Risk Agent</h4>
                  <div className="flex flex-col gap-2">
                    {activeApp.redFlags?.map((flag, idx) => (
                      <div key={idx} className="flex gap-2 items-center text-xs p-2.5 rounded-xl bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-900/30">
                        <AlertCircle size={14} className="shrink-0" />
                        <span className="font-semibold">{flag}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gemini Decision Reason */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-indigo-500" />
                    AI Underwriting Analysis
                  </h4>
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-4.5 rounded-2xl text-xs border border-slate-150 dark:border-slate-850 flex flex-col gap-4">
                    <div>
                      <span className="font-bold text-slate-500 block">Cash Flow Summary</span>
                      <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{activeApp.analysisSummary}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500 block">System Repayment Evaluation</span>
                      <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{activeApp.reason}</p>
                    </div>
                  </div>
                </div>

                {/* HITL verification suggestions */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-500" /> Actionable Underwriter Verification Checklist
                  </h4>
                  <div className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 p-4.5 rounded-2xl text-xs border border-emerald-200/30 dark:border-emerald-900/20 leading-relaxed font-semibold">
                    <p className="mb-2">Risk recommendations for reviewer override:</p>
                    <p>{activeApp.hitlReason || "Validate bank deposits directly with co-applicant logs or secondary assets."}</p>
                  </div>
                </div>

                {/* Applicant Declared Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-150 dark:border-slate-850 rounded-xl p-3.5">
                    <span className="text-xs text-slate-400 block">Declared Monthly Income</span>
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-100">₹{activeApp.income.toLocaleString()}</span>
                  </div>
                  <div className="border border-slate-150 dark:border-slate-850 rounded-xl p-3.5">
                    <span className="text-xs text-slate-400 block">Existing Debt commitments</span>
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-100">₹{activeApp.existingDebt.toLocaleString()}</span>
                  </div>
                  <div className="border border-slate-150 dark:border-slate-850 rounded-xl p-3.5">
                    <span className="text-xs text-slate-400 block">New EMI Estimate</span>
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-100">₹{Math.round(activeApp.requestedAmount / activeApp.tenureMonths).toLocaleString()}</span>
                  </div>
                  <div className="border border-slate-150 dark:border-slate-850 rounded-xl p-3.5">
                    <span className="text-xs text-slate-400 block">Combined DTI Ratio</span>
                    <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {Math.round(((activeApp.existingDebt + (activeApp.requestedAmount / activeApp.tenureMonths)) / activeApp.income) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Raw transaction log */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Recent Transaction Log</h4>
                  <div className="flex flex-col gap-2">
                    {activeApp.transactions.map((tx, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 dark:bg-slate-900/30 border border-slate-150 dark:border-slate-850 rounded-xl">
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block">{tx.description}</span>
                          <span className="text-xxs text-slate-400">{tx.date}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-mono font-bold ${tx.type === 'credit' ? 'text-emerald-500' : 'text-slate-700 dark:text-slate-350'}`}>
                            {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Action Buttons panel */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 bg-slate-50/50 dark:bg-slate-900/10">
                <button
                  onClick={() => handleActionClick('DENIED')}
                  className="flex-1 py-3 border border-red-200 dark:border-red-900/30 text-red-600 hover:bg-red-500/10 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <XCircle size={16} /> Reject Application
                </button>
                <button
                  onClick={() => handleActionClick('REQUEST_DOCS')}
                  className="flex-1 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <HelpCircle size={16} /> Request More Docs
                </button>
                <button
                  onClick={() => handleActionClick('APPROVED')}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <CheckCircle size={16} /> Approve Override
                </button>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
};
