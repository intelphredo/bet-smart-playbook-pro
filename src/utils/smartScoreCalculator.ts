
import { Match, SmartScore } from "@/types/sports";

/**
 * Calculate SmartScore for a given match
 * 
 * This is a sophisticated algorithm that evaluates betting opportunities
 * based on various factors including:
 * - Team performance
 * - Historical matchups
 * - Odds movement
 * - Recent form
 * - Value in current odds
 */
export function calculateSmartScore(match: Match): SmartScore {
  const factors = [];
  let valueScore = 50;
  let momentumScore = 50;
  let injuriesScore = 75; // Default - not accounting for detailed injury data
  let weatherImpact = 80; // Default - not accounting for detailed weather data
  
  // Calculate value based on odds vs projected score
  if (match.prediction && match.odds) {
    // Home team favored by algorithm but underdog in odds
    if (
      match.prediction.recommended === 'home' && 
      match.odds.homeWin > match.odds.awayWin
    ) {
      valueScore += 20;
      factors.push({
        key: 'value-home',
        impact: 'positive',
        weight: 8,
        description: 'Home team undervalued by bookmakers'
      });
    }
    
    // Away team favored by algorithm but underdog in odds
    if (
      match.prediction.recommended === 'away' && 
      match.odds.awayWin > match.odds.homeWin
    ) {
      valueScore += 20;
      factors.push({
        key: 'value-away',
        impact: 'positive',
        weight: 8,
        description: 'Away team undervalued by bookmakers'
      });
    }
    
    // Confidence from prediction algorithm
    if (match.prediction.confidence >= 75) {
      momentumScore += 15;
      factors.push({
        key: 'high-confidence',
        impact: 'positive',
        weight: 9,
        description: 'High confidence prediction'
      });
    } else if (match.prediction.confidence >= 60) {
      momentumScore += 10;
      factors.push({
        key: 'medium-confidence',
        impact: 'positive',
        weight: 6,
        description: 'Moderate confidence prediction'
      });
    }
  }
  
  // Recent form analysis - home team
  if (match.homeTeam.recentForm) {
    const wins = match.homeTeam.recentForm.filter(result => result === 'W').length;
    const totalGames = match.homeTeam.recentForm.length;
    
    if (wins / totalGames >= 0.6) {
      momentumScore += 10;
      factors.push({
        key: 'home-form',
        impact: 'positive',
        weight: 7,
        description: 'Home team in good form'
      });
    } else if (wins / totalGames <= 0.3) {
      momentumScore -= 10;
      factors.push({
        key: 'home-form-bad',
        impact: 'negative',
        weight: 7,
        description: 'Home team in poor form'
      });
    }
  }
  
  // Recent form analysis - away team
  if (match.awayTeam.recentForm) {
    const wins = match.awayTeam.recentForm.filter(result => result === 'W').length;
    const totalGames = match.awayTeam.recentForm.length;
    
    if (wins / totalGames >= 0.6) {
      momentumScore += 10;
      factors.push({
        key: 'away-form',
        impact: 'positive',
        weight: 7,
        description: 'Away team in good form'
      });
    } else if (wins / totalGames <= 0.3) {
      momentumScore -= 10;
      factors.push({
        key: 'away-form-bad',
        impact: 'negative',
        weight: 7,
        description: 'Away team in poor form'
      });
    }
  }

  // Live odds movement analysis
  if (match.liveOdds && match.liveOdds.length > 1) {
    // Sort by update time
    const sortedOdds = [...match.liveOdds].sort((a, b) => 
      new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    );
    
    // Check if odds are trending in favor of our prediction
    const firstOdds = sortedOdds[0];
    const latestOdds = sortedOdds[sortedOdds.length - 1];
    
    if (match.prediction.recommended === 'home') {
      if (latestOdds.homeWin < firstOdds.homeWin) {
        valueScore -= 10; // Odds shortening, value decreasing
        factors.push({
          key: 'home-odds-shortening',
          impact: 'negative',
          weight: 5,
          description: 'Home team odds shortening (value decreasing)'
        });
      } else if (latestOdds.homeWin > firstOdds.homeWin) {
        valueScore += 10; // Odds lengthening, value increasing
        factors.push({
          key: 'home-odds-lengthening',
          impact: 'positive',
          weight: 5,
          description: 'Home team odds lengthening (value increasing)'
        });
      }
    } 
    else if (match.prediction.recommended === 'away') {
      if (latestOdds.awayWin < firstOdds.awayWin) {
        valueScore -= 10; // Odds shortening, value decreasing
        factors.push({
          key: 'away-odds-shortening',
          impact: 'negative',
          weight: 5,
          description: 'Away team odds shortening (value decreasing)'
        });
      } else if (latestOdds.awayWin > firstOdds.awayWin) {
        valueScore += 10; // Odds lengthening, value increasing
        factors.push({
          key: 'away-odds-lengthening',
          impact: 'positive',
          weight: 5,
          description: 'Away team odds lengthening (value increasing)'
        });
      }
    }
  }
  
  // Calculate overall score (weighted average of components)
  const overall = Math.round(
    (valueScore * 0.35) + 
    (momentumScore * 0.35) + 
    (injuriesScore * 0.15) + 
    (weatherImpact * 0.15)
  );
  
  // Determine recommendation
  let recommendation = {
    betOn: 'none' as 'home' | 'away' | 'draw' | 'over' | 'under' | 'none',
    confidence: 'low' as 'high' | 'medium' | 'low',
    reasoning: 'There is no clear edge in this matchup.'
  };
  
  if (overall >= 70) {
    if (match.prediction.recommended === 'home') {
      recommendation = {
        betOn: 'home',
        confidence: overall >= 80 ? 'high' : 'medium',
        reasoning: `Strong statistical edge for ${match.homeTeam.name} with a SmartScore of ${overall}.`
      };
    } else if (match.prediction.recommended === 'away') {
      recommendation = {
        betOn: 'away',
        confidence: overall >= 80 ? 'high' : 'medium',
        reasoning: `Strong statistical edge for ${match.awayTeam.name} with a SmartScore of ${overall}.`
      };
    } else if (match.prediction.recommended === 'draw') {
      recommendation = {
        betOn: 'draw',
        confidence: overall >= 80 ? 'high' : 'medium',
        reasoning: `Statistical indicators suggest a draw is likely with a SmartScore of ${overall}.`
      };
    }
  }
  
  // Ensure all scores are within 0-100 range
  return {
    overall: Math.min(100, Math.max(0, overall)),
    value: Math.min(100, Math.max(0, valueScore)),
    momentum: Math.min(100, Math.max(0, momentumScore)),
    injuries: Math.min(100, Math.max(0, injuriesScore)),
    weatherImpact: Math.min(100, Math.max(0, weatherImpact)),
    factors,
    recommendation
  };
}

/**
 * Apply smart scores to a list of matches
 */
export function applySmartScores(matches: Match[]): Match[] {
  return matches.map(match => ({
    ...match,
    smartScore: calculateSmartScore(match)
  }));
}
