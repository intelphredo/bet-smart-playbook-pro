
import { League } from './core';
import { Team } from './team';
import { LiveOdds } from './betting';
import { SmartScore, DataVerificationResult } from './analysis';
import { MatchLineup } from './lineup';

export interface Match {
  id: string;
  league: League;
  homeTeam: Team;
  awayTeam: Team;
  startTime: string;
  odds: {
    homeWin: number;
    awayWin: number;
    draw?: number;
  };
  liveOdds?: LiveOdds[];
  prediction: {
    recommended: 'home' | 'away' | 'draw';
    confidence: number;
    projectedScore: {
      home: number;
      away: number;
    };
  };
  status: 'scheduled' | 'pre' | 'live' | 'finished';
  score?: {
    home: number;
    away: number;
    period?: string;
  };
  smartScore?: SmartScore;
  verification?: DataVerificationResult;
  lastUpdated?: string;
}

export interface MatchEnhanced extends Match {
  lineups?: {
    home: MatchLineup;
    away: MatchLineup;
  };
  oddsTrend?: MatchOddsTrend;
  weatherInfo?: {
    temperature: string;
    condition: string;
    windSpeed: string;
    precipitation: string;
  };
  venue?: {
    name: string;
    city: string;
    country: string;
    capacity: number;
    surface: string;
  };
  headToHead?: {
    lastMatches: {
      date: string;
      homeTeam: string;
      awayTeam: string;
      homeScore: number;
      awayScore: number;
    }[];
    homeTeamWins: number;
    awayTeamWins: number;
    draws: number;
  };
}

export interface MatchOddsTrend {
  homeOdds: number[];
  awayOdds: number[];
  drawOdds?: number[];
  timestamps: string[];
}
