
import { LiveOdds, Match, Sportsbook } from "@/types/sports";

export const SPORTSBOOK_LOGOS = {
  draftkings: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=400&fit=crop&crop=center",
  betmgm: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop&crop=center", 
  caesars: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&h=400&fit=crop&crop=center",
  pointsbet: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=400&fit=crop&crop=center",
  fanduel: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&h=400&fit=crop&crop=center",
};

export const AVAILABLE_SPORTSBOOKS: Sportsbook[] = [
  {
    id: "draftkings",
    name: "DraftKings",
    logo: SPORTSBOOK_LOGOS.draftkings,
    isAvailable: true
  },
  {
    id: "betmgm",
    name: "BetMGM",
    logo: SPORTSBOOK_LOGOS.betmgm,
    isAvailable: true
  },
  {
    id: "caesars",
    name: "Caesars",
    logo: SPORTSBOOK_LOGOS.caesars,
    isAvailable: true
  },
  {
    id: "fanduel",
    name: "FanDuel",
    logo: SPORTSBOOK_LOGOS.fanduel,
    isAvailable: true
  },
  {
    id: "pointsbet",
    name: "PointsBet",
    logo: SPORTSBOOK_LOGOS.pointsbet,
    isAvailable: true
  }
];

/**
 * Formats American odds from decimal odds
 */
export function formatAmericanOdds(decimalOdds: number): string {
  if (decimalOdds >= 2) {
    return `+${Math.round((decimalOdds - 1) * 100)}`;
  } else {
    return `-${Math.round(100 / (decimalOdds - 1))}`;
  }
}

/**
 * Converts American odds to decimal odds
 */
export function americanToDecimalOdds(americanOdds: number): number {
  if (americanOdds >= 100) {
    return 1 + (americanOdds / 100);
  } else {
    return 1 + (100 / Math.abs(americanOdds));
  }
}

/**
 * Calculates implied probability from decimal odds
 */
export function calculateImpliedProbability(decimalOdds: number): number {
  return 1 / decimalOdds;
}

/**
 * Identifies if there's an arbitrage opportunity between bookmakers
 */
export function identifyArbitrageOpportunity(match: Match): boolean {
  if (!match.liveOdds || match.liveOdds.length < 2) return false;
  
  const bestHomeOdds = Math.max(...match.liveOdds.map(o => o.homeWin));
  const bestAwayOdds = Math.max(...match.liveOdds.map(o => o.awayWin));
  
  const homeProbability = 1 / bestHomeOdds;
  const awayProbability = 1 / bestAwayOdds;
  
  // If draw is available
  if (match.liveOdds[0].draw !== undefined) {
    const bestDrawOdds = Math.max(...match.liveOdds
      .filter(o => o.draw !== undefined)
      .map(o => o.draw as number));
    
    const drawProbability = 1 / bestDrawOdds;
    const totalProbability = homeProbability + awayProbability + drawProbability;
    
    return totalProbability < 1; // Arbitrage opportunity exists if total probability is less than 1
  }
  
  // Without draw
  const totalProbability = homeProbability + awayProbability;
  return totalProbability < 1;
}

/**
 * Calculate optimal arbitrage betting strategy
 */
export function calculateArbitrageStrategy(match: Match) {
  if (!match.liveOdds || match.liveOdds.length < 2) return null;
  
  // Find best odds for each outcome
  const bestHomeOdds = {
    value: Math.max(...match.liveOdds.map(o => o.homeWin)),
    sportsbook: match.liveOdds.reduce((prev, current) => 
      current.homeWin > prev.homeWin ? current : prev
    ).sportsbook
  };
  
  const bestAwayOdds = {
    value: Math.max(...match.liveOdds.map(o => o.awayWin)),
    sportsbook: match.liveOdds.reduce((prev, current) => 
      current.awayWin > prev.awayWin ? current : prev
    ).sportsbook
  };
  
  let bestDrawOdds;
  if (match.liveOdds[0].draw !== undefined) {
    bestDrawOdds = {
      value: Math.max(...match.liveOdds
        .filter(o => o.draw !== undefined)
        .map(o => o.draw as number)),
      sportsbook: match.liveOdds
        .filter(o => o.draw !== undefined)
        .reduce((prev, current) => 
          (current.draw as number) > (prev.draw as number) ? current : prev
        ).sportsbook
    };
  }
  
  // Calculate implied probabilities
  const homeProbability = 1 / bestHomeOdds.value;
  const awayProbability = 1 / bestAwayOdds.value;
  const drawProbability = bestDrawOdds ? 1 / bestDrawOdds.value : 0;
  
  const totalProbability = homeProbability + awayProbability + (bestDrawOdds ? drawProbability : 0);
  
  // Check if arbitrage exists
  if (totalProbability >= 1) {
    return null; // No arbitrage opportunity
  }
  
  // Calculate optimal stakes (for $100 total investment)
  const homeStake = (homeProbability / totalProbability) * 100;
  const awayStake = (awayProbability / totalProbability) * 100;
  const drawStake = bestDrawOdds ? (drawProbability / totalProbability) * 100 : 0;
  
  // Calculate guaranteed profit
  const guaranteedProfitPercentage = ((1 / totalProbability) - 1) * 100;
  
  return {
    isArbitrage: true,
    totalProbability,
    profitPercentage: guaranteedProfitPercentage,
    stakes: [
      {
        outcome: 'home',
        team: match.homeTeam.name,
        sportsbook: bestHomeOdds.sportsbook.name,
        odds: bestHomeOdds.value,
        stake: homeStake,
        return: homeStake * bestHomeOdds.value
      },
      {
        outcome: 'away',
        team: match.awayTeam.name,
        sportsbook: bestAwayOdds.sportsbook.name,
        odds: bestAwayOdds.value,
        stake: awayStake,
        return: awayStake * bestAwayOdds.value
      },
      ...(bestDrawOdds ? [{
        outcome: 'draw',
        team: 'Draw',
        sportsbook: bestDrawOdds.sportsbook.name,
        odds: bestDrawOdds.value,
        stake: drawStake,
        return: drawStake * bestDrawOdds.value
      }] : [])
    ]
  };
}

/**
 * Analyze line movement trends across sportsbooks
 */
export function analyzeLineMovements(match: Match) {
  if (!match.liveOdds || match.liveOdds.length < 2) return null;
  
  try {
    // Sort odds by timestamp
    const sortedOdds = [...match.liveOdds].sort((a, b) => 
      new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    );
    
    const firstOdds = sortedOdds[0];
    const latestOdds = sortedOdds[sortedOdds.length - 1];
    
    // Calculate line movements
    const homeMovement = latestOdds.homeWin - firstOdds.homeWin;
    const awayMovement = latestOdds.awayWin - firstOdds.awayWin;
    
    // Calculate draw movement if it exists
    let drawMovement = 0;
    if (firstOdds.draw !== undefined && latestOdds.draw !== undefined) {
      drawMovement = latestOdds.draw - firstOdds.draw;
    }
    
    // Determine if there's significant movement (more than 5% change)
    const isSignificantHome = Math.abs(homeMovement / firstOdds.homeWin) > 0.05;
    const isSignificantAway = Math.abs(awayMovement / firstOdds.awayWin) > 0.05;
    const isSignificantDraw = firstOdds.draw !== undefined && 
      Math.abs(drawMovement / firstOdds.draw) > 0.05;
    
    return {
      homeMovement: {
        absolute: homeMovement,
        percentage: (homeMovement / firstOdds.homeWin) * 100,
        direction: homeMovement > 0 ? 'increasing' : homeMovement < 0 ? 'decreasing' : 'stable',
        isSignificant: isSignificantHome
      },
      awayMovement: {
        absolute: awayMovement,
        percentage: (awayMovement / firstOdds.awayWin) * 100,
        direction: awayMovement > 0 ? 'increasing' : awayMovement < 0 ? 'decreasing' : 'stable',
        isSignificant: isSignificantAway
      },
      ...(firstOdds.draw !== undefined ? {
        drawMovement: {
          absolute: drawMovement,
          percentage: (drawMovement / (firstOdds.draw as number)) * 100,
          direction: drawMovement > 0 ? 'increasing' : drawMovement < 0 ? 'decreasing' : 'stable',
          isSignificant: isSignificantDraw
        }
      } : {}),
      timeframe: {
        start: firstOdds.updatedAt,
        end: latestOdds.updatedAt,
        durationMs: new Date(latestOdds.updatedAt).getTime() - new Date(firstOdds.updatedAt).getTime()
      }
    };
  } catch (error) {
    console.error("Error analyzing line movements:", error);
    return null;
  }
}
