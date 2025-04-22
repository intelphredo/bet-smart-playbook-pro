import { Match } from "@/types/sports";

interface BetSmartLogger {
  logs: string[];
  upcomingMatches?: Match[];
  liveMatches?: Match[];
  finishedMatches?: Match[];
  algorithmPerformance?: any;
  addLog: (message: string) => void;
}

// Initialize global logger
if (typeof window !== 'undefined') {
  if (!window.__BetSmart) {
    window.__BetSmart = {
      logs: [],
      addLog: function(message: string) {
        this.logs.push(`[${new Date().toISOString()}] ${message}`);
        // Keep only last 100 logs
        if (this.logs.length > 100) {
          this.logs.shift();
        }
      }
    } as BetSmartLogger;
  }
}

export const logger = {
  log: (message: string) => {
    console.log(message);
    if (typeof window !== 'undefined' && window.__BetSmart) {
      window.__BetSmart.addLog(message);
    }
  },
  error: (message: string) => {
    console.error(message);
    if (typeof window !== 'undefined' && window.__BetSmart) {
      window.__BetSmart.addLog(`ERROR: ${message}`);
    }
  }
};
