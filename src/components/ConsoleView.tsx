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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
            <CheckCircle size={12} /> Auto-Approved
          </span>
        );
      case 'OVERRIDDEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
            <CheckCircle size={12} /> Override Approved
          </span>
        );
      case 'FLAGGED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
            <AlertTriangle size={12} /> HITL Flagged
          </span>
        );
      case 'DENIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50">
            <XCircle size={12} /> Denied
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
            <Clock size={12} /> Info Requested
          </span>
        );
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20';
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20';
  };

  const openApplicantDetails = (app: Applicant) => {
    setActiveApplicant(app);
  };

  return (
    <div className="flex-1 flex flex-col gap-6 max-w-6xl mx-auto w-full">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Applications</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{totalCount}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Live</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between shadow-sm border-l-4 border-l-emerald-500">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Approved Portfolio</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{approvedCount}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">Active</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between shadow-sm border-l-4 border-l-amber-500">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">HITL Exceptions</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{flaggedCount}</span>
            <button 
              onClick={() => setView('hitl')}
              className="text-xs px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium flex items-center gap-1 transition-all cursor-pointer"
            >
              Review <ArrowRight size={10} />
            </button>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between shadow-sm border-l-4 border-l-red-500">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Rejected Applications</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{deniedCount}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400">Rejected</span>
          </div>
        </div>
      </div>

      {/* Main Operations Card */}
      <div className="glass-panel rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Activity size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 m-0">Lender Operations Console</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage credit risks and evaluate borrower pipelines.</p>
            </div>
          </div>

          <div className="flex gap-3 items-center w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search applicant or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2 rounded-xl bg-slate-100/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 text-sm"
              />
            </div>
            <button
              onClick={() => setView('pipeline')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-200 dark:shadow-none cursor-pointer"
            >
              <Plus size={16} /> Process New Loan
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/55 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                <th className="py-3.5 px-6">ID</th>
                <th className="py-3.5 px-6">Borrower</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">CIBIL</th>
                <th className="py-3.5 px-6 text-center">Affordability Score</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm text-slate-700 dark:text-slate-300">
              {filteredApplicants.map((app) => (
                <tr 
                  key={app.id} 
                  className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-all cursor-pointer"
                  onClick={() => openApplicantDetails(app)}
                >
                  <td className="py-4 px-6 font-mono font-bold text-indigo-600 dark:text-indigo-400">{app.id}</td>
                  <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-100">{app.name}</td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-xs">
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
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all flex items-center gap-1 ml-auto cursor-pointer"
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
          <div className="w-full max-w-xl bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 dark:border-slate-800 animate-slide-in relative">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">{activeApplicant.id}</span>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 m-0">{activeApplicant.name}</h3>
              </div>
              <button 
                onClick={() => setActiveApplicant(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              
              {/* Top summary row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl text-center">
                  <span className="text-xxs uppercase font-semibold text-slate-400 dark:text-slate-500">CIBIL Score</span>
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-0.5">{activeApplicant.cibil}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl text-center">
                  <span className="text-xxs uppercase font-semibold text-slate-400 dark:text-slate-500">Declared Income</span>
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-0.5">₹{(activeApplicant.income/1000).toFixed(0)}k/mo</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl text-center">
                  <span className="text-xxs uppercase font-semibold text-slate-400 dark:text-slate-500">Affordability Score</span>
                  <div className={`text-lg font-black mt-0.5 ${activeApplicant.affordabilityScore >= 80 ? 'text-emerald-500' : activeApplicant.affordabilityScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                    {activeApplicant.affordabilityScore}%
                  </div>
                </div>
              </div>

              {/* Status and Action banner */}
              <div className="p-4 rounded-xl border flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 block">Current Evaluation</span>
                  <div className="mt-1">{getStatusBadge(activeApplicant.status)}</div>
                </div>
                {activeApplicant.status === 'FLAGGED' && (
                  <button
                    onClick={() => {
                      setActiveApplicant(null);
                      setView('hitl');
                    }}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    Go to HITL Review <ArrowRight size={12} />
                  </button>
                )}
              </div>

              {/* AI Underwriting Narrative */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-indigo-500" />
                  AI Credit Underwriting Summary
                </h4>
                <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800/80">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Key Findings:</p>
                  <p className="mb-4">{activeApplicant.analysisSummary || "Awaiting underwriting analysis logs."}</p>
                  
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Decision Rationale:</p>
                  <p>{activeApplicant.reason}</p>
                </div>
              </div>

              {/* Red flags if any */}
              {activeApplicant.redFlags && activeApplicant.redFlags.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ShieldAlert size={14} /> Warning Red Flags
                  </h4>
                  <div className="flex flex-col gap-2">
                    {activeApplicant.redFlags.map((flag, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-2.5 rounded-lg border border-red-100 dark:border-red-900/30">
                        <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                        <span>{flag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Declared Loan Parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-3.5">
                  <span className="text-xs text-slate-400 dark:text-slate-500 block">Requested Amount</span>
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-100">₹{activeApplicant.requestedAmount.toLocaleString()}</span>
                </div>
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-3.5">
                  <span className="text-xs text-slate-400 dark:text-slate-500 block">Proposed Tenure</span>
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{activeApplicant.tenureMonths} Months</span>
                </div>
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-3.5">
                  <span className="text-xs text-slate-400 dark:text-slate-500 block">Monthly Debt Obligations</span>
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-100">₹{activeApplicant.existingDebt.toLocaleString()}</span>
                </div>
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-3.5">
                  <span className="text-xs text-slate-400 dark:text-slate-500 block">Debt-to-Income (DTI)</span>
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {Math.round(((activeApplicant.existingDebt + (activeApplicant.requestedAmount / activeApplicant.tenureMonths)) / activeApplicant.income) * 100)}%
                  </span>
                </div>
              </div>

              {/* Transactions log overview */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Recent Verified Bank Transactions</h4>
                <div className="flex flex-col gap-2">
                  {activeApplicant.transactions.map((tx, idx) => (
                    <div 
                      key={idx} 
                      className={`flex justify-between items-center text-xs p-2.5 rounded-lg border ${
                        tx.isBounce 
                          ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/35' 
                          : 'bg-slate-50/50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      <div>
                        <span className="font-semibold block text-slate-800 dark:text-slate-200">{tx.description}</span>
                        <span className="text-xxs text-slate-400">{tx.date}</span>
                      </div>
                      <div className="text-right">
                        <span className={`font-mono font-bold ${tx.type === 'credit' ? 'text-emerald-500' : 'text-slate-700 dark:text-slate-300'} ${tx.isBounce ? 'text-red-500' : ''}`}>
                          {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount.toLocaleString()}
                        </span>
                        {tx.isBounce && <span className="block text-xxs font-bold text-red-500">ACH FAILURE</span>}
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
