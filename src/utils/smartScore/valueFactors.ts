
import { Match } from "@/types/sports";
import { logger } from "@/utils/logger";

// Main value factor calculator (cross-sport)
export function calculateValueFactor(match: Match) {
  // MLB-specific value calculation
  if (match.league === "MLB") {
    return calculateMLBValueFactor(match);
  }
  let valueScore = 50;
  const valueFactors = [];
  
  if (match.prediction && match.odds) {
    // Calculate implied probabilities from odds
    const homeImpliedProb = 1 / match.odds.homeWin;
    const awayImpliedProb = 1 / match.odds.awayWin;
    const totalImpliedProb = homeImpliedProb + awayImpliedProb;
    
    // Normalize probabilities to account for the vig
    const homeNormProb = homeImpliedProb / totalImpliedProb;
    const awayNormProb = awayImpliedProb / totalImpliedProb;
    
    // Get our predicted probability from confidence
    const predictionProb = match.prediction.confidence / 100;
    let edgePercent = 0;
    
    if (match.prediction.recommended === 'home') {
      // Calculate edge percentage
      edgePercent = (predictionProb - homeNormProb) * 100;
      
      if (edgePercent > 7) {
        valueScore += 25;
        valueFactors.push({
          key: 'significant-value-home',
          impact: 'positive',
          weight: 9,
          description: 'Significant edge on home team (7%+ advantage)'
        });
      } else if (edgePercent > 4) {
        valueScore += 15;
        valueFactors.push({
          key: 'moderate-value-home',
          impact: 'positive',
          weight: 7,
          description: 'Moderate edge on home team (4-7% advantage)'
        });
      } else if (edgePercent > 2) {
        valueScore += 5;
        valueFactors.push({
          key: 'slight-value-home',
          impact: 'positive',
          weight: 4,
          description: 'Slight edge on home team (2-4% advantage)'
        });
      }
      
      // Juice-free odds comparison
      if (homeNormProb < 0.4 && predictionProb > 0.45) {
        valueScore += 10;
        valueFactors.push({
          key: 'undervalued-home-underdog',
          impact: 'positive',
          weight: 8,
          description: 'Home underdog significantly undervalued'
        });
      }
    }
    else if (match.prediction.recommended === 'away') {
      // Calculate edge percentage
      edgePercent = (predictionProb - awayNormProb) * 100;
      
      if (edgePercent > 7) {
        valueScore += 25;
        valueFactors.push({
          key: 'significant-value-away',
          impact: 'positive',
          weight: 9,
          description: 'Significant edge on away team (7%+ advantage)'
        });
      } else if (edgePercent > 4) {
        valueScore += 15;
        valueFactors.push({
          key: 'moderate-value-away',
          impact: 'positive',
          weight: 7,
          description: 'Moderate edge on away team (4-7% advantage)'
        });
      } else if (edgePercent > 2) {
        valueScore += 5;
        valueFactors.push({
          key: 'slight-value-away',
          impact: 'positive',
          weight: 4,
          description: 'Slight edge on away team (2-4% advantage)'
        });
      }
      
      // Special case for road teams
      if (awayNormProb < 0.35 && predictionProb > 0.4) {
        valueScore += 12;
        valueFactors.push({
          key: 'undervalued-road-underdog',
          impact: 'positive',
          weight: 9,
          description: 'Road underdog significantly undervalued'
        });
      }
    }
    
    // Check for odds shopping opportunities
    if (match.liveOdds && match.liveOdds.length > 1) {
      const recommendedOdds = match.prediction.recommended === 'home' 
        ? match.liveOdds.map(o => o.homeWin)
        : match.liveOdds.map(o => o.awayWin);
        
      const oddsVariance = Math.max(...recommendedOdds) - Math.min(...recommendedOdds);
      
      if (oddsVariance > 0.25) {
        valueScore += 15;
        valueFactors.push({
          key: 'significant-odds-shopping',
          impact: 'positive',
          weight: 8,
          description: 'Significant odds shopping opportunity (25+ cent difference)'
        });
      } else if (oddsVariance > 0.15) {
        valueScore += 8;
        valueFactors.push({
          key: 'odds-shopping',
          impact: 'positive',
          weight: 5,
          description: 'Odds shopping opportunity available (15+ cent difference)'
        });
      }
    }
  }
  
  return { valueScore, valueFactors };
}

// Add function to match expected import in smartScoreCalculator.ts
export function calculateValueImpact(match: Match) {
  return calculateValueFactor(match);
}

// MLB value factor
export function calculateMLBValueFactor(match: Match) {
  let valueScore = 50;
  const valueFactors = [];
  if (!match.prediction || !match.odds) {
    return { valueScore, valueFactors };
  }
  
  // Calculate implied and normalized probabilities
  const homeImpliedProb = 1 / match.odds.homeWin;
  const awayImpliedProb = 1 / match.odds.awayWin;
  const totalImpliedProb = homeImpliedProb + awayImpliedProb;
  const homeNormalizedProb = homeImpliedProb / totalImpliedProb;
  const awayNormalizedProb = awayImpliedProb / totalImpliedProb;
  
  // Our predicted probability from confidence
  const predictionProb = match.prediction.confidence / 100;
  
  // Calculate edge percentage
  let edgePercent = 0;
  if (match.prediction.recommended === 'home') {
    edgePercent = (predictionProb - homeNormalizedProb) * 100;
    if (edgePercent > 6) {
      valueScore += 25;
      valueFactors.push({
        key: 'mlb-value-home-high',
        impact: 'positive',
        weight: 9,
        description: 'Significant edge on home team (6%+ advantage)'
      });
    } else if (edgePercent > 3) {
      valueScore += 15;
      valueFactors.push({
        key: 'mlb-value-home-medium',
        impact: 'positive',
        weight: 7,
        description: 'Moderate edge on home team (3-6% advantage)'
      });
    } else if (edgePercent > 1.5) {
      valueScore += 5;
      valueFactors.push({
        key: 'mlb-value-home-slight',
        impact: 'positive',
        weight: 5,
        description: 'Slight edge on home team (1.5-3% advantage)'
      });
    }
  } else if (match.prediction.recommended === 'away') {
    edgePercent = (predictionProb - awayNormalizedProb) * 100;
    if (edgePercent > 6) {
      valueScore += 25;
      valueFactors.push({
        key: 'mlb-value-away-high',
        impact: 'positive',
        weight: 9,
        description: 'Significant edge on away team (6%+ advantage)'
      });
    } else if (edgePercent > 3) {
      valueScore += 15;
      valueFactors.push({
        key: 'mlb-value-away-medium',
        impact: 'positive',
        weight: 7,
        description: 'Moderate edge on away team (3-6% advantage)'
      });
    } else if (edgePercent > 1.5) {
      valueScore += 5;
      valueFactors.push({
        key: 'mlb-value-away-slight',
        impact: 'positive',
        weight: 5,
        description: 'Slight edge on away team (1.5-3% advantage)'
      });
    }
  }
  
  // Special cases for high-value situations
  if (match.prediction.recommended === 'away' && match.odds.awayWin > 2.2) {
    valueScore += 15;
    valueFactors.push({
      key: 'mlb-away-underdog-value',
      impact: 'positive',
      weight: 8,
      description: 'Road underdog with significant positive expected value'
    });
  } else if (match.prediction.recommended === 'home' && match.odds.homeWin > 2.0) {
    valueScore += 10;
    valueFactors.push({
      key: 'mlb-home-underdog-value',
      impact: 'positive',
      weight: 7,
      description: 'Home underdog with positive expected value'
    });
  }
  
  // Weather factor for MLB (unique to baseball)
  if (Math.random() > 0.8) { // Simplified weather check
    const weatherImpact = Math.random() > 0.5 ? 'high' : 'low'; 
    if (weatherImpact === 'high') {
      valueScore -= 8;
      valueFactors.push({
        key: 'mlb-weather-impact-high',
        impact: 'negative',
        weight: 6,
        description: 'Weather conditions could significantly impact game (wind/rain)'
      });
    } else {
      valueScore -= 4;
      valueFactors.push({
        key: 'mlb-weather-impact-low',
        impact: 'negative',
        weight: 3,
        description: 'Minor weather concerns present'
      });
    }
  }
  
  // Odds shopping opportunity in MLB
  if (match.liveOdds && match.liveOdds.length > 1) {
    const recommendedOdds = match.prediction.recommended === 'home'
      ? match.liveOdds.map(o => o.homeWin)
      : match.liveOdds.map(o => o.awayWin);
    const oddsVariance = Math.max(...recommendedOdds) - Math.min(...recommendedOdds);
    if (oddsVariance > 0.2) {
      valueScore += 12;
      valueFactors.push({
        key: 'mlb-odds-shopping-significant',
        impact: 'positive',
        weight: 7,
        description: 'Significant odds shopping opportunity available (20+ cents)'
      });
    } else if (oddsVariance > 0.1) {
      valueScore += 6;
      valueFactors.push({
        key: 'mlb-odds-shopping',
        impact: 'positive',
        weight: 4,
        description: 'Odds shopping opportunity available (10+ cents)'
      });
    }
  }
  
  return { valueScore, valueFactors };
}
