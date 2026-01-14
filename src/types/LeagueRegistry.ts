
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
    const defaultLeagues: LeagueConfig[] = [
      // Basketball
      {
        id: 'NBA',
        name: 'NBA',
        category: 'basketball',
        apiIdentifiers: { 
          ESPN: 'basketball/nba',
          ACTION: 'basketball_nba',
          ODDS_API: 'basketball_nba',
          SPORT_RADAR: 'basketball/nba'
        },
        hasPlayerProps: true,
        supportedBetTypes: ['spread', 'moneyline', 'total', 'player_props'],
        level: 'professional',
        active: true
      },
      {
        id: 'NCAAB',
        name: 'College Basketball',
        shortName: 'NCAAB',
        category: 'basketball',
        apiIdentifiers: { 
          ESPN: 'basketball/mens-college-basketball',
          ACTION: 'basketball_ncaab',
          ODDS_API: 'basketball_ncaab',
          SPORT_RADAR: 'basketball/ncaab'
        },
        hasPlayerProps: false,
        supportedBetTypes: ['spread', 'moneyline', 'total'],
        level: 'college',
        active: true
      },
      {
        id: 'WNBA',
        name: 'WNBA',
        category: 'basketball',
        apiIdentifiers: { 
          ESPN: 'basketball/wnba',
          ACTION: 'basketball_wnba',
          ODDS_API: 'basketball_wnba',
          SPORT_RADAR: 'basketball/wnba'
        },
        hasPlayerProps: true,
        supportedBetTypes: ['spread', 'moneyline', 'total', 'player_props'],
        level: 'professional',
        active: true
      },
      // Football
      {
        id: 'NFL',
        name: 'NFL',
        category: 'football',
        apiIdentifiers: { 
          ESPN: 'football/nfl',
          ACTION: 'football_nfl',
          ODDS_API: 'americanfootball_nfl',
          SPORT_RADAR: 'football/nfl'
        },
        hasPlayerProps: true,
        supportedBetTypes: ['spread', 'moneyline', 'total', 'player_props'],
        level: 'professional',
        active: true
      },
      {
        id: 'NCAAF',
        name: 'College Football',
        shortName: 'NCAAF',
        category: 'football',
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
      },
      {
        id: 'CFL',
        name: 'CFL',
        category: 'football',
        apiIdentifiers: { 
          ESPN: 'football/cfl',
          ACTION: 'football_cfl',
          ODDS_API: 'americanfootball_cfl',
          SPORT_RADAR: 'football/cfl'
        },
        hasPlayerProps: false,
        supportedBetTypes: ['spread', 'moneyline', 'total'],
        level: 'professional',
        active: true
      },
      {
        id: 'XFL',
        name: 'XFL',
        category: 'football',
        apiIdentifiers: { 
          ESPN: 'football/xfl',
          ACTION: 'football_xfl',
          ODDS_API: 'americanfootball_xfl',
          SPORT_RADAR: 'football/xfl'
        },
        hasPlayerProps: false,
        supportedBetTypes: ['spread', 'moneyline', 'total'],
        level: 'professional',
        active: true
      },
      // Baseball
      {
        id: 'MLB',
        name: 'MLB',
        category: 'baseball',
        apiIdentifiers: { 
          ESPN: 'baseball/mlb',
          ACTION: 'baseball_mlb',
          ODDS_API: 'baseball_mlb',
          SPORT_RADAR: 'baseball/mlb'
        },
        hasPlayerProps: true,
        supportedBetTypes: ['moneyline', 'runline', 'total', 'player_props'],
        level: 'professional',
        active: true
      },
      // Hockey
      {
        id: 'NHL',
        name: 'NHL',
        category: 'hockey',
        apiIdentifiers: { 
          ESPN: 'hockey/nhl',
          ACTION: 'hockey_nhl',
          ODDS_API: 'icehockey_nhl',
          SPORT_RADAR: 'hockey/nhl'
        },
        hasPlayerProps: true,
        supportedBetTypes: ['moneyline', 'puckline', 'total', 'player_props'],
        level: 'professional',
        active: true
      },
      // Soccer - Multiple Leagues
      {
        id: 'SOCCER',
        name: 'Soccer',
        category: 'soccer',
        apiIdentifiers: { 
          ESPN: 'soccer/eng.1',
          ACTION: 'soccer_epl',
          ODDS_API: 'soccer_epl',
          SPORT_RADAR: 'soccer/epl'
        },
        hasPlayerProps: true,
        supportedBetTypes: ['moneyline', 'spread', 'total', 'player_props'],
        level: 'professional',
        active: true
      },
      {
        id: 'EPL',
        name: 'Premier League',
        shortName: 'EPL',
        category: 'soccer',
        apiIdentifiers: { 
          ESPN: 'soccer/eng.1',
          ACTION: 'soccer_epl',
          ODDS_API: 'soccer_epl',
          SPORT_RADAR: 'soccer/epl'
        },
        hasPlayerProps: true,
        supportedBetTypes: ['moneyline', 'spread', 'total', 'player_props'],
        level: 'professional',
        active: true
      },
      {
        id: 'LA_LIGA',
        name: 'La Liga',
        category: 'soccer',
        apiIdentifiers: { 
          ESPN: 'soccer/esp.1',
          ACTION: 'soccer_spain_la_liga',
          ODDS_API: 'soccer_spain_la_liga',
          SPORT_RADAR: 'soccer/laliga'
        },
        hasPlayerProps: true,
        supportedBetTypes: ['moneyline', 'spread', 'total', 'player_props'],
        level: 'professional',
        active: true
      },
      {
        id: 'SERIE_A',
        name: 'Serie A',
        category: 'soccer',
        apiIdentifiers: { 
          ESPN: 'soccer/ita.1',
          ACTION: 'soccer_italy_serie_a',
          ODDS_API: 'soccer_italy_serie_a',
          SPORT_RADAR: 'soccer/seriea'
        },
        hasPlayerProps: true,
        supportedBetTypes: ['moneyline', 'spread', 'total', 'player_props'],
        level: 'professional',
        active: true
      },
      {
        id: 'BUNDESLIGA',
        name: 'Bundesliga',
        category: 'soccer',
        apiIdentifiers: { 
          ESPN: 'soccer/ger.1',
          ACTION: 'soccer_germany_bundesliga',
          ODDS_API: 'soccer_germany_bundesliga',
          SPORT_RADAR: 'soccer/bundesliga'
        },
        hasPlayerProps: true,
        supportedBetTypes: ['moneyline', 'spread', 'total', 'player_props'],
        level: 'professional',
        active: true
      },
      {
        id: 'LIGUE_1',
        name: 'Ligue 1',
        category: 'soccer',
        apiIdentifiers: { 
          ESPN: 'soccer/fra.1',
          ACTION: 'soccer_france_ligue_one',
          ODDS_API: 'soccer_france_ligue_one',
          SPORT_RADAR: 'soccer/ligue1'
        },
        hasPlayerProps: true,
        supportedBetTypes: ['moneyline', 'spread', 'total', 'player_props'],
        level: 'professional',
        active: true
      },
      {
        id: 'MLS',
        name: 'MLS',
        category: 'soccer',
        apiIdentifiers: { 
          ESPN: 'soccer/usa.1',
          ACTION: 'soccer_usa_mls',
          ODDS_API: 'soccer_usa_mls',
          SPORT_RADAR: 'soccer/mls'
        },
        hasPlayerProps: true,
        supportedBetTypes: ['moneyline', 'spread', 'total', 'player_props'],
        level: 'professional',
        active: true
      },
      {
        id: 'CHAMPIONS_LEAGUE',
        name: 'Champions League',
        shortName: 'UCL',
        category: 'soccer',
        apiIdentifiers: { 
          ESPN: 'soccer/uefa.champions',
          ACTION: 'soccer_uefa_champs_league',
          ODDS_API: 'soccer_uefa_champs_league',
          SPORT_RADAR: 'soccer/ucl'
        },
        hasPlayerProps: true,
        supportedBetTypes: ['moneyline', 'spread', 'total', 'player_props'],
        level: 'international',
        active: true
      },
      // MMA
      {
        id: 'UFC',
        name: 'UFC',
        category: 'mma',
        apiIdentifiers: { 
          ESPN: 'mma/ufc',
          ACTION: 'mma_ufc',
          ODDS_API: 'mma_mixed_martial_arts',
          SPORT_RADAR: 'mma/ufc'
        },
        hasPlayerProps: true,
        supportedBetTypes: ['moneyline', 'total_rounds', 'method_of_victory'],
        level: 'professional',
        active: true
      },
      // Tennis
      {
        id: 'ATP',
        name: 'ATP Tennis',
        shortName: 'ATP',
        category: 'tennis',
        apiIdentifiers: { 
          ESPN: 'tennis/atp',
          ACTION: 'tennis_atp',
          ODDS_API: 'tennis_atp_french_open',
          SPORT_RADAR: 'tennis/atp'
        },
        hasPlayerProps: false,
        supportedBetTypes: ['moneyline', 'spread', 'total_games'],
        level: 'professional',
        active: true
      },
      {
        id: 'WTA',
        name: 'WTA Tennis',
        shortName: 'WTA',
        category: 'tennis',
        apiIdentifiers: { 
          ESPN: 'tennis/wta',
          ACTION: 'tennis_wta',
          ODDS_API: 'tennis_wta_french_open',
          SPORT_RADAR: 'tennis/wta'
        },
        hasPlayerProps: false,
        supportedBetTypes: ['moneyline', 'spread', 'total_games'],
        level: 'professional',
        active: true
      },
      // Golf
      {
        id: 'PGA',
        name: 'PGA Tour',
        shortName: 'PGA',
        category: 'golf',
        apiIdentifiers: { 
          ESPN: 'golf/pga',
          ACTION: 'golf_pga',
          ODDS_API: 'golf_pga_championship_winner',
          SPORT_RADAR: 'golf/pga'
        },
        hasPlayerProps: false,
        supportedBetTypes: ['outright_winner', 'matchups', 'top_finishes'],
        level: 'professional',
        active: true
      }
    ];
    
    defaultLeagues.forEach(league => this.registerLeague(league));
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
