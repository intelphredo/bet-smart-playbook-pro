
import { Match } from "@/types/sports";

/**
 * Calculate the valueScore and associated factors for SmartScore.
 */
export function calculateValueFactor(match: Match) {
  let valueScore = 50;
  const valueFactors = [];

  if (match.prediction && match.odds) {
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
  }
  return { valueScore, valueFactors };
}

/**
 * Calculate the momentumScore and associated factors for SmartScore.
 */
export function calculateMomentumFactors(match: Match) {
  let momentumScore = 50;
  const momentumFactors = [];

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

  // Home team recent form
  if (match.homeTeam.recentForm) {
    const wins = match.homeTeam.recentForm.filter(result => result === 'W').length;
    const totalGames = match.homeTeam.recentForm.length;
    if (wins / totalGames >= 0.6) {
      momentumScore += 10;
      momentumFactors.push({
        key: 'home-form',
        impact: 'positive',
        weight: 7,
        description: 'Home team in good form'
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
  }

  // Away team recent form
  if (match.awayTeam.recentForm) {
    const wins = match.awayTeam.recentForm.filter(result => result === 'W').length;
    const totalGames = match.awayTeam.recentForm.length;
    if (wins / totalGames >= 0.6) {
      momentumScore += 10;
      momentumFactors.push({
        key: 'away-form',
        impact: 'positive',
        weight: 7,
        description: 'Away team in good form'
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

    if (match.prediction.recommended === 'home') {
      if (latestOdds.homeWin < firstOdds.homeWin) {
        adjustedValueScore -= 10;
        oddsFactors.push({
          key: 'home-odds-shortening',
          impact: 'negative',
          weight: 5,
          description: 'Home team odds shortening (value decreasing)'
        });
      } else if (latestOdds.homeWin > firstOdds.homeWin) {
        adjustedValueScore += 10;
        oddsFactors.push({
          key: 'home-odds-lengthening',
          impact: 'positive',
          weight: 5,
          description: 'Home team odds lengthening (value increasing)'
        });
      }
    }
    else if (match.prediction.recommended === 'away') {
      if (latestOdds.awayWin < firstOdds.awayWin) {
        adjustedValueScore -= 10;
        oddsFactors.push({
          key: 'away-odds-shortening',
          impact: 'negative',
          weight: 5,
          description: 'Away team odds shortening (value decreasing)'
        });
      } else if (latestOdds.awayWin > firstOdds.awayWin) {
        adjustedValueScore += 10;
        oddsFactors.push({
          key: 'away-odds-lengthening',
          impact: 'positive',
          weight: 5,
          description: 'Away team odds lengthening (value increasing)'
        });
      }
    }
  }

  return { adjustedValueScore, oddsFactors };
}
