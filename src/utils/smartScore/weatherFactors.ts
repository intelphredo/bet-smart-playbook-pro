import { Match } from "@/types/sports";
import type { WeatherData, WeatherFactor, WeatherImpactResult, WEATHER_THRESHOLDS } from "@/types/weather";

/**
 * Calculate weather impact on a match using real weather data
 * Falls back to simulated data if real weather is not available
 */
export function calculateWeatherImpact(
  match: Match,
  weatherData?: WeatherData | null
): WeatherImpactResult {
  // Indoor sports have no weather impact
  if (['NBA', 'NHL'].includes(match.league)) {
    return {
      weatherImpact: 95,
      weatherFactors: [{
        key: 'indoor-sport',
        impact: 'positive',
        weight: 2,
        description: 'Indoor climate-controlled environment'
      }]
    };
  }

  // If we have real weather data, use it
  if (weatherData) {
    return calculateRealWeatherImpact(match, weatherData);
  }

  // Fallback to simulated weather based on match data
  return calculateSimulatedWeatherImpact(match);
}

/**
 * Calculate impact from real weather data
 */
function calculateRealWeatherImpact(
  match: Match,
  weather: WeatherData
): WeatherImpactResult {
  let weatherImpact = 80;
  const weatherFactors: WeatherFactor[] = [];

  // League-specific calculations
  switch (match.league) {
    case 'MLB':
      return calculateMLBRealWeatherImpact(weather);
    case 'NFL':
      return calculateNFLRealWeatherImpact(weather);
    case 'SOCCER':
      return calculateSoccerRealWeatherImpact(weather);
    default:
      return calculateGenericWeatherImpact(weather);
  }
}

/**
 * MLB-specific weather impact with real data
 */
function calculateMLBRealWeatherImpact(weather: WeatherData): WeatherImpactResult {
  let weatherImpact = 80;
  const weatherFactors: WeatherFactor[] = [];

  // Wind is critical for baseball
  if (weather.windSpeed >= 20) {
    weatherImpact -= 25;
    weatherFactors.push({
      key: 'high-wind-mlb',
      impact: 'negative',
      weight: 9,
      description: `High winds (${weather.windSpeed} mph) significantly affecting fly balls and pitching`
    });
  } else if (weather.windSpeed >= 12) {
    weatherImpact -= 12;
    weatherFactors.push({
      key: 'moderate-wind-mlb',
      impact: 'negative',
      weight: 6,
      description: `Moderate winds (${weather.windSpeed} mph) affecting ball flight`
    });
  }

  // Rain causes delays/postponements in MLB
  if (weather.condition === 'rain' || weather.condition === 'thunderstorm') {
    weatherImpact -= 30;
    weatherFactors.push({
      key: 'rain-mlb',
      impact: 'negative',
      weight: 10,
      description: 'Rain affecting grip, field conditions, potential delays'
    });
  } else if (weather.condition === 'drizzle') {
    weatherImpact -= 15;
    weatherFactors.push({
      key: 'drizzle-mlb',
      impact: 'negative',
      weight: 7,
      description: 'Light rain affecting pitching grip and ball handling'
    });
  }

  // Temperature effects
  if (weather.temperature < 40) {
    weatherImpact -= 15;
    weatherFactors.push({
      key: 'cold-mlb',
      impact: 'negative',
      weight: 7,
      description: `Cold conditions (${weather.temperature}°F) affecting bat speed and ball travel`
    });
  } else if (weather.temperature > 90) {
    weatherImpact -= 10;
    weatherFactors.push({
      key: 'heat-mlb',
      impact: 'negative',
      weight: 5,
      description: `Hot conditions (${weather.temperature}°F) affecting player stamina`
    });
  }

  // Humidity affects ball travel
  if (weather.humidity > 80) {
    weatherImpact -= 5;
    weatherFactors.push({
      key: 'humidity-mlb',
      impact: 'negative',
      weight: 3,
      description: 'High humidity reducing ball carry distance'
    });
  }

  // If conditions are good
  if (weatherFactors.length === 0) {
    weatherFactors.push({
      key: 'favorable-mlb',
      impact: 'positive',
      weight: 5,
      description: `Ideal baseball weather: ${weather.temperature}°F, ${weather.conditionDescription}`
    });
  }

  return { weatherImpact: Math.max(0, weatherImpact), weatherFactors, weatherData: weather };
}

/**
 * NFL-specific weather impact with real data
 */
function calculateNFLRealWeatherImpact(weather: WeatherData): WeatherImpactResult {
  let weatherImpact = 80;
  const weatherFactors: WeatherFactor[] = [];

  // Snow has major impact on NFL
  if (weather.condition === 'snow') {
    weatherImpact -= 30;
    weatherFactors.push({
      key: 'snow-nfl',
      impact: 'negative',
      weight: 10,
      description: 'Snow affecting footing, passing game, and field conditions'
    });
  }

  // Rain affects ball handling
  if (weather.condition === 'rain' || weather.condition === 'thunderstorm') {
    weatherImpact -= 20;
    weatherFactors.push({
      key: 'rain-nfl',
      impact: 'negative',
      weight: 8,
      description: 'Rain affecting ball handling, footing, and passing accuracy'
    });
  }

  // Wind is critical for passing and kicking
  if (weather.windSpeed >= 25) {
    weatherImpact -= 25;
    weatherFactors.push({
      key: 'high-wind-nfl',
      impact: 'negative',
      weight: 9,
      description: `Strong winds (${weather.windSpeed} mph) severely impacting passing and kicking games`
    });
  } else if (weather.windSpeed >= 15) {
    weatherImpact -= 15;
    weatherFactors.push({
      key: 'moderate-wind-nfl',
      impact: 'negative',
      weight: 7,
      description: `Moderate winds (${weather.windSpeed} mph) affecting deep passes and field goals`
    });
  }

  // Extreme cold
  if (weather.temperature < 32) {
    weatherImpact -= 15;
    weatherFactors.push({
      key: 'freezing-nfl',
      impact: 'negative',
      weight: 8,
      description: `Freezing conditions (${weather.temperature}°F) affecting grip and player comfort`
    });
  } else if (weather.temperature < 40) {
    weatherImpact -= 8;
    weatherFactors.push({
      key: 'cold-nfl',
      impact: 'negative',
      weight: 5,
      description: `Cold weather (${weather.temperature}°F) impacting ball handling`
    });
  }

  // If conditions are good
  if (weatherFactors.length === 0) {
    weatherFactors.push({
      key: 'favorable-nfl',
      impact: 'positive',
      weight: 5,
      description: `Good football weather: ${weather.temperature}°F, ${weather.conditionDescription}`
    });
  }

  return { weatherImpact: Math.max(0, weatherImpact), weatherFactors, weatherData: weather };
}

/**
 * Soccer-specific weather impact with real data
 */
function calculateSoccerRealWeatherImpact(weather: WeatherData): WeatherImpactResult {
  let weatherImpact = 80;
  const weatherFactors: WeatherFactor[] = [];

  // Heavy rain affects passing and control
  if (weather.condition === 'rain' || weather.condition === 'thunderstorm') {
    weatherImpact -= 20;
    weatherFactors.push({
      key: 'rain-soccer',
      impact: 'negative',
      weight: 8,
      description: 'Rain affecting field conditions and ball control'
    });
  }

  // Snow
  if (weather.condition === 'snow') {
    weatherImpact -= 25;
    weatherFactors.push({
      key: 'snow-soccer',
      impact: 'negative',
      weight: 9,
      description: 'Snow affecting visibility and field conditions'
    });
  }

  // High winds affect crossing and long balls
  if (weather.windSpeed >= 30) {
    weatherImpact -= 15;
    weatherFactors.push({
      key: 'high-wind-soccer',
      impact: 'negative',
      weight: 7,
      description: `Strong winds (${weather.windSpeed} mph) affecting crosses and long balls`
    });
  } else if (weather.windSpeed >= 20) {
    weatherImpact -= 8;
    weatherFactors.push({
      key: 'moderate-wind-soccer',
      impact: 'negative',
      weight: 5,
      description: `Moderate winds affecting aerial play`
    });
  }

  // Temperature effects
  if (weather.temperature < 35) {
    weatherImpact -= 10;
    weatherFactors.push({
      key: 'cold-soccer',
      impact: 'negative',
      weight: 5,
      description: `Cold conditions (${weather.temperature}°F) affecting player performance`
    });
  } else if (weather.temperature > 85) {
    weatherImpact -= 15;
    weatherFactors.push({
      key: 'heat-soccer',
      impact: 'negative',
      weight: 7,
      description: `Hot conditions (${weather.temperature}°F) affecting stamina and performance`
    });
  }

  // If conditions are good
  if (weatherFactors.length === 0) {
    weatherFactors.push({
      key: 'favorable-soccer',
      impact: 'positive',
      weight: 5,
      description: `Good playing conditions: ${weather.temperature}°F, ${weather.conditionDescription}`
    });
  }

  return { weatherImpact: Math.max(0, weatherImpact), weatherFactors, weatherData: weather };
}

/**
 * Generic weather impact for other outdoor sports
 */
function calculateGenericWeatherImpact(weather: WeatherData): WeatherImpactResult {
  let weatherImpact = 80;
  const weatherFactors: WeatherFactor[] = [];

  if (weather.condition === 'rain' || weather.condition === 'thunderstorm') {
    weatherImpact -= 20;
    weatherFactors.push({
      key: 'rain-generic',
      impact: 'negative',
      weight: 7,
      description: 'Rain affecting playing conditions'
    });
  }

  if (weather.condition === 'snow') {
    weatherImpact -= 25;
    weatherFactors.push({
      key: 'snow-generic',
      impact: 'negative',
      weight: 8,
      description: 'Snow affecting playing conditions'
    });
  }

  if (weather.windSpeed >= 20) {
    weatherImpact -= 15;
    weatherFactors.push({
      key: 'wind-generic',
      impact: 'negative',
      weight: 6,
      description: `High winds (${weather.windSpeed} mph)`
    });
  }

  if (weatherFactors.length === 0) {
    weatherFactors.push({
      key: 'favorable-generic',
      impact: 'positive',
      weight: 3,
      description: 'Favorable playing conditions'
    });
  }

  return { weatherImpact: Math.max(0, weatherImpact), weatherFactors, weatherData: weather };
}

/**
 * Fallback simulated weather calculation (original logic)
 */
function calculateSimulatedWeatherImpact(match: Match): WeatherImpactResult {
  let weatherImpact = 80;
  const weatherFactors: WeatherFactor[] = [];
  
  // Seed a pseudo-random value based on match ID to ensure consistency
  const seed = match.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const pseudoRandom = (seed % 100) / 100;
  
  switch (match.league) {
    case 'MLB':
      return calculateMLBSimulatedImpact(match, pseudoRandom);
    case 'NFL':
      return calculateNFLSimulatedImpact(match, pseudoRandom);
    case 'SOCCER':
      if (pseudoRandom < 0.25) {
        weatherImpact -= 15;
        weatherFactors.push({
          key: 'rain-soccer',
          impact: 'negative',
          weight: 7,
          description: 'Rainy conditions affecting field play'
        });
      } else if (pseudoRandom < 0.35) {
        weatherImpact -= 20;
        weatherFactors.push({
          key: 'heavy-rain-soccer',
          impact: 'negative',
          weight: 8,
          description: 'Heavy rain affecting passing and visibility'
        });
      } else {
        weatherFactors.push({
          key: 'favorable-conditions-soccer',
          impact: 'positive',
          weight: 3,
          description: 'Favorable playing conditions'
        });
      }
      break;
    default:
      if (pseudoRandom < 0.3) {
        weatherImpact -= 10;
        weatherFactors.push({
          key: 'unfavorable-conditions',
          impact: 'negative',
          weight: 5,
          description: 'Potentially unfavorable weather conditions'
        });
      } else {
        weatherFactors.push({
          key: 'standard-conditions',
          impact: 'neutral',
          weight: 2,
          description: 'Standard playing conditions'
        });
      }
  }
  
  return { weatherImpact, weatherFactors };
}

function calculateMLBSimulatedImpact(match: Match, pseudoRandom: number): WeatherImpactResult {
  let weatherImpact = 80;
  const weatherFactors: WeatherFactor[] = [];
  
  const indoorVenues = ['Rays', 'Marlins', 'Blue Jays', 'Diamondbacks', 'Rangers', 'Astros'];
  const homeTeamName = match.homeTeam?.name ?? '';
  const homeTeamShort = match.homeTeam?.shortName ?? '';
  const isIndoor = indoorVenues.some(team => 
    homeTeamName.includes(team) || homeTeamShort.includes(team)
  );
  
  if (isIndoor) {
    return {
      weatherImpact: 95,
      weatherFactors: [{
        key: 'dome-baseball',
        impact: 'positive',
        weight: 8,
        description: 'Dome stadium with controlled climate'
      }]
    };
  }
  
  if (pseudoRandom < 0.15) {
    weatherImpact -= 25;
    weatherFactors.push({
      key: 'rain-baseball',
      impact: 'negative',
      weight: 9,
      description: 'Rain affecting pitching grip and ball flight'
    });
  } else if (pseudoRandom < 0.25) {
    weatherImpact -= 20;
    weatherFactors.push({
      key: 'wind-baseball',
      impact: 'negative',
      weight: 8,
      description: 'High winds affecting fly balls and pitching'
    });
  } else if (pseudoRandom < 0.45) {
    weatherImpact -= 10;
    weatherFactors.push({
      key: 'heat-baseball',
      impact: 'negative',
      weight: 6,
      description: 'Heat/humidity affecting player stamina'
    });
  } else {
    weatherFactors.push({
      key: 'favorable-baseball',
      impact: 'positive',
      weight: 3,
      description: 'Favorable baseball playing conditions'
    });
  }
  
  return { weatherImpact, weatherFactors };
}

function calculateNFLSimulatedImpact(match: Match, pseudoRandom: number): WeatherImpactResult {
  let weatherImpact = 80;
  const weatherFactors: WeatherFactor[] = [];
  
  const indoorVenues = ['Saints', 'Vikings', 'Falcons', 'Lions', 'Colts', 'Raiders', 'Cardinals', 'Cowboys', 'Texans', 'Rams', 'Chargers'];
  const nflHomeTeamName = match.homeTeam?.name ?? '';
  const nflHomeTeamShort = match.homeTeam?.shortName ?? '';
  const isIndoor = indoorVenues.some(team => 
    nflHomeTeamName.includes(team) || nflHomeTeamShort.includes(team)
  );
  
  if (isIndoor) {
    return {
      weatherImpact: 95,
      weatherFactors: [{
        key: 'dome-football',
        impact: 'positive',
        weight: 8,
        description: 'Dome stadium with ideal passing conditions'
      }]
    };
  }
  
  if (pseudoRandom < 0.15) {
    weatherImpact -= 30;
    weatherFactors.push({
      key: 'snow-football',
      impact: 'negative',
      weight: 10,
      description: 'Snow affecting field conditions and passing game'
    });
  } else if (pseudoRandom < 0.30) {
    weatherImpact -= 20;
    weatherFactors.push({
      key: 'rain-football',
      impact: 'negative',
      weight: 8,
      description: 'Rain affecting ball handling and footing'
    });
  } else if (pseudoRandom < 0.45) {
    weatherImpact -= 15;
    weatherFactors.push({
      key: 'wind-football',
      impact: 'negative',
      weight: 7,
      description: 'High winds affecting passing and kicking game'
    });
  } else {
    weatherFactors.push({
      key: 'favorable-football',
      impact: 'positive',
      weight: 3,
      description: 'Favorable football playing conditions'
    });
  }
  
  return { weatherImpact, weatherFactors };
}
