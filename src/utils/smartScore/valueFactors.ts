
import { Match } from "@/types/sports";

// Main value factor calculator (cross-sport)
export function calculateValueFactor(match: Match) {
  // MLB-specific value calculation
  if (match.league === "MLB") {
    return calculateMLBValueFactor(match);
  }
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

// MLB value factor
export function calculateMLBValueFactor(match: Match) {
  let valueScore = 50;
  const valueFactors = [];
  if (!match.prediction || !match.odds) {
    return { valueScore, valueFactors };
  }
  const homeImpliedProb = 1 / match.odds.homeWin;
  const awayImpliedProb = 1 / match.odds.awayWin;
  const totalImpliedProb = homeImpliedProb + awayImpliedProb;
  const homeNormalizedProb = homeImpliedProb / totalImpliedProb;
  const awayNormalizedProb = awayImpliedProb / totalImpliedProb;
  const predictionProb = match.prediction.confidence / 100;
  let edgePercent = 0;
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
