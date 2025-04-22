// API Configuration for sports data providers

export const API_CONFIGS = {
  SPORTRADAR: {
    BASE_URL: 'https://api.sportradar.com/v1',
    API_KEY: import.meta.env.VITE_SPORTRADAR_API_KEY || 'your-api-key-here',
    ENDPOINTS: {
      NFL: '/nfl/official/trial/v8/en/games/{{year}}/{{month}}/{{day}}/schedule.json',
      NBA: '/nba/trial/v8/en/games/{{year}}/{{month}}/{{day}}/schedule.json',
      MLB: '/mlb/trial/v7/en/games/{{year}}/{{month}}/{{day}}/schedule.json',
      NHL: '/nhl/trial/v8/en/games/{{year}}/{{month}}/{{day}}/schedule.json',
      SOCCER: '/soccer/trial/v4/en/schedules/{{year}}-{{month}}-{{day}}/schedule.json'
    }
  },
  ODDS_API: {
    BASE_URL: 'https://api.the-odds-api.com/v4',
    API_KEY: import.meta.env.VITE_ODDS_API_KEY || 'your-api-key-here',
    ENDPOINTS: {
      ODDS: '/sports/{{sport}}/odds',
      SCORES: '/sports/{{sport}}/scores'
    }
  },
  BETFAIR: {
    BASE_URL: 'https://api.betfair.com/exchange/betting/rest/v1',
    API_KEY: import.meta.env.VITE_BETFAIR_API_KEY || 'your-api-key-here',
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
