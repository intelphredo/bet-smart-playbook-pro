import { Match } from "@/types/sports";

// Check if we're in development mode
const isDevelopment = typeof window !== 'undefined' && 
  (import.meta.env.DEV || import.meta.env.MODE === 'development');

// Initialize global logger if it doesn't exist
if (typeof window !== 'undefined') {
  if (!window.__BetSmart) {
    window.__BetSmart = {
      logs: [],
      upcomingMatches: [],
      liveMatches: [],
      finishedMatches: [],
      algorithmPerformance: null,
      addLog: function(message: string) {
        this.logs.push(`[${new Date().toISOString()}] ${message}`);
        // Keep only last 100 logs
        if (this.logs.length > 100) {
          this.logs.shift();
        }
      }
    };
  }
}

/**
 * Centralized logger utility that respects environment settings
 * Only outputs to console in development mode
 */
export const logger = {
  /**
   * Log informational messages - only outputs in development
   */
  log: (message: string, ...args: unknown[]) => {
    if (typeof window !== 'undefined' && window.__BetSmart) {
      window.__BetSmart.addLog(message);
    }
    if (isDevelopment) {
      console.log(message, ...args);
    }
  },
  
  /**
   * Log debug messages - only outputs in development
   */
  debug: (message: string, ...args: unknown[]) => {
    if (typeof window !== 'undefined' && window.__BetSmart) {
      window.__BetSmart.addLog(`DEBUG: ${message}`);
    }
    if (isDevelopment) {
      console.debug(message, ...args);
    }
  },
  
  /**
   * Log warning messages - outputs in all environments
   */
  warn: (message: string, ...args: unknown[]) => {
    if (typeof window !== 'undefined' && window.__BetSmart) {
      window.__BetSmart.addLog(`WARN: ${message}`);
    }
    console.warn(message, ...args);
  },
  
  /**
   * Log error messages - outputs in all environments
   */
  error: (message: string, ...args: unknown[]) => {
    if (typeof window !== 'undefined' && window.__BetSmart) {
      window.__BetSmart.addLog(`ERROR: ${message}`);
    }
    console.error(message, ...args);
  },
  
  /**
   * Log performance timing - only outputs in development
   */
  time: (label: string) => {
    if (isDevelopment) {
      console.time(label);
    }
  },
  
  /**
   * End performance timing - only outputs in development
   */
  timeEnd: (label: string) => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  },
  
  /**
   * Log a group of messages - only outputs in development
   */
  group: (label: string) => {
    if (isDevelopment) {
      console.group(label);
    }
  },
  
  /**
   * End a group - only outputs in development
   */
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },
  
  /**
   * Log a table - only outputs in development
   */
  table: (data: unknown) => {
    if (isDevelopment) {
      console.table(data);
    }
  }
};

export default logger;
