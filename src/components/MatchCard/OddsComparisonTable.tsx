import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { SPORTSBOOK_LOGOS, findBestOdds, SPORTSBOOK_PRIORITY } from "@/utils/sportsbook";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Props {
  match: any;
  formatOdds: (odds: number | undefined) => string;
}

const OddsComparisonTable = ({ match, formatOdds }: Props) => {
  if (!match.liveOdds || match.liveOdds.length === 0) return null;

  const bestOdds = findBestOdds(match.liveOdds);
  const hasDrawMarket = match.odds?.draw !== undefined;

  // Sort sportsbooks by priority (DraftKings, FanDuel, BetMGM first)
  const sortedOdds = [...match.liveOdds].sort((a: any, b: any) => {
    const priorityA = SPORTSBOOK_PRIORITY[a.sportsbook.id] || 99;
    const priorityB = SPORTSBOOK_PRIORITY[b.sportsbook.id] || 99;
    return priorityA - priorityB;
  });

  // Calculate odds movement compared to opening
  const getMovement = (current: number | undefined, opening: number | undefined) => {
    if (!current || !opening) return null;
    const diff = current - opening;
    if (Math.abs(diff) < 0.01) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const MovementIndicator = ({ movement }: { movement: 'up' | 'down' | 'stable' | null }) => {
    if (!movement || movement === 'stable') return null;
    return movement === 'up' ? (
      <TrendingUp className="w-3 h-3 text-green-500 ml-1" />
    ) : (
      <TrendingDown className="w-3 h-3 text-red-500 ml-1" />
    );
  };

  const OddsCell = ({ 
    value, 
    isBest, 
    openingValue,
    className 
  }: { 
    value: number | undefined; 
    isBest: boolean;
    openingValue?: number;
    className?: string;
  }) => {
    const movement = getMovement(value, openingValue);
    
    return (
      <td 
        className={cn(
          "px-3 py-2 text-center transition-colors",
          isBest && "bg-green-100 dark:bg-green-900/30",
          className
        )}
      >
        <div className="flex items-center justify-center gap-1">
          {isBest && (
            <Trophy className="w-3 h-3 text-yellow-500 flex-shrink-0" />
          )}
          <span 
            className={cn(
              "font-mono",
              isBest && "font-bold text-green-700 dark:text-green-400"
            )}
          >
            {formatOdds(value)}
          </span>
          <MovementIndicator movement={movement} />
        </div>
      </td>
    );
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          📊 Odds Comparison
        </h4>
        {bestOdds.home && (
          <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
            <Trophy className="w-3 h-3 mr-1" />
            Best Value Available
          </Badge>
        )}
      </div>
      
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                Sportsbook
              </th>
              <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                Home
              </th>
              {hasDrawMarket && (
                <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                  Draw
                </th>
              )}
              <th className="px-3 py-2 text-center font-medium text-muted-foreground">
                Away
              </th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground hidden sm:table-cell">
                Updated
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {/* Opening Odds Row */}
            <tr className="bg-muted/30">
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    <Minus className="w-3 h-3 text-muted-foreground" />
                  </span>
                  <span className="font-medium text-muted-foreground">Opening</span>
                </div>
              </td>
              <td className="px-3 py-2 text-center font-mono text-muted-foreground">
                {formatOdds(match.odds?.homeWin)}
              </td>
              {hasDrawMarket && (
                <td className="px-3 py-2 text-center font-mono text-muted-foreground">
                  {formatOdds(match.odds?.draw)}
                </td>
              )}
              <td className="px-3 py-2 text-center font-mono text-muted-foreground">
                {formatOdds(match.odds?.awayWin)}
              </td>
              <td className="px-3 py-2 text-right text-muted-foreground hidden sm:table-cell">
                —
              </td>
            </tr>

            {/* Sportsbook Rows */}
            {sortedOdds.map((odd: any) => {
              const isBestHome = bestOdds.home?.sportsbookId === odd.sportsbook.id && 
                                 bestOdds.home?.value === odd.homeWin;
              const isBestAway = bestOdds.away?.sportsbookId === odd.sportsbook.id && 
                                 bestOdds.away?.value === odd.awayWin;
              const isBestDraw = bestOdds.draw?.sportsbookId === odd.sportsbook.id && 
                                 bestOdds.draw?.value === odd.draw;

              return (
                <tr 
                  key={odd.sportsbook.id} 
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="px-3 py-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 cursor-default">
                            <span className="w-6 h-6 rounded-full bg-background border border-border overflow-hidden flex-shrink-0">
                              <img
                                src={odd.sportsbook.logo || SPORTSBOOK_LOGOS[odd.sportsbook.id as keyof typeof SPORTSBOOK_LOGOS]}
                                alt={odd.sportsbook.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                                }}
                              />
                            </span>
                            <span className="font-medium truncate max-w-[100px]">
                              {odd.sportsbook.name}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{odd.sportsbook.name}</p>
                          {odd.updatedAt && (
                            <p className="text-xs text-muted-foreground">
                              Last updated: {formatTimeAgo(odd.updatedAt)}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                  
                  <OddsCell 
                    value={odd.homeWin} 
                    isBest={isBestHome}
                    openingValue={match.odds?.homeWin}
                  />
                  
                  {hasDrawMarket && (
                    <OddsCell 
                      value={odd.draw} 
                      isBest={isBestDraw}
                      openingValue={match.odds?.draw}
                    />
                  )}
                  
                  <OddsCell 
                    value={odd.awayWin} 
                    isBest={isBestAway}
                    openingValue={match.odds?.awayWin}
                  />
                  
                  <td className="px-3 py-2 text-right text-xs text-muted-foreground hidden sm:table-cell">
                    {odd.updatedAt ? formatTimeAgo(odd.updatedAt) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OddsComparisonTable;
