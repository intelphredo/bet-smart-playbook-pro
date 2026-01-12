import { useQuery } from "@tanstack/react-query";
import { League } from "@/types/sports";
import { fetchHeadToHeadHistory, HeadToHeadHistory } from "@/services/espnHeadToHead";

interface TeamInfo {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  league: League;
}

// Generate consistent mock data based on team IDs
const generateMockHistory = (
  team1: TeamInfo,
  team2: TeamInfo
): HeadToHeadHistory => {
  // Use team IDs to generate consistent mock data
  const seed = (team1.id + team2.id).split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  const random = (min: number, max: number) => {
    const x = Math.sin(seed * 9999) * 10000;
    return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
  };
  
  const totalGames = random(5, 12);
  const team1Wins = random(1, totalGames - 1);
  const ties = random(0, Math.min(2, totalGames - team1Wins));
  const team2Wins = totalGames - team1Wins - ties;
  
  // Generate last meetings
  const lastMeetings = [];
  const currentYear = new Date().getFullYear();
  
  for (let i = 0; i < Math.min(5, totalGames); i++) {
    const monthsAgo = i * 2 + random(1, 3);
    const date = new Date();
    date.setMonth(date.getMonth() - monthsAgo);
    
    const isHomeTeam1 = i % 2 === 0;
    
    // Score ranges based on league
    const getScoreRange = () => {
      switch (team1.league) {
        case "NBA":
        case "NCAAB":
          return { min: 85, max: 130 };
        case "NFL":
        case "NCAAF":
          return { min: 14, max: 42 };
        case "NHL":
          return { min: 1, max: 6 };
        case "MLB":
          return { min: 2, max: 10 };
        case "SOCCER":
          return { min: 0, max: 4 };
        default:
          return { min: 70, max: 120 };
      }
    };
    
    const range = getScoreRange();
    const homeScore = random(range.min, range.max);
    const awayScore = random(range.min, range.max);
    const winner = homeScore > awayScore ? "home" as const : homeScore < awayScore ? "away" as const : "tie" as const;
    
    lastMeetings.push({
      id: `mock-h2h-${i}`,
      date: date.toISOString(),
      homeTeam: isHomeTeam1 ? team1.name : team2.name,
      homeTeamId: isHomeTeam1 ? team1.id : team2.id,
      awayTeam: isHomeTeam1 ? team2.name : team1.name,
      awayTeamId: isHomeTeam1 ? team2.id : team1.id,
      homeScore,
      awayScore,
      winner,
      venue: isHomeTeam1 ? `${team1.shortName} Arena` : `${team2.shortName} Arena`,
      season: `${currentYear - Math.floor(monthsAgo / 12)}-${(currentYear - Math.floor(monthsAgo / 12) + 1).toString().slice(-2)}`,
      seasonType: "Regular Season",
      completed: true,
    });
  }
  
  // Determine streak
  let streakTeam: string | null = null;
  let streakCount = 0;
  
  if (lastMeetings.length > 0) {
    const firstMatch = lastMeetings[0];
    const firstWinner = firstMatch.winner === "home" ? firstMatch.homeTeam : 
                        firstMatch.winner === "away" ? firstMatch.awayTeam : null;
    
    if (firstWinner) {
      streakTeam = firstWinner;
      streakCount = 1;
      
      for (let i = 1; i < lastMeetings.length; i++) {
        const match = lastMeetings[i];
        const winner = match.winner === "home" ? match.homeTeam : 
                       match.winner === "away" ? match.awayTeam : null;
        if (winner === streakTeam) {
          streakCount++;
        } else {
          break;
        }
      }
    }
  }

  // Calculate averages
  let avgTeam1Score = 0;
  let avgTeam2Score = 0;
  
  lastMeetings.forEach(match => {
    const team1IsHome = match.homeTeamId === team1.id;
    avgTeam1Score += team1IsHome ? match.homeScore : match.awayScore;
    avgTeam2Score += team1IsHome ? match.awayScore : match.homeScore;
  });
  
  if (lastMeetings.length > 0) {
    avgTeam1Score = Math.round(avgTeam1Score / lastMeetings.length);
    avgTeam2Score = Math.round(avgTeam2Score / lastMeetings.length);
  }
  
  return {
    team1Wins,
    team2Wins,
    ties,
    totalGames,
    lastMeetings,
    streakTeam,
    streakCount,
    avgTeam1Score,
    avgTeam2Score,
    isLiveData: false,
  };
};

export const useHeadToHead = (
  team1: TeamInfo | null,
  team2: TeamInfo | null
) => {
  return useQuery({
    queryKey: ["headToHead", team1?.id, team2?.id, team1?.league],
    queryFn: async (): Promise<HeadToHeadHistory> => {
      if (!team1 || !team2) {
        throw new Error("Both teams are required");
      }

      // Try to fetch real data
      const realData = await fetchHeadToHeadHistory(
        team1.league,
        team1.id,
        team1.name,
        team2.id,
        team2.name
      );

      // If we got real data, return it
      if (realData.isLiveData && realData.totalGames > 0) {
        return realData;
      }

      // Fall back to mock data
      console.info("Using mock H2H data (no real matchups found)");
      return generateMockHistory(team1, team2);
    },
    enabled: Boolean(team1 && team2),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });
};
