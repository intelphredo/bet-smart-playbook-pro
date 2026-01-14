
import { Match, League } from '@/types/sports';
import { InjuryLineImpact, TeamInjuryImpact, InjuredPlayer, InjuryStatus } from '@/types/injuries';
import { SportradarInjury } from '@/types/sportradar';
import { 
  getPositionWeight, 
  getStatusMultiplier, 
  SPORT_POSITION_WEIGHTS 
} from './positionImpactWeights';

// Convert Sportradar injury to our internal format
function mapToInjuredPlayer(injury: SportradarInjury, teamId: string, teamName: string): InjuredPlayer {
  return {
    playerId: injury.playerId,
    playerName: injury.playerName,
    position: injury.position || 'Unknown',
    team: teamName,
    teamId,
    status: mapInjuryStatus(injury.status),
    injuryType: injury.injuryType || 'Undisclosed',
    description: injury.description,
    expectedReturn: injury.expectedReturn,
  };
}

function mapInjuryStatus(status: string): InjuryStatus {
  const normalized = status.toLowerCase().replace(/[_\s]/g, '-');
  if (['out', 'injured-reserve', 'ir'].includes(normalized)) return 'out';
  if (['doubtful'].includes(normalized)) return 'doubtful';
  if (['questionable'].includes(normalized)) return 'questionable';
  if (['probable', 'likely'].includes(normalized)) return 'probable';
  if (['day-to-day', 'dtd'].includes(normalized)) return 'day-to-day';
  return 'questionable'; // Default
}

// Calculate team injury impact
function calculateTeamImpact(
  injuries: SportradarInjury[],
  teamId: string,
  teamName: string,
  league: League
): TeamInjuryImpact {
  const sportConfig = SPORT_POSITION_WEIGHTS[league];
  let totalOffensiveImpact = 0;
  let totalDefensiveImpact = 0;
  let totalPointsImpact = 0;
  const keyPlayersOut: InjuredPlayer[] = [];
  
  injuries.forEach(injury => {
    const positionWeight = getPositionWeight(league, injury.position || 'Unknown');
    const statusMultiplier = getStatusMultiplier(injury.status);
    
    // Calculate weighted impact
    const offImpact = positionWeight.offensiveWeight * statusMultiplier * 100;
    const defImpact = positionWeight.defensiveWeight * statusMultiplier * 100;
    const pointsImpact = positionWeight.basePointsImpact * statusMultiplier;
    
    totalOffensiveImpact += offImpact;
    totalDefensiveImpact += defImpact;
    totalPointsImpact += pointsImpact;
    
    // Track key players (high impact or OUT status)
    if (statusMultiplier >= 0.75 || positionWeight.basePointsImpact >= 3) {
      keyPlayersOut.push(mapToInjuredPlayer(injury, teamId, teamName));
    }
  });
  
  // Normalize impacts to 0-100 scale (cap at 100)
  const normalizedOffensive = Math.min(totalOffensiveImpact, 100);
  const normalizedDefensive = Math.min(totalDefensiveImpact, 100);
  
  // Overall impact is weighted average (offense matters slightly more for scoring)
  const overallImpact = (normalizedOffensive * 0.55 + normalizedDefensive * 0.45);
  
  // Calculate adjusted points per game
  const adjustedPPG = Math.max(
    sportConfig.averagePointsPerGame - totalPointsImpact,
    sportConfig.averagePointsPerGame * 0.5 // Floor at 50% of average
  );
  
  return {
    teamId,
    teamName,
    offensiveImpact: Math.round(normalizedOffensive * 10) / 10,
    defensiveImpact: Math.round(normalizedDefensive * 10) / 10,
    overallImpact: Math.round(overallImpact * 10) / 10,
    adjustedPointsPerGame: Math.round(adjustedPPG * 10) / 10,
    keyPlayersOut,
    totalPlayersAffected: injuries.length,
  };
}

// Main function to calculate injury line impact
export function calculateInjuryLineImpact(
  match: Match,
  homeInjuries: SportradarInjury[],
  awayInjuries: SportradarInjury[]
): InjuryLineImpact {
  const league = match.league;
  const sportConfig = SPORT_POSITION_WEIGHTS[league];
  
  // Calculate team-specific impacts
  const homeTeamImpact = calculateTeamImpact(
    homeInjuries,
    match.homeTeam.id,
    match.homeTeam.name,
    league
  );
  
  const awayTeamImpact = calculateTeamImpact(
    awayInjuries,
    match.awayTeam.id,
    match.awayTeam.name,
    league
  );
  
  // Calculate net advantage (positive = home team healthier)
  const netAdvantage = awayTeamImpact.overallImpact - homeTeamImpact.overallImpact;
  
  // Calculate spread adjustment
  // Higher impact on opponent = spread moves in your favor
  const spreadAdjustment = calculateSpreadAdjustment(
    homeTeamImpact,
    awayTeamImpact,
    league
  );
  
  // Calculate total adjustment (affects over/under)
  const totalAdjustment = calculateTotalAdjustment(
    homeTeamImpact,
    awayTeamImpact,
    sportConfig.averagePointsPerGame
  );
  
  // Calculate moneyline shift
  const moneylineShift = calculateMoneylineShift(netAdvantage, league);
  
  // Determine advantage team
  let advantageTeam: 'home' | 'away' | 'even' = 'even';
  if (netAdvantage > 5) advantageTeam = 'home';
  else if (netAdvantage < -5) advantageTeam = 'away';
  
  // Calculate confidence level
  const totalInjuries = homeInjuries.length + awayInjuries.length;
  let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';
  if (totalInjuries >= 5) confidenceLevel = 'high';
  else if (totalInjuries <= 1) confidenceLevel = 'low';
  
  // Combine key players
  const keyPlayersAffected = [
    ...homeTeamImpact.keyPlayersOut,
    ...awayTeamImpact.keyPlayersOut,
  ];
  
  // Generate summary
  const impactSummary = generateImpactSummary(
    homeTeamImpact,
    awayTeamImpact,
    spreadAdjustment,
    match
  );
  
  // Detect value opportunity
  const valueOpportunity = detectValueOpportunity(
    spreadAdjustment,
    totalAdjustment,
    moneylineShift,
    match
  );
  
  return {
    matchId: match.id,
    league,
    spreadAdjustment: Math.round(spreadAdjustment * 10) / 10,
    totalAdjustment: Math.round(totalAdjustment * 10) / 10,
    moneylineShift: Math.round(moneylineShift),
    homeTeamImpact,
    awayTeamImpact,
    netAdvantage: Math.round(netAdvantage * 10) / 10,
    advantageTeam,
    confidenceLevel,
    lastUpdated: new Date().toISOString(),
    keyPlayersAffected,
    impactSummary,
    marketAdjusted: false, // Would need historical line data to determine
    valueOpportunity,
  };
}

function calculateSpreadAdjustment(
  homeImpact: TeamInjuryImpact,
  awayImpact: TeamInjuryImpact,
  league: League
): number {
  // Impact differential translates to spread points
  const impactDiff = awayImpact.overallImpact - homeImpact.overallImpact;
  
  // Different sports have different point scales
  const multipliers: Partial<Record<League, number>> = {
    NBA: 0.15,    // 1 point per 6.67 impact
    NFL: 0.1,     // 1 point per 10 impact
    NHL: 0.02,    // 0.5 goals per 25 impact
    MLB: 0.03,    // 0.3 runs per 10 impact
    SOCCER: 0.01, // 0.1 goals per 10 impact
    EPL: 0.01,
    LA_LIGA: 0.01,
    SERIE_A: 0.01,
    BUNDESLIGA: 0.01,
    LIGUE_1: 0.01,
    MLS: 0.01,
    CHAMPIONS_LEAGUE: 0.01,
    NCAAF: 0.12,
    NCAAB: 0.12,
    WNBA: 0.12,
    CFL: 0.1,
  };
  
  return impactDiff * (multipliers[league] || 0.1);
}

function calculateTotalAdjustment(
  homeImpact: TeamInjuryImpact,
  awayImpact: TeamInjuryImpact,
  averagePPG: number
): number {
  // Combined offensive impact reduces total scoring
  const combinedOffensiveImpact = 
    (homeImpact.offensiveImpact + awayImpact.offensiveImpact) / 2;
  
  // Each 10% offensive impact reduces total by ~2-3% of average PPG
  const reductionPercent = combinedOffensiveImpact * 0.025;
  
  return -(averagePPG * 2 * reductionPercent);
}

function calculateMoneylineShift(netAdvantage: number, league: League): number {
  // Net advantage of 10 = roughly 10-15 point moneyline shift
  const baseShift = netAdvantage * 1.2;
  
  // Cap the shift at reasonable levels
  return Math.max(Math.min(baseShift, 50), -50);
}

function generateImpactSummary(
  homeImpact: TeamInjuryImpact,
  awayImpact: TeamInjuryImpact,
  spreadAdjustment: number,
  match: Match
): string {
  const parts: string[] = [];
  
  if (homeImpact.keyPlayersOut.length > 0) {
    const topPlayer = homeImpact.keyPlayersOut[0];
    parts.push(`${topPlayer.playerName} (${topPlayer.status.toUpperCase()}) impacts ${match.homeTeam.shortName}`);
  }
  
  if (awayImpact.keyPlayersOut.length > 0) {
    const topPlayer = awayImpact.keyPlayersOut[0];
    parts.push(`${topPlayer.playerName} (${topPlayer.status.toUpperCase()}) impacts ${match.awayTeam.shortName}`);
  }
  
  if (Math.abs(spreadAdjustment) >= 1) {
    const direction = spreadAdjustment > 0 ? match.homeTeam.shortName : match.awayTeam.shortName;
    parts.push(`Spread adjusted ${spreadAdjustment > 0 ? '+' : ''}${spreadAdjustment.toFixed(1)} toward ${direction}`);
  }
  
  return parts.length > 0 
    ? parts.join('. ') 
    : 'No significant injury impact detected';
}

function detectValueOpportunity(
  spreadAdjustment: number,
  totalAdjustment: number,
  moneylineShift: number,
  match: Match
): InjuryLineImpact['valueOpportunity'] | undefined {
  // Significant spread adjustment might indicate value
  if (Math.abs(spreadAdjustment) >= 2) {
    return {
      betType: 'spread',
      direction: spreadAdjustment > 0 ? 'home' : 'away',
      edgePercentage: Math.abs(spreadAdjustment) * 2,
      reasoning: `Injuries suggest ${Math.abs(spreadAdjustment).toFixed(1)} point edge on ${
        spreadAdjustment > 0 ? match.homeTeam.shortName : match.awayTeam.shortName
      } spread`,
    };
  }
  
  // Significant total adjustment
  if (Math.abs(totalAdjustment) >= 4) {
    return {
      betType: 'total',
      direction: totalAdjustment < 0 ? 'under' : 'over',
      edgePercentage: Math.abs(totalAdjustment) * 1.5,
      reasoning: `Injury-related scoring reduction suggests ${Math.abs(totalAdjustment).toFixed(1)} point under value`,
    };
  }
  
  return undefined;
}

// Helper to get injury severity color
export function getInjurySeverityColor(impact: number): string {
  if (impact >= 40) return 'text-destructive';
  if (impact >= 25) return 'text-orange-500';
  if (impact >= 10) return 'text-yellow-500';
  return 'text-muted-foreground';
}

// Helper to get injury severity label
export function getInjurySeverityLabel(impact: number): string {
  if (impact >= 40) return 'Severe';
  if (impact >= 25) return 'Significant';
  if (impact >= 10) return 'Moderate';
  if (impact > 0) return 'Minor';
  return 'None';
}
