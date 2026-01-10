
import { Match } from '@/types/sports';
import { BettingScenario, ScenarioDetectionResult } from './types';
import { BETTING_SCENARIOS } from './bettingScenarios';

/**
 * Detects which betting scenarios apply to a given match
 */
export function detectScenariosForMatch(match: Match): ScenarioDetectionResult[] {
  const results: ScenarioDetectionResult[] = [];
  
  for (const scenario of BETTING_SCENARIOS) {
    const detection = checkScenarioApplies(match, scenario);
    if (detection.applies) {
      results.push({
        scenario,
        confidence: detection.confidence,
        matchFactors: detection.factors
      });
    }
  }
  
  // Sort by confidence
  return results.sort((a, b) => b.confidence - a.confidence);
}

interface DetectionCheck {
  applies: boolean;
  confidence: number;
  factors: string[];
}

function checkScenarioApplies(match: Match, scenario: BettingScenario): DetectionCheck {
  const factors: string[] = [];
  let confidence = 0;
  
  const criteria = scenario.detectionCriteria;
  if (!criteria) {
    return { applies: false, confidence: 0, factors: [] };
  }
  
  // Check odds range (for moneyline scenarios)
  if (criteria.oddsRange) {
    const homeOdds = convertToAmericanOdds(match.odds.homeWin);
    const awayOdds = convertToAmericanOdds(match.odds.awayWin);
    
    if (criteria.oddsRange.max !== undefined) {
      // Heavy favorite check (negative odds)
      if (homeOdds <= criteria.oddsRange.max) {
        factors.push(`Home team at ${homeOdds} (heavy favorite)`);
        confidence = Math.min(100, 60 + Math.abs(homeOdds - criteria.oddsRange.max) / 5);
      }
      if (awayOdds <= criteria.oddsRange.max) {
        factors.push(`Away team at ${awayOdds} (heavy favorite)`);
        confidence = Math.max(confidence, Math.min(100, 60 + Math.abs(awayOdds - criteria.oddsRange.max) / 5));
      }
    }
    
    if (criteria.oddsRange.min !== undefined) {
      // Heavy underdog check (positive odds)
      if (homeOdds >= criteria.oddsRange.min) {
        factors.push(`Home team at +${homeOdds} (heavy underdog)`);
        confidence = Math.min(100, 60 + (homeOdds - criteria.oddsRange.min) / 10);
      }
      if (awayOdds >= criteria.oddsRange.min) {
        factors.push(`Away team at +${awayOdds} (heavy underdog)`);
        confidence = Math.max(confidence, Math.min(100, 60 + (awayOdds - criteria.oddsRange.min) / 10));
      }
    }
  }
  
  // Check if live betting scenario
  if (criteria.isLive !== undefined) {
    if ((match.status === 'live') === criteria.isLive) {
      factors.push('Live game in progress');
      confidence = 90;
    }
  }
  
  // Check spread-based scenarios
  if (criteria.spreadRange && match.smartScore?.components) {
    // Would need actual spread data - using value component as proxy
    const valueRating = match.smartScore.components.value;
    if (valueRating > 70) {
      factors.push('High value rating detected');
      confidence = Math.max(confidence, 70);
    }
  }
  
  // Check situational factors
  if (criteria.situational && match.smartScore?.factors) {
    const momentumFactors = match.smartScore.factors.momentum || [];
    const situationalMatches = criteria.situational.filter(sit => 
      momentumFactors.some((f: any) => 
        f.name?.toLowerCase().includes(sit) || 
        f.description?.toLowerCase().includes(sit)
      )
    );
    
    if (situationalMatches.length > 0) {
      factors.push(...situationalMatches.map(s => `Situational: ${s}`));
      confidence = Math.max(confidence, 50 + situationalMatches.length * 15);
    }
  }
  
  // Check for +EV scenario
  if (scenario.id === 'positive-ev' && match.prediction?.expectedValue) {
    if (match.prediction.expectedValue > 0) {
      factors.push(`Positive EV: ${(match.prediction.evPercentage || 0).toFixed(1)}%`);
      confidence = Math.min(100, 70 + (match.prediction.evPercentage || 0) * 5);
    }
  }
  
  // Check for CLV scenario
  if (scenario.id === 'closing-line-value' && match.prediction?.clvPercentage) {
    if (match.prediction.clvPercentage > 0) {
      factors.push(`CLV: +${match.prediction.clvPercentage.toFixed(1)}%`);
      confidence = Math.min(100, 70 + match.prediction.clvPercentage * 3);
    }
  }
  
  return {
    applies: factors.length > 0,
    confidence,
    factors
  };
}

/**
 * Convert decimal odds to American odds
 */
function convertToAmericanOdds(decimalOdds: number): number {
  if (decimalOdds >= 2.0) {
    // Underdog - positive American odds
    return Math.round((decimalOdds - 1) * 100);
  } else {
    // Favorite - negative American odds
    return Math.round(-100 / (decimalOdds - 1));
  }
}

/**
 * Get top N scenarios for a match
 */
export function getTopScenariosForMatch(match: Match, count: number = 3): ScenarioDetectionResult[] {
  return detectScenariosForMatch(match).slice(0, count);
}

/**
 * Check if match has any high-risk scenarios
 */
export function hasHighRiskScenarios(match: Match): boolean {
  const scenarios = detectScenariosForMatch(match);
  return scenarios.some(s => 
    s.scenario.riskLevel === 'high' || 
    s.scenario.riskLevel === 'very-high'
  );
}

/**
 * Get scenario-based betting recommendation
 */
export function getScenarioRecommendation(match: Match): {
  shouldBet: boolean;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  topScenarios: ScenarioDetectionResult[];
} {
  const scenarios = detectScenariosForMatch(match);
  
  if (scenarios.length === 0) {
    return {
      shouldBet: false,
      confidence: 'low',
      reasoning: 'No clear betting scenarios detected for this match',
      topScenarios: []
    };
  }
  
  const topScenario = scenarios[0];
  const avgROI = scenarios.reduce((sum, s) => sum + s.scenario.expectedROI, 0) / scenarios.length;
  const avgRisk = scenarios.filter(s => 
    s.scenario.riskLevel === 'high' || s.scenario.riskLevel === 'very-high'
  ).length / scenarios.length;
  
  let shouldBet = avgROI > 0 && avgRisk < 0.5;
  let confidence: 'high' | 'medium' | 'low' = 'low';
  
  if (topScenario.confidence > 80 && avgROI > 3) {
    confidence = 'high';
  } else if (topScenario.confidence > 60 && avgROI > 0) {
    confidence = 'medium';
  }
  
  // Check for +EV or CLV scenarios which are always good
  const hasPositiveEV = scenarios.some(s => s.scenario.id === 'positive-ev');
  const hasCLV = scenarios.some(s => s.scenario.id === 'closing-line-value');
  
  if (hasPositiveEV || hasCLV) {
    shouldBet = true;
    confidence = 'high';
  }
  
  return {
    shouldBet,
    confidence,
    reasoning: generateReasoningText(scenarios, shouldBet),
    topScenarios: scenarios.slice(0, 3)
  };
}

function generateReasoningText(scenarios: ScenarioDetectionResult[], shouldBet: boolean): string {
  if (scenarios.length === 0) {
    return 'Insufficient scenario data to make a recommendation.';
  }
  
  const topScenario = scenarios[0];
  const parts: string[] = [];
  
  parts.push(`Primary scenario: ${topScenario.scenario.name}`);
  
  if (topScenario.scenario.expectedROI > 0) {
    parts.push(`Historical ROI: +${topScenario.scenario.expectedROI.toFixed(1)}%`);
  } else {
    parts.push(`Warning: Negative expected ROI (${topScenario.scenario.expectedROI.toFixed(1)}%)`);
  }
  
  parts.push(`Risk level: ${topScenario.scenario.riskLevel}`);
  
  if (scenarios.length > 1) {
    parts.push(`${scenarios.length - 1} additional scenario(s) detected`);
  }
  
  return parts.join('. ') + '.';
}
