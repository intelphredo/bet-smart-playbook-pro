// Centralized live status detection for consistent behavior across all components

// Live status indicators - matches ESPN API states and internal status
export const LIVE_STATUSES = [
  "live", 
  "in_progress", 
  "in",
  // Basketball (NBA, NCAAB, WNBA)
  "1st half", "2nd half", "halftime", "end of 1st half", "end of 2nd half",
  "1st quarter", "2nd quarter", "3rd quarter", "4th quarter",
  "q1", "q2", "q3", "q4",
  // NFL/NCAAF
  "1st", "2nd", "3rd", "4th",
  // NHL
  "1st period", "2nd period", "3rd period",
  "p1", "p2", "p3",
  // Soccer
  "1h", "2h", "first half", "second half",
  // Overtime
  "ot", "ot1", "ot2", "ot3", "ot4", "ot5",
  "overtime", "extra time",
  // Generic
  "in progress"
];

/**
 * Determines if a match is currently live based on its status string
 * Uses comprehensive matching against ESPN API states and internal status values
 */
export const isMatchLive = (status: string | undefined | null): boolean => {
  if (!status) return false;
  
  const s = status.toLowerCase().trim();
  
  // Direct match or contains any live status indicator
  return LIVE_STATUSES.some(liveStatus => 
    s === liveStatus || s.includes(liveStatus)
  ) || 
  // Additional pattern matching for period/quarter with clock (e.g., "1st Half 12:45")
  /^(1st|2nd|3rd|4th|q[1-4]|p[1-3]|ot\d?)\s/.test(s) ||
  // Match patterns like "Q1 5:30" or "P2 10:00"
  /^[qp]\d\s+\d/.test(s);
};

/**
 * Determines if a match has finished
 */
export const isMatchFinished = (status: string | undefined | null): boolean => {
  if (!status) return false;
  
  const s = status.toLowerCase().trim();
  
  return s === "finished" || 
         s === "final" || 
         s === "post" ||
         s.includes("final") ||
         s.includes("end of game") ||
         s.includes("full time") ||
         s.includes("game over");
};
