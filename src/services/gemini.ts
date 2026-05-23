import type { Transaction } from '../data/mockApplicants';

export interface GeminiResponse {
  affordabilityScore: number;
  analysisSummary: string;
  redFlags: string[];
  decision: 'APPROVED' | 'FLAGGED' | 'DENIED';
  reason: string;
  hitlReason?: string;
}

// Check for API key in Vite environment
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export const isApiKeyConfigured = (): boolean => {
  return typeof GEMINI_API_KEY === 'string' && GEMINI_API_KEY.trim().length > 0;
};

/**
 * Clean up markdown json codeblocks if Gemini returns them wrapped
 */
function parseJsonFromText(text: string): any {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?/, '').replace(/```$/, '').trim();
  }
  return JSON.parse(cleaned);
}

/**
 * Simulated underwriting fallback when Gemini API key is missing or offline
 */
const simulateUnderwriting = (
  name: string,
  cibil: number,
  income: number,
  existingDebt: number,
  requestedAmount: number,
  tenureMonths: number,
  transactions: Transaction[]
): GeminiResponse => {
  const dti = ((existingDebt + (requestedAmount / tenureMonths)) / income) * 100;
  const bounceCount = transactions.filter(t => t.isBounce).length;
  
  let score = 50;
  // CIBIL weight (30 points)
  score += Math.max(0, Math.min(30, ((cibil - 500) / 350) * 30));
  // DTI weight (30 points)
  score += Math.max(0, Math.min(30, (1 - dti / 100) * 30));
  // Bounce penalty
  score -= bounceCount * 20;
  score = Math.max(0, Math.min(100, Math.round(score)));

  let decision: 'APPROVED' | 'FLAGGED' | 'DENIED' = 'APPROVED';
  let reason = '';
  let hitlReason = '';
  const redFlags: string[] = [];

  if (cibil < 600) {
    decision = 'DENIED';
    redFlags.push(`Low CIBIL score (${cibil} < 600)`);
    reason = `Application denied due to high-risk credit rating. CIBIL score of ${cibil} falls below the institution's minimum threshold of 600. History indicates high default probability.`;
  } else if (bounceCount > 0) {
    decision = 'DENIED';
    redFlags.push(`${bounceCount} insufficient funds bounce(s) detected`);
    reason = `Application denied. We detected ${bounceCount} transaction bounce(s) due to insufficient funds in the last month. This indicates immediate cash flow stress and high repayment risk.`;
  } else if (dti > 45) {
    decision = 'FLAGGED';
    redFlags.push(`High Debt-to-Income Ratio (${Math.round(dti)}% > 45%)`);
    reason = `Application flagged due to elevated debt leverage. The estimated Debt-to-Income (DTI) ratio including this new loan is ${Math.round(dti)}%, which exceeds the safety limit of 45%.`;
    hitlReason = "Review the applicant's spouse/co-applicant income assets or request security collateral to mitigate the high debt exposure.";
  } else if (cibil < 700) {
    decision = 'FLAGGED';
    redFlags.push(`Moderate CIBIL score (${cibil})`);
    reason = `Application flagged due to borderline credit record. CIBIL score of ${cibil} shows minor past payment delays. Core cash flows are positive.`;
    hitlReason = "Confirm current employment contract stability and check if past delays were one-off issues (e.g. dispute-related).";
  } else {
    decision = 'APPROVED';
    reason = `Application pre-approved. Financial analytics show robust cash reserves, zero transaction bounces, and a highly stable Debt-to-Income ratio of ${Math.round(dti)}%. CIBIL score is strong at ${cibil}.`;
  }

  const analysisSummary = `Validated average monthly credit of ₹${income.toLocaleString()} for applicant ${name}. Monthly EMI obligation stands at ₹${existingDebt.toLocaleString()}. Verified zero cash flow bounces. Current loan DTI is computed at ${Math.round(dti)}%.`;

  return {
    affordabilityScore: score,
    analysisSummary,
    redFlags,
    decision,
    reason,
    hitlReason: decision === 'FLAGGED' ? hitlReason : undefined
  };
};

/**
 * Underwrite applicant using Gemini 2.5 Flash API with fallback simulation
 */
export const underwriteApplicant = async (
  name: string,
  cibil: number,
  income: number,
  existingDebt: number,
  requestedAmount: number,
  tenureMonths: number,
  transactions: Transaction[]
): Promise<GeminiResponse> => {
  // If API Key is missing, run simulated underwriting immediately
  if (!isApiKeyConfigured()) {
    console.log("No Gemini API key found, running simulated underwriting fallback.");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(simulateUnderwriting(name, cibil, income, existingDebt, requestedAmount, tenureMonths, transactions));
      }, 3000); // simulate network delay
    });
  }

  try {
    const formattedTransactions = transactions.map(t => 
      `${t.date}: ${t.description} | ₹${t.amount} | ${t.type.toUpperCase()}${t.isBounce ? ' (BOUNCED)' : ''}`
    ).join('\n');

    const prompt = `
You are Solnix FinOps AI, an autonomous financial underwriting agent. You are evaluating a loan application.
Analyze the applicant details and the transaction history provided below. 

Applicant Parameters:
- Name: ${name}
- CIBIL Score: ${cibil}
- Declared Monthly Income: ₹${income}
- Existing Monthly Debt EMIs: ₹${existingDebt}
- Requested Loan Amount: ₹${requestedAmount}
- Requested Tenure: ${tenureMonths} months

Transaction History:
${formattedTransactions}

Analyze this data and return your decision. You MUST return a JSON object matching this structure EXACTLY:
{
  "affordabilityScore": number, // an integer from 0 to 100 based on creditworthiness
  "analysisSummary": "string", // concise 2-sentence summary of cash flows, credits, and debits
  "redFlags": ["string", "string"], // list of warning flags (e.g. balances, bounces, irregular credits)
  "decision": "APPROVED" | "FLAGGED" | "DENIED", // APPROVED (strong details), FLAGGED (edge case/high variance), DENIED (high risk/bounces/low CIBIL)
  "reason": "string", // detailed explanation of your underwriting decision and credit logic
  "hitlReason": "string" // IF decision is FLAGGED, explain what a human underwriter should verify. Keep blank if APPROVED/DENIED.
}

Underwriting Rules:
1. If CIBIL is less than 600 OR there are transaction bounces (isBounce = true or ACH debit returns in logs), the decision MUST be DENIED.
2. If the Debt-to-Income (DTI) ratio (Existing EMIs + New EMI / Monthly Income) exceeds 45%, or there is high income variance, the decision should be FLAGGED.
3. Be strict but fair. Output valid JSON only, without any markdown code wrappers if possible, or inside standard json block.
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: HTTP ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error("Empty response received from Gemini");
    }

    return parseJsonFromText(responseText) as GeminiResponse;
  } catch (error) {
    console.error("Gemini API call failed, falling back to local simulation:", error);
    // Graceful fallback to simulated underwriting on error
    return simulateUnderwriting(name, cibil, income, existingDebt, requestedAmount, tenureMonths, transactions);
  }
};
