
// Defines utilities types used in the application

export interface SportsbookLogos {
  [key: string]: string;
}

export interface BetLinkBuilder {
  (sportsbookId: string, matchId: string): string | null;
}

export interface FavoriteSportsbooks {
  [key: string]: boolean;
}
