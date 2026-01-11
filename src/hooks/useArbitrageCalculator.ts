import { useMemo } from "react";
import { Match, ArbitrageOpportunity } from "@/types/sports";

interface OddsData {
  homeWin: number;
  awayWin: number;
  draw?: number;
}

interface BookmakerOdds {
  name: string;
  odds: OddsData;
}

/**
 * Calculate arbitrage percentage from odds
 * Lower percentage = better arbitrage opportunity
 * Under 100% = guaranteed profit opportunity
 */
function calculateArbitragePercentage(odds: OddsData[]): number {
  if (odds.length === 0) return 100;
  
  // Find best odds for each outcome across all bookmakers
  const bestHome = Math.max(...odds.map(o => o.homeWin).filter(Boolean));
  const bestAway = Math.max(...odds.map(o => o.awayWin).filter(Boolean));
  const hasDraw = odds.some(o => o.draw !== undefined);
  const bestDraw = hasDraw ? Math.max(...odds.map(o => o.draw || 0).filter(Boolean)) : 0;
  
  if (bestHome <= 0 || bestAway <= 0) return 100;
  
  // Arbitrage formula: sum of (1/best_odds) for each outcome
  let arbPercentage = (1 / bestHome) + (1 / bestAway);
  if (hasDraw && bestDraw > 0) {
    arbPercentage += (1 / bestDraw);
  }
  
  return arbPercentage * 100;
}

/**
 * Calculate optimal stake percentages for arbitrage
 */
function calculateStakePercentages(odds: OddsData, hasDraw: boolean): { home: number; away: number; draw?: number } {
  const totalImpliedProb = (1 / odds.homeWin) + (1 / odds.awayWin) + (hasDraw && odds.draw ? (1 / odds.draw) : 0);
  
  const homeStake = ((1 / odds.homeWin) / totalImpliedProb) * 100;
  const awayStake = ((1 / odds.awayWin) / totalImpliedProb) * 100;
  const drawStake = hasDraw && odds.draw ? ((1 / odds.draw) / totalImpliedProb) * 100 : undefined;
  
  return { home: homeStake, away: awayStake, draw: drawStake };
}

/**
 * Hook to calculate real arbitrage opportunities from live odds data
 */
export function useArbitrageCalculator(matches: Match[]) {
  const arbitrageOpportunities = useMemo(() => {
    const opportunities: ArbitrageOpportunity[] = [];
    
    for (const match of matches) {
      if (!match.liveOdds || match.liveOdds.length < 2) continue;
      
      // Extract odds from each sportsbook
      const bookmakerOdds: BookmakerOdds[] = match.liveOdds
        .filter(lo => lo.sportsbook && lo.homeWin && lo.awayWin)
        .map(lo => ({
          name: lo.sportsbook?.name || "Unknown",
          odds: {
            homeWin: lo.homeWin,
            awayWin: lo.awayWin,
            draw: lo.draw,
          },
        }));
      
      if (bookmakerOdds.length < 2) continue;
      
      // Calculate arbitrage percentage
      const allOdds = bookmakerOdds.map(b => b.odds);
      const arbPercentage = calculateArbitragePercentage(allOdds);
      
      // Only include if there's a potential arbitrage (under 100%) or near-arbitrage (under 102%)
      if (arbPercentage > 102) continue;
      
      const potentialProfit = 100 - arbPercentage;
      const hasDraw = allOdds.some(o => o.draw !== undefined);
      
      // Find best odds for each outcome
      const bestHome = bookmakerOdds.reduce((best, curr) => 
        curr.odds.homeWin > best.odds.homeWin ? curr : best
      );
      const bestAway = bookmakerOdds.reduce((best, curr) => 
        curr.odds.awayWin > best.odds.awayWin ? curr : best
      );
      const bestDraw = hasDraw 
        ? bookmakerOdds.reduce((best, curr) => 
            (curr.odds.draw || 0) > (best.odds.draw || 0) ? curr : best
          )
        : null;
      
      // Calculate stake percentages
      const bestOdds: OddsData = {
        homeWin: bestHome.odds.homeWin,
        awayWin: bestAway.odds.awayWin,
        draw: bestDraw?.odds.draw,
      };
      const stakes = calculateStakePercentages(bestOdds, hasDraw);
      
      const bettingStrategy: ArbitrageOpportunity["bettingStrategy"] = [
        {
          bookmaker: bestHome.name,
          team: "home",
          stakePercentage: stakes.home,
          odds: bestHome.odds.homeWin,
        },
        {
          bookmaker: bestAway.name,
          team: "away",
          stakePercentage: stakes.away,
          odds: bestAway.odds.awayWin,
        },
      ];
      
      if (hasDraw && bestDraw && stakes.draw) {
        bettingStrategy.push({
          bookmaker: bestDraw.name,
          team: "draw",
          stakePercentage: stakes.draw,
          odds: bestDraw.odds.draw!,
        });
      }
      
      opportunities.push({
        id: `arb-${match.id}`,
        matchId: match.id,
        match: {
          homeTeam: match.homeTeam.shortName || match.homeTeam.name,
          awayTeam: match.awayTeam.shortName || match.awayTeam.name,
          league: match.league,
          startTime: match.startTime,
        },
        bookmakers: bookmakerOdds.map(b => ({ name: b.name, odds: b.odds })),
        arbitragePercentage: arbPercentage,
        potentialProfit: Math.max(0, potentialProfit),
        bettingStrategy,
        isPremium: potentialProfit > 1.5, // Premium if profit > 1.5%
      });
    }
    
    // Sort by potential profit (highest first)
    return opportunities.sort((a, b) => b.potentialProfit - a.potentialProfit);
  }, [matches]);
  
  return {
    opportunities: arbitrageOpportunities,
    hasOpportunities: arbitrageOpportunities.length > 0,
    bestOpportunity: arbitrageOpportunities[0] || null,
  };
}
