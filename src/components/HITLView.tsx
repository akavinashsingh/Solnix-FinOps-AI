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
          className="p-2 rounded-xl hover:bg-surface-2 border border-border text-ink-2 transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="font-display tracking-tight text-xl font-bold text-ink-1 m-0">HITL Exception Screen</h2>
          <p className="text-xs text-ink-3 mt-0.5">Evaluate edge cases and authorize human credit decisions.</p>
        </div>
      </div>

      {flaggedApplicants.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl text-center shadow-sm max-w-xl mx-auto mt-6">
          <div className="w-16 h-16 bg-success-bg text-success rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 ">
            <CheckCircle size={32} />
          </div>
          <h3 className="font-display tracking-tight text-lg font-bold text-ink-1 ">Queue Cleared!</h3>
          <p className="text-xs text-ink-3 mt-2 max-w-sm mx-auto leading-relaxed">
            There are currently no active applications awaiting Human-in-the-Loop review. All credit pipelines executed successfully.
          </p>
          <button
            onClick={() => setView('console')}
            className="mt-6 px-4 py-2 bg-accent hover:bg-accent-2 text-surface rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Back to Console
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          {/* Flagged applications sidebar list */}
          <div className="glass-panel rounded-2xl p-4 flex flex-col gap-3 shadow-sm md:col-span-1 h-[600px] overflow-y-auto">
            <span className="text-xs font-bold text-ink-3 uppercase tracking-wider mb-1 block">Flagged Queue ({flaggedApplicants.length})</span>
            
            <div className="flex flex-col gap-2">
              {flaggedApplicants.map(app => (
                <button
                  key={app.id}
                  onClick={() => setSelectedId(app.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1 cursor-pointer ${
                    (activeApp && activeApp.id === app.id)
                      ? 'border-amber-500 bg-warning/10 text-ink-1 ' 
                      : 'border-border hover:bg-surface-2 text-ink-2 '
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="font-mono text-xxs font-bold text-accent ">{app.id}</span>
                    <span className="text-xxs px-2 py-0.5 bg-warning-bg text-warning border border-warning-bd rounded-full font-bold">Review</span>
                  </div>
                  <span className="font-bold text-sm text-ink-1 ">{app.name}</span>
                  <div className="flex justify-between text-xxs text-ink-3 mt-1">
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
              <div className="p-6 border-b border-border flex justify-between items-center bg-surface-2 ">
                <div>
                  <span className="text-xs font-mono font-bold text-indigo-550 ">{activeApp.id}</span>
                  <h3 className="font-display tracking-tight text-xl font-bold text-ink-1 mt-0.5">{activeApp.name}</h3>
                </div>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 rounded bg-surface-2 text-ink-2 text-xs font-semibold">
                    CIBIL: {activeApp.cibil}
                  </span>
                  <span className="px-2.5 py-1 rounded bg-surface-2 text-ink-2 text-xs font-semibold">
                    Category: {activeApp.category}
                  </span>
                </div>
              </div>

              {/* Exception Detail Body */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                
                {/* Exception Alert bar */}
                <div className="p-4 rounded-2xl border border-warning-bd bg-warning/10 text-warning flex items-start gap-3">
                  <AlertTriangle className="shrink-0 mt-0.5 animate-bounce" size={18} />
                  <div>
                    <h4 className="text-sm font-bold">HUMAN INTERVENTION REQUIRED</h4>
                    <p className="text-xs text-ink-2 mt-1 leading-relaxed">
                      AI Underwriter confidence fell to 67% (underwriting threshold: 80%). The risk engine flagged several inconsistencies in the transactions log that must be audited manually before loan disbursement.
                    </p>
                  </div>
                </div>

                {/* Flag list */}
                <div>
                  <h4 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2.5">Triggers Flagged by Risk Agent</h4>
                  <div className="flex flex-col gap-2">
                    {activeApp.redFlags?.map((flag, idx) => (
                      <div key={idx} className="flex gap-2 items-center text-xs p-2.5 rounded-xl bg-danger-bg text-danger border border-danger-bd ">
                        <AlertCircle size={14} className="shrink-0" />
                        <span className="font-semibold">{flag}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gemini Decision Reason */}
                <div>
                  <h4 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-accent" />
                    AI Underwriting Analysis
                  </h4>
                  <div className="bg-surface-2 p-4.5 rounded-2xl text-xs border border-border flex flex-col gap-4">
                    <div>
                      <span className="font-bold text-ink-3 block">Cash Flow Summary</span>
                      <p className="text-ink-2 mt-1 leading-relaxed">{activeApp.analysisSummary}</p>
                    </div>
                    <div>
                      <span className="font-bold text-ink-3 block">System Repayment Evaluation</span>
                      <p className="text-ink-2 mt-1 leading-relaxed">{activeApp.reason}</p>
                    </div>
                  </div>
                </div>

                {/* HITL verification suggestions */}
                <div>
                  <h4 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-success" /> Actionable Underwriter Verification Checklist
                  </h4>
                  <div className="bg-success-bg text-emerald-800 p-4.5 rounded-2xl text-xs border border-success-bd leading-relaxed font-semibold">
                    <p className="mb-2">Risk recommendations for reviewer override:</p>
                    <p>{activeApp.hitlReason || "Validate bank deposits directly with co-applicant logs or secondary assets."}</p>
                  </div>
                </div>

                {/* Applicant Declared Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-border rounded-xl p-3.5">
                    <span className="text-xs text-ink-3 block">Declared Monthly Income</span>
                    <span className="text-lg font-bold text-ink-1 ">₹{activeApp.income.toLocaleString()}</span>
                  </div>
                  <div className="border border-border rounded-xl p-3.5">
                    <span className="text-xs text-ink-3 block">Existing Debt commitments</span>
                    <span className="text-lg font-bold text-ink-1 ">₹{activeApp.existingDebt.toLocaleString()}</span>
                  </div>
                  <div className="border border-border rounded-xl p-3.5">
                    <span className="text-xs text-ink-3 block">New EMI Estimate</span>
                    <span className="text-lg font-bold text-ink-1 ">₹{Math.round(activeApp.requestedAmount / activeApp.tenureMonths).toLocaleString()}</span>
                  </div>
                  <div className="border border-border rounded-xl p-3.5">
                    <span className="text-xs text-ink-3 block">Combined DTI Ratio</span>
                    <span className="text-lg font-bold text-ink-1 ">
                      {Math.round(((activeApp.existingDebt + (activeApp.requestedAmount / activeApp.tenureMonths)) / activeApp.income) * 100)}%
                    </span>
                  </div>
                </div>

                {/* Raw transaction log */}
                <div>
                  <h4 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2.5">Recent Transaction Log</h4>
                  <div className="flex flex-col gap-2">
                    {activeApp.transactions.map((tx, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-surface-2 border border-border rounded-xl">
                        <div>
                          <span className="font-semibold text-ink-1 block">{tx.description}</span>
                          <span className="text-xxs text-ink-3">{tx.date}</span>
                        </div>
                        <div className="text-right">
                          <span className={`font-mono font-bold ${tx.type === 'credit' ? 'text-success' : 'text-ink-2 '}`}>
                            {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Action Buttons panel */}
              <div className="p-4 border-t border-border flex gap-3 bg-surface-2 ">
                <button
                  onClick={() => handleActionClick('DENIED')}
                  className="flex-1 py-3 border border-danger-bd text-danger hover:bg-danger-bg0/10 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <XCircle size={16} /> Reject Application
                </button>
                <button
                  onClick={() => handleActionClick('REQUEST_DOCS')}
                  className="flex-1 py-3 border border-border text-ink-2 hover:bg-surface-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <HelpCircle size={16} /> Request More Docs
                </button>
                <button
                  onClick={() => handleActionClick('APPROVED')}
                  className="flex-1 py-3 bg-success hover:bg-success text-surface text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
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
