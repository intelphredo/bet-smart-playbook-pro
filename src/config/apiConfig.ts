// API Configuration for sports data providers

export const API_CONFIGS = {
  // Note: SportRadar API calls now go through the secure edge function (fetch-sportradar)
  // The API key is stored as a server-side secret, not exposed to the client
  SPORTRADAR: {
    // These endpoint definitions are kept for reference/documentation
    // Actual API calls are made through the edge function
    ENDPOINTS: {
      // NBA v8 - Full Coverage
      NBA: {
        SCHEDULE: '/nba/trial/v8/en/games/{{year}}/{{month}}/{{day}}/schedule.json',
        STANDINGS: '/nba/trial/v8/en/seasons/{{year}}/{{season_type}}/standings.json',
        INJURIES: '/nba/trial/v8/en/league/injuries.json',
        DAILY_INJURIES: '/nba/trial/v8/en/league/{{year}}/{{month}}/{{day}}/injuries.json',
        RANKINGS: '/nba/trial/v8/en/seasons/{{year}}/{{season_type}}/rankings.json',
        LEAGUE_LEADERS: '/nba/trial/v8/en/seasons/{{year}}/{{season_type}}/leaders.json',
        TEAM_PROFILE: '/nba/trial/v8/en/teams/{{team_id}}/profile.json',
        TEAM_DEPTH_CHART: '/nba/trial/v8/en/teams/{{team_id}}/depth_chart.json',
        PLAYER_PROFILE: '/nba/trial/v8/en/players/{{player_id}}/profile.json',
        GAME_BOXSCORE: '/nba/trial/v8/en/games/{{game_id}}/boxscore.json',
        GAME_PLAY_BY_PLAY: '/nba/trial/v8/en/games/{{game_id}}/pbp.json',
        GAME_SUMMARY: '/nba/trial/v8/en/games/{{game_id}}/summary.json',
        SEASONAL_STATS: '/nba/trial/v8/en/seasons/{{year}}/{{season_type}}/teams/{{team_id}}/statistics.json',
        FREE_AGENTS: '/nba/trial/v8/en/league/free_agents.json',
        DRAFT: '/nba/trial/v8/en/draft/{{year}}/summary.json',
        TRANSFERS: '/nba/trial/v8/en/league/{{year}}/{{month}}/{{day}}/transfers.json',
        SERIES_SCHEDULE: '/nba/trial/v8/en/series/{{year}}/{{series_id}}/schedule.json',
        HIERARCHY: '/nba/trial/v8/en/league/hierarchy.json',
        DAILY_CHANGE_LOG: '/nba/trial/v8/en/league/{{year}}/{{month}}/{{day}}/changes.json'
      },
      // NFL v8 - Official
      NFL: {
        SCHEDULE: '/nfl/official/trial/v8/en/games/{{year}}/{{season_type}}/{{week}}/schedule.json',
        WEEKLY_SCHEDULE: '/nfl/official/trial/v8/en/games/{{year}}/{{season_type}}/schedule.json',
        STANDINGS: '/nfl/official/trial/v8/en/seasons/{{year}}/{{season_type}}/standings/season.json',
        INJURIES: '/nfl/official/trial/v8/en/league/injuries.json',
        WEEKLY_INJURIES: '/nfl/official/trial/v8/en/seasons/{{year}}/{{season_type}}/{{week}}/injuries.json',
        DEPTH_CHARTS: '/nfl/official/trial/v8/en/seasons/{{year}}/{{season_type}}/{{week}}/depth_charts.json',
        TEAM_DEPTH_CHART: '/nfl/official/trial/v8/en/teams/{{team_id}}/depth_chart.json',
        PLAYER_PROFILE: '/nfl/official/trial/v8/en/players/{{player_id}}/profile.json',
        TEAM_PROFILE: '/nfl/official/trial/v8/en/teams/{{team_id}}/profile.json',
        TEAM_ROSTER: '/nfl/official/trial/v8/en/teams/{{team_id}}/roster.json',
        GAME_BOXSCORE: '/nfl/official/trial/v8/en/games/{{game_id}}/boxscore.json',
        GAME_ROSTER: '/nfl/official/trial/v8/en/games/{{game_id}}/roster.json',
        GAME_STATISTICS: '/nfl/official/trial/v8/en/games/{{game_id}}/statistics.json',
        LEAGUE_LEADERS: '/nfl/official/trial/v8/en/seasons/{{year}}/{{season_type}}/leaders.json',
        SEASONAL_STATS: '/nfl/official/trial/v8/en/seasons/{{year}}/{{season_type}}/teams/{{team_id}}/statistics.json',
        DRAFT: '/nfl/official/trial/v8/en/draft/{{year}}/summary.json',
        HIERARCHY: '/nfl/official/trial/v8/en/league/hierarchy.json'
      },
      // MLB v7
      MLB: {
        SCHEDULE: '/mlb/trial/v7/en/games/{{year}}/{{month}}/{{day}}/schedule.json',
        DAILY_SCHEDULE: '/mlb/trial/v7/en/games/{{year}}/{{month}}/{{day}}/schedule.json',
        STANDINGS: '/mlb/trial/v7/en/seasons/{{year}}/standings.json',
        INJURIES: '/mlb/trial/v7/en/league/injuries.json',
        PLAYER_PROFILE: '/mlb/trial/v7/en/players/{{player_id}}/profile.json',
        TEAM_PROFILE: '/mlb/trial/v7/en/teams/{{team_id}}/profile.json',
        TEAM_ROSTER: '/mlb/trial/v7/en/teams/{{team_id}}/profile.json',
        GAME_BOXSCORE: '/mlb/trial/v7/en/games/{{game_id}}/boxscore.json',
        GAME_SUMMARY: '/mlb/trial/v7/en/games/{{game_id}}/summary.json',
        GAME_PLAY_BY_PLAY: '/mlb/trial/v7/en/games/{{game_id}}/pbp.json',
        LEAGUE_LEADERS: '/mlb/trial/v7/en/seasons/{{year}}/leaders/hitting.json',
        PITCHING_LEADERS: '/mlb/trial/v7/en/seasons/{{year}}/leaders/pitching.json',
        DRAFT: '/mlb/trial/v7/en/draft/{{year}}/summary.json',
        HIERARCHY: '/mlb/trial/v7/en/league/hierarchy.json',
        VENUES: '/mlb/trial/v7/en/league/venues.json'
      },
      // NHL v8
      NHL: {
        SCHEDULE: '/nhl/trial/v8/en/games/{{year}}/{{month}}/{{day}}/schedule.json',
        DAILY_SCHEDULE: '/nhl/trial/v8/en/games/{{year}}/{{month}}/{{day}}/schedule.json',
        STANDINGS: '/nhl/trial/v8/en/seasons/{{year}}/{{season_type}}/standings.json',
        INJURIES: '/nhl/trial/v8/en/league/injuries.json',
        PLAYER_PROFILE: '/nhl/trial/v8/en/players/{{player_id}}/profile.json',
        TEAM_PROFILE: '/nhl/trial/v8/en/teams/{{team_id}}/profile.json',
        TEAM_ROSTER: '/nhl/trial/v8/en/teams/{{team_id}}/profile.json',
        GAME_BOXSCORE: '/nhl/trial/v8/en/games/{{game_id}}/boxscore.json',
        GAME_SUMMARY: '/nhl/trial/v8/en/games/{{game_id}}/summary.json',
        LEAGUE_LEADERS: '/nhl/trial/v8/en/seasons/{{year}}/{{season_type}}/leaders.json',
        DRAFT: '/nhl/trial/v8/en/draft/{{year}}/summary.json',
        HIERARCHY: '/nhl/trial/v8/en/league/hierarchy.json',
        RANKINGS: '/nhl/trial/v8/en/seasons/{{year}}/{{season_type}}/rankings.json'
      },
      // Soccer v4 (Premier League focus, expandable)
      SOCCER: {
        SCHEDULE: '/soccer/trial/v4/en/schedules/{{year}}-{{month}}-{{day}}/schedule.json',
        COMPETITION_SCHEDULE: '/soccer/trial/v4/en/competitions/{{competition_id}}/schedules.json',
        STANDINGS: '/soccer/trial/v4/en/competitions/{{competition_id}}/standings.json',
        INJURIES: '/soccer/trial/v4/en/competitions/{{competition_id}}/injuries.json',
        TEAM_PROFILE: '/soccer/trial/v4/en/teams/{{team_id}}/profile.json',
        TEAM_RESULTS: '/soccer/trial/v4/en/teams/{{team_id}}/results.json',
        PLAYER_PROFILE: '/soccer/trial/v4/en/players/{{player_id}}/profile.json',
        MATCH_LINEUPS: '/soccer/trial/v4/en/matches/{{match_id}}/lineups.json',
        MATCH_SUMMARY: '/soccer/trial/v4/en/matches/{{match_id}}/summary.json',
        MATCH_STATISTICS: '/soccer/trial/v4/en/matches/{{match_id}}/statistics.json',
        MATCH_TIMELINE: '/soccer/trial/v4/en/matches/{{match_id}}/timeline.json',
        LEAGUE_LEADERS: '/soccer/trial/v4/en/competitions/{{competition_id}}/leaders.json',
        COMPETITIONS: '/soccer/trial/v4/en/competitions.json',
        HIERARCHY: '/soccer/trial/v4/en/competitions/{{competition_id}}/info.json'
      }
    },
    // Competition IDs for Soccer
    SOCCER_COMPETITIONS: {
      PREMIER_LEAGUE: 'sr:competition:17',
      LA_LIGA: 'sr:competition:8',
      BUNDESLIGA: 'sr:competition:35',
      SERIE_A: 'sr:competition:23',
      LIGUE_1: 'sr:competition:34',
      MLS: 'sr:competition:242',
      CHAMPIONS_LEAGUE: 'sr:competition:7'
    },
    // Season types
    SEASON_TYPES: {
      NBA: { PRESEASON: 'PRE', REGULAR: 'REG', POSTSEASON: 'PST' },
      NFL: { PRESEASON: 'PRE', REGULAR: 'REG', POSTSEASON: 'PST' },
      NHL: { PRESEASON: 'PRE', REGULAR: 'REG', POSTSEASON: 'PST' },
      MLB: { PRESEASON: 'PRE', REGULAR: 'REG', POSTSEASON: 'PST' }
    }
  },
  // Note: Odds API calls now go through the secure edge function (fetch-odds)
  // The API key is stored as a server-side secret, not exposed to the client
  ODDS_API: {
    // These are kept for reference but not used directly - all calls go through edge function
    BASE_URL: 'https://api.the-odds-api.com/v4',
    ENDPOINTS: {
      ODDS: '/sports/{{sport}}/odds',
      SCORES: '/sports/{{sport}}/scores',
      EVENTS: '/sports/{{sport}}/events',
      HISTORICAL: '/historical/sports/{{sport}}/odds'
    }
  },
  BETFAIR: {
    BASE_URL: 'https://api.betfair.com/exchange/betting/rest/v1',
    API_KEY: import.meta.env.VITE_BETFAIR_API_KEY || '',
    SESSION_TOKEN: import.meta.env.VITE_BETFAIR_SESSION_TOKEN || '',
    ENDPOINTS: {
      LIST_EVENTS: '/listEvents',
      LIST_MARKET_CATALOGUE: '/listMarketCatalogue',
      LIST_MARKET_BOOK: '/listMarketBook'
    }
  }
};

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

export const LEAGUE_MAPPINGS = {
  NFL: { 
    ODDS_API: 'americanfootball_nfl',
    SPORTRADAR: 'nfl',
    BETFAIR: '61420'
  },
  NBA: { 
    ODDS_API: 'basketball_nba',
    SPORTRADAR: 'nba',
    BETFAIR: '7522'
  },
  MLB: { 
    ODDS_API: 'baseball_mlb',
    SPORTRADAR: 'mlb',
    BETFAIR: '7511'
  },
  NHL: { 
    ODDS_API: 'icehockey_nhl',
    SPORTRADAR: 'nhl',
    BETFAIR: '35232'
  },
  SOCCER: { 
    ODDS_API: 'soccer_epl',
    SPORTRADAR: 'soccer',
    BETFAIR: '10932509'
  }
};

// Helper to get current season year
export const getCurrentSeasonYear = (league: string): number => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  
  // NBA/NHL seasons span two years (Oct-June)
  if (league === 'NBA' || league === 'NHL') {
    return month >= 9 ? year : year - 1; // Oct = month 9
  }
  // NFL season spans two years (Sep-Feb)
  if (league === 'NFL') {
    return month >= 8 ? year : year - 1; // Sep = month 8
  }
  // MLB/Soccer use calendar year
  return year;
};

// Helper to get current season type
export const getCurrentSeasonType = (league: string): string => {
  const now = new Date();
  const month = now.getMonth();
  
  switch (league) {
    case 'NBA':
      if (month >= 9 && month <= 11) return 'PRE'; // Oct-Nov
      if (month >= 0 && month <= 3) return 'REG'; // Jan-Apr
      if (month >= 4 && month <= 5) return 'PST'; // May-Jun
      return 'REG';
    case 'NFL':
      if (month === 7 || month === 8) return 'PRE'; // Aug-Sep
      if (month >= 9 || month <= 0) return 'REG'; // Oct-Jan
      if (month >= 1 && month <= 2) return 'PST'; // Jan-Feb
      return 'REG';
    case 'NHL':
      if (month >= 9 && month <= 10) return 'PRE'; // Oct
      if (month >= 11 || month <= 3) return 'REG'; // Nov-Apr
      if (month >= 4 && month <= 5) return 'PST'; // May-Jun
      return 'REG';
    case 'MLB':
      if (month >= 2 && month <= 3) return 'PRE'; // Mar-Apr
      if (month >= 4 && month <= 8) return 'REG'; // Apr-Sep
      if (month >= 9 && month <= 10) return 'PST'; // Oct-Nov
      return 'REG';
    default:
      return 'REG';
  }
};
