
import { Match } from "@/types/sports";

/**
 * Calculate the valueScore and associated factors for SmartScore.
 */
export function calculateValueFactor(match: Match) {
  let valueScore = 50;
  const valueFactors = [];

  // MLB-specific value calculation
  if (match.league === "MLB") {
    return calculateMLBValueFactor(match);
  }

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
 * MLB-specific value factor calculation with baseball-focused metrics
 */
function calculateMLBValueFactor(match: Match) {
  let valueScore = 50;
  const valueFactors = [];

  if (!match.prediction || !match.odds) {
    return { valueScore, valueFactors };
  }

  // Calculate probability implied by odds
  const homeImpliedProb = 1 / match.odds.homeWin;
  const awayImpliedProb = 1 / match.odds.awayWin;
  
  // Normalize for overround (bookmaker margin)
  const totalImpliedProb = homeImpliedProb + awayImpliedProb;
  const homeNormalizedProb = homeImpliedProb / totalImpliedProb;
  const awayNormalizedProb = awayImpliedProb / totalImpliedProb;
  
  // Convert confidence to probability
  const predictionProb = match.prediction.confidence / 100;
  let edgePercent = 0;
  
  // Calculate edge based on recommended side
  if (match.prediction.recommended === 'home') {
    edgePercent = (predictionProb - homeNormalizedProb) * 100;
    
    if (edgePercent > 5) {
      valueScore += 25;
      valueFactors.push({
        key: 'mlb-value-home-high',
        impact: 'positive',
        weight: 9,
        description: 'Significant value on home team based on our model'
      });
    } else if (edgePercent > 2) {
      valueScore += 15;
      valueFactors.push({
        key: 'mlb-value-home-medium',
        impact: 'positive',
        weight: 7,
        description: 'Moderate value on home team based on our model'
      });
    } else if (edgePercent > 0) {
      valueScore += 5;
      valueFactors.push({
        key: 'mlb-value-home-slight',
        impact: 'positive',
        weight: 5,
        description: 'Slight value on home team based on our model'
      });
    }
  } else if (match.prediction.recommended === 'away') {
    edgePercent = (predictionProb - awayNormalizedProb) * 100;
    
    if (edgePercent > 5) {
      valueScore += 25;
      valueFactors.push({
        key: 'mlb-value-away-high',
        impact: 'positive',
        weight: 9,
        description: 'Significant value on away team based on our model'
      });
    } else if (edgePercent > 2) {
      valueScore += 15;
      valueFactors.push({
        key: 'mlb-value-away-medium',
        impact: 'positive',
        weight: 7,
        description: 'Moderate value on away team based on our model'
      });
    } else if (edgePercent > 0) {
      valueScore += 5;
      valueFactors.push({
        key: 'mlb-value-away-slight',
        impact: 'positive',
        weight: 5,
        description: 'Slight value on away team based on our model'
      });
    }
  }
  
  // Baseball specific: check for large underdogs with value
  if (match.prediction.recommended === 'home' && match.odds.homeWin > 2.0) {
    valueScore += 10;
    valueFactors.push({
      key: 'mlb-home-underdog',
      impact: 'positive',
      weight: 7,
      description: 'Home underdog with positive expected value'
    });
  } else if (match.prediction.recommended === 'away' && match.odds.awayWin > 2.2) {
    valueScore += 12;
    valueFactors.push({
      key: 'mlb-away-underdog',
      impact: 'positive',
      weight: 7,
      description: 'Road underdog with positive expected value'
    });
  }
  
  // Check for sportsbook odds variance
  if (match.liveOdds && match.liveOdds.length > 1) {
    const recommendedOdds = match.prediction.recommended === 'home' 
      ? match.liveOdds.map(o => o.homeWin)
      : match.liveOdds.map(o => o.awayWin);
    
    const oddsVariance = Math.max(...recommendedOdds) - Math.min(...recommendedOdds);
    
    if (oddsVariance > 0.15) {
      valueScore += 10;
      valueFactors.push({
        key: 'mlb-odds-shopping',
        impact: 'positive',
        weight: 6,
        description: 'Significant odds shopping opportunity available'
      });
    }
  }
  
  return { valueScore, valueFactors };
}

/**
 * Calculate the momentumScore and associated factors for SmartScore.
 */
export function calculateMomentumFactors(match: Match) {
  // For MLB, use a specific momentum calculation
  if (match.league === "MLB") {
    return calculateMLBMomentumFactors(match);
  }

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
 * MLB-specific momentum factors calculation
 * Baseball has different streakiness patterns than other sports
 */
function calculateMLBMomentumFactors(match: Match) {
  let momentumScore = 50;
  const momentumFactors = [];
  
  // Baseball has more variance, so we weigh momentum less heavily
  // Confidence is more tempered for MLB
  if (match.prediction && match.prediction.confidence >= 65) {
    momentumScore += 10;
    momentumFactors.push({
      key: 'mlb-high-confidence',
      impact: 'positive',
      weight: 7,
      description: 'High confidence MLB prediction'
    });
  } else if (match.prediction && match.prediction.confidence >= 55) {
    momentumScore += 5;
    momentumFactors.push({
      key: 'mlb-medium-confidence',
      impact: 'positive',
      weight: 5,
      description: 'Moderate confidence MLB prediction'
    });
  }

  // For baseball, recent form is important but streakiness is more random
  // Looking at last 5 games
  if (match.homeTeam.recentForm) {
    const wins = match.homeTeam.recentForm.filter(result => result === 'W').length;
    const totalGames = match.homeTeam.recentForm.length;
    
    if (wins / totalGames >= 0.8) {
      momentumScore += 12;
      momentumFactors.push({
        key: 'mlb-home-hot',
        impact: 'positive',
        weight: 7,
        description: 'Home team winning recently'
      });
    } else if (wins / totalGames <= 0.2) {
      momentumScore -= 10;
      momentumFactors.push({
        key: 'mlb-home-cold',
        impact: 'negative',
        weight: 7,
        description: 'Home team struggling recently'
      });
    }
  }

  // Away team recent form
  if (match.awayTeam.recentForm) {
    const wins = match.awayTeam.recentForm.filter(result => result === 'W').length;
    const totalGames = match.awayTeam.recentForm.length;
    
    if (wins / totalGames >= 0.8) {
      momentumScore += 12;
      momentumFactors.push({
        key: 'mlb-away-hot',
        impact: 'positive',
        weight: 7,
        description: 'Away team winning recently'
      });
    } else if (wins / totalGames <= 0.2) {
      momentumScore -= 10;
      momentumFactors.push({
        key: 'mlb-away-cold',
        impact: 'negative',
        weight: 7,
        description: 'Away team struggling recently'
      });
    }
  }
  
  // MLB home field advantage is smaller than other sports
  if (match.prediction && match.prediction.recommended === 'home') {
    momentumScore += 3;
    momentumFactors.push({
      key: 'mlb-home-edge',
      impact: 'positive',
      weight: 3,
      description: 'Small MLB home field advantage'
    });
  }
  
  // Check for recent matchup history if we had that data
  // (Would look at head-to-head results if available)
  
  return { momentumScore, momentumFactors };
}

/**
 * Calculate odds movement factors, modifying value score
 */
export function calculateOddsMovementFactors(match: Match, valueScore: number) {
  // For MLB, use a specific odds movement calculation
  if (match.league === "MLB") {
    return calculateMLBOddsMovementFactors(match, valueScore);
  }

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
 * MLB-specific odds movement factors calculation
 */
function calculateMLBOddsMovementFactors(match: Match, valueScore: number) {
  const oddsFactors = [];
  let adjustedValueScore = valueScore;

  if (!match.liveOdds || match.liveOdds.length <= 1 || !match.prediction) {
    return { adjustedValueScore, oddsFactors };
  }
  
  const sortedOdds = [...match.liveOdds].sort((a, b) => 
    new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
  );
  const firstOdds = sortedOdds[0];
  const latestOdds = sortedOdds[sortedOdds.length - 1];

  // MLB odds movements are typically smaller but more meaningful
  // A 0.1 movement in baseball can be significant
  if (match.prediction.recommended === 'home') {
    const homeOddsMovement = latestOdds.homeWin - firstOdds.homeWin;
    
    if (homeOddsMovement <= -0.15) {
      // Odds shortening significantly for baseball
      adjustedValueScore -= 15;
      oddsFactors.push({
        key: 'mlb-home-odds-shortening',
        impact: 'negative',
        weight: 8,
        description: 'Home team odds shortening significantly (sharp MLB money against our pick)'
      });
    } else if (homeOddsMovement <= -0.05) {
      // Odds shortening slightly
      adjustedValueScore -= 7;
      oddsFactors.push({
        key: 'mlb-home-odds-ticking-down',
        impact: 'negative',
        weight: 5,
        description: 'Home team odds moving against us slightly'
      });
    } else if (homeOddsMovement >= 0.15) {
      // Odds lengthening significantly for baseball
      adjustedValueScore += 15;
      oddsFactors.push({
        key: 'mlb-home-odds-lengthening',
        impact: 'positive',
        weight: 8,
        description: 'Home team odds lengthening significantly (value increasing)'
      });
    } else if (homeOddsMovement >= 0.05) {
      // Odds lengthening slightly
      adjustedValueScore += 7;
      oddsFactors.push({
        key: 'mlb-home-odds-ticking-up',
        impact: 'positive',
        weight: 5,
        description: 'Home team odds improving slightly'
      });
    }
  } else if (match.prediction.recommended === 'away') {
    const awayOddsMovement = latestOdds.awayWin - firstOdds.awayWin;
    
    if (awayOddsMovement <= -0.15) {
      // Odds shortening significantly for baseball
      adjustedValueScore -= 15;
      oddsFactors.push({
        key: 'mlb-away-odds-shortening',
        impact: 'negative',
        weight: 8,
        description: 'Away team odds shortening significantly (sharp MLB money against our pick)'
      });
    } else if (awayOddsMovement <= -0.05) {
      // Odds shortening slightly
      adjustedValueScore -= 7;
      oddsFactors.push({
        key: 'mlb-away-odds-ticking-down',
        impact: 'negative',
        weight: 5,
        description: 'Away team odds moving against us slightly'
      });
    } else if (awayOddsMovement >= 0.15) {
      // Odds lengthening significantly for baseball
      adjustedValueScore += 15;
      oddsFactors.push({
        key: 'mlb-away-odds-lengthening',
        impact: 'positive',
        weight: 8,
        description: 'Away team odds lengthening significantly (value increasing)'
      });
    } else if (awayOddsMovement >= 0.05) {
      // Odds lengthening slightly
      adjustedValueScore += 7;
      oddsFactors.push({
        key: 'mlb-away-odds-ticking-up',
        impact: 'positive',
        weight: 5,
        description: 'Away team odds improving slightly'
      });
    }
  }
  
  // Check for steam moves (significant line movement across multiple books)
  // This would be more valuable with more sportsbooks and timing data
  
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
