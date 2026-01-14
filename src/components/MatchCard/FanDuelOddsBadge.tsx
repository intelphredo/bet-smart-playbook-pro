import { Badge } from "@/components/ui/badge";
import { LiveOdds } from "@/types/sports";
import { getPrimaryOdds, formatAmericanOdds, PRIMARY_SPORTSBOOK } from "@/utils/sportsbook";
import { Star, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FanDuelOddsBadgeProps {
  liveOdds?: LiveOdds[];
  homeTeam?: string;
  awayTeam?: string;
  compact?: boolean;
  showSpread?: boolean;
}

export function FanDuelOddsBadge({ 
  liveOdds, 
  homeTeam = "Home",
  awayTeam = "Away",
  compact = false,
  showSpread = true 
}: FanDuelOddsBadgeProps) {
  const primaryOdds = getPrimaryOdds(liveOdds || []);
  
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

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {isFanDuel && (
          <Star className="h-3 w-3 text-primary fill-primary" />
        )}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">{awayML || '-'}</span>
          <span className="text-muted-foreground/50">|</span>
          <span className="text-muted-foreground">{homeML || '-'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-lg border p-3",
      isFanDuel 
        ? "bg-primary/5 border-primary/30" 
        : "bg-accent/30 border-border/50"
    )}>
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
      </div>

      {/* Odds Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Away Team */}
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground truncate">{awayTeam}</p>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm font-bold tabular-nums",
              awayML && awayML.startsWith('+') ? "text-green-500" : "text-foreground"
            )}>
              {awayML || '-'}
            </span>
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
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm font-bold tabular-nums",
              homeML && homeML.startsWith('+') ? "text-green-500" : "text-foreground"
            )}>
              {homeML || '-'}
            </span>
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
          </div>
        </div>
      )}
    </div>
  );
}

export default FanDuelOddsBadge;
