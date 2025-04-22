import { Match } from "@/types";

export function calculateWeatherImpact(match: Match) {
  let weatherImpact = 80;
  const weatherFactors = [];
  // This could be enhanced with real weather data from an API
  return { weatherImpact, weatherFactors };
}
