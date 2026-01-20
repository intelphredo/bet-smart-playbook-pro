
import { Match, SmartScoreFactor } from "@/types/sports";

// Rename function to match expected import in smartScoreCalculator.ts
export function calculateMomentumImpact(match: Match) {
  return calculateMomentumFactors(match);
}

// Main momentum factor calculator (cross-sport)
export function calculateMomentumFactors(match: Match) {
  if (match.league === "MLB") {
    return calculateMLBMomentumFactors(match);
  }
  let momentumScore = 50;
  const momentumFactors: SmartScoreFactor[] = [];
  
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
  if (match.homeTeam?.recentForm && Array.isArray(match.homeTeam.recentForm) && match.homeTeam.recentForm.length > 0) {
    const wins = match.homeTeam.recentForm.filter(result => result === 'W').length;
    const totalGames = match.homeTeam.recentForm.length;
    const winRate = wins / totalGames;
    
    if (winRate >= 0.8) {
      momentumScore += 15;
      momentumFactors.push({
        key: 'home-hot-streak',
        impact: 'positive',
        weight: 9,
        description: 'Home team on hot streak'
      });
    } else if (winRate >= 0.6) {
      momentumScore += 10;
      momentumFactors.push({
        key: 'home-form',
        impact: 'positive',
        weight: 7,
        description: 'Home team in good form'
      });
    } else if (winRate <= 0.2) {
      momentumScore -= 15;
      momentumFactors.push({
        key: 'home-cold-streak',
        impact: 'negative',
        weight: 9,
        description: 'Home team on cold streak'
      });
    } else if (winRate <= 0.3) {
      momentumScore -= 10;
      momentumFactors.push({
        key: 'home-form-bad',
        impact: 'negative',
        weight: 7,
        description: 'Home team in poor form'
      });
    }
    
    // Check last 3 games streak
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
  if (match.awayTeam?.recentForm && Array.isArray(match.awayTeam.recentForm) && match.awayTeam.recentForm.length > 0) {
    const wins = match.awayTeam.recentForm.filter(result => result === 'W').length;
    const totalGames = match.awayTeam.recentForm.length;
    const winRate = wins / totalGames;
    
    if (winRate >= 0.8) {
      momentumScore += 15;
      momentumFactors.push({
        key: 'away-hot-streak',
        impact: 'positive',
        weight: 9,
        description: 'Away team on hot streak'
      });
    } else if (winRate >= 0.6) {
      momentumScore += 10;
      momentumFactors.push({
        key: 'away-form',
        impact: 'positive',
        weight: 7,
        description: 'Away team in good form'
      });
    } else if (winRate <= 0.2) {
      momentumScore -= 15;
      momentumFactors.push({
        key: 'away-cold-streak',
        impact: 'negative',
        weight: 9,
        description: 'Away team on cold streak'
      });
    } else if (winRate <= 0.3) {
      momentumScore -= 10;
      momentumFactors.push({
        key: 'away-form-bad',
        impact: 'negative',
        weight: 7,
        description: 'Away team in poor form'
      });
    }
    
    // Check last 3 games streak
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
  
  if (match.league === "NBA" || match.league === "NHL") {
    momentumScore = momentumScore * 1.1;
  }
  
  return { momentumScore, momentumFactors };
}

// MLB momentum factor
export function calculateMLBMomentumFactors(match: Match) {
  let momentumScore = 50;
  const momentumFactors: SmartScoreFactor[] = [];
  
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
  
  if (match.homeTeam?.recentForm && Array.isArray(match.homeTeam.recentForm) && match.homeTeam.recentForm.length > 0) {
    const wins = match.homeTeam.recentForm.filter(result => result === 'W').length;
    const totalGames = match.homeTeam.recentForm.length;
    const winRate = wins / totalGames;
    
    if (winRate >= 0.8) {
      momentumScore += 12;
      momentumFactors.push({
        key: 'mlb-home-hot',
        impact: 'positive',
        weight: 7,
        description: 'Home team winning recently'
      });
    } else if (winRate <= 0.2) {
      momentumScore -= 10;
      momentumFactors.push({
        key: 'mlb-home-cold',
        impact: 'negative',
        weight: 7,
        description: 'Home team struggling recently'
      });
    }
  }
  
  if (match.awayTeam?.recentForm && Array.isArray(match.awayTeam.recentForm) && match.awayTeam.recentForm.length > 0) {
    const wins = match.awayTeam.recentForm.filter(result => result === 'W').length;
    const totalGames = match.awayTeam.recentForm.length;
    const winRate = wins / totalGames;
    
    if (winRate >= 0.8) {
      momentumScore += 12;
      momentumFactors.push({
        key: 'mlb-away-hot',
        impact: 'positive',
        weight: 7,
        description: 'Away team winning recently'
      });
    } else if (winRate <= 0.2) {
      momentumScore -= 10;
      momentumFactors.push({
        key: 'mlb-away-cold',
        impact: 'negative',
        weight: 7,
        description: 'Away team struggling recently'
      });
    }
  }
  
  if (match.prediction && match.prediction.recommended === 'home') {
    momentumScore += 3;
    momentumFactors.push({
      key: 'mlb-home-edge',
      impact: 'positive',
      weight: 3,
      description: 'Small MLB home field advantage'
    });
  }
  
  return { momentumScore, momentumFactors };
}
