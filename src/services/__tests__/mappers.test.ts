import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mapOddsApiToMatch } from '@/services/oddsApiMappers';
import type { League, Match } from '@/types/sports';

// Mock the team logos module
vi.mock('@/utils/teamLogos', () => ({
  getTeamLogoUrl: vi.fn((teamName: string) => `/logos/${teamName.toLowerCase().replace(/\s/g, '-')}.png`),
  getSportsbookLogo: vi.fn((bookKey: string) => `/sportsbooks/${bookKey}.png`),
  getTeamAbbreviation: vi.fn((teamName: string) => teamName.substring(0, 3).toUpperCase()),
}));

describe('mapOddsApiToMatch', () => {
  const mockOddsEvent = {
    id: 'event-123',
    sport_key: 'basketball_nba',
    sport_title: 'NBA',
    commence_time: '2024-01-15T19:00:00Z',
    home_team: 'Los Angeles Lakers',
    away_team: 'Boston Celtics',
    bookmakers: [
      {
        key: 'draftkings',
        title: 'DraftKings',
        last_update: '2024-01-15T18:00:00Z',
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'Los Angeles Lakers', price: 1.91 },
              { name: 'Boston Celtics', price: 1.91 },
            ],
          },
        ],
      },
      {
        key: 'fanduel',
        title: 'FanDuel',
        last_update: '2024-01-15T18:00:00Z',
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'Los Angeles Lakers', price: 1.95 },
              { name: 'Boston Celtics', price: 1.87 },
            ],
          },
        ],
      },
    ],
  };

  const mockScoreData = {
    id: 'event-123',
    scores: [
      { name: 'Los Angeles Lakers', score: '102' },
      { name: 'Boston Celtics', score: '98' },
    ],
    status: 'in-progress',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic mapping', () => {
    it('maps a single event correctly', () => {
      const result = mapOddsApiToMatch([mockOddsEvent], [], 'NBA' as League);
      
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('event-123');
      expect(result[0].league).toBe('NBA');
    });

    it('maps home and away teams correctly', () => {
      const result = mapOddsApiToMatch([mockOddsEvent], [], 'NBA' as League);
      
      expect(result[0].homeTeam.name).toBe('Los Angeles Lakers');
      expect(result[0].awayTeam.name).toBe('Boston Celtics');
    });

    it('generates team IDs from names', () => {
      const result = mapOddsApiToMatch([mockOddsEvent], [], 'NBA' as League);
      
      expect(result[0].homeTeam.id).toBe('odds-api-los-angeles-lakers');
      expect(result[0].awayTeam.id).toBe('odds-api-boston-celtics');
    });

    it('sets start time from commence_time', () => {
      const result = mapOddsApiToMatch([mockOddsEvent], [], 'NBA' as League);
      
      expect(result[0].startTime).toBe('2024-01-15T19:00:00Z');
    });
  });

  describe('odds mapping', () => {
    it('extracts moneyline odds from first bookmaker', () => {
      const result = mapOddsApiToMatch([mockOddsEvent], [], 'NBA' as League);
      
      expect(result[0].odds.homeWin).toBe(1.91);
      expect(result[0].odds.awayWin).toBe(1.91);
    });

    it('handles missing bookmakers gracefully', () => {
      const eventWithNoBookmakers = { ...mockOddsEvent, bookmakers: [] };
      const result = mapOddsApiToMatch([eventWithNoBookmakers], [], 'NBA' as League);
      
      expect(result[0].odds.homeWin).toBe(0);
      expect(result[0].odds.awayWin).toBe(0);
    });

    it('maps live odds from all bookmakers', () => {
      const result = mapOddsApiToMatch([mockOddsEvent], [], 'NBA' as League);
      
      expect(result[0].liveOdds).toHaveLength(2);
      expect(result[0].liveOdds![0].sportsbook.id).toBe('draftkings');
      expect(result[0].liveOdds![1].sportsbook.id).toBe('fanduel');
    });

    it('includes sportsbook metadata in live odds', () => {
      const result = mapOddsApiToMatch([mockOddsEvent], [], 'NBA' as League);
      
      const draftkingsOdds = result[0].liveOdds![0];
      expect(draftkingsOdds.sportsbook.name).toBe('DraftKings');
      expect(draftkingsOdds.sportsbook.isAvailable).toBe(true);
    });
  });

  describe('soccer draw odds', () => {
    const soccerEvent = {
      ...mockOddsEvent,
      sport_key: 'soccer_epl',
      home_team: 'Arsenal',
      away_team: 'Chelsea',
      bookmakers: [
        {
          key: 'bet365',
          title: 'Bet365',
          markets: [
            {
              key: 'h2h',
              outcomes: [
                { name: 'Arsenal', price: 2.10 },
                { name: 'Draw', price: 3.40 },
                { name: 'Chelsea', price: 3.20 },
              ],
            },
          ],
        },
      ],
    };

    it('extracts draw odds for soccer', () => {
      const result = mapOddsApiToMatch([soccerEvent], [], 'SOCCER' as League);
      
      expect(result[0].odds.draw).toBe(3.40);
    });

    it('includes draw in live odds for soccer', () => {
      const result = mapOddsApiToMatch([soccerEvent], [], 'SOCCER' as League);
      
      expect(result[0].liveOdds![0].draw).toBe(3.40);
    });

    it('does not include draw for non-soccer sports', () => {
      const result = mapOddsApiToMatch([mockOddsEvent], [], 'NBA' as League);
      
      expect(result[0].odds.draw).toBeUndefined();
    });
  });

  describe('score integration', () => {
    it('adds score data when available', () => {
      const result = mapOddsApiToMatch([mockOddsEvent], [mockScoreData], 'NBA' as League);
      
      expect(result[0].score).toBeDefined();
      expect(result[0].score!.home).toBe(102);
      expect(result[0].score!.away).toBe(98);
    });

    it('includes period/status in score', () => {
      const result = mapOddsApiToMatch([mockOddsEvent], [mockScoreData], 'NBA' as League);
      
      expect(result[0].score!.period).toBe('in-progress');
    });

    it('handles missing score data gracefully', () => {
      const result = mapOddsApiToMatch([mockOddsEvent], [], 'NBA' as League);
      
      expect(result[0].score).toBeUndefined();
    });

    it('handles score data with different ID', () => {
      const differentIdScore = { ...mockScoreData, id: 'different-id' };
      const result = mapOddsApiToMatch([mockOddsEvent], [differentIdScore], 'NBA' as League);
      
      expect(result[0].score).toBeUndefined();
    });
  });

  describe('status determination', () => {
    it('sets status to finished for completed events', () => {
      const completedEvent = { ...mockOddsEvent, completed: true };
      const result = mapOddsApiToMatch([completedEvent], [], 'NBA' as League);
      
      expect(result[0].status).toBe('finished');
    });

    it('sets status to live for live events', () => {
      const liveEvent = { ...mockOddsEvent, live: true };
      const result = mapOddsApiToMatch([liveEvent], [], 'NBA' as League);
      
      expect(result[0].status).toBe('live');
    });

    it('sets status to pre when game is within 1 hour', () => {
      const soonEvent = {
        ...mockOddsEvent,
        commence_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 mins
      };
      const result = mapOddsApiToMatch([soonEvent], [], 'NBA' as League);
      
      expect(result[0].status).toBe('pre');
    });

    it('sets status to scheduled for future games', () => {
      const futureEvent = {
        ...mockOddsEvent,
        commence_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      };
      const result = mapOddsApiToMatch([futureEvent], [], 'NBA' as League);
      
      expect(result[0].status).toBe('scheduled');
    });
  });

  describe('prediction generation', () => {
    it('generates prediction recommendation', () => {
      const result = mapOddsApiToMatch([mockOddsEvent], [], 'NBA' as League);
      
      expect(result[0].prediction).toBeDefined();
      expect(['home', 'away', 'draw']).toContain(result[0].prediction!.recommended);
    });

    it('recommends favorite based on odds', () => {
      const favoriteHomeEvent = {
        ...mockOddsEvent,
        bookmakers: [{
          key: 'test',
          title: 'Test',
          markets: [{
            key: 'h2h',
            outcomes: [
              { name: 'Los Angeles Lakers', price: 1.5 },
              { name: 'Boston Celtics', price: 2.8 },
            ],
          }],
        }],
      };
      const result = mapOddsApiToMatch([favoriteHomeEvent], [], 'NBA' as League);
      
      expect(result[0].prediction!.recommended).toBe('home');
    });

    it('generates confidence between 0 and 100', () => {
      const result = mapOddsApiToMatch([mockOddsEvent], [], 'NBA' as League);
      
      expect(result[0].prediction!.confidence).toBeGreaterThanOrEqual(0);
      expect(result[0].prediction!.confidence).toBeLessThanOrEqual(100);
    });

    it('includes projected score placeholder', () => {
      const result = mapOddsApiToMatch([mockOddsEvent], [], 'NBA' as League);
      
      expect(result[0].prediction!.projectedScore).toBeDefined();
      expect(result[0].prediction!.projectedScore!.home).toBe(0);
      expect(result[0].prediction!.projectedScore!.away).toBe(0);
    });
  });

  describe('error handling', () => {
    it('returns empty array on error', () => {
      const result = mapOddsApiToMatch(null as any, [], 'NBA' as League);
      
      expect(result).toEqual([]);
    });

    it('handles undefined odds data', () => {
      const result = mapOddsApiToMatch(undefined as any, [], 'NBA' as League);
      
      expect(result).toEqual([]);
    });

    it('handles malformed event data', () => {
      const malformedEvent = { id: 'test' }; // Missing required fields
      
      // Should not throw
      expect(() => {
        mapOddsApiToMatch([malformedEvent], [], 'NBA' as League);
      }).not.toThrow();
    });

    it('handles missing market data', () => {
      const noMarketsEvent = {
        ...mockOddsEvent,
        bookmakers: [{
          key: 'test',
          title: 'Test',
          markets: [], // No markets
        }],
      };
      const result = mapOddsApiToMatch([noMarketsEvent], [], 'NBA' as League);
      
      expect(result[0].odds.homeWin).toBe(0);
    });
  });

  describe('multiple events', () => {
    it('maps multiple events correctly', () => {
      const event2 = {
        ...mockOddsEvent,
        id: 'event-456',
        home_team: 'Miami Heat',
        away_team: 'Chicago Bulls',
      };
      
      const result = mapOddsApiToMatch([mockOddsEvent, event2], [], 'NBA' as League);
      
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('event-123');
      expect(result[1].id).toBe('event-456');
    });

    it('handles partial score data for multiple events', () => {
      const event2 = {
        ...mockOddsEvent,
        id: 'event-456',
        home_team: 'Miami Heat',
        away_team: 'Chicago Bulls',
      };
      
      // Only first event has scores
      const result = mapOddsApiToMatch(
        [mockOddsEvent, event2], 
        [mockScoreData], 
        'NBA' as League
      );
      
      expect(result[0].score).toBeDefined();
      expect(result[1].score).toBeUndefined();
    });
  });
});

describe('Team Logo Integration', () => {
  it('generates team logo URLs', () => {
    const event = {
      id: 'test',
      home_team: 'Test Team',
      away_team: 'Other Team',
      commence_time: new Date().toISOString(),
      bookmakers: [],
    };
    
    const result = mapOddsApiToMatch([event], [], 'NBA' as League);
    
    expect(result[0].homeTeam.logo).toContain('test-team');
    expect(result[0].awayTeam.logo).toContain('other-team');
  });

  it('generates team abbreviations', () => {
    const event = {
      id: 'test',
      home_team: 'Los Angeles Lakers',
      away_team: 'Boston Celtics',
      commence_time: new Date().toISOString(),
      bookmakers: [],
    };
    
    const result = mapOddsApiToMatch([event], [], 'NBA' as League);
    
    expect(result[0].homeTeam.shortName).toBeTruthy();
    expect(result[0].awayTeam.shortName).toBeTruthy();
  });
});
