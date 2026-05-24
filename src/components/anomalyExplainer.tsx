/* Pattern-based anomaly explainer.  Maps red-flag strings to a
   plain-English explanation + reviewer guidance.  Used in HITLView
   and ConsoleView detail panel. */

export interface FlagExplanation {
  title: string;
  detail: string;
  suggestion: string;
}

const RULES: Array<{ pattern: RegExp; explanation: FlagExplanation }> = [
  {
    pattern: /CIBIL.+(below|<).+(600|threshold)/i,
    explanation: {
      title: 'Bureau-score below underwriting floor',
      detail: 'The applicant\'s CIBIL score sits below the institutional minimum (600). Bureau scores below 600 are statistically associated with a 4–6× higher 90-day default rate, regardless of stated income.',
      suggestion: 'Verify with the borrower whether the low score is driven by a single dispute (e.g., a wrongly reported settlement) or by chronic delinquency. If the former, ask for a CIBIL dispute receipt before override.',
    },
  },
  {
    pattern: /(insufficient|ACH|UPI).+(bounce|return|failure)/i,
    explanation: {
      title: 'Recent insufficient-balance debit failure',
      detail: 'One or more ACH/UPI debit attempts failed because the account balance was below the requested amount. This is the strongest 30-day predictor of EMI default we track.',
      suggestion: 'Ask the borrower for an explanation of the failure (one-off timing vs. chronic shortfall). Request 3 most recent bank statements to confirm whether the average daily balance has recovered.',
    },
  },
  {
    pattern: /DTI.+exceeds|(Debt-to-Income).+>/i,
    explanation: {
      title: 'Debt-to-Income above safety threshold',
      detail: 'Including the proposed EMI, total monthly debt obligations consume more than 45% of declared monthly income. This leaves an insufficient cushion for living expenses and elevates default risk during any income disruption.',
      suggestion: 'Consider reducing the loan ticket or extending the tenure to bring DTI under 40%. Alternatively, validate any unreported income streams (rental, spouse) before override.',
    },
  },
  {
    pattern: /cash.+(deposit|credits|only).+(unverifiable|anomal|large|unexplained)/i,
    explanation: {
      title: 'Unverifiable cash-flow component',
      detail: 'A significant portion of credits arrived as cash deposits, which the AA cannot validate against an employer or invoice. This makes the income stream impossible to model.',
      suggestion: 'Request matching invoices, GST returns, or a deposit-source declaration. If the borrower runs a cash-heavy business, request 12 months of GST filings to corroborate.',
    },
  },
  {
    pattern: /credit (inquir|queries|queries)/i,
    explanation: {
      title: 'Multiple recent credit inquiries',
      detail: 'Three or more bureau queries in the past 45 days suggest the borrower is shopping for credit at multiple lenders simultaneously — sometimes a sign of distress, sometimes simply rate-shopping.',
      suggestion: 'Ask which institutions the borrower applied to and the outcome. If denied elsewhere, dig into the reasons. If rate-shopping for a single product, this is benign.',
    },
  },
  {
    pattern: /(cash flow variance|irregular|monthly credit)/i,
    explanation: {
      title: 'High month-over-month income variance',
      detail: 'Income credits fluctuate by more than ±40% month-on-month, which is typical for freelance, gig, or project-based work. EMI affordability cannot be guaranteed in low-income months.',
      suggestion: 'Look at 6 months of statements and check whether the low months were seasonal or trending. Consider a stepped-EMI structure or a smaller ticket size.',
    },
  },
  {
    pattern: /thin (bureau|file)/i,
    explanation: {
      title: 'Thin-file applicant',
      detail: 'The applicant has limited bureau history — typical for first-time formal borrowers or those whose lending has been mostly informal. Bureau-based risk models are unreliable here.',
      suggestion: 'Lean more heavily on AA cash-flow signals than bureau score. Consider a smaller ticket for relationship-building, or ask for a guarantor.',
    },
  },
  {
    pattern: /default/i,
    explanation: {
      title: 'Default flag during servicing',
      detail: 'The borrower has missed multiple consecutive EMIs and the loan is in default. Standard collections workflow applies.',
      suggestion: 'Initiate a settlement conversation before assigning to recovery. Sometimes a one-time restructure recovers more than collections.',
    },
  },
];

const FALLBACK: FlagExplanation = {
  title: 'Generic risk signal',
  detail: 'The Risk Agent identified a feature in this applicant\'s profile that warrants additional human review.',
  suggestion: 'Examine the cash-flow narrative, audit trail, and any supporting documents the borrower has provided.',
};

export function explainFlag(flag: string): FlagExplanation {
  for (const rule of RULES) {
    if (rule.pattern.test(flag)) return rule.explanation;
  }
  return FALLBACK;
}
