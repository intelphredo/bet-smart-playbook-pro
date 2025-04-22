
export interface DataVerificationResult {
  isVerified: boolean;
  confidenceScore: number;
  lastUpdated: string;
  sources: string[];
  discrepancies?: {
    field: string;
    values: Record<string, any>;
  }[];
}

export interface SmartScore {
  overall: number;
  value: number;
  momentum: number;
  injuries: number;
  weatherImpact: number;
  factors: {
    key: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
    description: string;
  }[];
  recommendation?: {
    betOn: 'home' | 'away' | 'draw' | 'over' | 'under' | 'none';
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
  };
}
