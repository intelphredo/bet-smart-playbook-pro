import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Match } from "@/types/sports";
import { useBetTracking } from "@/hooks/useBetTracking";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GroupedLeagueSelect, LEAGUE_CATEGORIES } from "@/components/filters/GroupedLeagueSelect";
import LiveRefreshIndicator from "@/components/LiveRefreshIndicator";
import { Radio, Clock, Flame, DollarSign, RefreshCw, Trophy } from "lucide-react";

const ALL_LEAGUES = Object.values(LEAGUE_CATEGORIES).flatMap(cat => cat.leagues);

interface CommandCenterTopBarProps {
  liveCount: number;
  upcomingCount: number;
  hotPicksCount: number;
  sharpSignals: number;
  selectedLeague: string;
  onLeagueChange: (league: string) => void;
  hasLiveGames: boolean;
  secondsUntilRefresh: number;
  isFetching: boolean;
  lastRefresh: Date;
  activeInterval: number;
  onRefresh: () => void;
  isLoading: boolean;
  totalGames: number;
}

export const CommandCenterTopBar = memo(function CommandCenterTopBar({
  liveCount,
  upcomingCount,
  hotPicksCount,
  sharpSignals,
  selectedLeague,
  onLeagueChange,
  hasLiveGames,
  secondsUntilRefresh,
  isFetching,
  lastRefresh,
  activeInterval,
  onRefresh,
  isLoading,
  totalGames,
}: CommandCenterTopBarProps) {
  const { stats } = useBetTracking();
  const winRate = stats?.total_bets 
    ? ((stats.wins || 0) / stats.total_bets * 100).toFixed(1) 
    : null;

  return (
    <div className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-40">
      <div className="container px-4">
        {/* Live counters row */}
        <div className="flex items-center justify-between py-2 gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-3 shrink-0">
            {/* Live counter */}
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              liveCount > 0 
                ? "bg-destructive/10 text-destructive" 
                : "bg-muted text-muted-foreground"
            )}>
              <Radio className={cn("h-3.5 w-3.5", liveCount > 0 && "animate-pulse")} />
              <span>Live: {liveCount}</span>
            </div>

            {/* Upcoming */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary">
              <Clock className="h-3.5 w-3.5" />
              <span>Upcoming: {upcomingCount}</span>
            </div>

            {/* Hot picks */}
            {hotPicksCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-orange-500/10 text-orange-500">
                <Flame className="h-3.5 w-3.5" />
                <span>Hot: {hotPicksCount}</span>
              </div>
            )}

            {/* Sharp signals */}
            {sharpSignals > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-purple-500/10 text-purple-500">
                <DollarSign className="h-3.5 w-3.5" />
                <span>Sharp: {sharpSignals}</span>
              </div>
            )}
          </div>

          {/* Right side: user stats + controls */}
          <div className="flex items-center gap-3 shrink-0">
            {winRate && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-accent text-accent-foreground">
                <Trophy className="h-3.5 w-3.5 text-primary" />
                <span>Win Rate: {winRate}%</span>
              </div>
            )}
            <LiveRefreshIndicator
              hasLiveGames={hasLiveGames}
              secondsUntilRefresh={secondsUntilRefresh}
              isFetching={isFetching}
              lastRefresh={lastRefresh}
              activeInterval={activeInterval}
            />
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={onRefresh} disabled={isLoading || isFetching}>
              <RefreshCw className={cn("h-4 w-4", (isLoading || isFetching) && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* League filter row */}
        <div className="flex items-center gap-2 pb-2">
          <GroupedLeagueSelect
            value={selectedLeague === "ALL" ? "all" : selectedLeague}
            onValueChange={(val) => onLeagueChange(val === "all" ? "ALL" : val)}
            leagues={ALL_LEAGUES}
            allLabel={`All Leagues (${totalGames})`}
            className="w-[200px]"
          />
        </div>
      </div>
    </div>
  );
});
