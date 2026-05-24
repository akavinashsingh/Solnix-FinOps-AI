import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import type { ViewState } from './context/AppContext';
import { ConsoleView } from './components/ConsoleView';
import { PipelineView } from './components/PipelineView';
import { HITLView } from './components/HITLView';
import { DisbursementView } from './components/DisbursementView';
import { ServicingView } from './components/ServicingView';
import { NudgeView } from './components/NudgeView';
import { AnalyticsView } from './components/AnalyticsView';
import { PolicyView } from './components/PolicyView';
import { ComplianceView } from './components/ComplianceView';
import { BorrowerView } from './components/BorrowerView';
import { CommandPalette } from './components/CommandPalette';
import {
  LayoutDashboard, BrainCircuit, Shield, Banknote, Wallet, Bell,
  BarChart3, FileSliders, Scale, User, Search, Database, Menu, X,
  Sun, Moon,
} from 'lucide-react';

interface NavItem {
  key: ViewState;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const SidebarItem: React.FC<{ item: NavItem; active: boolean; onClick: () => void }> = ({ item, active, onClick }) => (
  <button
    onClick={onClick}
    role="tab"
    aria-selected={active}
    className={[
      'relative flex items-center gap-2.5 h-9 w-full px-3 rounded-md text-[13px] text-left cursor-pointer transition-colors focus-ring',
      active
        ? 'bg-accent-bg text-accent font-medium'
        : 'text-ink-2 hover:bg-surface-2 hover:text-ink-1',
    ].join(' ')}
  >
    <span className={active ? 'text-accent' : 'text-ink-3'}>{item.icon}</span>
    <span className="flex-1 truncate">{item.label}</span>
    {typeof item.badge === 'number' && item.badge > 0 && (
      <span className="text-[10px] font-data tabular px-1.5 h-4 rounded-full bg-warning-bg text-warning border border-warning-bd flex items-center">
        {item.badge}
      </span>
    )}
    {active && <span className="absolute -left-0.5 top-2 bottom-2 w-[2px] rounded-r bg-accent" />}
  </button>
);

const Shell: React.FC = () => {
  const {
    view, setView, applicants, nudges, setCmdkOpen,
  } = useApp();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('solnix-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'light';
  });

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('solnix-theme', theme);
  }, [theme]);

  const handleItemClick = (key: ViewState) => {
    setView(key);
    setMenuOpen(false);
  };

  const flaggedCount    = applicants.filter(a => a.status === 'FLAGGED').length;
  const disbursingCount = applicants.filter(a => a.loanState === 'DISBURSING').length;
  const nudgeCount      = nudges.filter(n => n.status === 'PENDING' && (n.severity === 'WARNING' || n.severity === 'CRITICAL')).length;
  const servicingCount  = applicants.filter(a => a.loanState === 'SERVICING' || a.loanState === 'DEFAULTED').length;

  const groups: NavGroup[] = [
    {
      label: 'Underwriting',
      items: [
        { key: 'console',  label: 'Operations Console',  icon: <LayoutDashboard size={15} /> },
        { key: 'pipeline', label: 'Underwriting Pipeline', icon: <BrainCircuit size={15} /> },
        { key: 'hitl',     label: 'HITL Exception Queue',  icon: <Shield size={15} />, badge: flaggedCount },
      ],
    },
    {
      label: 'Operations',
      items: [
        { key: 'disbursement', label: 'Disbursement Queue', icon: <Banknote size={15} />, badge: disbursingCount },
        { key: 'servicing',    label: 'Servicing Portfolio', icon: <Wallet size={15} />, badge: servicingCount },
        { key: 'nudge',        label: 'Predictive Nudges',   icon: <Bell size={15} />,    badge: nudgeCount },
      ],
    },
    {
      label: 'Risk · Policy',
      items: [
        { key: 'analytics', label: 'Portfolio Analytics', icon: <BarChart3 size={15} /> },
        { key: 'policy',    label: 'Policy & Playback',   icon: <FileSliders size={15} /> },
      ],
    },
    {
      label: 'Compliance',
      items: [
        { key: 'compliance', label: 'Audit & Consent',    icon: <Scale size={15} /> },
      ],
    },
    {
      label: 'Demo',
      items: [
        { key: 'borrower',   label: 'Borrower Portal',    icon: <User size={15} /> },
      ],
    },
  ];

  return (
    <div className={["min-h-screen bg-canvas text-ink-1 flex flex-col", theme].join(' ')}>

      {/* Top header */}
      <header className="h-[52px] border-b border-border bg-surface/95 backdrop-blur-md sticky top-0 z-40 flex items-center px-4 sm:px-6 gap-4 sm:gap-6">

        {/* Hamburger Menu Toggle (Mobile & Tablet) */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          className="lg:hidden w-8 h-8 rounded-md hover:bg-surface-2 text-ink-2 flex items-center justify-center cursor-pointer focus-ring shrink-0"
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Brand */}
        <div className="flex items-center gap-3 w-[160px] sm:w-[212px] -ml-2 sm:-ml-3 pl-2 sm:pl-3 pr-3 sm:border-r border-border h-full shrink-0">
          <div className="w-7 h-7 rounded-md bg-accent text-surface flex items-center justify-center text-[11px] font-bold font-data tracking-tight-data shadow-warm-sm">SF</div>
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span className="font-interface text-[15px] font-medium text-ink-1">Solnix</span>
            <span className="font-display italic text-[16px] text-ink-1 leading-none">FinOps</span>
            <span className="ml-1 text-[10px] font-data uppercase tracking-label text-ink-3 border border-border rounded-sm px-1.5 py-px hidden sm:inline-block">FIU TSP</span>
          </div>
        </div>

        {/* Global query trigger */}
        <button
          onClick={() => setCmdkOpen(true)}
          aria-haspopup="dialog"
          aria-label="Open command search palette"
          className="flex-1 max-w-xl flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-surface-2 text-ink-3 text-[12.5px] hover:bg-surface focus-ring cursor-pointer transition-colors"
        >
          <Search size={14} />
          <span className="flex-1 text-left truncate">Ask anything · "flagged personal loans this week", "borrowers below ₹10k balance"…</span>
          <span className="font-data text-[10px] tracking-label text-ink-3 border border-border rounded-sm px-1 py-0.5 shrink-0 hidden sm:inline-block">⌘K</span>
        </button>

        {/* Right env */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-surface-2 border border-border shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-aa-teal" />
          <span className="text-[10px] font-data uppercase tracking-label text-ink-3">Sandbox · v0.5</span>
        </div>

        {/* Theme Switcher Toggle */}
        <button
          onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="w-8 h-8 rounded-md hover:bg-surface-2 text-ink-2 flex items-center justify-center cursor-pointer focus-ring shrink-0 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun size={16} className="text-amber-400 fill-amber-400/20" />
          ) : (
            <Moon size={16} className="text-indigo-600 fill-indigo-600/10" />
          )}
        </button>
      </header>

      <div className="flex-1 flex">

        {/* Mobile menu backdrop */}
        <div
          onClick={() => setMenuOpen(false)}
          className={[
            "fixed inset-0 top-[52px] z-20 bg-ink-1/15 backdrop-blur-[1px] lg:hidden transition-opacity duration-200",
            menuOpen ? "opacity-100 block" : "opacity-0 hidden"
          ].join(' ')}
          aria-hidden="true"
        />

        {/* Sidebar */}
        <aside
          role="tablist"
          aria-label="Navigation groups"
          className={[
            "w-[212px] border-r border-border bg-surface flex flex-col py-4 h-[calc(100vh-52px)] overflow-y-auto shrink-0",
            "fixed inset-y-0 left-0 top-[52px] z-30 transition-transform duration-220 ease-out transform lg:translate-x-0 lg:sticky lg:z-0 lg:flex",
            menuOpen ? "translate-x-0" : "-translate-x-full"
          ].join(' ')}
        >
          {groups.map((group, gi) => (
            <div key={group.label} className={gi === 0 ? 'px-3' : 'px-3 mt-5'}>
              <div className="text-[10px] font-data uppercase tracking-label text-ink-3 px-2 mb-1.5">{group.label}</div>
              <div className="flex flex-col gap-px">
                {group.items.map(item => (
                  <SidebarItem
                    key={item.key}
                    item={item}
                    active={view === item.key}
                    onClick={() => handleItemClick(item.key)}
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="mt-auto px-3 pt-4 border-t border-border mt-5">
            <div className="text-[10px] font-data uppercase tracking-label text-ink-3 px-2 mb-1.5">Data Rail</div>
            <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] text-ink-2">
              <Database size={12} className="text-aa-teal" />
              <span>OneMoney AA</span>
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-data uppercase tracking-label text-aa-teal">
                <span className="w-1.5 h-1.5 rounded-full bg-aa-teal" /> Live
              </span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 px-6 py-6 flex flex-col overflow-x-hidden">
          {view === 'console'      && <ConsoleView />}
          {view === 'pipeline'     && <PipelineView />}
          {view === 'hitl'         && <HITLView />}
          {view === 'disbursement' && <DisbursementView />}
          {view === 'servicing'    && <ServicingView />}
          {view === 'nudge'        && <NudgeView />}
          {view === 'analytics'    && <AnalyticsView />}
          {view === 'policy'       && <PolicyView />}
          {view === 'compliance'   && <ComplianceView />}
          {view === 'borrower'     && <BorrowerView />}
        </main>
      </div>

      <CommandPalette />
    </div>
  );
};

const App: React.FC = () => (
  <AppProvider>
    <Shell />
  </AppProvider>
);

export default App;
