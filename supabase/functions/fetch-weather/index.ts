import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limiter.ts";
import { fetchWithRetry } from "../_shared/fetch-utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherRequest {
  latitude: number;
  longitude: number;
  venueKey?: string;
}

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

// Helper functions
function degreesToCardinal(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

function mapCondition(weatherId: number, main: string): { condition: string; playable: boolean } {
  if (weatherId >= 200 && weatherId < 300) return { condition: 'thunderstorm', playable: false };
  if (weatherId >= 300 && weatherId < 400) return { condition: 'drizzle', playable: true };
  if (weatherId >= 500 && weatherId < 600) return { condition: 'rain', playable: weatherId < 502 };
  if (weatherId >= 600 && weatherId < 700) return { condition: 'snow', playable: weatherId < 602 };
  if (weatherId >= 700 && weatherId < 800) return { condition: weatherId === 741 ? 'fog' : 'mist', playable: true };
  if (weatherId === 800) return { condition: 'clear', playable: true };
  if (weatherId > 800 && weatherId < 900) return { condition: 'clouds', playable: true };
  return { condition: main.toLowerCase(), playable: true };
}

function kelvinToFahrenheit(kelvin: number): number { return Math.round((kelvin - 273.15) * 9/5 + 32); }
function kelvinToCelsius(kelvin: number): number { return Math.round(kelvin - 273.15); }
function msToMph(ms: number): number { return Math.round(ms * 2.237); }
function metersToMiles(meters: number): number { return Math.round(meters / 1609.34 * 10) / 10; }

function getWeatherIcon(condition: string): string {
  const icons: Record<string, string> = {
    clear: '☀️', clouds: '☁️', rain: '🌧️', drizzle: '🌦️',
    snow: '❄️', thunderstorm: '⛈️', mist: '🌫️', fog: '🌁', wind: '💨',
  };
  return icons[condition] || '🌤️';
}

function generateSimulatedWeather(lat: number, lon: number) {
  const now = new Date();
  const month = now.getMonth();
  const isWinter = month >= 11 || month <= 2;
  const isSummer = month >= 5 && month <= 8;
  const latFactor = Math.abs(lat - 35) / 20;
  let baseTemp = isSummer ? 78 : isWinter ? 42 : 60;
  baseTemp -= latFactor * (isWinter ? 15 : 8);
  const seed = (lat * 1000 + lon * 100) % 100;
  const variance = ((seed % 20) - 10);
  const temperature = Math.round(baseTemp + variance);
  let condition = 'clear';
  let playable = true;
  if (seed < 15) { condition = isWinter && temperature < 35 ? 'snow' : 'rain'; playable = seed > 10; }
  else if (seed < 30) { condition = 'clouds'; }
  else if (seed > 85) { condition = 'wind'; }
  const windSpeed = 5 + (seed % 20);
  const response: WeatherResponse = {
    temperature, temperatureCelsius: Math.round((temperature - 32) * 5/9),
    feelsLike: temperature - (windSpeed > 15 ? 5 : 0), condition, conditionDescription: condition,
    humidity: 40 + (seed % 40), windSpeed,
    windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][seed % 8],
    windGust: windSpeed > 15 ? windSpeed + 10 : null,
    precipitation: condition === 'rain' || condition === 'snow' ? 0.1 + (seed % 5) / 10 : 0,
    visibility: condition === 'rain' || condition === 'snow' ? 5 : 10,
    uvIndex: isSummer ? 6 + (seed % 4) : 2 + (seed % 3),
    pressure: 1010 + (seed % 20), isOutdoorPlayable: playable,
    icon: getWeatherIcon(condition), cached: false,
  };
  const dbRecord = {
    temperature, temperature_celsius: response.temperatureCelsius, feels_like: response.feelsLike,
    condition, condition_description: condition, humidity: response.humidity,
    wind_speed: windSpeed, wind_direction: response.windDirection, wind_gust: response.windGust,
    precipitation: response.precipitation, visibility: response.visibility,
    uv_index: response.uvIndex, pressure: response.pressure, is_outdoor_playable: playable,
  };
  return { response, dbRecord };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const rateLimitResult = await checkRateLimit(req, {
    ...RATE_LIMITS.PUBLIC_READ,
    endpoint: "fetch-weather",
  });
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult, corsHeaders);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openWeatherApiKey = Deno.env.get('OPENWEATHERMAP_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { latitude, longitude, venueKey }: WeatherRequest = await req.json();

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cacheKey = venueKey || `${latitude.toFixed(4)}_${longitude.toFixed(4)}`;

    // Check cache first
    const { data: cachedWeather } = await supabase
      .from('weather_cache')
      .select('*')
      .eq('venue_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    if (cachedWeather) {
      console.log(`Cache hit for ${cacheKey}`);
      const response: WeatherResponse = {
        temperature: Number(cachedWeather.temperature),
        temperatureCelsius: Number(cachedWeather.temperature_celsius),
        feelsLike: Number(cachedWeather.feels_like) || Number(cachedWeather.temperature),
        condition: cachedWeather.condition,
        conditionDescription: cachedWeather.condition_description || cachedWeather.condition,
        humidity: cachedWeather.humidity || 50,
        windSpeed: Number(cachedWeather.wind_speed) || 0,
        windDirection: cachedWeather.wind_direction || 'N',
        windGust: cachedWeather.wind_gust ? Number(cachedWeather.wind_gust) : null,
        precipitation: Number(cachedWeather.precipitation) || 0,
        visibility: Number(cachedWeather.visibility) || 10,
        uvIndex: Number(cachedWeather.uv_index) || 0,
        pressure: cachedWeather.pressure || 1013,
        isOutdoorPlayable: cachedWeather.is_outdoor_playable,
        icon: getWeatherIcon(cachedWeather.condition),
        cached: true,
      };
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!openWeatherApiKey) {
      console.log('No API key, generating simulated weather');
      const simulated = generateSimulatedWeather(latitude, longitude);
      await supabase.from('weather_cache').insert({
        venue_key: cacheKey, latitude, longitude, ...simulated.dbRecord,
      });
      return new Response(JSON.stringify({ ...simulated.response, cached: false, simulated: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching weather for ${latitude}, ${longitude}`);
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${openWeatherApiKey}`;
    
    const weatherRes = await fetchWithRetry(weatherUrl, { timeout: 10000 }, { maxRetries: 1 });
    
    if (!weatherRes.ok) {
      const errorText = await weatherRes.text();
      console.error('OpenWeatherMap API error:', errorText);
      const simulated = generateSimulatedWeather(latitude, longitude);
      return new Response(JSON.stringify({ ...simulated.response, cached: false, simulated: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const weatherData = await weatherRes.json();

    const { condition, playable } = mapCondition(weatherData.weather[0].id, weatherData.weather[0].main);
    const temperature = kelvinToFahrenheit(weatherData.main.temp);
    const temperatureCelsius = kelvinToCelsius(weatherData.main.temp);
    const feelsLike = kelvinToFahrenheit(weatherData.main.feels_like);
    const windSpeed = msToMph(weatherData.wind?.speed || 0);
    const windGust = weatherData.wind?.gust ? msToMph(weatherData.wind.gust) : null;
    const visibility = metersToMiles(weatherData.visibility || 10000);
    const precipitation = (weatherData.rain?.['1h'] || 0) + (weatherData.snow?.['1h'] || 0);

    let isOutdoorPlayable = playable;
    if (windSpeed > 40) isOutdoorPlayable = false;
    if (temperature < 0 || temperature > 110) isOutdoorPlayable = false;

    const response: WeatherResponse = {
      temperature, temperatureCelsius, feelsLike, condition,
      conditionDescription: weatherData.weather[0].description,
      humidity: weatherData.main.humidity, windSpeed,
      windDirection: degreesToCardinal(weatherData.wind?.deg || 0),
      windGust, precipitation: Math.round(precipitation * 100) / 100,
      visibility, uvIndex: 0, pressure: weatherData.main.pressure,
      isOutdoorPlayable, icon: getWeatherIcon(condition), cached: false,
    };

    await supabase.from('weather_cache').insert({
      venue_key: cacheKey, latitude, longitude, temperature,
      temperature_celsius: temperatureCelsius, feels_like: feelsLike, condition,
      condition_description: weatherData.weather[0].description,
      humidity: weatherData.main.humidity, wind_speed: windSpeed,
      wind_direction: degreesToCardinal(weatherData.wind?.deg || 0),
      wind_gust: windGust, precipitation, visibility,
      uv_index: 0, pressure: weatherData.main.pressure,
      is_outdoor_playable: isOutdoorPlayable,
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-weather:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
