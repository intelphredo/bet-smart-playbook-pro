
import { SocialSignal, TeamIntelligence, PlayerIntelligence, CoachIntelligence } from "@/types/socialIntelligence";

export const MOCK_SOCIAL_SIGNALS: SocialSignal[] = [
  // High-impact injury signals
  {
    id: 'sig-1',
    source: 'official',
    type: 'injury',
    severity: 'high',
    sentiment: 'negative',
    impactOnBetting: -8,
    headline: 'Star QB ruled out for Sunday',
    details: 'Team confirms starting quarterback will miss the game due to ankle injury sustained in practice.',
    sourceUrl: 'https://example.com/injury-report',
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    entityType: 'player',
    entityName: 'Patrick Mahomes',
    teamId: 'KC'
  },
  {
    id: 'sig-2',
    source: 'twitter',
    type: 'motivation',
    severity: 'medium',
    sentiment: 'positive',
    impactOnBetting: 5,
    headline: '"This one is personal" - Star player on revenge game',
    details: 'Player posts cryptic message about facing former team for first time since trade.',
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    entityType: 'player',
    entityName: 'James Harden',
    teamId: 'LAC'
  },
  {
    id: 'sig-3',
    source: 'news',
    type: 'locker_room',
    severity: 'medium',
    sentiment: 'negative',
    impactOnBetting: -4,
    headline: 'Reports of tension between coach and star player',
    details: 'Sources indicate disagreement over playing time has created friction within the team.',
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    entityType: 'team',
    entityName: 'Los Angeles Lakers',
    teamId: 'LAL'
  },
  {
    id: 'sig-4',
    source: 'insider',
    type: 'coaching',
    severity: 'high',
    sentiment: 'neutral',
    impactOnBetting: -3,
    headline: 'Interim coach to lead team after sudden departure',
    details: 'Head coach relieved of duties, assistant taking over with no preparation time.',
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    entityType: 'coach',
    entityName: 'Doc Rivers',
    teamId: 'MIL'
  },
  {
    id: 'sig-5',
    source: 'official',
    type: 'rest',
    severity: 'low',
    sentiment: 'positive',
    impactOnBetting: 3,
    headline: 'Team enjoys 4-day rest after grueling road trip',
    details: 'Full roster healthy and rested after week off, all players expected to play.',
    publishedAt: new Date(Date.now() - 43200000).toISOString(),
    entityType: 'team',
    entityName: 'Boston Celtics',
    teamId: 'BOS'
  },
  {
    id: 'sig-6',
    source: 'news',
    type: 'travel',
    severity: 'medium',
    sentiment: 'negative',
    impactOnBetting: -4,
    headline: 'Team arrives at 3am after flight delays',
    details: 'Weather delays caused team to arrive in city just hours before game time.',
    publishedAt: new Date(Date.now() - 21600000).toISOString(),
    entityType: 'team',
    entityName: 'Denver Nuggets',
    teamId: 'DEN'
  },
  {
    id: 'sig-7',
    source: 'twitter',
    type: 'lineup',
    severity: 'high',
    sentiment: 'positive',
    impactOnBetting: 6,
    headline: 'Star center returning from injury tonight',
    details: 'Team confirms all-star center cleared to play after missing 3 weeks.',
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    entityType: 'player',
    entityName: 'Joel Embiid',
    teamId: 'PHI'
  },
  {
    id: 'sig-8',
    source: 'reddit',
    type: 'motivation',
    severity: 'medium',
    sentiment: 'positive',
    impactOnBetting: 4,
    headline: 'Playoff implications - must-win for seeding',
    details: 'Team needs win to secure home court advantage in first round.',
    publishedAt: new Date(Date.now() - 28800000).toISOString(),
    entityType: 'team',
    entityName: 'Miami Heat',
    teamId: 'MIA'
  }
];

export const MOCK_PLAYER_INTELLIGENCE: PlayerIntelligence[] = [
  {
    playerId: 'lbj-23',
    playerName: 'LeBron James',
    team: 'Los Angeles Lakers',
    position: 'SF',
    signals: MOCK_SOCIAL_SIGNALS.filter(s => s.teamId === 'LAL'),
    overallSentiment: -15,
    trendingTopics: ['trade rumors', 'playoff push', 'rest management'],
    injuryStatus: 'healthy',
    recentPerformance: 'average',
    socialActivity: [
      { platform: 'Twitter', recentPosts: 3, sentiment: -10 },
      { platform: 'Instagram', recentPosts: 5, sentiment: 20 }
    ]
  },
  {
    playerId: 'jt-0',
    playerName: 'Jayson Tatum',
    team: 'Boston Celtics',
    position: 'SF',
    signals: MOCK_SOCIAL_SIGNALS.filter(s => s.teamId === 'BOS'),
    overallSentiment: 45,
    trendingTopics: ['MVP race', 'championship contender'],
    injuryStatus: 'healthy',
    recentPerformance: 'hot',
    socialActivity: [
      { platform: 'Twitter', recentPosts: 2, sentiment: 30 },
      { platform: 'Instagram', recentPosts: 4, sentiment: 40 }
    ]
  }
];

export const MOCK_COACH_INTELLIGENCE: CoachIntelligence[] = [
  {
    coachId: 'jm-1',
    coachName: 'Joe Mazzulla',
    team: 'Boston Celtics',
    pressConferenceNotes: 'Emphasized defensive adjustments and playoff preparation.',
    recentQuotes: [
      'We need to lock in defensively.',
      'Every game matters for seeding.',
      'The guys are focused and ready.'
    ],
    publicPerception: 75,
    tacticalTendencies: ['Switch-heavy defense', 'Fast pace offense', 'Three-point heavy']
  },
  {
    coachId: 'dh-1',
    coachName: 'Darvin Ham',
    team: 'Los Angeles Lakers',
    pressConferenceNotes: 'Addressed rotation changes and player health management.',
    recentQuotes: [
      'We are working through some things.',
      'Chemistry takes time.',
      'LeBron is our leader.'
    ],
    publicPerception: 45,
    tacticalTendencies: ['Iso-heavy', 'Defensive minded', 'Slow pace']
  }
];

export const MOCK_TEAM_INTELLIGENCE: TeamIntelligence[] = [
  {
    teamId: 'BOS',
    teamName: 'Boston Celtics',
    league: 'NBA',
    lockerRoomMorale: 85,
    injuryImpact: 10,
    travelFatigue: 15,
    motivationLevel: 90,
    restDays: 3,
    signals: MOCK_SOCIAL_SIGNALS.filter(s => s.teamId === 'BOS'),
    keyPlayers: MOCK_PLAYER_INTELLIGENCE.filter(p => p.team === 'Boston Celtics'),
    coach: MOCK_COACH_INTELLIGENCE.find(c => c.team === 'Boston Celtics'),
    recentHeadlines: [
      'Celtics on 7-game win streak',
      'Best record in the East',
      'Championship favorites'
    ],
    narratives: ['Championship or bust', 'Revenge for Finals loss']
  },
  {
    teamId: 'LAL',
    teamName: 'Los Angeles Lakers',
    league: 'NBA',
    lockerRoomMorale: 55,
    injuryImpact: 35,
    travelFatigue: 45,
    motivationLevel: 65,
    restDays: 1,
    signals: MOCK_SOCIAL_SIGNALS.filter(s => s.teamId === 'LAL'),
    keyPlayers: MOCK_PLAYER_INTELLIGENCE.filter(p => p.team === 'Los Angeles Lakers'),
    coach: MOCK_COACH_INTELLIGENCE.find(c => c.team === 'Los Angeles Lakers'),
    recentHeadlines: [
      'Lakers struggling on road trip',
      'Trade deadline questions linger',
      'LeBron load management continues'
    ],
    narratives: ['Underdog mentality', 'Prove doubters wrong']
  }
];

export function getTeamIntelligence(teamId: string): TeamIntelligence | undefined {
  return MOCK_TEAM_INTELLIGENCE.find(t => t.teamId === teamId);
}

export function getPlayerIntelligence(playerId: string): PlayerIntelligence | undefined {
  return MOCK_PLAYER_INTELLIGENCE.find(p => p.playerId === playerId);
}

export function getRecentSignals(limit: number = 10): SocialSignal[] {
  return [...MOCK_SOCIAL_SIGNALS]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}

export function getHighImpactSignals(): SocialSignal[] {
  return MOCK_SOCIAL_SIGNALS.filter(s => s.severity === 'high' || Math.abs(s.impactOnBetting) >= 5);
}
