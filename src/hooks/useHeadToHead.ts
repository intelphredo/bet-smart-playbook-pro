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

      // Fetch real data from ESPN
      const realData = await fetchHeadToHeadHistory(
        team1.league,
        team1.id,
        team1.name,
        team2.id,
        team2.name
      );

      return realData;
    },
    enabled: Boolean(team1 && team2),
    staleTime: 2 * 60 * 1000, // 2 minutes - refresh more often
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 2,
    refetchOnWindowFocus: false,
  });
};
