import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ConsoleView } from './components/ConsoleView';
import { PipelineView } from './components/PipelineView';
import { HITLView } from './components/HITLView';
import { 
  Shield, Database, 
  BrainCircuit, LayoutDashboard
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { view, setView, applicants } = useApp();

  const flaggedCount = applicants.filter(a => a.status === 'FLAGGED').length;

  return (
    <div className="min-h-screen bg-surface-2 text-ink-1 flex flex-col transition-colors duration-300">
      
      {/* Top Premium Navbar */}
      <header className="border-b border-border bg-surface/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-surface font-black shadow-md shadow-indigo-200 ">
              SF
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg text-ink-1 tracking-tight">Solnix FinOps AI</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-bg text-accent font-bold border border-accent ">FIU TSP</span>
              </div>
              <p className="text-[10px] text-ink-3 font-semibold tracking-wider uppercase mt-0.5">B2B Agentic Underwriting Infrastructure</p>
            </div>
          </div>

          {/* Center Navigation tabs */}
          <nav className="hidden md:flex bg-surface-2 p-1 rounded-xl border border-border ">
            <button
              onClick={() => setView('console')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 tab-transition cursor-pointer ${
                view === 'console' 
                  ? 'bg-surface text-accent shadow-sm' 
                  : 'text-ink-2 hover:text-ink-1 :text-ink-4'
              }`}
            >
              <LayoutDashboard size={14} /> Operations Console
            </button>
            <button
              onClick={() => setView('pipeline')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 tab-transition cursor-pointer ${
                view === 'pipeline' 
                  ? 'bg-surface text-accent shadow-sm' 
                  : 'text-ink-2 hover:text-ink-1 :text-ink-4'
              }`}
            >
              <BrainCircuit size={14} /> Underwriting Pipeline
            </button>
            <button
              onClick={() => setView('hitl')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 tab-transition relative cursor-pointer ${
                view === 'hitl' 
                  ? 'bg-surface text-accent shadow-sm' 
                  : 'text-ink-2 hover:text-ink-1 :text-ink-4'
              }`}
            >
              <Shield size={14} /> HITL Exception Queue
              {flaggedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-warning text-surface text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                  {flaggedCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Actions (API Status) */}
          <div className="flex items-center gap-4">
            
            {/* API Status Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 border border-border ">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span className="text-[10px] font-bold text-ink-3 uppercase tracking-wider font-interface">
                Sandbox
              </span>
            </div>

          </div>

        </div>
      </header>

      {/* Mobile navigation (Visible on small screens only) */}
      <nav className="flex md:hidden p-3 bg-surface border-b border-border sticky top-16 z-30 justify-around text-center gap-2">
        <button
          onClick={() => setView('console')}
          className={`flex-1 py-2 rounded-xl text-xxs font-bold flex flex-col items-center gap-1 cursor-pointer ${
            view === 'console' ? 'text-accent font-extrabold' : 'text-ink-3'
          }`}
        >
          <LayoutDashboard size={16} /> Console
        </button>
        <button
          onClick={() => setView('pipeline')}
          className={`flex-1 py-2 rounded-xl text-xxs font-bold flex flex-col items-center gap-1 cursor-pointer ${
            view === 'pipeline' ? 'text-accent font-extrabold' : 'text-ink-3'
          }`}
        >
          <BrainCircuit size={16} /> Pipeline
        </button>
        <button
          onClick={() => setView('hitl')}
          className={`flex-1 py-2 rounded-xl text-xxs font-bold flex flex-col items-center gap-1 relative cursor-pointer ${
            view === 'hitl' ? 'text-accent font-extrabold' : 'text-ink-3'
          }`}
        >
          <Shield size={16} /> HITL ({flaggedCount})
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 px-6 py-8 flex flex-col">
        {view === 'console' && <ConsoleView />}
        {view === 'pipeline' && <PipelineView />}
        {view === 'hitl' && <HITLView />}
      </main>

      {/* Premium Footer */}
      <footer className="py-6 border-t border-border bg-surface/30 text-center text-xs text-ink-3 font-medium">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 SolnixMedia. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Database size={12} className="text-teal-500" /> OneMoney API Sandbox</span>
            <span className="flex items-center gap-1.5"><Shield size={12} className="text-accent" /> DPDP 2023 Compliant</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
};

export default App;
