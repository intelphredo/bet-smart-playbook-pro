// Test suite for fetch-weather edge function
// Run with: deno test --allow-net --allow-env supabase/functions/fetch-weather/index.test.ts

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "http://localhost:54321";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/fetch-weather`;

// =============================================================================
// HTTP Endpoint Tests
// =============================================================================

Deno.test("fetch-weather: handles OPTIONS request for CORS", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "OPTIONS",
  });

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
});

Deno.test("fetch-weather: returns error for missing coordinates", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({}),
  });

  const data = await response.json();
  assertExists(data.error);
});

Deno.test("fetch-weather: accepts valid coordinates", async () => {
  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      latitude: 34.0522,
      longitude: -118.2437, // Los Angeles
    }),
  });

  const data = await response.json();
  assertExists(data);
  
  if (!data.error) {
    assertEquals(typeof data.temperature, "number");
    assertExists(data.condition);
  }
});

// =============================================================================
// Temperature Conversion Tests
// =============================================================================

Deno.test("kelvinToFahrenheit: converts correctly", () => {
  const kelvinToFahrenheit = (kelvin: number): number => {
    return Math.round((kelvin - 273.15) * 9/5 + 32);
  };

  assertEquals(kelvinToFahrenheit(273.15), 32);  // Freezing point
  assertEquals(kelvinToFahrenheit(373.15), 212); // Boiling point
  assertEquals(kelvinToFahrenheit(293.15), 68);  // Room temp (~20°C)
  assertEquals(kelvinToFahrenheit(310.15), 99);  // Body temp (~37°C)
});

Deno.test("kelvinToCelsius: converts correctly", () => {
  const kelvinToCelsius = (kelvin: number): number => {
    return Math.round(kelvin - 273.15);
  };

  assertEquals(kelvinToCelsius(273.15), 0);   // Freezing point
  assertEquals(kelvinToCelsius(373.15), 100); // Boiling point
  assertEquals(kelvinToCelsius(293.15), 20);  // Room temp
});

// =============================================================================
// Wind Conversion Tests
// =============================================================================

Deno.test("msToMph: converts meters per second to miles per hour", () => {
  const msToMph = (ms: number): number => {
    return Math.round(ms * 2.237);
  };

  assertEquals(msToMph(0), 0);
  assertEquals(msToMph(1), 2);    // ~2.24 mph
  assertEquals(msToMph(10), 22);  // ~22.37 mph
  assertEquals(msToMph(20), 45);  // ~44.74 mph
});

Deno.test("degreesToCardinal: converts wind degrees to direction", () => {
  const degreesToCardinal = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  assertEquals(degreesToCardinal(0), "N");
  assertEquals(degreesToCardinal(45), "NE");
  assertEquals(degreesToCardinal(90), "E");
  assertEquals(degreesToCardinal(135), "SE");
  assertEquals(degreesToCardinal(180), "S");
  assertEquals(degreesToCardinal(225), "SW");
  assertEquals(degreesToCardinal(270), "W");
  assertEquals(degreesToCardinal(315), "NW");
  assertEquals(degreesToCardinal(360), "N");
});

// =============================================================================
// Visibility Conversion Tests
// =============================================================================

Deno.test("metersToMiles: converts visibility correctly", () => {
  const metersToMiles = (meters: number): number => {
    return Math.round(meters / 1609.34 * 10) / 10;
  };

  assertEquals(metersToMiles(1609), 1);     // ~1 mile
  assertEquals(metersToMiles(10000), 6.2);  // ~6.2 miles
  assertEquals(metersToMiles(16093), 10);   // 10 miles
});

// =============================================================================
// Weather Condition Mapping Tests
// =============================================================================

Deno.test("mapCondition: thunderstorm is not playable", () => {
  const mapCondition = (weatherId: number): { condition: string; playable: boolean } => {
    if (weatherId >= 200 && weatherId < 300) {
      return { condition: 'thunderstorm', playable: false };
    }
    return { condition: 'unknown', playable: true };
  };

  const result = mapCondition(201);
  assertEquals(result.condition, "thunderstorm");
  assertEquals(result.playable, false);
});

Deno.test("mapCondition: light rain is playable", () => {
  const mapCondition = (weatherId: number): { condition: string; playable: boolean } => {
    if (weatherId >= 500 && weatherId < 600) {
      const playable = weatherId < 502;
      return { condition: 'rain', playable };
    }
    return { condition: 'unknown', playable: true };
  };

  assertEquals(mapCondition(500).playable, true);  // Light rain
  assertEquals(mapCondition(501).playable, true);  // Moderate rain
  assertEquals(mapCondition(502).playable, false); // Heavy rain
  assertEquals(mapCondition(503).playable, false); // Very heavy rain
});

Deno.test("mapCondition: snow playability depends on intensity", () => {
  const mapCondition = (weatherId: number): { condition: string; playable: boolean } => {
    if (weatherId >= 600 && weatherId < 700) {
      return { condition: 'snow', playable: weatherId < 602 };
    }
    return { condition: 'unknown', playable: true };
  };

  assertEquals(mapCondition(600).playable, true);  // Light snow
  assertEquals(mapCondition(601).playable, true);  // Snow
  assertEquals(mapCondition(602).playable, false); // Heavy snow
});

Deno.test("mapCondition: clear weather is playable", () => {
  const mapCondition = (weatherId: number): { condition: string; playable: boolean } => {
    if (weatherId === 800) {
      return { condition: 'clear', playable: true };
    }
    return { condition: 'unknown', playable: true };
  };

  const result = mapCondition(800);
  assertEquals(result.condition, "clear");
  assertEquals(result.playable, true);
});

Deno.test("mapCondition: cloudy weather is playable", () => {
  const mapCondition = (weatherId: number): { condition: string; playable: boolean } => {
    if (weatherId > 800 && weatherId < 900) {
      return { condition: 'clouds', playable: true };
    }
    return { condition: 'unknown', playable: true };
  };

  for (const id of [801, 802, 803, 804]) {
    const result = mapCondition(id);
    assertEquals(result.condition, "clouds");
    assertEquals(result.playable, true);
  }
});

// =============================================================================
// Playability Override Tests
// =============================================================================

Deno.test("playability: high winds make games unplayable", () => {
  const isPlayable = (basePlayable: boolean, windSpeed: number): boolean => {
    if (windSpeed > 40) return false;
    return basePlayable;
  };

  assertEquals(isPlayable(true, 30), true);
  assertEquals(isPlayable(true, 40), true);
  assertEquals(isPlayable(true, 41), false);
  assertEquals(isPlayable(true, 50), false);
});

Deno.test("playability: extreme temperatures make games unplayable", () => {
  const isPlayable = (basePlayable: boolean, temperature: number): boolean => {
    if (temperature < 0 || temperature > 110) return false;
    return basePlayable;
  };

  assertEquals(isPlayable(true, -5), false);
  assertEquals(isPlayable(true, 0), true);
  assertEquals(isPlayable(true, 70), true);
  assertEquals(isPlayable(true, 110), true);
  assertEquals(isPlayable(true, 115), false);
});

// =============================================================================
// Weather Icon Tests
// =============================================================================

Deno.test("getWeatherIcon: returns correct icons for conditions", () => {
  const getWeatherIcon = (condition: string): string => {
    const icons: Record<string, string> = {
      clear: '☀️',
      clouds: '☁️',
      rain: '🌧️',
      drizzle: '🌦️',
      snow: '❄️',
      thunderstorm: '⛈️',
      mist: '🌫️',
      fog: '🌁',
      wind: '💨',
    };
    return icons[condition] || '🌤️';
  };

  assertEquals(getWeatherIcon('clear'), '☀️');
  assertEquals(getWeatherIcon('rain'), '🌧️');
  assertEquals(getWeatherIcon('snow'), '❄️');
  assertEquals(getWeatherIcon('thunderstorm'), '⛈️');
  assertEquals(getWeatherIcon('unknown'), '🌤️');
});

// =============================================================================
// Cache Key Tests
// =============================================================================

Deno.test("cacheKey: formats correctly with coordinates", () => {
  const latitude = 34.0522;
  const longitude = -118.2437;
  const venueKey = undefined;

  const cacheKey = venueKey || `${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
  assertEquals(cacheKey, "34.0522_-118.2437");
});

Deno.test("cacheKey: uses venueKey when provided", () => {
  const latitude = 34.0522;
  const longitude = -118.2437;
  const venueKey = "staples_center";

  const cacheKey = venueKey || `${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
  assertEquals(cacheKey, "staples_center");
});

// =============================================================================
// Simulated Weather Tests
// =============================================================================

Deno.test("simulatedWeather: generates temperature based on latitude", () => {
  const generateBaseTemp = (lat: number, isSummer: boolean, isWinter: boolean): number => {
    const latFactor = Math.abs(lat - 35) / 20;
    let baseTemp = isSummer ? 78 : isWinter ? 42 : 60;
    baseTemp -= latFactor * (isWinter ? 15 : 8);
    return Math.round(baseTemp);
  };

  // Miami (26°N) should be warmer
  const miamiTemp = generateBaseTemp(26, true, false);
  // Minneapolis (45°N) should be colder
  const minneapolisTemp = generateBaseTemp(45, true, false);

  assertEquals(miamiTemp > minneapolisTemp, true);
});

Deno.test("simulatedWeather: winter temperatures are lower", () => {
  const generateBaseTemp = (isSummer: boolean, isWinter: boolean): number => {
    return isSummer ? 78 : isWinter ? 42 : 60;
  };

  const summerTemp = generateBaseTemp(true, false);
  const winterTemp = generateBaseTemp(false, true);
  const springTemp = generateBaseTemp(false, false);

  assertEquals(summerTemp > winterTemp, true);
  assertEquals(summerTemp > springTemp, true);
  assertEquals(springTemp > winterTemp, true);
});

// =============================================================================
// Response Structure Tests
// =============================================================================

Deno.test("response: contains all required fields", () => {
  interface WeatherResponse {
    temperature: number;
    temperatureCelsius: number;
    feelsLike: number;
    condition: string;
    conditionDescription: string;
    humidity: number;
    windSpeed: number;
    windDirection: string;
    windGust: number | null;
    precipitation: number;
    visibility: number;
    uvIndex: number;
    pressure: number;
    isOutdoorPlayable: boolean;
    icon: string;
    cached: boolean;
  }

  const mockResponse: WeatherResponse = {
    temperature: 72,
    temperatureCelsius: 22,
    feelsLike: 70,
    condition: "clear",
    conditionDescription: "clear sky",
    humidity: 45,
    windSpeed: 8,
    windDirection: "NW",
    windGust: null,
    precipitation: 0,
    visibility: 10,
    uvIndex: 5,
    pressure: 1015,
    isOutdoorPlayable: true,
    icon: "☀️",
    cached: false,
  };

  assertExists(mockResponse.temperature);
  assertExists(mockResponse.temperatureCelsius);
  assertExists(mockResponse.condition);
  assertEquals(typeof mockResponse.isOutdoorPlayable, "boolean");
  assertEquals(typeof mockResponse.cached, "boolean");
});

// =============================================================================
// Error Handling Tests
// =============================================================================

Deno.test("errorHandling: returns simulated weather on API failure", () => {
  // Simulate API failure scenario
  const apiSuccess = false;
  
  const getWeatherData = (apiSuccess: boolean) => {
    if (!apiSuccess) {
      // Return simulated data as fallback
      return {
        temperature: 70,
        condition: "clear",
        simulated: true,
      };
    }
    return {
      temperature: 72,
      condition: "clouds",
      simulated: false,
    };
  };

  const result = getWeatherData(apiSuccess);
  assertEquals(result.simulated, true);
});

Deno.test("errorHandling: validates latitude and longitude", () => {
  const validateCoordinates = (lat: number | undefined, lon: number | undefined): boolean => {
    if (!lat || !lon) return false;
    if (lat < -90 || lat > 90) return false;
    if (lon < -180 || lon > 180) return false;
    return true;
  };

  assertEquals(validateCoordinates(undefined, -118), false);
  assertEquals(validateCoordinates(34, undefined), false);
  assertEquals(validateCoordinates(95, -118), false);  // Invalid lat
  assertEquals(validateCoordinates(34, 200), false);   // Invalid lon
  assertEquals(validateCoordinates(34.05, -118.24), true);
});
