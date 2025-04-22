
import { League } from "./sports";

export interface LeagueConfig {
  id: League | string; // Allow both standard leagues and custom ones
  name: string;
  shortName?: string;
  category: SportCategory;
  apiIdentifiers: {
    ESPN?: string;
    ACTION?: string;
    ODDS_API?: string;
    SPORT_RADAR?: string;
    [key: string]: string | undefined; // Allow custom API identifiers
  };
  hasPlayerProps: boolean;
  supportedBetTypes: string[];
  division?: string;
  level?: 'professional' | 'college' | 'international' | 'other';
  active: boolean;
  logo?: string;
}

export type SportCategory = 
  | 'basketball'
  | 'football' 
  | 'baseball' 
  | 'hockey'
  | 'soccer'
  | 'mma'
  | 'tennis'
  | 'golf'
  | 'other';

export interface LeagueRegistryService {
  registerLeague(config: LeagueConfig): void;
  getLeague(id: League | string): LeagueConfig | undefined;
  getActiveLeagues(): LeagueConfig[];
  getLeaguesByCategory(category: SportCategory): LeagueConfig[];
}

class LeagueRegistryImpl implements LeagueRegistryService {
  private leagues: Map<string, LeagueConfig> = new Map();
  
  constructor() {
    // Register default leagues
    this.registerDefaultLeagues();
  }
  
  private registerDefaultLeagues() {
    // Standard leagues
    [
      {
        id: 'NBA',
        name: 'NBA',
        category: 'basketball' as SportCategory,
        apiIdentifiers: { 
          ESPN: 'basketball/nba',
          ACTION: 'basketball_nba',
          ODDS_API: 'basketball_nba',
          SPORT_RADAR: 'basketball/nba'
        },
        hasPlayerProps: true,
        supportedBetTypes: ['spread', 'moneyline', 'total', 'player_props'],
        active: true
      },
      {
        id: 'NFL',
        name: 'NFL',
        category: 'football' as SportCategory,
        apiIdentifiers: { 
          ESPN: 'football/nfl',
          ACTION: 'football_nfl',
          ODDS_API: 'americanfootball_nfl',
          SPORT_RADAR: 'football/nfl'
        },
        hasPlayerProps: true,
        supportedBetTypes: ['spread', 'moneyline', 'total', 'player_props'],
        active: true
      },
      {
        id: 'MLB',
        name: 'MLB',
        category: 'baseball' as SportCategory,
        apiIdentifiers: { 
          ESPN: 'baseball/mlb',
          ACTION: 'baseball_mlb',
          ODDS_API: 'baseball_mlb',
          SPORT_RADAR: 'baseball/mlb'
        },
        hasPlayerProps: true,
        supportedBetTypes: ['moneyline', 'runline', 'total', 'player_props'],
        active: true
      },
      {
        id: 'NHL',
        name: 'NHL',
        category: 'hockey' as SportCategory,
        apiIdentifiers: { 
          ESPN: 'hockey/nhl',
          ACTION: 'hockey_nhl',
          ODDS_API: 'icehockey_nhl',
          SPORT_RADAR: 'hockey/nhl'
        },
        hasPlayerProps: true,
        supportedBetTypes: ['moneyline', 'puckline', 'total', 'player_props'],
        active: true
      },
      {
        id: 'SOCCER',
        name: 'Soccer',
        category: 'soccer' as SportCategory,
        apiIdentifiers: { 
          ESPN: 'soccer/eng.1', // Premier League as default
          ACTION: 'soccer_epl',
          ODDS_API: 'soccer_epl',
          SPORT_RADAR: 'soccer/epl'
        },
        hasPlayerProps: true,
        supportedBetTypes: ['moneyline', 'spread', 'total', 'player_props'],
        active: true
      },
      {
        id: 'NCAAF',
        name: 'College Football',
        shortName: 'NCAAF',
        category: 'football' as SportCategory,
        apiIdentifiers: { 
          ESPN: 'football/college-football',
          ACTION: 'football_ncaaf',
          ODDS_API: 'americanfootball_ncaaf',
          SPORT_RADAR: 'football/ncaaf'
        },
        hasPlayerProps: false,
        supportedBetTypes: ['spread', 'moneyline', 'total'],
        level: 'college',
        active: true
      }
    ].forEach(league => this.registerLeague(league as LeagueConfig));
  }
  
  registerLeague(config: LeagueConfig): void {
    this.leagues.set(config.id, config);
  }
  
  getLeague(id: League | string): LeagueConfig | undefined {
    return this.leagues.get(id);
  }
  
  getActiveLeagues(): LeagueConfig[] {
    return Array.from(this.leagues.values()).filter(league => league.active);
  }
  
  getLeaguesByCategory(category: SportCategory): LeagueConfig[] {
    return Array.from(this.leagues.values())
      .filter(league => league.category === category && league.active);
  }
}

export const LeagueRegistry = new LeagueRegistryImpl();

export default LeagueRegistry;
