import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Applicant, Transaction } from '../data/mockApplicants';
import { mockApplicants } from '../data/mockApplicants';
import { underwriteApplicant } from '../services/gemini';

export type ViewState = 'console' | 'pipeline' | 'hitl';
export type PipelineStage = 'idle' | 'consent' | 'verifying_identity' | 'fetching_aa' | 'underwriting' | 'complete';

interface AppContextType {
  view: ViewState;
  setView: (view: ViewState) => void;
  applicants: Applicant[];
  setApplicants: React.Dispatch<React.SetStateAction<Applicant[]>>;
  activeApplicant: Applicant | null;
  setActiveApplicant: (applicant: Applicant | null) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  pipelineStage: PipelineStage;
  setPipelineStage: (stage: PipelineStage) => void;
  runUnderwritingPipeline: (applicantData: {
    name: string;
    cibil: number;
    income: number;
    existingDebt: number;
    requestedAmount: number;
    tenureMonths: number;
    category: Applicant['category'];
    transactions: Transaction[];
  }) => Promise<void>;
  handleHITLAction: (applicantId: string, action: 'APPROVED' | 'DENIED' | 'REQUEST_DOCS') => void;
  geminiStatus: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<ViewState>('console');
  const [applicants, setApplicants] = useState<Applicant[]>(mockApplicants);
  const [activeApplicant, setActiveApplicant] = useState<Applicant | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('idle');
  const [geminiStatus, setGeminiStatus] = useState<boolean>(false);

  // Initialize theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Check Gemini Status
  useEffect(() => {
    const key = import.meta.env.VITE_GEMINI_API_KEY || '';
    setGeminiStatus(typeof key === 'string' && key.trim().length > 0);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  /**
   * Run the loan application underwriting pipeline
   */
  const runUnderwritingPipeline = async (data: {
    name: string;
    cibil: number;
    income: number;
    existingDebt: number;
    requestedAmount: number;
    tenureMonths: number;
    category: Applicant['category'];
    transactions: Transaction[];
  }) => {
    // Stage 1: User gives Consent (handled in UI, then calls this)
    setPipelineStage('verifying_identity');
    
    // Simulate identity verification delay
    await new Promise(r => setTimeout(r, 1200));
    setPipelineStage('fetching_aa');
    
    // Simulate Account Aggregator fetching bank statements delay
    await new Promise(r => setTimeout(r, 1500));
    setPipelineStage('underwriting');

    try {
      // Call live Gemini Underwriting
      const analysis = await underwriteApplicant(
        data.name,
        data.cibil,
        data.income,
        data.existingDebt,
        data.requestedAmount,
        data.tenureMonths,
        data.transactions
      );

      // Create new applicant record
      const newApplicant: Applicant = {
        id: `APP-${String(applicants.length + 1).padStart(3, '0')}`,
        name: data.name,
        cibil: data.cibil,
        income: data.income,
        existingDebt: data.existingDebt,
        requestedAmount: data.requestedAmount,
        tenureMonths: data.tenureMonths,
        category: data.category,
        status: analysis.decision,
        affordabilityScore: analysis.affordabilityScore,
        reason: analysis.reason,
        hitlReason: analysis.hitlReason,
        redFlags: analysis.redFlags,
        analysisSummary: analysis.analysisSummary,
        transactions: data.transactions,
        applicationDate: new Date().toISOString().split('T')[0],
        processingTime: `${(Math.random() * 2 + 2).toFixed(1)}s`
      };

      setApplicants(prev => [newApplicant, ...prev]);
      setActiveApplicant(newApplicant);
      setPipelineStage('complete');
    } catch (error) {
      console.error("Pipeline failure:", error);
      setPipelineStage('idle');
    }
  };

  /**
   * Handle Human-in-the-Loop decision override
   */
  const handleHITLAction = (applicantId: string, action: 'APPROVED' | 'DENIED' | 'REQUEST_DOCS') => {
    setApplicants(prev => prev.map(app => {
      if (app.id === applicantId) {
        let newStatus: Applicant['status'] = app.status;
        let auditReason = app.reason;
        
        if (action === 'APPROVED') {
          newStatus = 'OVERRIDDEN';
          auditReason = `[HITL OVERRIDE APPROVED]: ${app.reason}`;
        } else if (action === 'DENIED') {
          newStatus = 'DENIED';
          auditReason = `[HITL OVERRIDE REJECTED]: ${app.reason}`;
        } else if (action === 'REQUEST_DOCS') {
          newStatus = 'PENDING';
          auditReason = `[HITL ADDITIONAL DOCUMENT REQUESTED]: ${app.reason}`;
        }

        return {
          ...app,
          status: newStatus,
          reason: auditReason
        };
      }
      return app;
    }));

    // If active applicant was updated, sync active applicant
    setActiveApplicant(prev => {
      if (prev && prev.id === applicantId) {
        let newStatus: Applicant['status'] = prev.status;
        if (action === 'APPROVED') newStatus = 'OVERRIDDEN';
        else if (action === 'DENIED') newStatus = 'DENIED';
        else if (action === 'REQUEST_DOCS') newStatus = 'PENDING';

        return { ...prev, status: newStatus };
      }
      return prev;
    });
  };

  return (
    <AppContext.Provider value={{
      view,
      setView,
      applicants,
      setApplicants,
      activeApplicant,
      setActiveApplicant,
      theme,
      toggleTheme,
      pipelineStage,
      setPipelineStage,
      runUnderwritingPipeline,
      handleHITLAction,
      geminiStatus
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
