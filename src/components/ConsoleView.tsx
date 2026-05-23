import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Applicant } from '../data/mockApplicants';
import { 
  Plus, Search, ShieldAlert, CheckCircle, AlertTriangle, 
  XCircle, ArrowRight, Activity, Clock
} from 'lucide-react';

export const ConsoleView: React.FC = () => {
  const { applicants, setView, setActiveApplicant, activeApplicant } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate summary counts
  const totalCount = applicants.length;
  const approvedCount = applicants.filter(a => a.status === 'APPROVED' || a.status === 'OVERRIDDEN').length;
  const flaggedCount = applicants.filter(a => a.status === 'FLAGGED').length;
  const deniedCount = applicants.filter(a => a.status === 'DENIED').length;

  const filteredApplicants = applicants.filter(app => 
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Applicant['status']) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success-bg text-success border border-success-bd">
            <CheckCircle size={12} /> Auto-Approved
          </span>
        );
      case 'OVERRIDDEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-accent-bg text-accent border border-accent">
            <CheckCircle size={12} /> Override Approved
          </span>
        );
      case 'FLAGGED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-warning-bg text-warning border border-warning-bd">
            <AlertTriangle size={12} /> HITL Flagged
          </span>
        );
      case 'DENIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-danger-bg text-danger border border-danger-bd">
            <XCircle size={12} /> Denied
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-2 text-ink-2 border border-border">
            <Clock size={12} /> Info Requested
          </span>
        );
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success bg-success-bg';
    if (score >= 50) return 'text-warning bg-warning-bg';
    return 'text-danger bg-danger-bg';
  };

  const openApplicantDetails = (app: Applicant) => {
    setActiveApplicant(app);
  };

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <span className="text-sm font-medium text-ink-3">Total Applications</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold text-ink-1">{totalCount}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-ink-2">Live</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between shadow-sm border-l-4 border-l-emerald-500">
          <span className="text-sm font-medium text-ink-3">Approved Portfolio</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold text-ink-1">{approvedCount}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-success-bg text-success">Active</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between shadow-sm border-l-4 border-l-amber-500">
          <span className="text-sm font-medium text-ink-3">HITL Exceptions</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold text-ink-1">{flaggedCount}</span>
            <button 
              onClick={() => setView('hitl')}
              className="text-xs px-2.5 py-1 rounded-lg bg-warning hover:opacity-90 text-surface font-medium flex items-center gap-1 transition-all cursor-pointer"
            >
              Review <ArrowRight size={10} />
            </button>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between shadow-sm border-l-4 border-l-red-500">
          <span className="text-sm font-medium text-ink-3">Rejected Applications</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold text-ink-1">{deniedCount}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-danger-bg text-danger">Rejected</span>
          </div>
        </div>
      </div>

      {/* Main Operations Card */}
      <div className="glass-panel rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2.5 bg-accent-bg text-accent rounded-xl">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="font-display tracking-tight text-xl font-bold text-ink-1 m-0">Lender Operations Console</h2>
              <p className="text-xs text-ink-3 mt-0.5">Manage credit risks and evaluate borrower pipelines.</p>
            </div>
          </div>

          <div className="flex gap-3 items-center w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" size={16} />
              <input
                type="text"
                placeholder="Search applicant or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-xl bg-surface-2 border border-border focus:outline-none focus:ring-2 focus:ring-indigo-500 text-ink-1 text-sm"
              />
            </div>
            <button
              onClick={() => setView('pipeline')}
              className="px-4 py-2 bg-accent hover:bg-accent-2 text-surface rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-200 cursor-pointer"
            >
              <Plus size={16} /> Process New Loan
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-2 border-b border-border text-xs font-semibold text-ink-3 uppercase">
                <th className="py-3.5 px-6">ID</th>
                <th className="py-3.5 px-6">Borrower</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">CIBIL</th>
                <th className="py-3.5 px-6 text-center">Affordability Score</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-ink-2">
              {filteredApplicants.map((app) => (
                <tr 
                  key={app.id} 
                  className="hover:bg-surface-2/40 transition-all cursor-pointer"
                  onClick={() => openApplicantDetails(app)}
                >
                  <td className="py-4 px-6 font-mono font-bold text-accent font-data">{app.id}</td>
                  <td className="py-4 px-6 font-semibold text-ink-1">{app.name}</td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-0.5 rounded bg-surface-2 text-ink-2 text-xs">
                      {app.category}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-medium">{app.cibil}</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold ${getScoreColor(app.affordabilityScore)}`}>
                      {app.affordabilityScore}/100
                    </span>
                  </td>
                  <td className="py-4 px-6">{getStatusBadge(app.status)}</td>
                  <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openApplicantDetails(app)}
                      className="px-3 py-1.5 rounded-lg border border-border hover:bg-surface-2 text-ink-2 text-xs font-medium transition-all flex items-center gap-1 ml-auto cursor-pointer"
                    >
                      View Report
                    </button>
                  </td>
                </tr>
              ))}
              {filteredApplicants.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                    No loan applications found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side drawer detail sheet */}
      {activeApplicant && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
          <div 
            className="fixed inset-0" 
            onClick={() => setActiveApplicant(null)}
          />
          <div className="w-full max-w-xl bg-surface h-full shadow-2xl flex flex-col z-10 border-l border-border animate-slide-in relative">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-accent font-data">{activeApplicant.id}</span>
                <h3 className="font-display tracking-tight text-xl font-bold text-ink-1 m-0">{activeApplicant.name}</h3>
              </div>
              <button 
                onClick={() => setActiveApplicant(null)}
                className="p-1 rounded-lg hover:bg-surface-2 text-ink-3 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              
              {/* Drawer Top summary row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-surface-2 p-3.5 rounded-xl text-center">
                  <span className="text-xxs uppercase font-semibold text-ink-3">CIBIL Score</span>
                  <div className="text-lg font-bold text-ink-1 mt-0.5">{activeApplicant.cibil}</div>
                </div>
                <div className="bg-surface-2 p-3.5 rounded-xl text-center">
                  <span className="text-xxs uppercase font-semibold text-ink-3">Declared Income</span>
                  <div className="text-lg font-bold text-ink-1 mt-0.5">₹{(activeApplicant.income/1000).toFixed(0)}k/mo</div>
                </div>
                <div className="bg-surface-2 p-3.5 rounded-xl text-center">
                  <span className="text-xxs uppercase font-semibold text-ink-3">Affordability Score</span>
                  <div className={`text-lg font-black mt-0.5 ${activeApplicant.affordabilityScore >= 80 ? 'text-success' : activeApplicant.affordabilityScore >= 50 ? 'text-warning' : 'text-danger'}`}>
                    {activeApplicant.affordabilityScore}%
                  </div>
                </div>
              </div>

              {/* Status and Action banner */}
              <div className="p-4 rounded-xl border flex justify-between items-center bg-surface-2 border-border">
                <div>
                  <span className="text-xs text-ink-3 block">Current Evaluation</span>
                  <div className="mt-1">{getStatusBadge(activeApplicant.status)}</div>
                </div>
                {activeApplicant.status === 'FLAGGED' && (
                  <button
                    onClick={() => {
                      setActiveApplicant(null);
                      setView('hitl');
                    }}
                    className="px-3.5 py-1.5 bg-warning hover:opacity-90 text-surface rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    Go to HITL Review <ArrowRight size={12} />
                  </button>
                )}
              </div>

              {/* AI Underwriting Narrative */}
              <div>
                <h4 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-accent" />
                  AI Credit Underwriting Summary
                </h4>
                <div className="bg-surface-2 p-4 rounded-xl text-sm leading-relaxed text-ink-2 border border-border">
                  <p className="font-semibold text-ink-1 mb-2">Key Findings:</p>
                  <p className="mb-4">{activeApplicant.analysisSummary || "Awaiting underwriting analysis logs."}</p>
                  
                  <p className="font-semibold text-ink-1 mb-2">Decision Rationale:</p>
                  <p>{activeApplicant.reason}</p>
                </div>
              </div>

              {/* Red flags if any */}
              {activeApplicant.redFlags && activeApplicant.redFlags.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-danger uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ShieldAlert size={14} /> Warning Red Flags
                  </h4>
                  <div className="flex flex-col gap-2">
                    {activeApplicant.redFlags.map((flag, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs bg-danger-bg text-danger p-2.5 rounded-lg border border-danger-bd">
                        <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                        <span>{flag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Declared Loan Parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-border rounded-xl p-3.5">
                  <span className="text-xs text-ink-3 block">Requested Amount</span>
                  <span className="text-lg font-bold text-ink-1">₹{activeApplicant.requestedAmount.toLocaleString()}</span>
                </div>
                <div className="border border-border rounded-xl p-3.5">
                  <span className="text-xs text-ink-3 block">Proposed Tenure</span>
                  <span className="text-lg font-bold text-ink-1">{activeApplicant.tenureMonths} Months</span>
                </div>
                <div className="border border-border rounded-xl p-3.5">
                  <span className="text-xs text-ink-3 block">Monthly Debt Obligations</span>
                  <span className="text-lg font-bold text-ink-1">₹{activeApplicant.existingDebt.toLocaleString()}</span>
                </div>
                <div className="border border-border rounded-xl p-3.5">
                  <span className="text-xs text-ink-3 block">Debt-to-Income (DTI)</span>
                  <span className="text-lg font-bold text-ink-1">
                    {Math.round(((activeApplicant.existingDebt + (activeApplicant.requestedAmount / activeApplicant.tenureMonths)) / activeApplicant.income) * 100)}%
                  </span>
                </div>
              </div>

              {/* Transactions log overview */}
              <div>
                <h4 className="text-xs font-semibold text-ink-3 uppercase tracking-wider mb-2.5">Recent Verified Bank Transactions</h4>
                <div className="flex flex-col gap-2">
                  {activeApplicant.transactions.map((tx, idx) => (
                    <div 
                       key={idx} 
                       className={`flex justify-between items-center text-xs p-2.5 rounded-lg border ${
                        tx.isBounce 
                          ? 'bg-danger-bg border border-danger-bd' 
                          : 'bg-surface-2 border border-border'
                      }`}
                    >
                      <div>
                        <span className="font-semibold block text-ink-1">{tx.description}</span>
                        <span className="text-xxs text-ink-3">{tx.date}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-mono font-bold ${tx.type === 'credit' ? 'text-success' : 'text-ink-2'} ${tx.isBounce ? 'text-danger' : ''}`}>
                          {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount.toLocaleString()}
                        </span>
                        {tx.isBounce && <span className="block text-xxs font-bold text-danger">ACH FAILURE</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
