import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Cloud, CloudRain, CloudSnow, Sun, Wind, Thermometer, Droplets, AlertTriangle } from "lucide-react";
import type { WeatherData, VenueInfo } from "@/types/weather";
import { getWeatherImpactDescription, isWeatherSevere } from "@/services/weatherService";
import { cn } from "@/lib/utils";

interface WeatherDisplayProps {
  weather: WeatherData;
  venue?: VenueInfo | null;
  league: string;
  compact?: boolean;
  showVenue?: boolean;
}

const getWeatherIcon = (condition: string) => {
  switch (condition) {
    case 'clear':
      return <Sun className="h-4 w-4 text-yellow-500" />;
    case 'clouds':
      return <Cloud className="h-4 w-4 text-muted-foreground" />;
    case 'rain':
    case 'drizzle':
      return <CloudRain className="h-4 w-4 text-blue-500" />;
    case 'snow':
      return <CloudSnow className="h-4 w-4 text-blue-200" />;
    case 'thunderstorm':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case 'wind':
      return <Wind className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Cloud className="h-4 w-4 text-muted-foreground" />;
  }
};

const getImpactColor = (weather: WeatherData): string => {
  if (isWeatherSevere(weather)) return 'bg-destructive/20 text-destructive border-destructive/30';
  if (weather.windSpeed > 15 || weather.temperature < 45 || weather.temperature > 85) {
    return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30';
  }
  return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30';
};

export function WeatherDisplay({ 
  weather, 
  venue, 
  league, 
  compact = false,
  showVenue = false 
}: WeatherDisplayProps) {
  const impactDescription = getWeatherImpactDescription(weather, league);
  const isSevere = isWeatherSevere(weather);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn(
                "gap-1 px-2 py-0.5 text-xs cursor-help",
                getImpactColor(weather)
              )}
            >
              {getWeatherIcon(weather.condition)}
              <span>{weather.temperature}°F</span>
              {weather.windSpeed > 10 && (
                <span className="flex items-center gap-0.5">
                  <Wind className="h-3 w-3" />
                  {weather.windSpeed}
                </span>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1.5">
              <div className="font-medium flex items-center gap-2">
                {getWeatherIcon(weather.condition)}
                <span className="capitalize">{weather.conditionDescription}</span>
              </div>
              {showVenue && venue && (
                <p className="text-xs text-muted-foreground">
                  {venue.venueName}, {venue.city}
                </p>
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="flex items-center gap-1">
                  <Thermometer className="h-3 w-3" />
                  <span>Feels like {weather.feelsLike}°F</span>
                </div>
                <div className="flex items-center gap-1">
                  <Droplets className="h-3 w-3" />
                  <span>{weather.humidity}% humidity</span>
                </div>
                <div className="flex items-center gap-1">
                  <Wind className="h-3 w-3" />
                  <span>{weather.windSpeed} mph {weather.windDirection}</span>
                </div>
                {weather.precipitation > 0 && (
                  <div className="flex items-center gap-1">
                    <CloudRain className="h-3 w-3" />
                    <span>{weather.precipitation}" precip</span>
                  </div>
                )}
              </div>
              <p className={cn(
                "text-xs pt-1 border-t",
                isSevere ? "text-destructive" : "text-muted-foreground"
              )}>
                {impactDescription}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full display
  return (
    <div className={cn(
      "rounded-lg border p-3",
      isSevere ? "border-destructive/30 bg-destructive/5" : "border-border/50 bg-muted/30"
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-background">
            {getWeatherIcon(weather.condition)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{weather.temperature}°F</span>
              <span className="text-sm text-muted-foreground capitalize">
                {weather.conditionDescription}
              </span>
            </div>
            {venue && showVenue && (
              <p className="text-xs text-muted-foreground">
                {venue.venueName}, {venue.city}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Wind className="h-3 w-3" />
            <span>{weather.windSpeed} mph {weather.windDirection}</span>
          </div>
          <div className="flex items-center gap-1">
            <Droplets className="h-3 w-3" />
            <span>{weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Thermometer className="h-3 w-3" />
            <span>Feels {weather.feelsLike}°F</span>
          </div>
          {weather.windGust && (
            <div className="flex items-center gap-1">
              <Wind className="h-3 w-3" />
              <span>Gusts {weather.windGust}</span>
            </div>
          )}
        </div>
      </div>

      <div className={cn(
        "mt-2 pt-2 border-t text-xs",
        isSevere ? "border-destructive/20 text-destructive" : "border-border/50 text-muted-foreground"
      )}>
        {isSevere && <AlertTriangle className="h-3 w-3 inline mr-1" />}
        {impactDescription}
      </div>
    </div>
  );
}

interface IndoorBadgeProps {
  venueName?: string;
}

export function IndoorBadge({ venueName }: IndoorBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className="gap-1 px-2 py-0.5 text-xs bg-accent/50 border-accent cursor-help"
          >
            <span>🏟️</span>
            <span>Indoor</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">
            {venueName ? `${venueName} - ` : ''}Climate-controlled dome stadium
          </p>
          <p className="text-xs text-muted-foreground">No weather impact on game</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default WeatherDisplay;
