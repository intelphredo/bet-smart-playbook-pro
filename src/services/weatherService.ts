import { supabase } from "@/integrations/supabase/client";
import type { WeatherData, VenueInfo, WeatherCondition } from "@/types/weather";
import type { Match } from "@/types/sports";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Fetch weather data for a specific location
 */
export async function fetchWeatherForLocation(
  latitude: number,
  longitude: number,
  venueKey?: string
): Promise<WeatherData | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-weather`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ latitude, longitude, venueKey }),
    });

    if (!response.ok) {
      console.error('Weather fetch failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    return {
      temperature: data.temperature,
      temperatureCelsius: data.temperatureCelsius,
      condition: data.condition as WeatherCondition,
      conditionDescription: data.conditionDescription,
      humidity: data.humidity,
      windSpeed: data.windSpeed,
      windDirection: data.windDirection,
      windGust: data.windGust,
      precipitation: data.precipitation,
      visibility: data.visibility,
      uvIndex: data.uvIndex,
      feelsLike: data.feelsLike,
      pressure: data.pressure,
      isOutdoorPlayable: data.isOutdoorPlayable,
      icon: data.icon,
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

/**
 * Get venue coordinates for a team
 */
export async function getVenueForTeam(
  teamName: string,
  league: string
): Promise<VenueInfo | null> {
  try {
    // Try exact match first
    let { data, error } = await supabase
      .from('venue_coordinates')
      .select('*')
      .eq('league', league)
      .ilike('team_name', `%${teamName}%`)
      .limit(1)
      .single();

    if (error || !data) {
      // Try partial match on team name
      const parts = teamName.split(' ');
      for (const part of parts) {
        if (part.length < 3) continue;
        const { data: partialMatch } = await supabase
          .from('venue_coordinates')
          .select('*')
          .eq('league', league)
          .ilike('team_name', `%${part}%`)
          .limit(1)
          .single();
        
        if (partialMatch) {
          data = partialMatch;
          break;
        }
      }
    }

    if (!data) return null;

    return {
      id: data.id,
      teamName: data.team_name,
      venueName: data.venue_name,
      city: data.city,
      state: data.state,
      country: data.country,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      isOutdoor: data.is_outdoor,
      league: data.league,
    };
  } catch (error) {
    console.error('Error fetching venue:', error);
    return null;
  }
}

/**
 * Fetch weather for a match based on home team venue
 */
export async function fetchWeatherForMatch(match: Match): Promise<{
  weather: WeatherData | null;
  venue: VenueInfo | null;
  isIndoor: boolean;
}> {
  // Indoor sports don't need weather
  if (['NBA', 'NHL'].includes(match.league)) {
    return { weather: null, venue: null, isIndoor: true };
  }

  const venue = await getVenueForTeam(match.homeTeam.name, match.league);
  
  if (!venue) {
    // Try with short name
    const venueByShortName = await getVenueForTeam(
      match.homeTeam.shortName || match.homeTeam.name,
      match.league
    );
    
    if (!venueByShortName) {
      console.log(`No venue found for ${match.homeTeam.name} in ${match.league}`);
      return { weather: null, venue: null, isIndoor: false };
    }
    
    if (!venueByShortName.isOutdoor) {
      return { weather: null, venue: venueByShortName, isIndoor: true };
    }

    const weather = await fetchWeatherForLocation(
      venueByShortName.latitude,
      venueByShortName.longitude,
      `${venueByShortName.teamName}_${match.league}`
    );

    return { weather, venue: venueByShortName, isIndoor: false };
  }

  // Check if venue is indoor
  if (!venue.isOutdoor) {
    return { weather: null, venue, isIndoor: true };
  }

  const weather = await fetchWeatherForLocation(
    venue.latitude,
    venue.longitude,
    `${venue.teamName}_${match.league}`
  );

  return { weather, venue, isIndoor: false };
}

/**
 * Get weather impact description based on conditions
 */
export function getWeatherImpactDescription(
  weather: WeatherData,
  league: string
): string {
  const impacts: string[] = [];

  // Temperature impact
  if (weather.temperature < 32) {
    impacts.push('Freezing conditions');
  } else if (weather.temperature < 45) {
    impacts.push('Cold weather');
  } else if (weather.temperature > 95) {
    impacts.push('Extreme heat');
  } else if (weather.temperature > 85) {
    impacts.push('Hot conditions');
  }

  // Wind impact
  if (weather.windSpeed > 20) {
    if (league === 'MLB') {
      impacts.push('High winds affecting fly balls');
    } else if (league === 'NFL') {
      impacts.push('Strong winds impacting passing game');
    } else {
      impacts.push('High winds');
    }
  } else if (weather.windSpeed > 12) {
    impacts.push('Moderate winds');
  }

  // Precipitation
  if (weather.condition === 'rain') {
    impacts.push('Rain affecting field conditions');
  } else if (weather.condition === 'snow') {
    impacts.push('Snow impacting gameplay');
  } else if (weather.condition === 'thunderstorm') {
    impacts.push('Thunderstorm - potential delays');
  }

  if (impacts.length === 0) {
    return 'Favorable playing conditions';
  }

  return impacts.join(', ');
}

/**
 * Check if weather conditions are severe
 */
export function isWeatherSevere(weather: WeatherData): boolean {
  return (
    weather.condition === 'thunderstorm' ||
    weather.condition === 'snow' ||
    weather.windSpeed > 30 ||
    weather.temperature < 20 ||
    weather.temperature > 100 ||
    !weather.isOutdoorPlayable
  );
}
