import { League } from "@/types/sports";
import { ESPN_API_BASE } from "./espnConstants";

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

// Fetch team schedule with results
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

// Find common matchups between two teams
export const fetchHeadToHeadHistory = async (
  league: League,
  team1Id: string,
  team1Name: string,
  team2Id: string,
  team2Name: string
): Promise<HeadToHeadHistory> => {
  try {
    // Fetch schedules for both teams in parallel
    const [team1Schedule, team2Schedule] = await Promise.all([
      fetchTeamSchedule(league, team1Id),
      fetchTeamSchedule(league, team2Id),
    ]);

    // Find games where both teams played each other
    const h2hGames = team1Schedule.filter((game) => {
      const isVsTeam2 = 
        game.homeTeamId === team2Id || 
        game.awayTeamId === team2Id ||
        game.homeTeam.toLowerCase().includes(team2Name.toLowerCase().split(" ").pop() || "") ||
        game.awayTeam.toLowerCase().includes(team2Name.toLowerCase().split(" ").pop() || "");
      return isVsTeam2 && game.completed;
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
      const team1IsHome = game.homeTeamId === team1Id || 
        game.homeTeam.toLowerCase().includes(team1Name.toLowerCase().split(" ").pop() || "");
      
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
      const team1IsHome = firstGame.homeTeamId === team1Id || 
        firstGame.homeTeam.toLowerCase().includes(team1Name.toLowerCase().split(" ").pop() || "");
      
      const team1Score = team1IsHome ? firstGame.homeScore : firstGame.awayScore;
      const team2Score = team1IsHome ? firstGame.awayScore : firstGame.homeScore;

      if (team1Score !== team2Score) {
        streakTeam = team1Score > team2Score ? team1Name : team2Name;
        streakCount = 1;

        for (let i = 1; i < lastMeetings.length; i++) {
          const game = lastMeetings[i];
          const isHome = game.homeTeamId === team1Id || 
            game.homeTeam.toLowerCase().includes(team1Name.toLowerCase().split(" ").pop() || "");
          
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
