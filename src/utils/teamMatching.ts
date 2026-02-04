import { Match } from "@/types/sports";

/**
 * Normalize team name for comparison
 */
const normalizeTeamName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\b(the|fc|city|sc|cf|united)\b/gi, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
};

/**
 * Check if two team names refer to the same team
 */
export function isSameTeam(name1: string, name2: string): boolean {
  if (!name1 || !name2) return false;
  
  const n1 = normalizeTeamName(name1);
  const n2 = normalizeTeamName(name2);
  
  // Exact match after normalization
  if (n1 === n2) return true;
  
  // One contains the other (handles "Lakers" vs "Los Angeles Lakers")
  if (n1.includes(n2) || n2.includes(n1)) return true;
  
  // Last word match (handles city differences like "Boston Celtics" vs "Celtics")
  const lastWord1 = n1.split(' ').pop() || '';
  const lastWord2 = n2.split(' ').pop() || '';
  if (lastWord1.length > 3 && lastWord1 === lastWord2) return true;
  
  // First significant word match (for teams like "Arsenal" vs "Arsenal FC")
  const firstWord1 = n1.split(' ')[0] || '';
  const firstWord2 = n2.split(' ')[0] || '';
  if (firstWord1.length > 4 && firstWord1 === firstWord2) return true;
  
  return false;
}

/**
 * Check if two matches represent the same game
 */
export function isSameGame(match1: Match, match2: Match): boolean {
  // Null safety: if either match is missing team data, they can't be compared
  if (!match1?.homeTeam?.name || !match1?.awayTeam?.name ||
      !match2?.homeTeam?.name || !match2?.awayTeam?.name) {
    return false;
  }

  // Check league match
  const sameLeague = match1.league === match2.league;

  // Check team matches
  const sameHome = isSameTeam(match1.homeTeam.name, match2.homeTeam.name);
  const sameAway = isSameTeam(match1.awayTeam.name, match2.awayTeam.name);

  // Also allow swapped home/away (some sources may differ)
  const swappedTeams =
    isSameTeam(match1.homeTeam.name, match2.awayTeam.name) &&
    isSameTeam(match1.awayTeam.name, match2.homeTeam.name);

  // Check if game times are within 3 hours of each other
  const time1 = new Date(match1.startTime).getTime();
  const time2 = new Date(match2.startTime).getTime();
  const sameTime = Math.abs(time1 - time2) < 3 * 60 * 60 * 1000;

  return sameLeague && ((sameHome && sameAway) || swappedTeams) && sameTime;
}

/**
 * Deduplicate matches from multiple sources, preferring matches with more data.
 * IMPORTANT: A score of 0 is still a valid score (e.g. 0-0 at kickoff), so we
 * must not treat it as "missing".
 */
export function dedupeMatches(matches: Match[]): Match[] {
  const seen = new Map<string, Match>();

  const statusRank: Record<Match["status"], number> = {
    live: 3,
    finished: 2,
    scheduled: 1,
    pre: 1,
  };

  const hasScoreObject = (m: Match) =>
    m.score !== undefined && (m.status === "live" || m.status === "finished");

  const mergeLiveOdds = (a?: Match["liveOdds"], b?: Match["liveOdds"]) => {
    const merged = [...(a || []), ...(b || [])];
    // De-dupe by sportsbook id (if present) + updatedAt
    const key = (o: any) => `${o?.sportsbook?.id ?? "unknown"}-${o?.updatedAt ?? ""}`;
    const map = new Map<string, any>();
    for (const o of merged) map.set(key(o), o);
    return Array.from(map.values());
  };

  for (const match of matches) {
    // Skip invalid matches without team data
    if (!match?.homeTeam?.name || !match?.awayTeam?.name) {
      continue;
    }

    let isDuplicate = false;

    for (const [key, existing] of seen) {
      if (isSameGame(match, existing)) {
        isDuplicate = true;

        const existingOddsCount = existing.liveOdds?.length || 0;
        const newOddsCount = match.liveOdds?.length || 0;

        const existingHasScore = hasScoreObject(existing);
        const newHasScore = hasScoreObject(match);

        // Decide which one is the primary record to keep
        const preferNew =
          newOddsCount > existingOddsCount || (newHasScore && !existingHasScore);

        const primary = preferNew ? match : existing;
        const secondary = preferNew ? existing : match;

        const mergedStatus =
          statusRank[primary.status] >= statusRank[secondary.status]
            ? primary.status
            : secondary.status;

        // Merge while preserving the best status + keeping score if either source has it
        const merged: Match = {
          ...secondary,
          ...primary,
          status: mergedStatus,
          score: primary.score ?? secondary.score,
          liveOdds: mergeLiveOdds(secondary.liveOdds, primary.liveOdds),
        };

        seen.set(key, merged);
        break;
      }
    }

    if (!isDuplicate) {
      // Create a unique key based on teams and time
      const key = `${match.homeTeam.name}-${match.awayTeam.name}-${match.startTime}`;
      seen.set(key, match);
    }
  }

  return Array.from(seen.values());
}
