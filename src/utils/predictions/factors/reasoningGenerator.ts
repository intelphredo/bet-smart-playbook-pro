/**
 * Prediction Reasoning Generator
 * 
 * Creates human-readable explanations for why a prediction was made,
 * highlighting the key factors that influenced the decision.
 */

import { PredictionFactor, ComprehensiveAnalysis } from './comprehensiveFactors';

export interface PredictionReasoning {
  summary: string;
  keyFactors: string[];
  confidence: string;
  riskAssessment: string;
  betterPick: string;
  warningFlags: string[];
}

/**
 * Generate a complete reasoning explanation for a prediction
 */
export function generatePredictionReasoning(
  homeTeam: string,
  awayTeam: string,
  recommended: 'home' | 'away',
  confidence: number,
  analysis: ComprehensiveAnalysis
): PredictionReasoning {
  const favored = recommended === 'home' ? homeTeam : awayTeam;
  const underdog = recommended === 'home' ? awayTeam : homeTeam;
  
  // Build summary based on confidence level
  let summary = '';
  if (confidence >= 75) {
    summary = `Strong pick on ${favored}. `;
  } else if (confidence >= 65) {
    summary = `Leaning ${favored}. `;
  } else if (confidence >= 55) {
    summary = `Slight edge to ${favored}. `;
  } else {
    summary = `Coin-flip game, but giving edge to ${favored}. `;
  }
  
  // Add primary factor explanation
  const topFactors = analysis.factors
    .filter(f => Math.abs(f.impact) >= 3)
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 3);
  
  if (topFactors.length > 0) {
    const primary = topFactors[0];
    summary += generateFactorSentence(primary, favored, homeTeam, awayTeam);
  }
  
  // Key factors list
  const keyFactors = topFactors.map(f => f.description).filter(d => d.length > 0);
  
  // Add neutral/weak factors context
  if (keyFactors.length === 0) {
    keyFactors.push('No dominant factors - this is a closely matched game');
  }
  
  // Confidence assessment
  let confidenceText = '';
  if (confidence >= 75) {
    confidenceText = `High confidence (${confidence}%) - Multiple factors align strongly`;
  } else if (confidence >= 65) {
    confidenceText = `Moderate confidence (${confidence}%) - Clear but not overwhelming edge`;
  } else if (confidence >= 55) {
    confidenceText = `Low confidence (${confidence}%) - Small margins, proceed with caution`;
  } else {
    confidenceText = `Very low confidence (${confidence}%) - Near toss-up, consider smaller stake`;
  }
  
  // Risk assessment
  let riskAssessment = '';
  switch (analysis.riskLevel) {
    case 'low':
      riskAssessment = 'Lower risk play - strong situational advantage';
      break;
    case 'medium':
      riskAssessment = 'Standard risk - typical variance expected';
      break;
    case 'high':
      riskAssessment = 'Higher risk - close matchup with potential for upset';
      break;
  }
  
  // Better pick explanation
  const betterPick = `${favored} is the better pick because they have advantages in: ${
    topFactors.map(f => f.name.toLowerCase()).join(', ') || 'overall matchup assessment'
  }.`;
  
  // Warning flags
  const warningFlags: string[] = [];
  
  for (const factor of analysis.factors) {
    // Check for factors working against our pick
    if (recommended === 'home' && factor.impact < -5) {
      warningFlags.push(`⚠️ ${factor.name}: ${factor.description}`);
    } else if (recommended === 'away' && factor.impact > 5) {
      warningFlags.push(`⚠️ ${factor.name}: ${factor.description}`);
    }
    
    // Low confidence factors
    if (factor.confidence < 50 && Math.abs(factor.impact) > 3) {
      warningFlags.push(`⚠️ ${factor.name} analysis has limited data`);
    }
  }
  
  return {
    summary,
    keyFactors,
    confidence: confidenceText,
    riskAssessment,
    betterPick,
    warningFlags
  };
}

/**
 * Generate a short sentence explaining a specific factor
 */
function generateFactorSentence(
  factor: PredictionFactor,
  favored: string,
  homeTeam: string,
  awayTeam: string
): string {
  const sentences: Record<string, (f: PredictionFactor) => string> = {
    'Home Court': (f) => {
      if (f.impact > 6) {
        return `${homeTeam} has a dominant home court advantage that's hard to overcome.`;
      }
      return `Home court gives ${homeTeam} a notable edge in this matchup.`;
    },
    'Momentum': (f) => {
      if (Math.abs(f.impact) > 8) {
        return `Recent form is the deciding factor here - one team is rolling while the other struggles.`;
      }
      return `Momentum matters, and ${favored} has been playing better lately.`;
    },
    'Head-to-Head': (f) => {
      return `History favors ${favored} in this head-to-head matchup.`;
    },
    'Injuries': (f) => {
      return `Injury situation significantly impacts this game's dynamics.`;
    },
    'Back-to-Back': (f) => {
      if (f.favoredTeam !== 'neutral') {
        const tired = f.favoredTeam === 'home' ? awayTeam : homeTeam;
        return `${tired} is on a back-to-back, which is a major fatigue concern.`;
      }
      return 'Rest and fatigue are factors to consider.';
    },
    'Rest Days': (f) => {
      return `Rest advantage gives ${favored} fresher legs.`;
    },
    'Coaching': (f) => {
      return `Coaching edge could be the difference in a close game.`;
    }
  };
  
  const generator = sentences[factor.name];
  return generator ? generator(factor) : factor.description;
}

/**
 * Generate a one-line summary for display
 */
export function generateOneLiner(
  homeTeam: string,
  awayTeam: string,
  recommended: 'home' | 'away',
  confidence: number,
  analysis: ComprehensiveAnalysis
): string {
  const favored = recommended === 'home' ? homeTeam : awayTeam;
  const primaryFactor = analysis.primaryFactor.toLowerCase();
  
  if (confidence >= 75) {
    return `${favored} should win this one. Key factor: ${primaryFactor}`;
  } else if (confidence >= 65) {
    return `Leaning ${favored} - ${primaryFactor} gives them the edge`;
  } else if (confidence >= 55) {
    return `Slight edge to ${favored} based on ${primaryFactor}`;
  } else {
    return `Close call, but ${favored} has minor advantages`;
  }
}

/**
 * Generate detailed breakdown for UI display
 */
export function generateDetailedBreakdown(
  analysis: ComprehensiveAnalysis
): { factor: string; impact: string; direction: 'positive' | 'negative' | 'neutral' }[] {
  return analysis.factors.map(f => ({
    factor: f.name,
    impact: f.description,
    direction: f.impact > 2 ? 'positive' : f.impact < -2 ? 'negative' : 'neutral'
  }));
}
