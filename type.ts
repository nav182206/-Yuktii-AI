export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "employee" | "owner" | "approver";
}

export interface CorporateEntity {
  id: string;
  name: string;
  industry: string;
  pan: string;
  cin: string;
  status: "pending" | "processing" | "completed" | "rejected";
  score: number | null;
  limit_requested: number;
  limit_recommended: number | null;
  risk_premium: number | null;
  last_updated: string;
  primary_notes?: string;
}

export interface CAMSection {
  title: string;
  content: string;
  sources: string[];
  confidence: number;
  pillar?: "Character" | "Capacity" | "Capital" | "Collateral" | "Conditions";
}

export interface DecisionLogic {
  recommendation: "LEND" | "REJECT" | "CAUTION";
  limit: number;
  rate: number;
  rationale: string;
  score_breakdown: {
    character: number;
    capacity: number;
    capital: number;
    collateral: number;
    conditions: number;
  };
  factors: {
    label: string;
    impact: "positive" | "negative" | "neutral";
    description: string;
  }[];
}
