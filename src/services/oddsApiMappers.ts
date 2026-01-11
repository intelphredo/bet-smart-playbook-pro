import { League, Match, Team, LiveOdds, Sportsbook } from "@/types/sports";
import { getTeamLogoUrl, getSportsbookLogo, getTeamAbbreviation as getTeamAbbr } from "@/utils/teamLogos";

export const mapOddsApiToMatch = (oddsData: any[], scoresData: any[], league: League): Match[] => {
  try {
    // First, create a map of scores by event ID for easy lookup
    const scoresMap = new Map();
    scoresData.forEach(score => {
      scoresMap.set(score.id, score);
    });
    
    return oddsData.map(event => {
      // Get team information with real logos
      const homeTeam: Team = {
        id: `odds-api-${event.home_team.replace(/\s/g, '-').toLowerCase()}`,
        name: event.home_team,
        shortName: getTeamAbbr(event.home_team, league).toUpperCase(),
        logo: getTeamLogoUrl(event.home_team, league),
      };
      
      const awayTeam: Team = {
        id: `odds-api-${event.away_team.replace(/\s/g, '-').toLowerCase()}`,
        name: event.away_team,
        shortName: getTeamAbbr(event.away_team, league).toUpperCase(),
        logo: getTeamLogoUrl(event.away_team, league),
      };
      
      // Get odds information from the first bookmaker (if available)
      const h2hMarket = event.bookmakers?.[0]?.markets.find(m => m.key === 'h2h');
      let homeOdds = 0;
      let awayOdds = 0;
      let drawOdds = undefined;
      
      if (h2hMarket) {
        homeOdds = parseFloat(h2hMarket.outcomes.find(o => o.name === event.home_team)?.price || 0);
        awayOdds = parseFloat(h2hMarket.outcomes.find(o => o.name === event.away_team)?.price || 0);
        
        // For soccer, get draw odds
        if (league === 'SOCCER') {
          const drawOutcome = h2hMarket.outcomes.find(o => o.name === 'Draw');
          if (drawOutcome) {
            drawOdds = parseFloat(drawOutcome.price || 0);
          }
        }
      }
      
      // Get all bookmakers for live odds comparison with real logos
      const liveOdds: LiveOdds[] = event.bookmakers?.map(bookmaker => {
        const h2h = bookmaker.markets.find(m => m.key === 'h2h');
        const homeWin = parseFloat(h2h?.outcomes.find(o => o.name === event.home_team)?.price || 0);
        const awayWin = parseFloat(h2h?.outcomes.find(o => o.name === event.away_team)?.price || 0);
        const draw = league === 'SOCCER' ? 
          parseFloat(h2h?.outcomes.find(o => o.name === 'Draw')?.price || 0) : 
          undefined;
        
        const sportsbook: Sportsbook = {
          id: bookmaker.key,
          name: bookmaker.title,
          logo: getSportsbookLogo(bookmaker.key),
          isAvailable: true
        };
        
        return {
          homeWin,
          awayWin,
          draw,
          updatedAt: new Date().toISOString(),
          sportsbook
        };
      }) || [];
      
      // Create basic match object
      const match: Match = {
        id: event.id,
        league,
        homeTeam,
        awayTeam,
        startTime: event.commence_time,
        odds: {
          homeWin: homeOdds,
          awayWin: awayOdds,
          draw: drawOdds
        },
        liveOdds: liveOdds.length > 0 ? liveOdds : undefined,
        status: getEventStatus(event),
        prediction: {
          recommended: getRecommendedBet(homeOdds, awayOdds, drawOdds),
          confidence: calculateConfidence(homeOdds, awayOdds, drawOdds),
          projectedScore: {
            home: 0, // Would need a more sophisticated algorithm
            away: 0  // Would need a more sophisticated algorithm
          }
        }
      };
      
      // Add score if available from scores data
      const scoreData = scoresMap.get(event.id);
      if (scoreData && (scoreData.scores || scoreData.score)) {
        match.score = {
          home: parseInt(scoreData.scores?.[0]?.score || scoreData.home_score || 0),
          away: parseInt(scoreData.scores?.[1]?.score || scoreData.away_score || 0),
          period: scoreData.time || scoreData.status || ''
        };
      }
      
      return match;
    });
  } catch (error) {
    console.error(`Error mapping OddsAPI data for ${league}:`, error);
    return [];
  }
};

// Helper to get an abbreviation for a team name
function getTeamAbbreviation(teamName: string): string {
  // This is a simplified version - a real implementation would have a lookup table
  const words = teamName.split(' ');
  
  if (words.length === 1) {
    return teamName.substring(0, 3).toUpperCase();
  }
  
  if (words.length === 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  
  // For 3+ word team names, use first letters
  return words.slice(0, 3).map(word => word[0]).join('').toUpperCase();
}

// Helper to determine event status
function getEventStatus(event: any): 'scheduled' | 'pre' | 'live' | 'finished' {
  if (event.completed) return 'finished';
  if (event.live) return 'live';
  
  const commenceTime = new Date(event.commence_time);
  const now = new Date();
  const hoursBefore = (commenceTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursBefore < 1) return 'pre';
  return 'scheduled';
}

// Simple recommendation based on odds
function getRecommendedBet(homeOdds: number, awayOdds: number, drawOdds?: number): 'home' | 'away' | 'draw' {
  if (!homeOdds || !awayOdds) return 'home';
  
  // For soccer with draw option
  if (drawOdds) {
    const values = [
      { type: 'home', odds: homeOdds },
      { type: 'away', odds: awayOdds },
      { type: 'draw', odds: drawOdds }
    ];
    
    // Find the lowest odds (highest probability)
    const lowestOdds = values.sort((a, b) => a.odds - b.odds)[0];
    return lowestOdds.type as 'home' | 'away' | 'draw';
  }
  
  // For sports without draw option
  return homeOdds <= awayOdds ? 'home' : 'away';
}

// Simple confidence calculation based on odds difference
function calculateConfidence(homeOdds: number, awayOdds: number, drawOdds?: number): number {
  if (!homeOdds || !awayOdds) return 50;
  
  let totalImpliedProb = 0;
  let impliedProbabilities = {};
  
  // Calculate implied probabilities
  if (homeOdds > 0) {
    impliedProbabilities['home'] = 1 / homeOdds;
    totalImpliedProb += impliedProbabilities['home'];
  }
  
  if (awayOdds > 0) {
    impliedProbabilities['away'] = 1 / awayOdds;
    totalImpliedProb += impliedProbabilities['away'];
  }
  
  if (drawOdds && drawOdds > 0) {
    impliedProbabilities['draw'] = 1 / drawOdds;
    totalImpliedProb += impliedProbabilities['draw'];
  }
  
  // Get recommendation
  const recommendation = getRecommendedBet(homeOdds, awayOdds, drawOdds);
  
  // Calculate normalized probability for recommendation
  const recommendationProb = impliedProbabilities[recommendation] / totalImpliedProb;
  
  // Convert to percentage and add some random variance
  return Math.round(recommendationProb * 100);
}
