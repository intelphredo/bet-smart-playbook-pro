/**
 * Data Layer - Match Repository
 * 
 * Handles all match data access with caching and multiple source support.
 */

import { Match, League } from "@/types/sports";
import { MatchData, TeamData, OddsData, IMatchRepository } from "@/domain/prediction/interfaces";
import { gameCache } from "@/utils/cache/cacheManager";

// ============================================
// Data Mapper - Convert Match to MatchData
// ============================================

export function mapMatchToMatchData(match: Match): MatchData {
  const mapTeam = (team: any): TeamData => ({
    id: team.id ?? team.name,
    name: team.name,
    shortName: team.shortName ?? team.name.substring(0, 3).toUpperCase(),
    record: team.record,
    recentForm: team.recentForm,
    logo: team.logo,
  });

  const mapOdds = (odds: any): OddsData | undefined => {
    if (!odds) return undefined;
    
    return {
      homeWin: odds.homeWin ?? odds.home ?? 2.0,
      awayWin: odds.awayWin ?? odds.away ?? 2.0,
      draw: odds.draw,
      spread: odds.spread ? {
        home: odds.spread.home ?? 0,
        away: odds.spread.away ?? 0,
        homeOdds: odds.spread.homeOdds ?? 1.91,
        awayOdds: odds.spread.awayOdds ?? 1.91,
      } : undefined,
      total: odds.total ? {
        line: odds.total.line ?? 0,
        overOdds: odds.total.overOdds ?? 1.91,
        underOdds: odds.total.underOdds ?? 1.91,
      } : undefined,
    };
  };

  return {
    id: match.id,
    homeTeam: mapTeam(match.homeTeam),
    awayTeam: mapTeam(match.awayTeam),
    league: match.league,
    startTime: match.startTime,
    status: match.status as MatchData['status'],
    venue: (match as any).venue,
    score: match.score,
    odds: mapOdds(match.odds),
  };
}

export function mapMatchDataToMatch(data: MatchData, original?: Match): Match {
  return {
    id: data.id,
    homeTeam: data.homeTeam as any,
    awayTeam: data.awayTeam as any,
    league: data.league,
    startTime: data.startTime,
    status: data.status,
    score: data.score,
    odds: data.odds as any,
  } as Match;
}

// ============================================
// Match Repository Implementation
// ============================================

export class MatchRepository implements IMatchRepository {
  private cache = gameCache;
  private dataProvider: () => Promise<Match[]>;

  constructor(dataProvider: () => Promise<Match[]>) {
    this.dataProvider = dataProvider;
  }

  private async getAllMatches(): Promise<MatchData[]> {
    const cached = this.cache.get<Match[]>('all-matches');
    
    if (cached.data && !cached.isExpired) {
      return cached.data.map(mapMatchToMatchData);
    }

    const matches = await this.dataProvider();
    this.cache.set('all-matches', matches);
    
    return matches.map(mapMatchToMatchData);
  }

  async getById(id: string): Promise<MatchData | null> {
    const matches = await this.getAllMatches();
    return matches.find(m => m.id === id) ?? null;
  }

  async getByLeague(league: League): Promise<MatchData[]> {
    const matches = await this.getAllMatches();
    return matches.filter(m => m.league === league);
  }

  async getUpcoming(limit?: number): Promise<MatchData[]> {
    const matches = await this.getAllMatches();
    const upcoming = matches
      .filter(m => m.status === 'scheduled' || m.status === 'pre')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    return limit ? upcoming.slice(0, limit) : upcoming;
  }

  async getLive(): Promise<MatchData[]> {
    const matches = await this.getAllMatches();
    return matches.filter(m => m.status === 'live');
  }

  async getFinished(limit?: number): Promise<MatchData[]> {
    const matches = await this.getAllMatches();
    const finished = matches
      .filter(m => m.status === 'finished')
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    return limit ? finished.slice(0, limit) : finished;
  }

  // Helper to invalidate cache
  invalidateCache(): void {
    this.cache.invalidate('all-matches');
  }
}

export default MatchRepository;
