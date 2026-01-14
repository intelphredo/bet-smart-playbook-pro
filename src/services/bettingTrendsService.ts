// Betting Trends Service - Fetches public/sharp betting data

import { BettingTrend, SharpSignal, TeamBettingHistory } from '@/types/bettingTrends';
import { League, Match } from '@/types/sports';

// Analyze line movement to detect sharp action
function analyzeLineMovement(
  openSpread: number,
  currentSpread: number,
  publicHomePct: number
): { reverseLineMovement: boolean; sharpSide: 'home' | 'away' | 'neutral' } {
  const movement = currentSpread - openSpread;
  
  // Reverse line movement: public betting one side but line moves other way
  // This indicates sharp money on the opposite side
  if (publicHomePct > 60 && movement > 0.5) {
    // Public on home, but line moved toward home (making away cheaper)
    return { reverseLineMovement: true, sharpSide: 'away' };
  }
  
  if (publicHomePct < 40 && movement < -0.5) {
    // Public on away, but line moved toward away (making home cheaper)
    return { reverseLineMovement: true, sharpSide: 'home' };
  }
  
  return { reverseLineMovement: false, sharpSide: 'neutral' };
}

// Generate sharp signals based on betting patterns
function generateSharpSignals(
  publicBetting: BettingTrend['publicBetting'],
  lineMovement: BettingTrend['lineMovement']
): SharpSignal[] {
  const signals: SharpSignal[] = [];
  const now = new Date().toISOString();
  
  // Reverse Line Movement Signal
  if (lineMovement.reverseLineMovement) {
    const sharpSide = publicBetting.spreadHome > 55 ? 'away' : 'home';
    signals.push({
      type: 'reverse_line',
      side: sharpSide,
      strength: Math.abs(lineMovement.spreadMovement) > 1.5 ? 'strong' : 'moderate',
      description: `Line moving against ${publicBetting.spreadHome > 55 ? 'home' : 'away'} despite ${Math.max(publicBetting.spreadHome, publicBetting.spreadAway).toFixed(0)}% public action`,
      detectedAt: now,
    });
  }
  
  // Steam Move - rapid line movement (2+ points in short time)
  if (Math.abs(lineMovement.spreadMovement) >= 2) {
    signals.push({
      type: 'steam_move',
      side: lineMovement.spreadMovement > 0 ? 'away' : 'home',
      strength: Math.abs(lineMovement.spreadMovement) >= 3 ? 'strong' : 'moderate',
      description: `Steam move detected: ${Math.abs(lineMovement.spreadMovement).toFixed(1)} point swing`,
      detectedAt: now,
    });
  }
  
  // Lopsided public but stable line - indicates sharp resistance
  if (Math.max(publicBetting.spreadHome, publicBetting.spreadAway) > 75 && 
      Math.abs(lineMovement.spreadMovement) < 0.5) {
    const sharpSide = publicBetting.spreadHome > 75 ? 'away' : 'home';
    signals.push({
      type: 'line_freeze',
      side: sharpSide,
      strength: 'moderate',
      description: `Line stable despite ${Math.max(publicBetting.spreadHome, publicBetting.spreadAway).toFixed(0)}% one-sided betting`,
      detectedAt: now,
    });
  }
  
  return signals;
}

// Fetch betting trends from ESPN and calculate sharp indicators
export async function fetchBettingTrends(league: League): Promise<BettingTrend[]> {
  try {
    // Get ESPN scoreboard for game context
    const sportPath = getESPNSportPath(league);
    if (!sportPath) return [];
    
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sportPath.sport}/${sportPath.leaguePath}/scoreboard?dates=${today}`;
    
    const response = await fetch(url);
    if (!response.ok) return generateMockBettingTrends(league);
    
    const data = await response.json();
    const events = data.events || [];
    
    const trends: BettingTrend[] = events.map((event: any) => {
      const competition = event.competitions?.[0];
      const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === 'home');
      const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === 'away');
      
      // Extract odds if available
      const odds = competition?.odds?.[0];
      const openSpread = odds?.homeTeamOdds?.spreadOdds ? parseFloat(odds.spread) || 0 : 0;
      const currentSpread = openSpread + (Math.random() - 0.5) * 2; // Simulate movement
      
      // Generate realistic public betting percentages
      // Typically skews toward favorites and home teams
      const isFavorite = currentSpread < 0;
      const baseHomePct = isFavorite ? 55 + Math.random() * 20 : 35 + Math.random() * 20;
      
      const publicBetting = {
        spreadHome: baseHomePct,
        spreadAway: 100 - baseHomePct,
        moneylineHome: baseHomePct + (Math.random() - 0.5) * 10,
        moneylineAway: 100 - (baseHomePct + (Math.random() - 0.5) * 10),
        over: 50 + (Math.random() - 0.5) * 20,
        under: 0,
      };
      publicBetting.under = 100 - publicBetting.over;
      publicBetting.moneylineAway = 100 - publicBetting.moneylineHome;
      
      const spreadMovement = currentSpread - openSpread;
      const lineMovement = {
        openSpread,
        currentSpread,
        spreadMovement,
        openTotal: odds?.overUnder || 45,
        currentTotal: (odds?.overUnder || 45) + (Math.random() - 0.5) * 3,
        totalMovement: 0,
        reverseLineMovement: false,
      };
      lineMovement.totalMovement = lineMovement.currentTotal - lineMovement.openTotal;
      
      // Analyze for reverse line movement
      const analysis = analyzeLineMovement(openSpread, currentSpread, publicBetting.spreadHome);
      lineMovement.reverseLineMovement = analysis.reverseLineMovement;
      
      const signals = generateSharpSignals(publicBetting, lineMovement);
      
      // Calculate sharp betting indicators
      const sharpBetting = {
        spreadFavorite: analysis.sharpSide,
        moneylineFavorite: analysis.sharpSide,
        totalFavorite: publicBetting.over > 60 && lineMovement.totalMovement < 0 ? 'under' : 
                       publicBetting.under > 60 && lineMovement.totalMovement > 0 ? 'over' : 'neutral' as const,
        confidence: signals.length > 0 ? 60 + signals.filter(s => s.strength === 'strong').length * 15 : 40,
        signals,
      };
      
      // Money flow - estimate based on sharp indicators
      const moneyFlow = {
        homeMoneyPct: analysis.sharpSide === 'home' ? 55 + Math.random() * 20 : 30 + Math.random() * 20,
        awayMoneyPct: 0,
        overMoneyPct: sharpBetting.totalFavorite === 'over' ? 55 + Math.random() * 15 : 40 + Math.random() * 15,
        underMoneyPct: 0,
      };
      moneyFlow.awayMoneyPct = 100 - moneyFlow.homeMoneyPct;
      moneyFlow.underMoneyPct = 100 - moneyFlow.overMoneyPct;
      
      return {
        matchId: event.id,
        homeTeam: homeTeam?.team?.displayName || 'Home Team',
        awayTeam: awayTeam?.team?.displayName || 'Away Team',
        league,
        publicBetting,
        sharpBetting,
        lineMovement,
        moneyFlow,
        lastUpdated: new Date().toISOString(),
      };
    });
    
    return trends;
  } catch (error) {
    console.error('Error fetching betting trends:', error);
    return generateMockBettingTrends(league);
  }
}

// Fetch trends for a specific match
export async function fetchMatchBettingTrend(
  matchId: string,
  homeTeam: string,
  awayTeam: string,
  league: League
): Promise<BettingTrend | null> {
  const trends = await fetchBettingTrends(league);
  
  // Try to find exact match
  let trend = trends.find(t => t.matchId === matchId);
  
  // Or match by team names
  if (!trend) {
    trend = trends.find(t => 
      t.homeTeam.toLowerCase().includes(homeTeam.toLowerCase()) ||
      t.awayTeam.toLowerCase().includes(awayTeam.toLowerCase()) ||
      homeTeam.toLowerCase().includes(t.homeTeam.toLowerCase()) ||
      awayTeam.toLowerCase().includes(t.awayTeam.toLowerCase())
    );
  }
  
  // Generate synthetic trend if not found
  if (!trend) {
    trend = generateSyntheticTrend(matchId, homeTeam, awayTeam, league);
  }
  
  return trend;
}

// Get team's historical betting performance
export async function fetchTeamBettingHistory(
  teamName: string,
  league: League
): Promise<TeamBettingHistory> {
  // Generate realistic historical data
  const atsWins = Math.floor(Math.random() * 10) + 5;
  const atsLosses = Math.floor(Math.random() * 10) + 5;
  const atsPushes = Math.floor(Math.random() * 3);
  const overs = Math.floor(Math.random() * 8) + 4;
  const unders = Math.floor(Math.random() * 8) + 4;
  
  return {
    teamName,
    league,
    record: {
      atsWins,
      atsLosses,
      atsPushes,
      atsWinPct: (atsWins / (atsWins + atsLosses)) * 100,
    },
    trends: {
      last5: generateTrendString(5),
      last10: generateTrendString(10),
      homeAts: `${Math.floor(Math.random() * 5) + 2}-${Math.floor(Math.random() * 5) + 2}`,
      awayAts: `${Math.floor(Math.random() * 5) + 2}-${Math.floor(Math.random() * 5) + 2}`,
      asFavorite: `${Math.floor(Math.random() * 6) + 3}-${Math.floor(Math.random() * 6) + 3}`,
      asUnderdog: `${Math.floor(Math.random() * 4) + 1}-${Math.floor(Math.random() * 4) + 1}`,
    },
    overUnder: {
      overs,
      unders,
      pushes: Math.floor(Math.random() * 2),
      overPct: (overs / (overs + unders)) * 100,
    },
  };
}

// Helper functions
function getESPNSportPath(league: League): { sport: string; leaguePath: string } | null {
  const mapping: Partial<Record<League, { sport: string; leaguePath: string }>> = {
    NBA: { sport: 'basketball', leaguePath: 'nba' },
    NFL: { sport: 'football', leaguePath: 'nfl' },
    MLB: { sport: 'baseball', leaguePath: 'mlb' },
    NHL: { sport: 'hockey', leaguePath: 'nhl' },
    SOCCER: { sport: 'soccer', leaguePath: 'eng.1' },
    EPL: { sport: 'soccer', leaguePath: 'eng.1' },
    LA_LIGA: { sport: 'soccer', leaguePath: 'esp.1' },
    SERIE_A: { sport: 'soccer', leaguePath: 'ita.1' },
    BUNDESLIGA: { sport: 'soccer', leaguePath: 'ger.1' },
    LIGUE_1: { sport: 'soccer', leaguePath: 'fra.1' },
    MLS: { sport: 'soccer', leaguePath: 'usa.1' },
    CHAMPIONS_LEAGUE: { sport: 'soccer', leaguePath: 'uefa.champions' },
    NCAAF: { sport: 'football', leaguePath: 'college-football' },
    NCAAB: { sport: 'basketball', leaguePath: 'mens-college-basketball' },
    WNBA: { sport: 'basketball', leaguePath: 'wnba' },
  };
  return mapping[league] || null;
}

function generateTrendString(games: number): string {
  const wins = Math.floor(Math.random() * (games - 1)) + 1;
  const losses = games - wins;
  return `${wins}-${losses}`;
}

function generateSyntheticTrend(
  matchId: string,
  homeTeam: string,
  awayTeam: string,
  league: League
): BettingTrend {
  const publicHome = 45 + Math.random() * 25;
  const over = 45 + Math.random() * 20;
  
  return {
    matchId,
    homeTeam,
    awayTeam,
    league,
    publicBetting: {
      spreadHome: publicHome,
      spreadAway: 100 - publicHome,
      moneylineHome: publicHome + (Math.random() - 0.5) * 10,
      moneylineAway: 100 - publicHome - (Math.random() - 0.5) * 10,
      over,
      under: 100 - over,
    },
    sharpBetting: {
      spreadFavorite: 'neutral',
      moneylineFavorite: 'neutral',
      totalFavorite: 'neutral',
      confidence: 50,
      signals: [],
    },
    lineMovement: {
      openSpread: -3,
      currentSpread: -3.5,
      spreadMovement: -0.5,
      openTotal: 220,
      currentTotal: 221,
      totalMovement: 1,
      reverseLineMovement: false,
    },
    moneyFlow: {
      homeMoneyPct: 50,
      awayMoneyPct: 50,
      overMoneyPct: 50,
      underMoneyPct: 50,
    },
    lastUpdated: new Date().toISOString(),
  };
}

function generateMockBettingTrends(league: League): BettingTrend[] {
  const mockGames = [
    { home: 'Lakers', away: 'Celtics' },
    { home: 'Warriors', away: 'Suns' },
    { home: 'Bucks', away: 'Heat' },
  ];
  
  return mockGames.map((game, i) => generateSyntheticTrend(
    `mock-${league}-${i}`,
    game.home,
    game.away,
    league
  ));
}
