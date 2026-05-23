const fs = require('fs');
const path = require('path');

function overwriteCSS() {
  const css = `@import "tailwindcss";

@theme {
  --animate-pulse-slow: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  --animate-glow: glow 2s infinite ease-in-out;
  --font-display: var(--font-display);
  --font-interface: var(--font-interface);
  --font-data: var(--font-data);
  --color-canvas: var(--color-canvas);
  --color-surface: var(--color-surface);
  --color-surface-2: var(--color-surface-2);
  --color-border: var(--color-border);
  --color-border-2: var(--color-border-2);
  --color-ink-1: var(--color-ink-1);
  --color-ink-2: var(--color-ink-2);
  --color-ink-3: var(--color-ink-3);
  --color-ink-4: var(--color-ink-4);
  --color-accent: var(--color-accent);
  --color-accent-2: var(--color-accent-2);
  --color-accent-bg: var(--color-accent-bg);
  --color-success: var(--color-success);
  --color-success-bg: var(--color-success-bg);
  --color-success-bd: var(--color-success-bd);
  --color-warning: var(--color-warning);
  --color-warning-bg: var(--color-warning-bg);
  --color-warning-bd: var(--color-warning-bd);
  --color-danger: var(--color-danger);
  --color-danger-bg: var(--color-danger-bg);
  --color-danger-bd: var(--color-danger-bd);
}

:root {
  --font-display: 'Instrument Serif', 'Playfair Display', Georgia, serif;
  --font-interface: 'DM Sans', 'Geist', 'Plus Jakarta Sans', sans-serif;
  --font-data: 'DM Mono', 'Geist Mono', 'IBM Plex Mono', monospace;

  --color-canvas: #FAFAF8;
  --color-surface: #FFFFFF;
  --color-surface-2: #F5F4F0;
  --color-border: #E8E6DF;
  --color-border-2: #D4D1C8;

  --color-ink-1: #1A1916;
  --color-ink-2: #4A4843;
  --color-ink-3: #8A8780;
  --color-ink-4: #B8B5AC;

  --color-accent: #1B3A6B;
  --color-accent-2: #2D5299;
  --color-accent-bg: #EBF0FA;

  --color-success: #166534;
  --color-success-bg: #F0FDF4;
  --color-success-bd: #BBF7D0;
  --color-warning: #92400E;
  --color-warning-bg: #FFFBEB;
  --color-warning-bd: #FDE68A;
  --color-danger: #991B1B;
  --color-danger-bg: #FFF5F5;
  --color-danger-bd: #FECACA;
  --color-neutral: #374151;
  --color-neutral-bg: #F9FAFB;
}

@keyframes glow {
  0%, 100% { box-shadow: 0 0 5px rgba(16, 185, 129, 0.2), 0 0 10px rgba(16, 185, 129, 0.1); }
  50% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.6), 0 0 30px rgba(16, 185, 129, 0.3); }
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

.glass-panel {
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
}

.glass-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-2);
}

body {
  margin: 0;
  font-family: var(--font-interface);
  background-color: var(--color-canvas);
  color: var(--color-ink-1);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.font-display { font-family: var(--font-display); }
.font-interface { font-family: var(--font-interface); }
.font-data { font-family: var(--font-data); tabular-nums: true; }

.tab-transition { transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); }
`;
  fs.writeFileSync(path.join(__dirname, '../src/index.css'), css, 'utf8');
}
overwriteCSS();

function overwriteHTML() {
  let html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  html = html.replace(
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;550;600;700;800;900&display=swap" rel="stylesheet">',
    '<link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">'
  );
  fs.writeFileSync(path.join(__dirname, '../index.html'), html, 'utf8');
}
overwriteHTML();

// mockApplicants
const mockAppPath = path.join(__dirname, '../src/data/mockApplicants.ts');
let mockContent = fs.readFileSync(mockAppPath, 'utf8').replace(/\r\n/g, '\n');
if (!mockContent.includes('APP-005')) {
  mockContent = mockContent.replace(/applicationDate: string;/g, 'applicationDate: string;\n  processingTime: string;');
  mockContent = mockContent.replace(/applicationDate: "2026-05-22"/g, 'applicationDate: "2026-05-22",\n    processingTime: "3m 42s"');
  mockContent = mockContent.replace(/applicationDate: "2026-05-23"/g, 'applicationDate: "2026-05-23",\n    processingTime: "4m 11s"');
  mockContent = mockContent.replace(/applicationDate: "2026-05-21"/g, 'applicationDate: "2026-05-21",\n    processingTime: "2m 58s"');
  mockContent = mockContent.replace(/applicationDate: "2026-05-20"/g, 'applicationDate: "2026-05-20",\n    processingTime: "3m 15s"');
  mockContent = mockContent.replace('  }\n];', `  },
  {
    id: "APP-005", name: "Deepika Nair", cibil: 720, income: 120000, existingDebt: 18000, requestedAmount: 400000, tenureMonths: 24, category: "Personal", status: "APPROVED", affordabilityScore: 79,
    reason: "Good credit profile with stable salary from Infosys. DTI at 15% is within acceptable range.",
    analysisSummary: "Monthly salary of ₹1,20,000 verified.", redFlags: [], applicationDate: "2026-05-19", processingTime: "4m 03s",
    transactions: [{ date: "2026-05-01", description: "INFOSYS SALARY", amount: 120000, type: "credit" }, { date: "2026-05-05", description: "RENT TRANSFER", amount: 25000, type: "debit" }]
  },
  {
    id: "APP-006", name: "Vikram Patel", cibil: 590, income: 55000, existingDebt: 20000, requestedAmount: 200000, tenureMonths: 12, category: "Consumer", status: "DENIED", affordabilityScore: 31,
    reason: "High debt leverage with DTI exceeding 36%. CIBIL below minimum threshold.",
    analysisSummary: "Irregular salary credits.", redFlags: ["CIBIL below 600", "DTI exceeds 36%"], applicationDate: "2026-05-18", processingTime: "2m 44s",
    transactions: [{ date: "2026-05-03", description: "CASH DEPOSIT", amount: 30000, type: "credit" }, { date: "2026-05-10", description: "EMI BAJAJ FINANCE", amount: 12000, type: "debit" }]
  },
  {
    id: "APP-007", name: "Sneha Kapoor", cibil: 710, income: 95000, existingDebt: 8000, requestedAmount: 350000, tenureMonths: 18, category: "Business", status: "FLAGGED", affordabilityScore: 72,
    reason: "Mixed signals in cash flow.", hitlReason: "Verify source of ₹2,00,000 cash deposit on May 8th.",
    analysisSummary: "One anomalous high-value cash deposit flagged.", redFlags: ["Unexplained large cash deposit"], applicationDate: "2026-05-17", processingTime: "5m 27s",
    transactions: [{ date: "2026-05-08", description: "CASH DEPOSIT", amount: 200000, type: "credit" }, { date: "2026-05-12", description: "VENDOR PAYMENT", amount: 45000, type: "debit" }]
  },
  {
    id: "APP-008", name: "Rajesh Gupta", cibil: 755, income: 180000, existingDebt: 25000, requestedAmount: 750000, tenureMonths: 36, category: "Personal", status: "APPROVED", affordabilityScore: 84,
    reason: "Senior executive with excellent credit history.", analysisSummary: "Verified salary of ₹1,80,000.", redFlags: [], applicationDate: "2026-05-16", processingTime: "3m 56s",
    transactions: [{ date: "2026-05-01", description: "HCL SALARY", amount: 180000, type: "credit" }, { date: "2026-05-05", description: "HOME LOAN SBI", amount: 25000, type: "debit" }]
  },
  {
    id: "APP-009", name: "Meera Reddy", cibil: 640, income: 72000, existingDebt: 28000, requestedAmount: 250000, tenureMonths: 24, category: "Micro-Lending", status: "FLAGGED", affordabilityScore: 48,
    reason: "Micro-lending applicant with thin credit file.", hitlReason: "Verify if existing EMIs include informal lending.",
    analysisSummary: "Two bounced UPI mandates detected.", redFlags: ["DTI would exceed 38%", "UPI mandate bounce detected"], applicationDate: "2026-05-15", processingTime: "4m 33s",
    transactions: [{ date: "2026-05-01", description: "SELF EMPLOYED CRD", amount: 72000, type: "credit" }, { date: "2026-05-07", description: "UPI BOUNCE", amount: 5000, type: "debit", isBounce: true }]
  },
  {
    id: "APP-010", name: "Ankit Joshi", cibil: 800, income: 250000, existingDebt: 15000, requestedAmount: 1200000, tenureMonths: 48, category: "Personal", status: "APPROVED", affordabilityScore: 92,
    reason: "Premium applicant with exceptional profile.", analysisSummary: "Salary credit fully verified.", redFlags: [], applicationDate: "2026-05-14", processingTime: "3m 08s",
    transactions: [{ date: "2026-05-01", description: "MICROSOFT SALARY", amount: 250000, type: "credit" }, { date: "2026-05-10", description: "ZERODHA TRADING", amount: 50000, type: "debit" }]
  }
];`);
  fs.writeFileSync(mockAppPath, mockContent, 'utf8');
}

// AppContext.tsx
let ctxContent = fs.readFileSync(path.join(__dirname, '../src/context/AppContext.tsx'), 'utf8');
ctxContent = ctxContent.replace(/useState<'light' \| 'dark'>\('dark'\)/g, "useState<'light' | 'dark'>('light')");
fs.writeFileSync(path.join(__dirname, '../src/context/AppContext.tsx'), ctxContent, 'utf8');

// PipelineView.tsx
let pipeContent = fs.readFileSync(path.join(__dirname, '../src/components/PipelineView.tsx'), 'utf8');
pipeContent = pipeContent.replace(/Simulate client consent and execute real-time underwriting\./, "Initiate consent and execute real-time underwriting.");
pipeContent = pipeContent.replace(/<div className=\{`w-2\.5[\s\S]*?Simulating AI \(Offline Local Fallback\)[\s\S]*?<\/span>/m, 
  `<div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-xxs font-semibold text-slate-500 uppercase tracking-wider font-interface">
                Sandbox Environment
              </span>`);
fs.writeFileSync(path.join(__dirname, '../src/components/PipelineView.tsx'), pipeContent, 'utf8');

// ConsoleView.tsx
let conContent = fs.readFileSync(path.join(__dirname, '../src/components/ConsoleView.tsx'), 'utf8');
conContent = conContent.replace(/import \{[\s\S]*?\} from 'lucide-react';/m, "import { Plus, Search, ShieldAlert, CheckCircle, AlertTriangle, XCircle, ArrowRight, Activity, Clock, Banknote, Timer, FileCheck, Ban } from 'lucide-react';");
conContent = conContent.replace(/<th className="py-3\.5 px-6">CIBIL<\/th>/g, '<th className="py-3.5 px-6 text-right">Loan Amount</th>\n                <th className="py-3.5 px-6">CIBIL</th>');
conContent = conContent.replace(/<th className="py-3\.5 px-6">Status<\/th>/g, '<th className="py-3.5 px-6 text-right">Processing Time</th>\n                <th className="py-3.5 px-6">Status</th>');
conContent = conContent.replace(/<td className="py-4 px-6 font-medium">\{app\.cibil\}<\/td>/g, '<td className="py-4 px-6 font-mono text-right font-medium text-slate-800 font-data">₹{app.requestedAmount.toLocaleString()}</td>\n                  <td className="py-4 px-6 font-medium font-data tabular-nums">{app.cibil}</td>');
conContent = conContent.replace(/<td className="py-4 px-6">\{getStatusBadge\(app\.status\)\}<\/td>/g, '<td className="py-4 px-6 text-right">\n                    <span className="font-mono text-xs text-slate-600 font-data tabular-nums">{app.processingTime}</span>\n                  </td>\n                  <td className="py-4 px-6">{getStatusBadge(app.status)}</td>');
conContent = conContent.replace(/colSpan=\{7\}/g, 'colSpan={9}');
conContent = conContent.replace(/<h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 m-0">\{activeApplicant\.name\}<\/h3>[\s\S]*?<\/div>/m, `<h3 className="text-xl font-bold text-slate-800 m-0 font-display tracking-tight">{activeApplicant.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(activeApplicant.status)}
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Timer size={11} /> Processed in <span className="font-data">{activeApplicant.processingTime}</span>
                  </span>
                </div>
              </div>`);
conContent = conContent.replace(/<span className="text-xs text-slate-400 block">Current Evaluation<\/span>/g, '<span className="text-xs text-slate-400 block uppercase tracking-wider font-interface">Current Evaluation</span>');
conContent = conContent.replace(/<\/div>[\s]*?<\/div>[\s]*?<\/div>$/m, `</div>
              {(activeApplicant.status === 'APPROVED' || activeApplicant.status === 'OVERRIDDEN') && (
                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-1.5"><Ban size={13} /> Reject</button>
                  <button className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"><FileCheck size={13} /> Docs</button>
                  <button className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5"><Banknote size={13} /> Disburse</button>
                </div>
              )}
            </div>
          </div>`);
fs.writeFileSync(path.join(__dirname, '../src/components/ConsoleView.tsx'), conContent, 'utf8');

function sweepFile(file) {
  const p = path.join(__dirname, '..', file);
  let content = fs.readFileSync(p, 'utf8');
  
  content = content.replace(/dark:[a-zA-Z0-9/-]+\s?/g, '');
  content = content.replace(/<h[23] className="/g, '<h$&font-display tracking-tight ');
  
  content = content.replace(/bg-slate-50\/55|bg-slate-50\/50/g, 'bg-surface-2');
  content = content.replace(/bg-slate-50/g, 'bg-surface-2');
  content = content.replace(/bg-slate-100\/50|bg-slate-100/g, 'bg-surface-2');
  content = content.replace(/bg-white\/60|bg-white/g, 'bg-surface');
  
  content = content.replace(/bg-indigo-600/g, 'bg-accent');
  content = content.replace(/bg-indigo-700/g, 'bg-accent-2');
  content = content.replace(/bg-indigo-50/g, 'bg-accent-bg');
  
  content = content.replace(/bg-emerald-600/g, 'bg-success');
  content = content.replace(/bg-emerald-700/g, 'bg-success');
  content = content.replace(/bg-emerald-50|bg-emerald-500\/10/g, 'bg-success-bg');
  
  content = content.replace(/bg-amber-500|bg-amber-600/g, 'bg-warning');
  content = content.replace(/bg-amber-50|bg-amber-500\/10/g, 'bg-warning-bg');
  
  content = content.replace(/bg-red-600|bg-red-700/g, 'bg-danger');
  content = content.replace(/bg-red-50|bg-red-500\/10/g, 'bg-danger-bg');

  content = content.replace(/text-slate-800|text-slate-900|text-slate-850/g, 'text-ink-1');
  content = content.replace(/text-slate-700|text-slate-600|text-slate-550/g, 'text-ink-2');
  content = content.replace(/text-slate-500|text-slate-400|text-slate-450/g, 'text-ink-3');
  content = content.replace(/text-slate-300|text-slate-350|text-slate-200/g, 'text-ink-4');
  
  content = content.replace(/text-indigo-500|text-indigo-600|text-indigo-650/g, 'text-accent');
  content = content.replace(/text-emerald-500|text-emerald-600|text-emerald-700/g, 'text-success');
  content = content.replace(/text-amber-500|text-amber-600|text-amber-700|text-amber-800/g, 'text-warning');
  content = content.replace(/text-red-500|text-red-600|text-red-700/g, 'text-danger');
  content = content.replace(/text-white/g, 'text-surface');

  content = content.replace(/border-slate-200\/60|border-slate-200\/50|border-slate-200|border-slate-150|border-slate-100/g, 'border-border');
  content = content.replace(/border-indigo-150|border-indigo-200\/50/g, 'border-accent');
  content = content.replace(/border-emerald-200\/50|border-emerald-200\/30/g, 'border-success-bd');
  content = content.replace(/border-amber-200\/50|border-amber-250/g, 'border-warning-bd');
  content = content.replace(/border-red-200\/50|border-red-200\/30|border-red-200|border-red-100/g, 'border-danger-bd');

  content = content.replace(/hover:bg-slate-50\/40|hover:bg-slate-50|hover:bg-slate-100/g, 'hover:bg-surface-2');
  content = content.replace(/hover:bg-indigo-700/g, 'hover:bg-accent-2');
  content = content.replace(/hover:bg-emerald-700/g, 'hover:bg-success');
  content = content.replace(/hover:bg-amber-600/g, 'hover:bg-warning');
  content = content.replace(/hover:bg-red-500\/10/g, 'hover:bg-danger-bg');
  content = content.replace(/hover:text-slate-800/g, 'hover:text-ink-1');
  
  fs.writeFileSync(p, content, 'utf8');
}

['src/App.tsx', 'src/components/ConsoleView.tsx', 'src/components/PipelineView.tsx', 'src/components/HITLView.tsx'].forEach(sweepFile);

console.log('Finished without breaking JSX!');
