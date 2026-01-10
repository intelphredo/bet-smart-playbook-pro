// Comprehensive Sportradar API Types for All Sports

export type InjuryStatus = 'out' | 'doubtful' | 'questionable' | 'probable' | 'day-to-day' | 'out-for-season' | 'injured-reserve';
export type PracticeStatus = 'full' | 'limited' | 'did-not-participate';
export type PlayerStatus = 'active' | 'inactive' | 'suspended' | 'injured';
export type PlayoffPosition = 'clinched' | 'in' | 'wildcard' | 'out' | 'eliminated';
export type SportLeague = 'NBA' | 'NFL' | 'MLB' | 'NHL' | 'SOCCER';

// Core Injury Type
export interface SportradarInjury {
  id: string;
  playerId: string;
  playerName: string;
  team: string;
  teamId: string;
  position: string;
  status: InjuryStatus;
  description: string;
  injuryType: string;
  startDate: string;
  expectedReturn?: string;
  practice?: PracticeStatus;
  comment?: string;
  updatedAt: string;
}

// Standings
export interface SportradarStanding {
  teamId: string;
  teamName: string;
  market: string;
  alias: string;
  conference: string;
  division: string;
  wins: number;
  losses: number;
  ties?: number;
  winPct: number;
  gamesBack: number;
  streak: {
    kind: 'win' | 'loss';
    length: number;
  };
  homeRecord: string;
  awayRecord: string;
  last10: string;
  pointsFor: number;
  pointsAgainst: number;
  pointDiff: number;
  confRank: number;
  divRank: number;
  playoffPosition?: PlayoffPosition;
  clinched?: boolean;
}

// Player Core
export interface SportradarPlayer {
  id: string;
  name: string;
  fullName: string;
  firstName: string;
  lastName: string;
  position: string;
  primaryPosition?: string;
  jerseyNumber: string;
  teamId: string;
  teamName?: string;
  height: string;
  weight: string;
  birthDate: string;
  birthPlace?: string;
  college?: string;
  draftYear?: number;
  draftRound?: number;
  draftPick?: number;
  experience: number;
  status: PlayerStatus;
  injuryStatus?: InjuryStatus;
  photoUrl?: string;
}

// Player Statistics - Sport Agnostic Base
export interface SportradarPlayerStats {
  playerId: string;
  playerName: string;
  teamId: string;
  season: string;
  gamesPlayed: number;
  gamesStarted?: number;
  minutesPerGame?: number;
}

// NBA Specific Stats
export interface NBAPlayerStats extends SportradarPlayerStats {
  pointsPerGame: number;
  reboundsPerGame: number;
  assistsPerGame: number;
  stealsPerGame: number;
  blocksPerGame: number;
  turnoversPerGame: number;
  fieldGoalPct: number;
  threePointPct: number;
  freeThrowPct: number;
  plusMinus: number;
  playerEfficiencyRating?: number;
  trueShootingPct?: number;
  usageRate?: number;
}

// NFL Specific Stats
export interface NFLPlayerStats extends SportradarPlayerStats {
  // Passing
  passingYards?: number;
  passingTDs?: number;
  passingAttempts?: number;
  passingCompletions?: number;
  interceptions?: number;
  passerRating?: number;
  // Rushing
  rushingYards?: number;
  rushingTDs?: number;
  rushingAttempts?: number;
  yardsPerCarry?: number;
  // Receiving
  receivingYards?: number;
  receivingTDs?: number;
  receptions?: number;
  targets?: number;
  yardsPerReception?: number;
  // Defense
  tackles?: number;
  sacks?: number;
  forcedFumbles?: number;
  defensiveInterceptions?: number;
}

// MLB Specific Stats
export interface MLBPlayerStats extends SportradarPlayerStats {
  // Batting
  battingAverage?: number;
  onBasePercentage?: number;
  sluggingPercentage?: number;
  ops?: number;
  homeRuns?: number;
  rbi?: number;
  runs?: number;
  hits?: number;
  doubles?: number;
  triples?: number;
  stolenBases?: number;
  strikeouts?: number;
  walks?: number;
  // Pitching
  era?: number;
  wins?: number;
  losses?: number;
  saves?: number;
  inningsPitched?: number;
  pitchingStrikeouts?: number;
  whip?: number;
  battersFaced?: number;
}

// NHL Specific Stats
export interface NHLPlayerStats extends SportradarPlayerStats {
  goals: number;
  assists: number;
  points: number;
  plusMinus: number;
  penaltyMinutes: number;
  powerPlayGoals?: number;
  shortHandedGoals?: number;
  gameWinningGoals?: number;
  shots?: number;
  shootingPct?: number;
  // Goalie
  savePercentage?: number;
  goalsAgainstAverage?: number;
  shutouts?: number;
  wins?: number;
  losses?: number;
}

// Soccer Specific Stats
export interface SoccerPlayerStats extends SportradarPlayerStats {
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  shots?: number;
  shotsOnGoal?: number;
  passAccuracy?: number;
  tackles?: number;
  interceptions?: number;
  // Goalkeeper
  saves?: number;
  cleanSheets?: number;
  goalsConceded?: number;
}

// League Leaders
export interface SportradarLeagueLeader {
  category: string;
  categoryDisplayName: string;
  league: SportLeague;
  players: {
    rank: number;
    player: SportradarPlayer;
    value: number;
    displayValue: string;
  }[];
}

// Team Depth Chart
export interface SportradarDepthChartPosition {
  position: string;
  positionName: string;
  players: {
    depth: number;
    player: SportradarPlayer;
  }[];
}

export interface SportradarTeamDepthChart {
  teamId: string;
  teamName: string;
  league: SportLeague;
  positions: SportradarDepthChartPosition[];
  lastUpdated: string;
}

// Team Profile
export interface SportradarTeam {
  id: string;
  name: string;
  market: string;
  alias: string;
  conference?: string;
  division?: string;
  venue?: {
    id: string;
    name: string;
    city: string;
    state?: string;
    country: string;
    capacity: number;
    surface?: string;
  };
  coach?: {
    id: string;
    name: string;
    position: string;
  };
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

// Draft Information
export interface SportradarDraftPick {
  round: number;
  pick: number;
  overall: number;
  teamId: string;
  teamName: string;
  tradedFrom?: string;
  player?: {
    id: string;
    name: string;
    position: string;
    college?: string;
    height?: string;
    weight?: string;
  };
}

export interface SportradarDraft {
  year: number;
  league: SportLeague;
  status: 'scheduled' | 'inprogress' | 'complete';
  rounds: {
    round: number;
    picks: SportradarDraftPick[];
  }[];
}

// Free Agents
export interface SportradarFreeAgent {
  player: SportradarPlayer;
  previousTeam: string;
  previousTeamId: string;
  freeAgentDate: string;
  stats?: SportradarPlayerStats;
}

// Game/Match Data
export interface SportradarGame {
  id: string;
  status: 'scheduled' | 'inprogress' | 'halftime' | 'complete' | 'closed' | 'cancelled' | 'postponed';
  scheduledTime: string;
  homeTeam: SportradarTeam;
  awayTeam: SportradarTeam;
  homeScore?: number;
  awayScore?: number;
  period?: number;
  clock?: string;
  venue?: SportradarTeam['venue'];
  broadcast?: {
    network: string;
  };
  weather?: {
    condition: string;
    temperature: number;
    humidity: number;
    wind?: {
      speed: number;
      direction: string;
    };
  };
}

// Boxscore
export interface SportradarBoxscore {
  game: SportradarGame;
  homeTeamStats: Record<string, number>;
  awayTeamStats: Record<string, number>;
  homePlayerStats: SportradarPlayerStats[];
  awayPlayerStats: SportradarPlayerStats[];
  leaders?: {
    home: {
      points?: SportradarPlayer;
      rebounds?: SportradarPlayer;
      assists?: SportradarPlayer;
    };
    away: {
      points?: SportradarPlayer;
      rebounds?: SportradarPlayer;
      assists?: SportradarPlayer;
    };
  };
}

// Play-by-Play Event
export interface SportradarPlayByPlayEvent {
  id: string;
  type: string;
  clock: string;
  period: number;
  description: string;
  homeScore?: number;
  awayScore?: number;
  player?: SportradarPlayer;
  team?: string;
  coordinates?: {
    x: number;
    y: number;
  };
}

export interface SportradarPlayByPlay {
  game: SportradarGame;
  periods: {
    period: number;
    events: SportradarPlayByPlayEvent[];
  }[];
}

// Rankings
export interface SportradarRanking {
  teamId: string;
  teamName: string;
  conference: string;
  division: string;
  conferenceRank: number;
  divisionRank: number;
  overallRank: number;
  powerRank?: number;
  previousRank?: number;
  rankChange?: number;
}

// API Response Wrappers
export interface SportradarResponse<T> {
  data: T;
  cached: boolean;
  timestamp: string;
  league: SportLeague;
}

export interface SportradarError {
  code: string;
  message: string;
  details?: string;
}

// Aggregated Match Intelligence
export interface SportradarMatchIntelligence {
  gameId: string;
  homeTeamInjuries: SportradarInjury[];
  awayTeamInjuries: SportradarInjury[];
  homeTeamStanding?: SportradarStanding;
  awayTeamStanding?: SportradarStanding;
  homeTeamForm: ('W' | 'L' | 'D')[];
  awayTeamForm: ('W' | 'L' | 'D')[];
  keyPlayersOut: SportradarPlayer[];
  headToHead?: {
    homeWins: number;
    awayWins: number;
    draws: number;
    lastMeetings: SportradarGame[];
  };
  bettingImpact: {
    injuryImpact: number; // -100 to 100 (negative = favors away)
    formImpact: number;
    homeAdvantage: number;
    restAdvantage: number;
  };
}
