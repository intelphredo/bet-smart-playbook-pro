import { League } from "@/types/sports";
import { ESPN_API_BASE } from "./espnConstants";
import { format, subMonths } from "date-fns";

export interface ESPNHistoricalMatch {
  id: string;
  date: string;
  homeTeam: string;
  homeTeamId: string;
  awayTeam: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  winner: "home" | "away" | "tie";
  venue: string;
  season: string;
  seasonType: string;
  completed: boolean;
}

export interface TeamSeasonRecord {
  teamId: string;
  teamName: string;
  wins: number;
  losses: number;
  ties: number;
  winPercentage: number;
  streak: string | number;
  homeRecord: string;
  awayRecord: string;
  last10: string | null;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  conferenceRecord?: string;
  divisionRecord?: string;
  season: string;
}

export interface HeadToHeadHistory {
  team1Wins: number;
  team2Wins: number;
  ties: number;
  totalGames: number;
  lastMeetings: ESPNHistoricalMatch[];
  streakTeam: string | null;
  streakCount: number;
  avgTeam1Score: number;
  avgTeam2Score: number;
  isLiveData: boolean;
  team1SeasonRecord?: TeamSeasonRecord;
  team2SeasonRecord?: TeamSeasonRecord;
}

// Map league to ESPN sport path
const getESPNSportPath = (league: League): string => {
  const paths: Record<League, string> = {
    NBA: "basketball/nba",
    NFL: "football/nfl",
    MLB: "baseball/mlb",
    NHL: "hockey/nhl",
    SOCCER: "soccer/eng.1",
    NCAAF: "football/college-football",
    NCAAB: "basketball/mens-college-basketball",
  };
  return paths[league] || "basketball/nba";
};

// Fetch completed games from scoreboard for past dates
const fetchPastGames = async (
  league: League,
  daysBack: number = 30
): Promise<ESPNHistoricalMatch[]> => {
  const sportPath = getESPNSportPath(league);
  const allGames: ESPNHistoricalMatch[] = [];
  
  // Fetch games from the past N days
  const dates: string[] = [];
  for (let i = 1; i <= daysBack; i++) {
    const date = subMonths(new Date(), i / 30); // Spread over months
    dates.push(format(date, "yyyyMMdd"));
  }
  
  // Only fetch a sample of dates to avoid too many requests
  const sampleDates = dates.filter((_, i) => i % 7 === 0).slice(0, 8);
  
  try {
    const results = await Promise.all(
      sampleDates.map(async (dateStr) => {
        const url = `${ESPN_API_BASE}/${sportPath}/scoreboard?dates=${dateStr}`;
        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
          if (!response.ok) return [];
          
          const data = await response.json();
          const events = data?.events || [];
          
          return events
            .filter((event: any) => event.status?.type?.completed)
            .map((event: any) => {
              const competition = event.competitions?.[0];
              const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === "home");
              const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === "away");
              
              const homeScore = parseInt(homeTeam?.score || "0", 10);
              const awayScore = parseInt(awayTeam?.score || "0", 10);
              
              let winner: "home" | "away" | "tie" = "tie";
              if (homeScore > awayScore) winner = "home";
              else if (awayScore > homeScore) winner = "away";

              return {
                id: event.id,
                date: event.date,
                homeTeam: homeTeam?.team?.displayName || homeTeam?.team?.name || "Unknown",
                homeTeamId: homeTeam?.team?.id || "",
                awayTeam: awayTeam?.team?.displayName || awayTeam?.team?.name || "Unknown",
                awayTeamId: awayTeam?.team?.id || "",
                homeScore,
                awayScore,
                winner,
                venue: competition?.venue?.fullName || competition?.venue?.address?.city || "",
                season: event.season?.displayName || event.season?.year?.toString() || "",
                seasonType: event.seasonType?.name || "Regular Season",
                completed: true,
              };
            });
        } catch {
          return [];
        }
      })
    );
    
    return results.flat();
  } catch (error) {
    console.warn("Error fetching past games:", error);
    return [];
  }
};

// Fetch team schedule with results (primary method)
const fetchTeamSchedule = async (
  league: League,
  teamId: string
): Promise<ESPNHistoricalMatch[]> => {
  const sportPath = getESPNSportPath(league);
  const url = `${ESPN_API_BASE}/${sportPath}/teams/${teamId}/schedule`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.warn(`ESPN schedule fetch failed for team ${teamId}:`, response.status);
      return [];
    }

    const data = await response.json();
    const events = data?.events || [];

    return events
      .filter((event: any) => event.competitions?.[0]?.status?.type?.completed)
      .map((event: any) => {
        const competition = event.competitions?.[0];
        const homeTeam = competition?.competitors?.find((c: any) => c.homeAway === "home");
        const awayTeam = competition?.competitors?.find((c: any) => c.homeAway === "away");
        
        const homeScore = parseInt(homeTeam?.score || "0", 10);
        const awayScore = parseInt(awayTeam?.score || "0", 10);
        
        let winner: "home" | "away" | "tie" = "tie";
        if (homeScore > awayScore) winner = "home";
        else if (awayScore > homeScore) winner = "away";

        return {
          id: event.id,
          date: event.date,
          homeTeam: homeTeam?.team?.displayName || homeTeam?.team?.name || "Unknown",
          homeTeamId: homeTeam?.team?.id || "",
          awayTeam: awayTeam?.team?.displayName || awayTeam?.team?.name || "Unknown",
          awayTeamId: awayTeam?.team?.id || "",
          homeScore,
          awayScore,
          winner,
          venue: competition?.venue?.fullName || competition?.venue?.address?.city || "Unknown",
          season: event.season?.displayName || event.season?.year?.toString() || "",
          seasonType: event.seasonType?.name || "Regular Season",
          completed: true,
        };
      });
  } catch (error) {
    console.warn(`Error fetching team schedule for ${teamId}:`, error);
    return [];
  }
};

// Fetch team season record
const fetchTeamSeasonRecord = async (
  league: League,
  teamId: string,
  teamName: string
): Promise<TeamSeasonRecord | null> => {
  const sportPath = getESPNSportPath(league);
  const url = `${ESPN_API_BASE}/${sportPath}/teams/${teamId}`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      console.warn(`ESPN team record fetch failed for team ${teamId}:`, response.status);
      return null;
    }

    const data = await response.json();
    const team = data?.team;
    const record = team?.record?.items?.[0] || team?.record;
    const stats = record?.stats || [];
    
    // Parse stats into a map for easy access
    const statMap: Record<string, number | string> = {};
    stats.forEach((stat: any) => {
      statMap[stat.name] = stat.value ?? stat.displayValue;
    });

    // Get wins, losses, ties from various possible locations
    const wins = parseInt(statMap.wins as string) || record?.wins || 0;
    const losses = parseInt(statMap.losses as string) || record?.losses || 0;
    const ties = parseInt(statMap.ties as string) || record?.ties || 0;
    const totalGames = wins + losses + ties;
    const winPct = totalGames > 0 ? wins / totalGames : 0;

    // Try to get additional record details
    const items = team?.record?.items || [];
    let homeRecord = "";
    let awayRecord = "";
    let conferenceRecord = "";
    let divisionRecord = "";
    let last10 = "";

    items.forEach((item: any) => {
      const type = item.type?.toLowerCase() || item.name?.toLowerCase() || "";
      const summary = item.summary || item.displayValue || "";
      
      if (type.includes("home")) homeRecord = summary;
      else if (type.includes("road") || type.includes("away")) awayRecord = summary;
      else if (type.includes("conference") || type.includes("conf")) conferenceRecord = summary;
      else if (type.includes("division") || type.includes("div")) divisionRecord = summary;
      else if (type.includes("last") || type.includes("l10")) last10 = summary;
    });

    // Get streak
    const streak = team?.streak?.displayValue || 
      (statMap.streak as string) || 
      `${wins > losses ? "W" : "L"}1`;

    // Get points for/against
    const pointsFor = parseInt(statMap.pointsFor as string) || 
      parseInt(statMap.pointsScored as string) || 
      parseInt(statMap.runsScored as string) || 0;
    const pointsAgainst = parseInt(statMap.pointsAgainst as string) || 
      parseInt(statMap.pointsAllowed as string) || 
      parseInt(statMap.runsAllowed as string) || 0;

    return {
      teamId,
      teamName: team?.displayName || team?.name || teamName,
      wins,
      losses,
      ties,
      winPercentage: Math.round(winPct * 1000) / 10,
      streak: streak || "-",
      homeRecord: homeRecord || `${Math.floor(wins / 2)}-${Math.floor(losses / 2)}`,
      awayRecord: awayRecord || `${Math.ceil(wins / 2)}-${Math.ceil(losses / 2)}`,
      last10: last10 || "",
      pointsFor,
      pointsAgainst,
      pointDifferential: pointsFor - pointsAgainst,
      conferenceRecord: conferenceRecord || undefined,
      divisionRecord: divisionRecord || undefined,
      season: team?.season?.displayName || new Date().getFullYear().toString(),
    };
  } catch (error) {
    console.warn(`Error fetching team season record for ${teamId}:`, error);
    return null;
  }
};

// Normalize team name for matching
const normalizeTeamName = (name: string): string => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
};

// Check if two team names match
const teamsMatch = (name1: string, name2: string): boolean => {
  const n1 = normalizeTeamName(name1);
  const n2 = normalizeTeamName(name2);
  
  // Exact match
  if (n1 === n2) return true;
  
  // One contains the other (e.g., "Lakers" in "Los Angeles Lakers")
  if (n1.includes(n2) || n2.includes(n1)) return true;
  
  // Last word match (city names like "Lakers", "Celtics")
  const lastWord1 = name1.split(" ").pop()?.toLowerCase() || "";
  const lastWord2 = name2.split(" ").pop()?.toLowerCase() || "";
  if (lastWord1 && lastWord2 && (lastWord1 === lastWord2 || lastWord1.includes(lastWord2) || lastWord2.includes(lastWord1))) {
    return true;
  }
  
  return false;
};

// Find common matchups between two teams
export const fetchHeadToHeadHistory = async (
  league: League,
  team1Id: string,
  team1Name: string,
  team2Id: string,
  team2Name: string
): Promise<HeadToHeadHistory> => {
  try {
    // Try multiple data sources in parallel, including season records
    const [team1Schedule, team2Schedule, pastGames, team1Record, team2Record] = await Promise.all([
      fetchTeamSchedule(league, team1Id),
      fetchTeamSchedule(league, team2Id),
      fetchPastGames(league, 90), // Last ~3 months
      fetchTeamSeasonRecord(league, team1Id, team1Name),
      fetchTeamSeasonRecord(league, team2Id, team2Name),
    ]);

    // Combine all sources and find H2H games
    const allGames = [...team1Schedule, ...team2Schedule, ...pastGames];
    
    // Deduplicate by game ID
    const uniqueGames = Array.from(
      new Map(allGames.map(g => [g.id, g])).values()
    );

    // Find games where both teams played each other
    const h2hGames = uniqueGames.filter((game) => {
      const isTeam1Home = teamsMatch(game.homeTeam, team1Name) || game.homeTeamId === team1Id;
      const isTeam1Away = teamsMatch(game.awayTeam, team1Name) || game.awayTeamId === team1Id;
      const isTeam2Home = teamsMatch(game.homeTeam, team2Name) || game.homeTeamId === team2Id;
      const isTeam2Away = teamsMatch(game.awayTeam, team2Name) || game.awayTeamId === team2Id;
      
      return ((isTeam1Home && isTeam2Away) || (isTeam1Away && isTeam2Home)) && game.completed;
    });

    // Sort by date (most recent first)
    h2hGames.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Take last 10 matchups
    const lastMeetings = h2hGames.slice(0, 10);

    // Calculate stats
    let team1Wins = 0;
    let team2Wins = 0;
    let ties = 0;
    let team1TotalScore = 0;
    let team2TotalScore = 0;

    lastMeetings.forEach((game) => {
      const team1IsHome = teamsMatch(game.homeTeam, team1Name) || game.homeTeamId === team1Id;
      
      const team1Score = team1IsHome ? game.homeScore : game.awayScore;
      const team2Score = team1IsHome ? game.awayScore : game.homeScore;
      
      team1TotalScore += team1Score;
      team2TotalScore += team2Score;

      if (team1Score > team2Score) {
        team1Wins++;
      } else if (team2Score > team1Score) {
        team2Wins++;
      } else {
        ties++;
      }
    });

    // Calculate streak
    let streakTeam: string | null = null;
    let streakCount = 0;

    if (lastMeetings.length > 0) {
      const firstGame = lastMeetings[0];
      const team1IsHome = teamsMatch(firstGame.homeTeam, team1Name) || firstGame.homeTeamId === team1Id;
      
      const team1Score = team1IsHome ? firstGame.homeScore : firstGame.awayScore;
      const team2Score = team1IsHome ? firstGame.awayScore : firstGame.homeScore;

      if (team1Score !== team2Score) {
        streakTeam = team1Score > team2Score ? team1Name : team2Name;
        streakCount = 1;

        for (let i = 1; i < lastMeetings.length; i++) {
          const game = lastMeetings[i];
          const isHome = teamsMatch(game.homeTeam, team1Name) || game.homeTeamId === team1Id;
          
          const t1Score = isHome ? game.homeScore : game.awayScore;
          const t2Score = isHome ? game.awayScore : game.homeScore;
          
          const gameWinner = t1Score > t2Score ? team1Name : t2Score > t1Score ? team2Name : null;
          
          if (gameWinner === streakTeam) {
            streakCount++;
          } else {
            break;
          }
        }
      }
    }

    return {
      team1Wins,
      team2Wins,
      ties,
      totalGames: lastMeetings.length,
      lastMeetings,
      streakTeam,
      streakCount,
      avgTeam1Score: lastMeetings.length > 0 ? Math.round(team1TotalScore / lastMeetings.length) : 0,
      avgTeam2Score: lastMeetings.length > 0 ? Math.round(team2TotalScore / lastMeetings.length) : 0,
      isLiveData: lastMeetings.length > 0,
      team1SeasonRecord: team1Record || undefined,
      team2SeasonRecord: team2Record || undefined,
    };
  } catch (error) {
    console.error("Error fetching H2H history:", error);
    return {
      team1Wins: 0,
      team2Wins: 0,
      ties: 0,
      totalGames: 0,
      lastMeetings: [],
      streakTeam: null,
      streakCount: 0,
      avgTeam1Score: 0,
      avgTeam2Score: 0,
      isLiveData: false,
    };
  }
};
