
import { League } from './sports';

export type InjuryStatus = 'out' | 'doubtful' | 'questionable' | 'probable' | 'day-to-day' | 'healthy';

export interface InjuredPlayer {
  playerId: string;
  playerName: string;
  position: string;
  team: string;
  teamId: string;
  status: InjuryStatus;
  injuryType: string;
  description?: string;
  expectedReturn?: string;
  seasonStats?: {
    pointsPerGame?: number;
    assistsPerGame?: number;
    reboundsPerGame?: number;
    yardsPerGame?: number;
    touchdownsPerGame?: number;
    goalsPerGame?: number;
    savesPerGame?: number;
  };
}

export interface TeamInjuryImpact {
  teamId: string;
  teamName: string;
  offensiveImpact: number;       // 0-100 reduction in offensive capability
  defensiveImpact: number;       // 0-100 reduction in defensive capability
  overallImpact: number;         // Combined weighted score
  adjustedPointsPerGame: number; // Projected PPG with injuries
  keyPlayersOut: InjuredPlayer[];
  totalPlayersAffected: number;
}

export interface InjuryLineImpact {
  matchId: string;
  league: League;
  
  // Line adjustments
  spreadAdjustment: number;      // e.g., +3.5 points shift
  totalAdjustment: number;       // e.g., -8.5 points shift
  moneylineShift: number;        // e.g., +30 (home ML shifted by 30)
  
  // Team-specific impacts
  homeTeamImpact: TeamInjuryImpact;
  awayTeamImpact: TeamInjuryImpact;
  
  // Net advantage (positive = home team healthier)
  netAdvantage: number;
  advantageTeam: 'home' | 'away' | 'even';
  
  // Confidence and metadata
  confidenceLevel: 'high' | 'medium' | 'low';
  lastUpdated: string;
  
  // Key insights
  keyPlayersAffected: InjuredPlayer[];
  impactSummary: string;
  
  // Value detection
  marketAdjusted: boolean;      // Has market already adjusted for injuries?
  valueOpportunity?: {
    betType: 'spread' | 'total' | 'moneyline';
    direction: 'home' | 'away' | 'over' | 'under';
    edgePercentage: number;
    reasoning: string;
  };
}

export interface PositionWeight {
  position: string;
  offensiveWeight: number;  // 0-1, how much this position affects offense
  defensiveWeight: number;  // 0-1, how much this position affects defense
  basePointsImpact: number; // Base points per game impact when out
}

export interface SportPositionWeights {
  league: League;
  positions: PositionWeight[];
  averagePointsPerGame: number;
  averagePointsAllowed: number;
}
