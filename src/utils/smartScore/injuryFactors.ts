import { Match, League } from "@/types/sports";
import { SportLeague, SportradarInjury } from "@/types/sportradar";
import { fetchLeagueInjuries } from "@/services/sportradar/injuriesService";
import { 
  getPositionWeight, 
  getStatusMultiplier 
} from "@/utils/injuries/positionImpactWeights";

// Cache for injuries to avoid refetching
const injuryCache: Map<string, { data: SportradarInjury[]; timestamp: number }> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function mapToSportLeague(league: League): SportLeague {
  const mapping: Partial<Record<League, SportLeague>> = {
    'NBA': 'NBA',
    'NFL': 'NFL',
    'MLB': 'MLB',
    'NHL': 'NHL',
    'SOCCER': 'SOCCER',
    'EPL': 'SOCCER',
    'LA_LIGA': 'SOCCER',
    'SERIE_A': 'SOCCER',
    'BUNDESLIGA': 'SOCCER',
    'LIGUE_1': 'SOCCER',
    'MLS': 'SOCCER',
    'CHAMPIONS_LEAGUE': 'SOCCER',
    'NCAAF': 'NFL',
    'NCAAB': 'NBA',
    'WNBA': 'NBA',
    'CFL': 'NFL',
  };
  return mapping[league] || 'NBA';
}

async function getCachedInjuries(league: SportLeague): Promise<SportradarInjury[]> {
  const cached = injuryCache.get(league);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  try {
    const injuries = await fetchLeagueInjuries(league);
    injuryCache.set(league, { data: injuries, timestamp: Date.now() });
    return injuries;
  } catch (error) {
    console.error(`[InjuryFactors] Error fetching injuries:`, error);
    return cached?.data || [];
  }
}

function filterTeamInjuries(
  injuries: SportradarInjury[],
  teamName: string,
  teamShortName: string
): SportradarInjury[] {
  const normalizedTeamName = teamName.toLowerCase();
  const normalizedShortName = teamShortName.toLowerCase();
  
  return injuries.filter(injury => {
    const injuryTeam = (injury.team || '').toLowerCase();
    return (
      injuryTeam.includes(normalizedTeamName) ||
      injuryTeam.includes(normalizedShortName) ||
      normalizedTeamName.includes(injuryTeam)
    );
  });
}

function calculateTeamInjuryScore(
  injuries: SportradarInjury[],
  league: League
): { score: number; factors: string[] } {
  let totalImpact = 0;
  const factors: string[] = [];
  
  injuries.forEach(injury => {
    const positionWeight = getPositionWeight(league, injury.position || 'Unknown');
    const statusMultiplier = getStatusMultiplier(injury.status);
    
    const impact = positionWeight.basePointsImpact * statusMultiplier * 10;
    totalImpact += impact;
    
    // Add factor for significant injuries
    if (statusMultiplier >= 0.75) {
      factors.push(`${injury.playerName} (${injury.position}) - ${injury.status.toUpperCase()}`);
    }
  });
  
  // Convert impact to score (higher impact = lower score for betting confidence)
  // 0 impact = 100 score, 50+ impact = 25 score minimum
  const score = Math.max(25, 100 - (totalImpact * 1.5));
  
  return { score: Math.round(score), factors };
}

export function calculateInjuryImpact(match: Match): { injuriesScore: number; injuryFactors: string[] } {
  // Synchronous version for compatibility with existing SmartScore calculator
  // Uses mock/cached data patterns
  let injuriesScore = 75;
  const injuryFactors: string[] = [];
  
  // Check team records for losing streaks (proxy for potential injury impact)
  const homeRecord = match.homeTeam?.record || '';
  const awayRecord = match.awayTeam?.record || '';
  
  // Parse recent losses from record
  const homeLosses = (homeRecord.match(/L/g) || []).length;
  const awayLosses = (awayRecord.match(/L/g) || []).length;
  
  if (homeLosses >= 3 && match.homeTeam?.shortName) {
    injuriesScore -= 10;
    injuryFactors.push(`${match.homeTeam.shortName} on losing streak (possible injury impact)`);
  }
  
  if (awayLosses >= 3 && match.awayTeam?.shortName) {
    injuriesScore -= 10;
    injuryFactors.push(`${match.awayTeam.shortName} on losing streak (possible injury impact)`);
  }
  
  if (injuryFactors.length === 0) {
    injuryFactors.push("No major injuries reported");
  }
  
  return { injuriesScore, injuryFactors };
}

// Async version that uses real injury data
export async function calculateInjuryImpactAsync(match: Match): Promise<{ 
  injuriesScore: number; 
  injuryFactors: string[];
  homeInjuries: SportradarInjury[];
  awayInjuries: SportradarInjury[];
}> {
  const sportLeague = mapToSportLeague(match.league);
  const allInjuries = await getCachedInjuries(sportLeague);
  
  const homeInjuries = filterTeamInjuries(
    allInjuries,
    match.homeTeam.name,
    match.homeTeam.shortName
  );
  
  const awayInjuries = filterTeamInjuries(
    allInjuries,
    match.awayTeam.name,
    match.awayTeam.shortName
  );
  
  const homeImpact = calculateTeamInjuryScore(homeInjuries, match.league);
  const awayImpact = calculateTeamInjuryScore(awayInjuries, match.league);
  
  // Combined score (average of both teams' injury health)
  const injuriesScore = Math.round((homeImpact.score + awayImpact.score) / 2);
  
  // Combine factors
  const injuryFactors: string[] = [];
  
  if (homeImpact.factors.length > 0) {
    injuryFactors.push(`${match.homeTeam.shortName}: ${homeImpact.factors.slice(0, 2).join(', ')}`);
  }
  
  if (awayImpact.factors.length > 0) {
    injuryFactors.push(`${match.awayTeam.shortName}: ${awayImpact.factors.slice(0, 2).join(', ')}`);
  }
  
  if (injuryFactors.length === 0) {
    injuryFactors.push("Both teams at full strength");
  }
  
  return { 
    injuriesScore, 
    injuryFactors,
    homeInjuries,
    awayInjuries
  };
}
