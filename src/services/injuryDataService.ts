/**
 * Injury Data Service
 * 
 * Fetches and caches real injury data from ESPN for use in predictions.
 * Provides utilities for calculating injury impact on match outcomes.
 */

import { League, Team } from "@/types/sports";
import { InjuryStatus } from "@/types/injuries";

export interface PlayerInjury {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  teamId: string;
  status: InjuryStatus;
  injuryType: string;
  description: string;
  impactScore: number; // 0-100 based on player importance
  updatedAt: string;
}

export interface TeamInjuryReport {
  teamName: string;
  teamId: string;
  injuries: PlayerInjury[];
  totalImpactScore: number;
  keyPlayersOut: string[];
  keyPlayersQuestionable: string[];
}

export interface MatchInjuryData {
  homeTeam: TeamInjuryReport;
  awayTeam: TeamInjuryReport;
  impactDifferential: number; // Positive = away team more injured (favors home)
  summary: string;
}

// Cache for injury data
const injuryCache = new Map<string, { data: TeamInjuryReport; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Position importance weights for calculating impact
const positionImportance: Record<string, Record<string, number>> = {
  NBA: {
    PG: 90, SG: 75, SF: 70, PF: 75, C: 80,
    G: 80, F: 70, default: 60
  },
  NFL: {
    QB: 100, RB: 75, WR: 70, TE: 60, OL: 50, OT: 55, OG: 45, C: 50,
    DE: 70, DT: 65, LB: 70, CB: 75, S: 65, K: 40, P: 30,
    default: 50
  },
  MLB: {
    SP: 95, RP: 60, CP: 70, C: 75, '1B': 65, '2B': 70, SS: 80, '3B': 70,
    LF: 60, CF: 70, RF: 65, DH: 55, OF: 65, default: 55
  },
  NHL: {
    G: 95, C: 85, LW: 70, RW: 70, D: 75, W: 70, default: 65
  },
  default: { default: 60 }
};

// Status severity weights
const statusSeverity: Record<InjuryStatus, number> = {
  'out': 100,
  'doubtful': 80,
  'questionable': 50,
  'probable': 20,
  'day-to-day': 40,
  'healthy': 0
};

/**
 * Get position importance score for a player
 */
function getPositionImportance(position: string, league: League): number {
  const leagueWeights = positionImportance[league] || positionImportance.default;
  const normalizedPos = position?.toUpperCase() || 'default';
  return leagueWeights[normalizedPos] || leagueWeights.default || 60;
}

/**
 * Calculate individual player impact score
 */
function calculatePlayerImpact(
  position: string,
  status: InjuryStatus,
  league: League
): number {
  const posImportance = getPositionImportance(position, league);
  const severity = statusSeverity[status] || 50;
  return Math.round((posImportance * severity) / 100);
}

/**
 * Fetch team injuries from ESPN
 */
async function fetchTeamInjuriesFromESPN(
  league: League,
  teamName: string
): Promise<PlayerInjury[]> {
  const sportPath = getESPNSportPath(league);
  if (!sportPath) return [];

  try {
    // Search for team
    const teamsUrl = `https://site.api.espn.com/apis/site/v2/sports/${sportPath.sport}/${sportPath.leaguePath}/teams`;
    const teamsResponse = await fetch(teamsUrl);
    if (!teamsResponse.ok) return [];

    const teamsData = await teamsResponse.json();
    const teams = teamsData.sports?.[0]?.leagues?.[0]?.teams || [];

    // Find matching team
    const normalizedSearch = teamName.toLowerCase();
    const matchingTeam = teams.find((t: any) => {
      const team = t.team;
      return (
        team?.displayName?.toLowerCase().includes(normalizedSearch) ||
        team?.name?.toLowerCase().includes(normalizedSearch) ||
        team?.shortDisplayName?.toLowerCase().includes(normalizedSearch) ||
        team?.abbreviation?.toLowerCase() === normalizedSearch
      );
    });

    if (!matchingTeam?.team?.id) return [];

    // Fetch roster with injury data
    const rosterUrl = `https://site.api.espn.com/apis/site/v2/sports/${sportPath.sport}/${sportPath.leaguePath}/teams/${matchingTeam.team.id}/roster`;
    const rosterResponse = await fetch(rosterUrl);
    if (!rosterResponse.ok) return [];

    const rosterData = await rosterResponse.json();
    const injuries: PlayerInjury[] = [];

    // Process athletes
    const athletes = rosterData.athletes || [];
    athletes.forEach((group: any) => {
      const items = group.items || [];
      items.forEach((player: any) => {
        if (player.injuries && player.injuries.length > 0) {
          player.injuries.forEach((injury: any) => {
            const status = mapESPNStatus(injury.status || injury.type?.abbreviation);
            const position = player.position?.abbreviation || player.position?.name || '';
            
            injuries.push({
              playerId: player.id,
              playerName: player.fullName || player.displayName,
              position,
              team: rosterData.team?.displayName || teamName,
              teamId: rosterData.team?.id || matchingTeam.team.id,
              status,
              injuryType: injury.type?.name || injury.details?.type || 'Undisclosed',
              description: injury.details?.detail || injury.longComment || injury.shortComment || '',
              impactScore: calculatePlayerImpact(position, status, league),
              updatedAt: injury.date || new Date().toISOString(),
            });
          });
        }
      });
    });

    return injuries;
  } catch (error) {
    console.error(`Error fetching injuries for ${teamName}:`, error);
    return [];
  }
}

/**
 * Get ESPN sport path mapping
 */
function getESPNSportPath(league: League): { sport: string; leaguePath: string } | null {
  const mapping: Partial<Record<League, { sport: string; leaguePath: string }>> = {
    NBA: { sport: 'basketball', leaguePath: 'nba' },
    NFL: { sport: 'football', leaguePath: 'nfl' },
    MLB: { sport: 'baseball', leaguePath: 'mlb' },
    NHL: { sport: 'hockey', leaguePath: 'nhl' },
    NCAAB: { sport: 'basketball', leaguePath: 'mens-college-basketball' },
    NCAAF: { sport: 'football', leaguePath: 'college-football' },
    WNBA: { sport: 'basketball', leaguePath: 'wnba' },
  };
  return mapping[league] || null;
}

/**
 * Map ESPN status to our InjuryStatus type
 */
function mapESPNStatus(status: string): InjuryStatus {
  const statusLower = status?.toLowerCase() || '';
  
  if (statusLower.includes('out') || statusLower === 'o' || statusLower.includes('injured reserve') || statusLower === 'ir') return 'out';
  if (statusLower.includes('doubtful') || statusLower === 'd') return 'doubtful';
  if (statusLower.includes('questionable') || statusLower === 'q') return 'questionable';
  if (statusLower.includes('probable') || statusLower === 'p') return 'probable';
  if (statusLower.includes('day-to-day') || statusLower.includes('day to day') || statusLower === 'dtd') return 'day-to-day';
  
  return 'questionable';
}

/**
 * Get team injury report with caching
 */
export async function getTeamInjuryReport(
  league: League,
  teamName: string
): Promise<TeamInjuryReport> {
  const cacheKey = `${league}-${teamName.toLowerCase()}`;
  const cached = injuryCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const injuries = await fetchTeamInjuriesFromESPN(league, teamName);
  
  const report: TeamInjuryReport = {
    teamName,
    teamId: injuries[0]?.teamId || '',
    injuries,
    totalImpactScore: injuries.reduce((sum, inj) => sum + inj.impactScore, 0),
    keyPlayersOut: injuries
      .filter(i => i.status === 'out')
      .map(i => `${i.playerName} (${i.position})`),
    keyPlayersQuestionable: injuries
      .filter(i => i.status === 'questionable' || i.status === 'doubtful')
      .map(i => `${i.playerName} (${i.position})`),
  };

  injuryCache.set(cacheKey, { data: report, timestamp: Date.now() });
  return report;
}

/**
 * Get injury data for a match
 */
export async function getMatchInjuryData(
  league: League,
  homeTeamName: string,
  awayTeamName: string
): Promise<MatchInjuryData> {
  const [homeReport, awayReport] = await Promise.all([
    getTeamInjuryReport(league, homeTeamName),
    getTeamInjuryReport(league, awayTeamName),
  ]);

  const impactDifferential = awayReport.totalImpactScore - homeReport.totalImpactScore;
  
  let summary = '';
  if (Math.abs(impactDifferential) < 20) {
    summary = 'Both teams have similar injury situations';
  } else if (impactDifferential > 50) {
    summary = `${awayTeamName} significantly impacted by injuries, major advantage for ${homeTeamName}`;
  } else if (impactDifferential > 0) {
    summary = `${awayTeamName} dealing with more injuries than ${homeTeamName}`;
  } else if (impactDifferential < -50) {
    summary = `${homeTeamName} significantly impacted by injuries, major advantage for ${awayTeamName}`;
  } else {
    summary = `${homeTeamName} dealing with more injuries than ${awayTeamName}`;
  }

  return {
    homeTeam: homeReport,
    awayTeam: awayReport,
    impactDifferential,
    summary,
  };
}

/**
 * Calculate injury impact score for predictions (0-15 scale)
 */
export function calculateInjuryImpactFromReport(report: TeamInjuryReport): number {
  // Scale from 0-500 total impact to 0-15
  return Math.min(15, Math.round(report.totalImpactScore / 35));
}

/**
 * Clear injury cache (useful for testing or manual refresh)
 */
export function clearInjuryCache(): void {
  injuryCache.clear();
}

/**
 * Get cache status
 */
export function getInjuryCacheStatus(): { size: number; keys: string[] } {
  return {
    size: injuryCache.size,
    keys: Array.from(injuryCache.keys()),
  };
}
