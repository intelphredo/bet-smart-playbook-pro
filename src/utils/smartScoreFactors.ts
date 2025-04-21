
import { Match } from "@/types/sports";

/**
 * Calculate the valueScore and associated factors for SmartScore.
 */
export function calculateValueFactor(match: Match) {
  let valueScore = 50;
  const valueFactors = [];

  if (match.prediction && match.odds) {
    // Check if home team is undervalued by bookmakers
    if (
      match.prediction.recommended === 'home' && 
      match.odds.homeWin > match.odds.awayWin
    ) {
      valueScore += 20;
      valueFactors.push({
        key: 'value-home',
        impact: 'positive',
        weight: 8,
        description: 'Home team undervalued by bookmakers'
      });
    }
    
    // Check if away team is undervalued by bookmakers
    if (
      match.prediction.recommended === 'away' && 
      match.odds.awayWin > match.odds.homeWin
    ) {
      valueScore += 20;
      valueFactors.push({
        key: 'value-away',
        impact: 'positive',
        weight: 8,
        description: 'Away team undervalued by bookmakers'
      });
    }
    
    // Check for significant odds differences across sportsbooks (arbitrage potential)
    if (match.liveOdds && match.liveOdds.length > 1) {
      const homeOdds = match.liveOdds.map(o => o.homeWin);
      const awayOdds = match.liveOdds.map(o => o.awayWin);
      
      const homeOddsVariance = Math.max(...homeOdds) - Math.min(...homeOdds);
      const awayOddsVariance = Math.max(...awayOdds) - Math.min(...awayOdds);
      
      if (homeOddsVariance > 0.2 || awayOddsVariance > 0.2) {
        valueScore += 15;
        valueFactors.push({
          key: 'odds-variance',
          impact: 'positive',
          weight: 7,
          description: 'Significant odds variance between sportsbooks'
        });
      }
    }
  }
  
  return { valueScore, valueFactors };
}

/**
 * Calculate the momentumScore and associated factors for SmartScore.
 */
export function calculateMomentumFactors(match: Match) {
  let momentumScore = 50;
  const momentumFactors = [];

  // Factor in prediction confidence
  if (match.prediction && match.prediction.confidence >= 75) {
    momentumScore += 15;
    momentumFactors.push({
      key: 'high-confidence',
      impact: 'positive',
      weight: 9,
      description: 'High confidence prediction'
    });
  } else if (match.prediction && match.prediction.confidence >= 60) {
    momentumScore += 10;
    momentumFactors.push({
      key: 'medium-confidence',
      impact: 'positive',
      weight: 6,
      description: 'Moderate confidence prediction'
    });
  }

  // Home team recent form analysis
  if (match.homeTeam.recentForm) {
    const wins = match.homeTeam.recentForm.filter(result => result === 'W').length;
    const totalGames = match.homeTeam.recentForm.length;
    
    if (wins / totalGames >= 0.8) {
      momentumScore += 15;
      momentumFactors.push({
        key: 'home-hot-streak',
        impact: 'positive',
        weight: 9,
        description: 'Home team on hot streak'
      });
    } else if (wins / totalGames >= 0.6) {
      momentumScore += 10;
      momentumFactors.push({
        key: 'home-form',
        impact: 'positive',
        weight: 7,
        description: 'Home team in good form'
      });
    } else if (wins / totalGames <= 0.2) {
      momentumScore -= 15;
      momentumFactors.push({
        key: 'home-cold-streak',
        impact: 'negative',
        weight: 9,
        description: 'Home team on cold streak'
      });
    } else if (wins / totalGames <= 0.3) {
      momentumScore -= 10;
      momentumFactors.push({
        key: 'home-form-bad',
        impact: 'negative',
        weight: 7,
        description: 'Home team in poor form'
      });
    }
    
    // Check for streaks (consecutive wins or losses)
    if (match.homeTeam.recentForm.length >= 3) {
      const lastThree = match.homeTeam.recentForm.slice(0, 3);
      if (lastThree.every(result => result === 'W')) {
        momentumScore += 8;
        momentumFactors.push({
          key: 'home-winning-streak',
          impact: 'positive',
          weight: 6,
          description: 'Home team on winning streak'
        });
      } else if (lastThree.every(result => result === 'L')) {
        momentumScore -= 8;
        momentumFactors.push({
          key: 'home-losing-streak',
          impact: 'negative',
          weight: 6,
          description: 'Home team on losing streak'
        });
      }
    }
  }

  // Away team recent form analysis
  if (match.awayTeam.recentForm) {
    const wins = match.awayTeam.recentForm.filter(result => result === 'W').length;
    const totalGames = match.awayTeam.recentForm.length;
    
    if (wins / totalGames >= 0.8) {
      momentumScore += 15;
      momentumFactors.push({
        key: 'away-hot-streak',
        impact: 'positive',
        weight: 9,
        description: 'Away team on hot streak'
      });
    } else if (wins / totalGames >= 0.6) {
      momentumScore += 10;
      momentumFactors.push({
        key: 'away-form',
        impact: 'positive',
        weight: 7,
        description: 'Away team in good form'
      });
    } else if (wins / totalGames <= 0.2) {
      momentumScore -= 15;
      momentumFactors.push({
        key: 'away-cold-streak',
        impact: 'negative',
        weight: 9,
        description: 'Away team on cold streak'
      });
    } else if (wins / totalGames <= 0.3) {
      momentumScore -= 10;
      momentumFactors.push({
        key: 'away-form-bad',
        impact: 'negative',
        weight: 7,
        description: 'Away team in poor form'
      });
    }
    
    // Check for streaks (consecutive wins or losses)
    if (match.awayTeam.recentForm.length >= 3) {
      const lastThree = match.awayTeam.recentForm.slice(0, 3);
      if (lastThree.every(result => result === 'W')) {
        momentumScore += 8;
        momentumFactors.push({
          key: 'away-winning-streak',
          impact: 'positive',
          weight: 6,
          description: 'Away team on winning streak'
        });
      } else if (lastThree.every(result => result === 'L')) {
        momentumScore -= 8;
        momentumFactors.push({
          key: 'away-losing-streak',
          impact: 'negative',
          weight: 6,
          description: 'Away team on losing streak'
        });
      }
    }
  }
  
  // League-specific momentum factors
  if (match.league === "NBA" || match.league === "NHL") {
    // These leagues have significant momentum factors
    momentumScore = momentumScore * 1.1;
  }
  
  return { momentumScore, momentumFactors };
}

/**
 * Calculate odds movement factors, modifying value score
 */
export function calculateOddsMovementFactors(match: Match, valueScore: number) {
  const oddsFactors = [];
  let adjustedValueScore = valueScore;

  if (match.liveOdds && match.liveOdds.length > 1 && match.prediction) {
    const sortedOdds = [...match.liveOdds].sort((a, b) => 
      new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    );
    const firstOdds = sortedOdds[0];
    const latestOdds = sortedOdds[sortedOdds.length - 1];

    // Check for significant line movement
    if (match.prediction.recommended === 'home') {
      const homeOddsMovement = latestOdds.homeWin - firstOdds.homeWin;
      
      if (homeOddsMovement <= -0.2) {
        // Odds shortening significantly (more than 0.2)
        adjustedValueScore -= 15;
        oddsFactors.push({
          key: 'home-odds-shortening-significant',
          impact: 'negative',
          weight: 8,
          description: 'Home team odds shortening significantly (sharp money against our pick)'
        });
      } else if (homeOddsMovement < 0) {
        // Odds shortening slightly
        adjustedValueScore -= 5;
        oddsFactors.push({
          key: 'home-odds-shortening',
          impact: 'negative',
          weight: 4,
          description: 'Home team odds shortening (value decreasing)'
        });
      } else if (homeOddsMovement >= 0.2) {
        // Odds lengthening significantly
        adjustedValueScore += 15;
        oddsFactors.push({
          key: 'home-odds-lengthening-significant',
          impact: 'positive',
          weight: 8,
          description: 'Home team odds lengthening significantly (growing value)'
        });
      } else if (homeOddsMovement > 0) {
        // Odds lengthening slightly
        adjustedValueScore += 5;
        oddsFactors.push({
          key: 'home-odds-lengthening',
          impact: 'positive',
          weight: 4,
          description: 'Home team odds lengthening (value increasing)'
        });
      }
    }
    else if (match.prediction.recommended === 'away') {
      const awayOddsMovement = latestOdds.awayWin - firstOdds.awayWin;
      
      if (awayOddsMovement <= -0.2) {
        // Odds shortening significantly
        adjustedValueScore -= 15;
        oddsFactors.push({
          key: 'away-odds-shortening-significant',
          impact: 'negative',
          weight: 8,
          description: 'Away team odds shortening significantly (sharp money against our pick)'
        });
      } else if (awayOddsMovement < 0) {
        // Odds shortening slightly
        adjustedValueScore -= 5;
        oddsFactors.push({
          key: 'away-odds-shortening',
          impact: 'negative',
          weight: 4,
          description: 'Away team odds shortening (value decreasing)'
        });
      } else if (awayOddsMovement >= 0.2) {
        // Odds lengthening significantly
        adjustedValueScore += 15;
        oddsFactors.push({
          key: 'away-odds-lengthening-significant',
          impact: 'positive',
          weight: 8,
          description: 'Away team odds lengthening significantly (growing value)'
        });
      } else if (awayOddsMovement > 0) {
        // Odds lengthening slightly
        adjustedValueScore += 5;
        oddsFactors.push({
          key: 'away-odds-lengthening',
          impact: 'positive',
          weight: 4,
          description: 'Away team odds lengthening (value increasing)'
        });
      }
    }
    
    // Check for reverse line movement (odds moving against consensus)
    // This is a strong indicator used by professional bettors
    const homeOddsMovement = latestOdds.homeWin - firstOdds.homeWin;
    const awayOddsMovement = latestOdds.awayWin - firstOdds.awayWin;
    
    if (homeOddsMovement > 0 && awayOddsMovement < 0) {
      // Home team odds getting longer while away team odds getting shorter
      oddsFactors.push({
        key: 'reverse-line-movement-home',
        impact: 'positive',
        weight: 9,
        description: 'Reverse line movement favoring home team (sharp indicator)'
      });
      
      if (match.prediction.recommended === 'home') {
        adjustedValueScore += 20;
      }
    } else if (homeOddsMovement < 0 && awayOddsMovement > 0) {
      // Away team odds getting longer while home team odds getting shorter
      oddsFactors.push({
        key: 'reverse-line-movement-away',
        impact: 'positive',
        weight: 9,
        description: 'Reverse line movement favoring away team (sharp indicator)'
      });
      
      if (match.prediction.recommended === 'away') {
        adjustedValueScore += 20;
      }
    }
  }

  return { adjustedValueScore, oddsFactors };
}

/**
 * Calculate injury impact on the match
 */
export function calculateInjuryImpact(match: Match) {
  // Default - not accounting for detailed injury data yet
  let injuriesScore = 75;
  const injuryFactors = [];
  
  // This could be enhanced with real injury data from an API
  
  return { injuriesScore, injuryFactors };
}

/**
 * Calculate weather impact on the match
 */
export function calculateWeatherImpact(match: Match) {
  // Default - not accounting for detailed weather data yet
  let weatherImpact = 80;
  const weatherFactors = [];
  
  // This could be enhanced with real weather data from an API
  
  return { weatherImpact, weatherFactors };
}
