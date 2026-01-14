import { Badge } from "@/components/ui/badge";
import { LiveOdds } from "@/types/sports";
import { getPrimaryOdds, formatAmericanOdds, PRIMARY_SPORTSBOOK } from "@/utils/sportsbook";
import { Star, TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { OddsMovementIndicator, MovementDirection } from "./OddsMovementIndicator";
import { useSimulatedMovement } from "@/hooks/useOddsMovement";

interface FanDuelOddsBadgeProps {
  liveOdds?: LiveOdds[];
  homeTeam?: string;
  awayTeam?: string;
  compact?: boolean;
  showSpread?: boolean;
  matchId?: string;
}

export function FanDuelOddsBadge({ 
  liveOdds, 
  homeTeam = "Home",
  awayTeam = "Away",
  compact = false,
  showSpread = true,
  matchId
}: FanDuelOddsBadgeProps) {
  const primaryOdds = getPrimaryOdds(liveOdds || []);
  const movement = useSimulatedMovement(liveOdds);
  
  if (!primaryOdds) return null;

  const isFanDuel = primaryOdds.sportsbook.id.toLowerCase().includes('fanduel');
  
  const formatMoneyline = (value: number | null | undefined): string | null => {
    if (value === null || value === undefined) return null;
    if (value >= 100) return `+${Math.round(value)}`;
    if (value <= -100) return `${Math.round(value)}`;
    return formatAmericanOdds(value);
  };

  const homeML = formatMoneyline(primaryOdds.homeWin);
  const awayML = formatMoneyline(primaryOdds.awayWin);
  const homeSpread = primaryOdds.spread?.homeSpread;
  const awaySpread = primaryOdds.spread?.awaySpread;

  const formatSpread = (spread: number | undefined): string | null => {
    if (spread === undefined) return null;
    return spread > 0 ? `+${spread}` : `${spread}`;
  };

  const hasMovement = movement && (movement.homeDirection !== 'stable' || movement.awayDirection !== 'stable');

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {isFanDuel && (
          <Star className="h-3 w-3 text-primary fill-primary" />
        )}
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-0.5 text-muted-foreground">
            {awayML || '-'}
            {movement?.awayDirection && movement.awayDirection !== 'stable' && (
              <OddsMovementIndicator 
                direction={movement.awayDirection} 
                compact 
                showTooltip={false}
              />
            )}
          </span>
          <span className="text-muted-foreground/50">|</span>
          <span className="flex items-center gap-0.5 text-muted-foreground">
            {homeML || '-'}
            {movement?.homeDirection && movement.homeDirection !== 'stable' && (
              <OddsMovementIndicator 
                direction={movement.homeDirection} 
                compact 
                showTooltip={false}
              />
            )}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-lg border p-3 relative",
      isFanDuel 
        ? "bg-primary/5 border-primary/30" 
        : "bg-accent/30 border-border/50"
    )}>
      {/* Live movement indicator dot */}
      {hasMovement && movement.isRecent && (
        <span className="absolute top-2 right-2 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {isFanDuel && (
            <Star className="h-3.5 w-3.5 text-primary fill-primary" />
          )}
          <span className="text-xs font-semibold text-primary">
            {primaryOdds.sportsbook.name}
          </span>
          {isFanDuel && (
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-primary/30 text-primary">
              Primary
            </Badge>
          )}
        </div>
        {hasMovement && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Activity className="h-3 w-3" />
            <span>Line moving</span>
          </div>
        )}
      </div>

      {/* Odds Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Away Team */}
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground truncate">{awayTeam}</p>
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "text-sm font-bold tabular-nums relative",
              awayML && awayML.startsWith('+') ? "text-green-500" : "text-foreground"
            )}>
              {awayML || '-'}
            </span>
            {movement?.awayDirection && movement.awayDirection !== 'stable' && (
              <OddsMovementIndicator 
                direction={movement.awayDirection}
                change={movement.awayChange}
              />
            )}
            {showSpread && awaySpread !== undefined && (
              <span className="text-xs text-muted-foreground tabular-nums">
                ({formatSpread(awaySpread)})
              </span>
            )}
          </div>
        </div>

        {/* Home Team */}
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground truncate">{homeTeam}</p>
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "text-sm font-bold tabular-nums relative",
              homeML && homeML.startsWith('+') ? "text-green-500" : "text-foreground"
            )}>
              {homeML || '-'}
            </span>
            {movement?.homeDirection && movement.homeDirection !== 'stable' && (
              <OddsMovementIndicator 
                direction={movement.homeDirection}
                change={movement.homeChange}
              />
            )}
            {showSpread && homeSpread !== undefined && (
              <span className="text-xs text-muted-foreground tabular-nums">
                ({formatSpread(homeSpread)})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Total Line if available */}
      {primaryOdds.totals && (
        <div className="mt-2 pt-2 border-t border-border/30 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Total</span>
          <div className="flex items-center gap-2">
            <span className="font-medium">O/U {primaryOdds.totals.total}</span>
            {movement?.totalDirection && movement.totalDirection !== 'stable' && (
              <OddsMovementIndicator 
                direction={movement.totalDirection}
                change={movement.totalChange}
                compact
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FanDuelOddsBadge;
