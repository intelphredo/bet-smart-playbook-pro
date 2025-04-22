
import { useMemo } from "react";
import { Match } from "@/types/sports";
import { verifyMatchData } from "@/utils/dataVerification";

export function useMatchVerification(
  allMatches: Match[],
  espnMatches: Match[],
  apiMatches: Match[],
  anMatches: Match[],
  dataSource: DataSource | "ALL",
  useExternalApis: boolean,
  lastRefreshTime: string
) {
  const verifiedMatches = useMemo(() => {
    if (!useExternalApis || dataSource !== "ALL") {
      return allMatches.map(match => ({
        ...match,
        verification: {
          isVerified: true,
          confidenceScore: 100,
          lastUpdated: lastRefreshTime,
          sources: [dataSource]
        }
      }));
    }

    return allMatches.map(match => {
      const matchInSources = [
        { name: "ESPN", data: espnMatches.find(m => m.id === match.id) },
        { name: "API", data: apiMatches.find(m => m.id === match.id) },
        { name: "ACTION", data: anMatches.find(m => m.id === match.id) }
      ].filter(source => source.data) as { name: string; data: Match }[];

      const verification = verifyMatchData(match, matchInSources);
      
      return {
        ...match,
        verification,
        lastUpdated: lastRefreshTime
      };
    });
  }, [allMatches, espnMatches, apiMatches, anMatches, dataSource, useExternalApis, lastRefreshTime]);

  return { verifiedMatches };
}
