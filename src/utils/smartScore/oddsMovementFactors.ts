
import { Match } from "@/types/sports";

// Main odds movement factor calculator (cross-sport)
export function calculateOddsMovementFactors(match: Match, valueScore: number) {
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
    if (match.prediction.recommended === 'home') {
      const homeOddsMovement = latestOdds.homeWin - firstOdds.homeWin;
      if (homeOddsMovement <= -0.2) {
        adjustedValueScore -= 15;
        oddsFactors.push({
          key: 'home-odds-shortening-significant',
          impact: 'negative',
          weight: 8,
          description: 'Home team odds shortening significantly (sharp money against our pick)'
        });
      } else if (homeOddsMovement < 0) {
        adjustedValueScore -= 5;
        oddsFactors.push({
          key: 'home-odds-shortening',
          impact: 'negative',
          weight: 4,
          description: 'Home team odds shortening (value decreasing)'
        });
      } else if (homeOddsMovement >= 0.2) {
        adjustedValueScore += 15;
        oddsFactors.push({
          key: 'home-odds-lengthening-significant',
          impact: 'positive',
          weight: 8,
          description: 'Home team odds lengthening significantly (growing value)'
        });
      } else if (homeOddsMovement > 0) {
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
        adjustedValueScore -= 15;
        oddsFactors.push({
          key: 'away-odds-shortening-significant',
          impact: 'negative',
          weight: 8,
          description: 'Away team odds shortening significantly (sharp money against our pick)'
        });
      } else if (awayOddsMovement < 0) {
        adjustedValueScore -= 5;
        oddsFactors.push({
          key: 'away-odds-shortening',
          impact: 'negative',
          weight: 4,
          description: 'Away team odds shortening (value decreasing)'
        });
      } else if (awayOddsMovement >= 0.2) {
        adjustedValueScore += 15;
        oddsFactors.push({
          key: 'away-odds-lengthening-significant',
          impact: 'positive',
          weight: 8,
          description: 'Away team odds lengthening significantly (growing value)'
        });
      } else if (awayOddsMovement > 0) {
        adjustedValueScore += 5;
        oddsFactors.push({
          key: 'away-odds-lengthening',
          impact: 'positive',
          weight: 4,
          description: 'Away team odds lengthening (value increasing)'
        });
      }
    }
    const homeOddsMovement = latestOdds.homeWin - firstOdds.homeWin;
    const awayOddsMovement = latestOdds.awayWin - firstOdds.awayWin;
    if (homeOddsMovement > 0 && awayOddsMovement < 0) {
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

// MLB odds movement factor
export function calculateMLBOddsMovementFactors(match: Match, valueScore: number) {
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
  if (match.prediction.recommended === 'home') {
    const homeOddsMovement = latestOdds.homeWin - firstOdds.homeWin;
    if (homeOddsMovement <= -0.15) {
      adjustedValueScore -= 15;
      oddsFactors.push({
        key: 'mlb-home-odds-shortening',
        impact: 'negative',
        weight: 8,
        description: 'Home team odds shortening significantly (sharp MLB money against our pick)'
      });
    } else if (homeOddsMovement <= -0.05) {
      adjustedValueScore -= 7;
      oddsFactors.push({
        key: 'mlb-home-odds-ticking-down',
        impact: 'negative',
        weight: 5,
        description: 'Home team odds moving against us slightly'
      });
    } else if (homeOddsMovement >= 0.15) {
      adjustedValueScore += 15;
      oddsFactors.push({
        key: 'mlb-home-odds-lengthening',
        impact: 'positive',
        weight: 8,
        description: 'Home team odds lengthening significantly (value increasing)'
      });
    } else if (homeOddsMovement >= 0.05) {
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
      adjustedValueScore -= 15;
      oddsFactors.push({
        key: 'mlb-away-odds-shortening',
        impact: 'negative',
        weight: 8,
        description: 'Away team odds shortening significantly (sharp MLB money against our pick)'
      });
    } else if (awayOddsMovement <= -0.05) {
      adjustedValueScore -= 7;
      oddsFactors.push({
        key: 'mlb-away-odds-ticking-down',
        impact: 'negative',
        weight: 5,
        description: 'Away team odds moving against us slightly'
      });
    } else if (awayOddsMovement >= 0.15) {
      adjustedValueScore += 15;
      oddsFactors.push({
        key: 'mlb-away-odds-lengthening',
        impact: 'positive',
        weight: 8,
        description: 'Away team odds lengthening significantly (value increasing)'
      });
    } else if (awayOddsMovement >= 0.05) {
      adjustedValueScore += 7;
      oddsFactors.push({
        key: 'mlb-away-odds-ticking-up',
        impact: 'positive',
        weight: 5,
        description: 'Away team odds improving slightly'
      });
    }
  }
  return { adjustedValueScore, oddsFactors };
}
