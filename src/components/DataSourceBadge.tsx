import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Clock, RefreshCw, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

export interface DataSourceInfo {
  source: "live" | "mock";
  lastUpdated: Date;
  gamesLoaded: number;
  errors?: string[];
}

export interface OddsApiStatus {
  isLoading: boolean;
  isError: boolean;
  matchCount: number;
  hasData: boolean;
}

interface DataSourceBadgeProps {
  dataSource: DataSourceInfo;
  oddsApiStatus?: OddsApiStatus;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  compact?: boolean;
}

const DataSourceBadge = ({ 
  dataSource, 
  oddsApiStatus,
  onRefresh, 
  isRefreshing = false,
  compact = false 
}: DataSourceBadgeProps) => {
  const isLive = dataSource.source === "live";
  const hasOdds = oddsApiStatus?.hasData;
  
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={`gap-1.5 ${
                isLive 
                  ? "bg-green-500/10 text-green-600 border-green-500/30 dark:text-green-400" 
                  : "bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400"
              }`}
            >
              {isLive ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              {isLive ? "Live" : "Demo"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p className="font-medium">
                {isLive ? "Live ESPN Data" : "Demo Mode (Mock Data)"}
              </p>
              <p className="text-muted-foreground">
                {dataSource.gamesLoaded} games loaded
              </p>
              <p className="text-muted-foreground">
                Updated {formatDistanceToNow(dataSource.lastUpdated, { addSuffix: true })}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>

        {oddsApiStatus && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={`gap-1.5 ${
                  hasOdds 
                    ? "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400" 
                    : oddsApiStatus.isLoading
                    ? "bg-gray-500/10 text-gray-600 border-gray-500/30"
                    : "bg-red-500/10 text-red-600 border-red-500/30 dark:text-red-400"
                }`}
              >
                <DollarSign className="h-3 w-3" />
                {hasOdds ? "Live Odds" : oddsApiStatus.isLoading ? "Loading..." : "No Odds"}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <p className="font-medium">
                  {hasOdds ? "Real Sportsbook Odds" : "Odds API Status"}
                </p>
                <p className="text-muted-foreground">
                  {hasOdds 
                    ? `${oddsApiStatus.matchCount} events with odds from DraftKings, FanDuel, BetMGM & more`
                    : oddsApiStatus.isError 
                    ? "Failed to fetch odds"
                    : "Loading odds data..."}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border/50">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-full ${
          isLive 
            ? "bg-green-500/10" 
            : "bg-amber-500/10"
        }`}>
          {isLive ? (
            <Wifi className={`h-4 w-4 ${isLive ? "text-green-500" : "text-amber-500"}`} />
          ) : (
            <WifiOff className="h-4 w-4 text-amber-500" />
          )}
        </div>
        
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {isLive ? "Live ESPN Data" : "Demo Mode"}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Updated {formatDistanceToNow(dataSource.lastUpdated, { addSuffix: true })}
          </span>
        </div>
      </div>

      {oddsApiStatus && (
        <div className="flex items-center gap-2 px-3 border-l border-border/50">
          <div className={`p-2 rounded-full ${
            hasOdds 
              ? "bg-blue-500/10" 
              : "bg-gray-500/10"
          }`}>
            <DollarSign className={`h-4 w-4 ${hasOdds ? "text-blue-500" : "text-gray-500"}`} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {hasOdds ? "Live Sportsbook Odds" : "Odds Loading..."}
            </span>
            <span className="text-xs text-muted-foreground">
              {hasOdds 
                ? `${oddsApiStatus.matchCount} events • DraftKings, FanDuel, BetMGM`
                : "Fetching from The Odds API"}
            </span>
          </div>
        </div>
      )}
      
      <Badge 
        variant="secondary" 
        className="ml-auto"
      >
        {dataSource.gamesLoaded} games
      </Badge>
      
      {onRefresh && (
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      )}
    </div>
  );
};

export default DataSourceBadge;
