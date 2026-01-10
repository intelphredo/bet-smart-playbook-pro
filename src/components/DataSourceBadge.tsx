
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

export interface DataSourceInfo {
  source: "live" | "mock";
  lastUpdated: Date;
  gamesLoaded: number;
  errors?: string[];
}

interface DataSourceBadgeProps {
  dataSource: DataSourceInfo;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  compact?: boolean;
}

const DataSourceBadge = ({ 
  dataSource, 
  onRefresh, 
  isRefreshing = false,
  compact = false 
}: DataSourceBadgeProps) => {
  const isLive = dataSource.source === "live";
  
  if (compact) {
    return (
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
