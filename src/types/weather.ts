
export type WeatherCondition = 
  | 'clear' 
  | 'clouds' 
  | 'rain' 
  | 'snow' 
  | 'thunderstorm' 
  | 'mist' 
  | 'wind'
  | 'drizzle'
  | 'fog';

export interface WeatherData {
  temperature: number; // Fahrenheit
  temperatureCelsius: number;
  condition: WeatherCondition;
  conditionDescription: string;
  humidity: number; // percentage
  windSpeed: number; // mph
  windDirection: string; // N, NE, E, etc.
  windGust?: number;
  precipitation: number; // inches
  visibility: number; // miles
  uvIndex: number;
  feelsLike: number;
  pressure: number;
  isOutdoorPlayable: boolean;
  icon?: string;
}

export interface WeatherFactor {
  key: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface WeatherImpactResult {
  weatherImpact: number;
  weatherFactors: WeatherFactor[];
  weatherData?: WeatherData;
}

export interface VenueInfo {
  id: string;
  teamName: string;
  venueName: string;
  city: string;
  state: string | null;
  country: string;
  latitude: number;
  longitude: number;
  isOutdoor: boolean;
  league: string;
}

export interface WeatherCacheEntry {
  id: string;
  venueKey: string;
  latitude: number | null;
  longitude: number | null;
  temperature: number;
  temperatureCelsius: number;
  feelsLike: number | null;
  condition: string;
  conditionDescription: string | null;
  humidity: number | null;
  windSpeed: number | null;
  windDirection: string | null;
  windGust: number | null;
  precipitation: number;
  visibility: number | null;
  uvIndex: number | null;
  pressure: number | null;
  isOutdoorPlayable: boolean;
  fetchedAt: string;
  expiresAt: string;
}

// Sport-specific weather thresholds
export const WEATHER_THRESHOLDS = {
  MLB: {
    windCritical: 20, // mph - significant impact on fly balls
    windModerate: 12,
    tempCold: 40,
    tempHot: 90,
    rainDelay: true, // games postponed for rain
  },
  NFL: {
    windCritical: 25, // mph - affects passing game
    windModerate: 15,
    tempCold: 32, // freezing
    tempHot: 85,
    snowImpact: true,
  },
  SOCCER: {
    windCritical: 30,
    windModerate: 20,
    tempCold: 35,
    tempHot: 85,
  },
} as const;
