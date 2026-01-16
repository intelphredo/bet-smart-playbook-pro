export interface DisplayPreferences {
  odds_format: 'american' | 'decimal' | 'fractional';
  theme: 'light' | 'dark' | 'system';
}

export interface FavoritesPreferences {
  leagues: string[];
  teams: string[];
  sportsbooks: string[];
  matches: string[]; // Match IDs
}

export interface NotificationPreferences {
  line_movements: boolean;
  positive_ev: boolean;
  arbitrage: boolean;
  game_start: boolean;
  bet_results: boolean;
}

export interface BankrollPreferences {
  current_bankroll: number;
  unit_size: number;
  kelly_fraction: number;
  max_bet_percentage: number;
}

export interface BettingPreferences {
  default_stake: number;
  auto_kelly: boolean;
  show_ev_threshold: number;
  hide_negative_ev: boolean;
}

export interface UserPreferences {
  display: DisplayPreferences;
  favorites: FavoritesPreferences;
  notifications: NotificationPreferences;
  bankroll: BankrollPreferences;
  betting: BettingPreferences;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  display: {
    odds_format: 'american',
    theme: 'system',
  },
  favorites: {
    leagues: [],
    teams: [],
    sportsbooks: [],
    matches: [],
  },
  notifications: {
    line_movements: false,
    positive_ev: false,
    arbitrage: false,
    game_start: false,
    bet_results: false,
  },
  bankroll: {
    current_bankroll: 1000,
    unit_size: 10,
    kelly_fraction: 0.25,
    max_bet_percentage: 5,
  },
  betting: {
    default_stake: 10,
    auto_kelly: false,
    show_ev_threshold: 3,
    hide_negative_ev: false,
  },
};
