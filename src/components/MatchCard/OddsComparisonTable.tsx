import { useState } from "react";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { SPORTSBOOK_LOGOS, findBestOdds, SPORTSBOOK_PRIORITY } from "@/utils/sportsbook";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { OddsFormatToggle } from "@/components/ui/odds-format-toggle";
import { useOddsFormat } from "@/contexts/OddsFormatContext";
import { cn } from "@/lib/utils";
import { LiveOdds } from "@/types/sports";

interface Props {
  match: any;
}

type MarketType = 'moneyline' | 'spread' | 'total';

const OddsComparisonTable = ({ match }: Props) => {
  const [activeMarket, setActiveMarket] = useState<MarketType>('moneyline');
  const { formatOdds } = useOddsFormat();
  
  if (!match.liveOdds || match.liveOdds.length === 0) return null;

  const bestOdds = findBestOdds(match.liveOdds);
  const hasDrawMarket = match.odds?.draw !== undefined;
  
  // Check if spread/total markets are available
  const hasSpreadMarket = match.liveOdds.some((o: LiveOdds) => o.spread);
  const hasTotalMarket = match.liveOdds.some((o: LiveOdds) => o.totals);

  // Sort sportsbooks by priority (DraftKings, FanDuel, BetMGM first) and deduplicate
  const sortedOdds = [...match.liveOdds]
    .reduce((acc: LiveOdds[], odd: LiveOdds) => {
      // Keep only the first occurrence of each sportsbook (most recent)
      if (!acc.find((o: LiveOdds) => o.sportsbook.id === odd.sportsbook.id)) {
        acc.push(odd);
      }
      return acc;
    }, [])
    .sort((a: any, b: any) => {
      const priorityA = SPORTSBOOK_PRIORITY[a.sportsbook.id] || 99;
      const priorityB = SPORTSBOOK_PRIORITY[b.sportsbook.id] || 99;
      return priorityA - priorityB;
    });

  // Find best spread odds
  const findBestSpreadOdds = () => {
    let bestHomeSpread: { value: number; odds: number; sportsbookId: string } | null = null;
    let bestAwaySpread: { value: number; odds: number; sportsbookId: string } | null = null;

    match.liveOdds.forEach((odd: LiveOdds) => {
      if (odd.spread) {
        if (!bestHomeSpread || odd.spread.homeSpreadOdds > bestHomeSpread.odds) {
          bestHomeSpread = { 
            value: odd.spread.homeSpread, 
            odds: odd.spread.homeSpreadOdds, 
            sportsbookId: odd.sportsbook.id 
          };
        }
        if (!bestAwaySpread || odd.spread.awaySpreadOdds > bestAwaySpread.odds) {
          bestAwaySpread = { 
            value: odd.spread.awaySpread, 
            odds: odd.spread.awaySpreadOdds, 
            sportsbookId: odd.sportsbook.id 
          };
        }
      }
    });

    return { home: bestHomeSpread, away: bestAwaySpread };
  };

  // Find best total odds
  const findBestTotalOdds = () => {
    let bestOver: { value: number; odds: number; sportsbookId: string } | null = null;
    let bestUnder: { value: number; odds: number; sportsbookId: string } | null = null;

    match.liveOdds.forEach((odd: LiveOdds) => {
      if (odd.totals) {
        if (!bestOver || odd.totals.overOdds > bestOver.odds) {
          bestOver = { 
            value: odd.totals.total, 
            odds: odd.totals.overOdds, 
            sportsbookId: odd.sportsbook.id 
          };
        }
        if (!bestUnder || odd.totals.underOdds > bestUnder.odds) {
          bestUnder = { 
            value: odd.totals.total, 
            odds: odd.totals.underOdds, 
            sportsbookId: odd.sportsbook.id 
          };
        }
      }
    });

    return { over: bestOver, under: bestUnder };
  };

  const bestSpreadOdds = findBestSpreadOdds();
  const bestTotalOdds = findBestTotalOdds();

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
    prefix,
    className 
  }: { 
    value: number | undefined; 
    isBest: boolean;
    openingValue?: number;
    prefix?: string;
    className?: string;
  }) => {
    const movement = getMovement(value, openingValue);
    
    return (
      <td 
        className={cn(
          "px-3 py-2 text-center transition-all duration-200",
          isBest && "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent",
          className
        )}
      >
        <div className="flex items-center justify-center gap-1">
          {isBest && (
            <Trophy className="w-3 h-3 text-primary flex-shrink-0 animate-pulse" />
          )}
          <span 
            className={cn(
              "font-mono text-sm",
              isBest && "font-bold bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent"
            )}
          >
            {prefix}{formatOdds(value)}
          </span>
          <MovementIndicator movement={movement} />
        </div>
      </td>
    );
  };

  const SpreadCell = ({ 
    spread, 
    odds, 
    isBest,
    className 
  }: { 
    spread: number | undefined;
    odds: number | undefined; 
    isBest: boolean;
    className?: string;
  }) => {
    if (spread === undefined || odds === undefined) {
      return <td className="px-3 py-2 text-center text-muted-foreground">-</td>;
    }
    
    const spreadDisplay = spread > 0 ? `+${spread}` : `${spread}`;
    
    return (
      <td 
        className={cn(
          "px-3 py-2 text-center transition-all duration-200",
          isBest && "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent",
          className
        )}
      >
        <div className="flex flex-col items-center">
          {isBest && (
            <Trophy className="w-3 h-3 text-primary mb-0.5 animate-pulse" />
          )}
          <span 
            className={cn(
              "font-mono text-sm",
              isBest && "font-bold bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent"
            )}
          >
            {spreadDisplay}
          </span>
          <span className="text-xs text-muted-foreground">
            ({formatOdds(odds)})
          </span>
        </div>
      </td>
    );
  };

  const TotalCell = ({ 
    total, 
    odds, 
    type,
    isBest,
    className 
  }: { 
    total: number | undefined;
    odds: number | undefined;
    type: 'over' | 'under';
    isBest: boolean;
    className?: string;
  }) => {
    if (total === undefined || odds === undefined) {
      return <td className="px-3 py-2 text-center text-muted-foreground">-</td>;
    }
    
    const prefix = type === 'over' ? 'O' : 'U';
    
    return (
      <td 
        className={cn(
          "px-3 py-2 text-center transition-all duration-200",
          isBest && "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent",
          className
        )}
      >
        <div className="flex flex-col items-center">
          {isBest && (
            <Trophy className="w-3 h-3 text-primary mb-0.5 animate-pulse" />
          )}
          <span 
            className={cn(
              "font-mono text-sm",
              isBest && "font-bold bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent"
            )}
          >
            {prefix} {total}
          </span>
          <span className="text-xs text-muted-foreground">
            ({formatOdds(odds)})
          </span>
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

  const SportsbookRow = ({ odd }: { odd: LiveOdds }) => (
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
  );

  const MoneylineTable = () => (
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
        {sortedOdds.map((odd: LiveOdds) => {
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
              <SportsbookRow odd={odd} />
              
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
  );

  const SpreadTable = () => (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-muted/50">
          <th className="px-3 py-2 text-left font-medium text-muted-foreground">
            Sportsbook
          </th>
          <th className="px-3 py-2 text-center font-medium text-muted-foreground">
            {match.homeTeam?.shortName || 'Home'} Spread
          </th>
          <th className="px-3 py-2 text-center font-medium text-muted-foreground">
            {match.awayTeam?.shortName || 'Away'} Spread
          </th>
          <th className="px-3 py-2 text-right font-medium text-muted-foreground hidden sm:table-cell">
            Updated
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {sortedOdds.map((odd: LiveOdds) => {
          const isBestHomeSpread = bestSpreadOdds.home?.sportsbookId === odd.sportsbook.id;
          const isBestAwaySpread = bestSpreadOdds.away?.sportsbookId === odd.sportsbook.id;

          return (
            <tr 
              key={odd.sportsbook.id} 
              className="hover:bg-muted/20 transition-colors"
            >
              <SportsbookRow odd={odd} />
              
              <SpreadCell 
                spread={odd.spread?.homeSpread}
                odds={odd.spread?.homeSpreadOdds}
                isBest={isBestHomeSpread}
              />
              
              <SpreadCell 
                spread={odd.spread?.awaySpread}
                odds={odd.spread?.awaySpreadOdds}
                isBest={isBestAwaySpread}
              />
              
              <td className="px-3 py-2 text-right text-xs text-muted-foreground hidden sm:table-cell">
                {odd.updatedAt ? formatTimeAgo(odd.updatedAt) : '—'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const TotalTable = () => (
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-muted/50">
          <th className="px-3 py-2 text-left font-medium text-muted-foreground">
            Sportsbook
          </th>
          <th className="px-3 py-2 text-center font-medium text-muted-foreground">
            Over
          </th>
          <th className="px-3 py-2 text-center font-medium text-muted-foreground">
            Under
          </th>
          <th className="px-3 py-2 text-right font-medium text-muted-foreground hidden sm:table-cell">
            Updated
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {sortedOdds.map((odd: LiveOdds) => {
          const isBestOver = bestTotalOdds.over?.sportsbookId === odd.sportsbook.id;
          const isBestUnder = bestTotalOdds.under?.sportsbookId === odd.sportsbook.id;

          return (
            <tr 
              key={odd.sportsbook.id} 
              className="hover:bg-muted/20 transition-colors"
            >
              <SportsbookRow odd={odd} />
              
              <TotalCell 
                total={odd.totals?.total}
                odds={odd.totals?.overOdds}
                type="over"
                isBest={isBestOver}
              />
              
              <TotalCell 
                total={odd.totals?.total}
                odds={odd.totals?.underOdds}
                type="under"
                isBest={isBestUnder}
              />
              
              <td className="px-3 py-2 text-right text-xs text-muted-foreground hidden sm:table-cell">
                {odd.updatedAt ? formatTimeAgo(odd.updatedAt) : '—'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="p-1 rounded bg-primary/10">📊</span>
          Odds Comparison
        </h4>
        <div className="flex items-center gap-2">
          <OddsFormatToggle />
          {bestOdds.home && (
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 badge-glow">
              <Trophy className="w-3 h-3 mr-1" />
              Best Value
            </Badge>
          )}
        </div>
      </div>
      
      <Tabs value={activeMarket} onValueChange={(v) => setActiveMarket(v as MarketType)}>
        <TabsList className="mb-3 h-8 bg-muted/50 border border-border/50">
          <TabsTrigger value="moneyline" className="text-xs px-3 h-7 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            Moneyline
          </TabsTrigger>
          {hasSpreadMarket && (
            <TabsTrigger value="spread" className="text-xs px-3 h-7 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              Spread
            </TabsTrigger>
          )}
          {hasTotalMarket && (
            <TabsTrigger value="total" className="text-xs px-3 h-7 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              Total
            </TabsTrigger>
          )}
        </TabsList>

        <div className="overflow-x-auto rounded-xl border border-primary/10 bg-gradient-to-br from-card via-card to-primary/5">
          <TabsContent value="moneyline" className="m-0">
            <MoneylineTable />
          </TabsContent>
          
          {hasSpreadMarket && (
            <TabsContent value="spread" className="m-0">
              <SpreadTable />
            </TabsContent>
          )}
          
          {hasTotalMarket && (
            <TabsContent value="total" className="m-0">
              <TotalTable />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default OddsComparisonTable;
