import { useMemo } from "react";
import { Match } from "@/types";

export interface MatchesByStatusResult {
  baseMatches: Match[];
  upcomingMatches: Match[];
  liveMatches: Match[];
  finishedMatches: Match[];
  allMatches: Match[];
  isLoading: boolean;
  error: Error | null;
  refetchSchedule: () => any;
  selectedDivisionsStandings?: any;
  selectedIsLoadingStandings?: boolean;
  selectedStandingsError?: Error | null;
  selectedFetchLiveGameData?: (gameId: string) => Promise<any>;
}

export function useMatchesByStatus(allMatches: Match[]): MatchesByStatusResult {
  return useMemo(() => {
    const upcomingMatches = allMatches.filter(m => m.status === "scheduled" || m.status === "pre");
    const liveMatches = allMatches.filter(m => m.status === "live");
    const finishedMatches = allMatches.filter(m => m.status === "finished");

    return {
      upcomingMatches,
      liveMatches,
      finishedMatches,
      allMatches
    };
  }, [allMatches]);
}

export function useMatchesByStatusMultiSource(
  dataSource: string,
  useExternalApis: boolean,
  apiData: any,
  anData: any,
  mlbData: any,
  espnData: any
) {
  let baseMatches: Match[] = [];
  let isLoading = false;
  let error: Error | null = null;
  
  switch(dataSource) {
    case 'API':
      baseMatches = apiData.allMatches;
      isLoading = apiData.isLoading;
      error = apiData.error;
      break;
    case 'ACTION':
      baseMatches = anData.allMatches;
      isLoading = anData.isLoading;
      error = anData.error;
      break;
    case 'MLB':
      baseMatches = mlbData.allMatches;
      isLoading = mlbData.isLoadingSchedule;
      error = mlbData.scheduleError;
      break;
    case 'ESPN':
    default:
      baseMatches = espnData.allMatches;
      isLoading = espnData.isLoading;
      error = espnData.error;
      break;
  }

  const { upcomingMatches, liveMatches, finishedMatches, allMatches } = useMatchesByStatus(baseMatches);

  let additionalProps = {};
  if (dataSource === 'MLB') {
    additionalProps = {
      selectedDivisionsStandings: mlbData.divisionsStandings,
      selectedIsLoadingStandings: mlbData.isLoadingStandings,
      selectedStandingsError: mlbData.standingsError,
      selectedFetchLiveGameData: mlbData.fetchLiveGameData,
    };
  }

  const refetchSchedule = () => {
    switch(dataSource) {
      case 'API':
        return apiData.refetch();
      case 'ACTION':
        return anData.refetch();
      case 'MLB':
        return mlbData.refetchSchedule();
      case 'ESPN':
      default:
        return espnData.refetch();
    }
  };

  return {
    baseMatches,
    upcomingMatches,
    liveMatches, 
    finishedMatches,
    allMatches,
    isLoading,
    error,
    refetchSchedule,
    ...additionalProps
  };
}
