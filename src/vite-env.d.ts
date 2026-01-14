
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SPORTRADAR_API_KEY: string;
  readonly VITE_ODDS_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Add BetSmart logger interface to Window object
import { Match } from "./types/sports";

interface BetSmartLogger {
  logs: string[];
  upcomingMatches: Match[];
  liveMatches: Match[];
  finishedMatches: Match[];
  algorithmPerformance?: any;
  addLog: (message: string) => void;
}

declare global {
  interface Window {
    __BetSmart?: BetSmartLogger;
  }
}
