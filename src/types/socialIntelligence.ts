
export type SignalSource = 'twitter' | 'news' | 'reddit' | 'official' | 'insider';
export type SignalType = 'injury' | 'lineup' | 'trade' | 'suspension' | 'coaching' | 'locker_room' | 'motivation' | 'weather' | 'travel' | 'rest';
export type SignalSeverity = 'high' | 'medium' | 'low';
export type SignalSentiment = 'positive' | 'negative' | 'neutral';

export interface SocialSignal {
  id: string;
  source: SignalSource;
  type: SignalType;
  severity: SignalSeverity;
  sentiment: SignalSentiment;
  impactOnBetting: number; // -10 to +10
  headline: string;
  details: string;
  sourceUrl?: string;
  publishedAt: string;
  entityType: 'player' | 'team' | 'coach';
  entityName: string;
  teamId?: string;
}

export interface PlayerIntelligence {
  playerId: string;
  playerName: string;
  team: string;
  position: string;
  signals: SocialSignal[];
  overallSentiment: number; // -100 to +100
  trendingTopics: string[];
  injuryStatus?: 'healthy' | 'questionable' | 'doubtful' | 'out';
  recentPerformance: 'hot' | 'cold' | 'average';
  socialActivity: {
    platform: string;
    recentPosts: number;
    sentiment: number;
  }[];
}

export interface CoachIntelligence {
  coachId: string;
  coachName: string;
  team: string;
  pressConferenceNotes?: string;
  recentQuotes: string[];
  publicPerception: number;
  tacticalTendencies?: string[];
  headToHeadRecord?: {
    opponent: string;
    wins: number;
    losses: number;
  }[];
}

export interface TeamIntelligence {
  teamId: string;
  teamName: string;
  league: string;
  lockerRoomMorale: number; // -100 to +100
  injuryImpact: number; // 0-100 (higher = more impacted)
  travelFatigue: number; // 0-100
  motivationLevel: number; // 0-100
  restDays: number;
  signals: SocialSignal[];
  keyPlayers: PlayerIntelligence[];
  coach?: CoachIntelligence;
  recentHeadlines: string[];
  narratives: string[];
}

export interface MatchSocialIntelligence {
  matchId: string;
  homeTeam: TeamIntelligence;
  awayTeam: TeamIntelligence;
  keySignals: SocialSignal[];
  socialScore: number; // 0-100, edge indicator
  edgeDirection: 'home' | 'away' | 'neutral';
  confidenceBoost: number; // -20 to +20
  summary: string;
}

export interface SocialImpactFactor {
  name: string;
  icon: string;
  impact: number;
  description: string;
  affectedTeam: 'home' | 'away' | 'both';
}
