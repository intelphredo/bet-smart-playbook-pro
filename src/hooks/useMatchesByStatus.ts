
import { Match, DataSource } from "@/types/sports";

interface MatchesByStatus {
  baseMatches: Match[];
  baseUpcomingMatches: Match[];
  baseLiveMatches: Match[];
  baseFinishedMatches: Match[];
  isLoading: boolean;
  error: any;
  refetchSchedule: () => void;
  selectedDivisionsStandings: any[];
  selectedIsLoadingStandings: boolean;
  selectedStandingsError: any;
  selectedFetchLiveGameData?: () => void;
}

export function useMatchesByStatus(
  dataSource: DataSource | "ALL",
  useExternalApis: boolean,
  apiMatches: any,
  mlbMatches: any,
  espnMatches: any
): MatchesByStatus {
  if (useExternalApis && dataSource === "API") {
    return {
      baseMatches: apiMatches.allMatches,
      baseUpcomingMatches: apiMatches.upcomingMatches,
      baseLiveMatches: apiMatches.liveMatches,
      baseFinishedMatches: apiMatches.finishedMatches,
      isLoading: apiMatches.isLoading,
      error: apiMatches.error,
      refetchSchedule: apiMatches.refetch,
      selectedDivisionsStandings: [],
      selectedIsLoadingStandings: false,
      selectedStandingsError: null,
      selectedFetchLiveGameData: undefined
    };
  }

  if (dataSource === "MLB") {
    return {
      baseMatches: mlbMatches.allMatches,
      baseUpcomingMatches: mlbMatches.upcomingMatches,
      baseLiveMatches: mlbMatches.liveMatches,
      baseFinishedMatches: mlbMatches.finishedMatches,
      isLoading: mlbMatches.isLoadingSchedule,
      error: mlbMatches.scheduleError,
      refetchSchedule: mlbMatches.refetchSchedule,
      selectedDivisionsStandings: mlbMatches.divisionsStandings,
      selectedIsLoadingStandings: mlbMatches.isLoadingStandings,
      selectedStandingsError: mlbMatches.standingsError,
      selectedFetchLiveGameData: mlbMatches.fetchLiveGameData
    };
  }

  return {
    baseMatches: espnMatches.allMatches,
    baseUpcomingMatches: espnMatches.upcomingMatches,
    baseLiveMatches: espnMatches.liveMatches,
    baseFinishedMatches: espnMatches.finishedMatches,
    isLoading: espnMatches.isLoading,
    error: espnMatches.error,
    refetchSchedule: espnMatches.refetch,
    selectedDivisionsStandings: [],
    selectedIsLoadingStandings: false,
    selectedStandingsError: null,
    selectedFetchLiveGameData: undefined
  };
}
