
/// <reference types="vite/client" />

/**
 * Client-side environment variables
 * SECURITY: Only VITE_SUPABASE_* variables should be here
 * Sensitive API keys (ODDS_API_KEY, SPORTRADAR_API_KEY) are stored
 * securely in edge function secrets and NEVER exposed client-side
 */
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_PROJECT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Add EdgeIQ logger interface to Window object
import { Match } from "./types/sports";

interface EdgeIQLogger {
  logs: string[];
  upcomingMatches: Match[];
  liveMatches: Match[];
  finishedMatches: Match[];
  algorithmPerformance?: any;
  addLog: (message: string) => void;
}

declare global {
  interface Window {
    __EdgeIQ?: EdgeIQLogger;
  }
}
