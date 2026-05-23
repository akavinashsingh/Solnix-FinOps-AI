import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ConsoleView } from './components/ConsoleView';
import { PipelineView } from './components/PipelineView';
import { HITLView } from './components/HITLView';
import { 
  Sun, Moon, Shield, Database, 
  BrainCircuit, LayoutDashboard
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { view, setView, theme, toggleTheme, geminiStatus, applicants } = useApp();

  const flaggedCount = applicants.filter(a => a.status === 'FLAGGED').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-300">
      
      {/* Top Premium Navbar */}
      <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 dark:from-indigo-600 dark:to-indigo-500 flex items-center justify-center text-white font-black shadow-md shadow-indigo-200 dark:shadow-none">
              SF
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg text-slate-850 dark:text-slate-50 tracking-tight">Solnix FinOps AI</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-150 dark:border-indigo-900/40">FIU TSP</span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase mt-0.5">B2B Agentic Underwriting Infrastructure</p>
            </div>
          </div>

          {/* Center Navigation tabs */}
          <nav className="hidden md:flex bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800/50">
            <button
              onClick={() => setView('console')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 tab-transition cursor-pointer ${
                view === 'console' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-slate-100 shadow-sm' 
                  : 'text-slate-550 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutDashboard size={14} /> Operations Console
            </button>
            <button
              onClick={() => setView('pipeline')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 tab-transition cursor-pointer ${
                view === 'pipeline' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-slate-100 shadow-sm' 
                  : 'text-slate-550 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BrainCircuit size={14} /> Underwriting Pipeline
            </button>
            <button
              onClick={() => setView('hitl')}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 tab-transition relative cursor-pointer ${
                view === 'hitl' 
                  ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-slate-100 shadow-sm' 
                  : 'text-slate-550 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Shield size={14} /> HITL Exception Queue
              {flaggedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                  {flaggedCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Actions (API Status, Dark mode) */}
          <div className="flex items-center gap-4">
            
            {/* API Status Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80">
              <span className={`w-1.5 h-1.5 rounded-full ${geminiStatus ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                {geminiStatus ? 'Gemini Live' : 'AI Offline Mock'}
              </span>
            </div>

            {/* Dark Mode toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-400 hover:bg-slate-55 dark:hover:bg-slate-850 hover:text-indigo-600 dark:hover:text-slate-100 transition-all cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

          </div>

        </div>
      </header>

      {/* Mobile navigation (Visible on small screens only) */}
      <nav className="flex md:hidden p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-16 z-30 justify-around text-center gap-2">
        <button
          onClick={() => setView('console')}
          className={`flex-1 py-2 rounded-xl text-xxs font-bold flex flex-col items-center gap-1 cursor-pointer ${
            view === 'console' ? 'text-indigo-600 dark:text-slate-200 font-extrabold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard size={16} /> Console
        </button>
        <button
          onClick={() => setView('pipeline')}
          className={`flex-1 py-2 rounded-xl text-xxs font-bold flex flex-col items-center gap-1 cursor-pointer ${
            view === 'pipeline' ? 'text-indigo-600 dark:text-slate-200 font-extrabold' : 'text-slate-400'
          }`}
        >
          <BrainCircuit size={16} /> Pipeline
        </button>
        <button
          onClick={() => setView('hitl')}
          className={`flex-1 py-2 rounded-xl text-xxs font-bold flex flex-col items-center gap-1 relative cursor-pointer ${
            view === 'hitl' ? 'text-indigo-600 dark:text-slate-200 font-extrabold' : 'text-slate-400'
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
      <footer className="py-6 border-t border-slate-200 dark:border-slate-800/80 bg-white/30 dark:bg-slate-950/20 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 SolnixMedia. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Database size={12} className="text-teal-500" /> OneMoney API Sandbox</span>
            <span className="flex items-center gap-1.5"><Shield size={12} className="text-indigo-500" /> DPDP 2023 Compliant</span>
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
