import { useQuery } from "@tanstack/react-query";

export interface RankedTeam {
  rank: number;
  previousRank: number;
  teamId: string;
  teamName: string;
  teamAbbreviation: string;
  teamLogo: string;
  record: string;
  points: number;
  firstPlaceVotes: number;
  trend: "up" | "down" | "same" | "new";
  trendAmount: number;
}

export interface RankingsData {
  pollName: string;
  pollType: string;
  headline: string;
  lastUpdated: string;
  teams: RankedTeam[];
}

interface ESPNRankingsResponse {
  rankings: Array<{
    id: string;
    name: string;
    shortName: string;
    type: string;
    headline: string;
    date: string;
    ranks: Array<{
      current: number;
      previous: number;
      points: number;
      firstPlaceVotes: number;
      trend: string;
      team: {
        id: string;
        uid: string;
        location: string;
        name: string;
        nickname: string;
        abbreviation: string;
        color: string;
        logo: string;
        recordSummary: string;
      };
    }>;
  }>;
}

const ESPN_RANKINGS_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/rankings";

const fetchNCAABRankings = async (): Promise<RankingsData[]> => {
  try {
    const response = await fetch(ESPN_RANKINGS_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch rankings: ${response.status}`);
    }
    
    const data: ESPNRankingsResponse = await response.json();
    
    if (!data.rankings || data.rankings.length === 0) {
      return [];
    }
    
    return data.rankings.map(ranking => ({
      pollName: ranking.name,
      pollType: ranking.type,
      headline: ranking.headline,
      lastUpdated: ranking.date,
      teams: ranking.ranks.slice(0, 25).map(rank => {
        const trendValue = rank.previous > 0 ? rank.previous - rank.current : 0;
        let trend: RankedTeam["trend"] = "same";
        
        if (rank.previous === 0 || rank.trend === "new") {
          trend = "new";
        } else if (trendValue > 0) {
          trend = "up";
        } else if (trendValue < 0) {
          trend = "down";
        }
        
        return {
          rank: rank.current,
          previousRank: rank.previous,
          teamId: rank.team.id,
          teamName: rank.team.location + " " + rank.team.nickname,
          teamAbbreviation: rank.team.abbreviation,
          teamLogo: rank.team.logo,
          record: rank.team.recordSummary || "",
          points: rank.points,
          firstPlaceVotes: rank.firstPlaceVotes || 0,
          trend,
          trendAmount: Math.abs(trendValue),
        };
      }),
    }));
  } catch (error) {
    console.error("Error fetching NCAAB rankings:", error);
    // Return mock data as fallback
    return getMockRankings();
  }
};

const getMockRankings = (): RankingsData[] => {
  const mockTeams: RankedTeam[] = [
    { rank: 1, previousRank: 1, teamId: "2250", teamName: "Auburn Tigers", teamAbbreviation: "AUB", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2.png", record: "17-1", points: 1525, firstPlaceVotes: 61, trend: "same", trendAmount: 0 },
    { rank: 2, previousRank: 2, teamId: "150", teamName: "Duke Blue Devils", teamAbbreviation: "DUKE", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/150.png", record: "16-2", points: 1464, firstPlaceVotes: 0, trend: "same", trendAmount: 0 },
    { rank: 3, previousRank: 4, teamId: "2294", teamName: "Iowa State Cyclones", teamAbbreviation: "ISU", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/66.png", record: "16-2", points: 1385, firstPlaceVotes: 0, trend: "up", trendAmount: 1 },
    { rank: 4, previousRank: 3, teamId: "2305", teamName: "Kansas Jayhawks", teamAbbreviation: "KU", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2305.png", record: "14-3", points: 1289, firstPlaceVotes: 0, trend: "down", trendAmount: 1 },
    { rank: 5, previousRank: 7, teamId: "2633", teamName: "Tennessee Volunteers", teamAbbreviation: "TENN", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2633.png", record: "16-2", points: 1270, firstPlaceVotes: 0, trend: "up", trendAmount: 2 },
    { rank: 6, previousRank: 5, teamId: "2168", teamName: "Alabama Crimson Tide", teamAbbreviation: "ALA", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/333.png", record: "15-3", points: 1185, firstPlaceVotes: 0, trend: "down", trendAmount: 1 },
    { rank: 7, previousRank: 8, teamId: "2390", teamName: "Marquette Golden Eagles", teamAbbreviation: "MARQ", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/269.png", record: "15-3", points: 1128, firstPlaceVotes: 0, trend: "up", trendAmount: 1 },
    { rank: 8, previousRank: 6, teamId: "2199", teamName: "Florida Gators", teamAbbreviation: "FLA", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/57.png", record: "15-3", points: 1089, firstPlaceVotes: 0, trend: "down", trendAmount: 2 },
    { rank: 9, previousRank: 10, teamId: "248", teamName: "Houston Cougars", teamAbbreviation: "HOU", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/248.png", record: "14-3", points: 978, firstPlaceVotes: 0, trend: "up", trendAmount: 1 },
    { rank: 10, previousRank: 9, teamId: "2509", teamName: "Purdue Boilermakers", teamAbbreviation: "PUR", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2509.png", record: "15-4", points: 914, firstPlaceVotes: 0, trend: "down", trendAmount: 1 },
    { rank: 11, previousRank: 11, teamId: "96", teamName: "Kentucky Wildcats", teamAbbreviation: "UK", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/96.png", record: "14-4", points: 843, firstPlaceVotes: 0, trend: "same", trendAmount: 0 },
    { rank: 12, previousRank: 14, teamId: "2393", teamName: "Michigan State Spartans", teamAbbreviation: "MSU", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/127.png", record: "15-3", points: 789, firstPlaceVotes: 0, trend: "up", trendAmount: 2 },
    { rank: 13, previousRank: 12, teamId: "52", teamName: "Texas Tech Red Raiders", teamAbbreviation: "TTU", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2641.png", record: "14-4", points: 734, firstPlaceVotes: 0, trend: "down", trendAmount: 1 },
    { rank: 14, previousRank: 13, teamId: "2628", teamName: "Texas A&M Aggies", teamAbbreviation: "TAMU", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/245.png", record: "14-4", points: 698, firstPlaceVotes: 0, trend: "down", trendAmount: 1 },
    { rank: 15, previousRank: 16, teamId: "2250", teamName: "Gonzaga Bulldogs", teamAbbreviation: "GONZ", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2250.png", record: "15-4", points: 645, firstPlaceVotes: 0, trend: "up", trendAmount: 1 },
    { rank: 16, previousRank: 17, teamId: "228", teamName: "Oregon Ducks", teamAbbreviation: "ORE", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2483.png", record: "15-3", points: 598, firstPlaceVotes: 0, trend: "up", trendAmount: 1 },
    { rank: 17, previousRank: 15, teamId: "153", teamName: "UConn Huskies", teamAbbreviation: "CONN", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/41.png", record: "14-4", points: 534, firstPlaceVotes: 0, trend: "down", trendAmount: 2 },
    { rank: 18, previousRank: 20, teamId: "2393", teamName: "Illinois Fighting Illini", teamAbbreviation: "ILL", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/356.png", record: "14-4", points: 467, firstPlaceVotes: 0, trend: "up", trendAmount: 2 },
    { rank: 19, previousRank: 18, teamId: "2393", teamName: "Ole Miss Rebels", teamAbbreviation: "MISS", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/145.png", record: "14-4", points: 412, firstPlaceVotes: 0, trend: "down", trendAmount: 1 },
    { rank: 20, previousRank: 19, teamId: "2379", teamName: "Memphis Tigers", teamAbbreviation: "MEM", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/235.png", record: "14-3", points: 378, firstPlaceVotes: 0, trend: "down", trendAmount: 1 },
    { rank: 21, previousRank: 23, teamId: "2132", teamName: "Clemson Tigers", teamAbbreviation: "CLEM", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/228.png", record: "14-4", points: 289, firstPlaceVotes: 0, trend: "up", trendAmount: 2 },
    { rank: 22, previousRank: 21, teamId: "153", teamName: "North Carolina Tar Heels", teamAbbreviation: "UNC", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/153.png", record: "13-5", points: 256, firstPlaceVotes: 0, trend: "down", trendAmount: 1 },
    { rank: 23, previousRank: 22, teamId: "2567", teamName: "St. John's Red Storm", teamAbbreviation: "STJO", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/2599.png", record: "15-3", points: 212, firstPlaceVotes: 0, trend: "down", trendAmount: 1 },
    { rank: 24, previousRank: 25, teamId: "2415", teamName: "Missouri Tigers", teamAbbreviation: "MIZ", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/142.png", record: "14-3", points: 178, firstPlaceVotes: 0, trend: "up", trendAmount: 1 },
    { rank: 25, previousRank: 0, teamId: "2393", teamName: "Wisconsin Badgers", teamAbbreviation: "WIS", teamLogo: "https://a.espncdn.com/i/teamlogos/ncaa/500/275.png", record: "14-4", points: 134, firstPlaceVotes: 0, trend: "new", trendAmount: 0 },
  ];

  return [{
    pollName: "AP Top 25",
    pollType: "ap",
    headline: "2025 NCAA Men's Basketball Rankings",
    lastUpdated: new Date().toISOString(),
    teams: mockTeams,
  }];
};

export const useNCAABRankings = () => {
  return useQuery({
    queryKey: ["ncaab-rankings"],
    queryFn: fetchNCAABRankings,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};

// Get ranking for a specific team by name or abbreviation
export const getTeamRanking = (rankings: RankingsData[] | undefined, teamName: string): number | null => {
  if (!rankings || rankings.length === 0) return null;
  
  const apPoll = rankings.find(r => r.pollType === "ap") || rankings[0];
  const normalizedSearch = teamName.toLowerCase().trim();
  
  const team = apPoll.teams.find(t => 
    t.teamName.toLowerCase().includes(normalizedSearch) ||
    t.teamAbbreviation.toLowerCase() === normalizedSearch
  );
  
  return team?.rank ?? null;
};
