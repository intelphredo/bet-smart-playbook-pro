import { useQuery } from "@tanstack/react-query";
import { fetchWeatherForMatch } from "@/services/weatherService";
import type { Match } from "@/types/sports";
import type { WeatherData, VenueInfo } from "@/types/weather";

interface UseMatchWeatherResult {
  weather: WeatherData | null;
  venue: VenueInfo | null;
  isIndoor: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch weather data for a match
 * Only fetches for outdoor sports (MLB, NFL, SOCCER)
 */
export function useMatchWeather(match: Match | null): UseMatchWeatherResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['match-weather', match?.id, match?.homeTeam?.name, match?.league],
    queryFn: async () => {
      if (!match) return { weather: null, venue: null, isIndoor: true };
      return fetchWeatherForMatch(match);
    },
    enabled: !!match && !['NBA', 'NHL'].includes(match.league),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 1,
  });

  return {
    weather: data?.weather ?? null,
    venue: data?.venue ?? null,
    isIndoor: data?.isIndoor ?? ['NBA', 'NHL'].includes(match?.league ?? ''),
    isLoading,
    error: error as Error | null,
  };
}

/**
 * Hook to fetch weather for multiple matches
 */
export function useMultipleMatchWeather(matches: Match[]) {
  const outdoorMatches = matches.filter(
    m => !['NBA', 'NHL'].includes(m.league)
  );

  const queries = useQuery({
    queryKey: ['matches-weather', outdoorMatches.map(m => m.id).join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        outdoorMatches.map(match => fetchWeatherForMatch(match))
      );
      
      const weatherMap = new Map<string, { weather: WeatherData | null; venue: VenueInfo | null; isIndoor: boolean }>();
      outdoorMatches.forEach((match, index) => {
        weatherMap.set(match.id, results[index]);
      });
      
      return weatherMap;
    },
    enabled: outdoorMatches.length > 0,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  return {
    weatherMap: queries.data ?? new Map(),
    isLoading: queries.isLoading,
    error: queries.error,
  };
}
