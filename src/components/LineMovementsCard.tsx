import { TrendingUp, TrendingDown, Activity, ArrowRight, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useLineMovements, LineMovement } from '@/hooks/useLineMovements';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

function MovementRow({ movement }: { movement: LineMovement }) {
  const isSteam = movement.movement_direction === 'steam';
  
  const getMovementDisplay = () => {
    if (movement.market_type === 'spread' || movement.market_type.includes('spread')) {
      const prev = movement.previous_odds.spread_home;
      const curr = movement.current_odds.spread_home;
      if (prev !== undefined && curr !== undefined) {
        return {
          label: 'Spread',
          from: prev > 0 ? `+${prev}` : `${prev}`,
          to: curr > 0 ? `+${curr}` : `${curr}`
        };
      }
    } else if (movement.market_type === 'total' || movement.market_type.includes('total')) {
      const prev = movement.previous_odds.total;
      const curr = movement.current_odds.total;
      if (prev !== undefined && curr !== undefined) {
        return {
          label: 'Total',
          from: `${prev}`,
          to: `${curr}`
        };
      }
    } else {
      const isHome = movement.market_type.includes('home');
      const prev = isHome ? movement.previous_odds.home : movement.previous_odds.away;
      const curr = isHome ? movement.current_odds.home : movement.current_odds.away;
      if (prev !== undefined && curr !== undefined) {
        return {
          label: isHome ? 'Home ML' : 'Away ML',
          from: prev > 0 ? `+${prev}` : `${prev}`,
          to: curr > 0 ? `+${curr}` : `${curr}`
        };
      }
    }
    return null;
  };

  const display = getMovementDisplay();
  if (!display) return null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      {/* Direction indicator */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
        isSteam ? "bg-red-100 dark:bg-red-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"
      )}>
        {isSteam ? (
          <TrendingDown className="w-5 h-5 text-red-500" />
        ) : (
          <TrendingUp className="w-5 h-5 text-emerald-500" />
        )}
      </div>

      {/* Match info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{movement.match_title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="outline" className="text-xs">
            {movement.league}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {display.label}
          </Badge>
        </div>
      </div>

      {/* Movement */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-mono text-muted-foreground">{display.from}</span>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <span className={cn(
          "font-mono font-bold",
          isSteam ? "text-red-500" : "text-emerald-500"
        )}>
          {display.to}
        </span>
      </div>

      {/* Time */}
      <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground min-w-[80px] justify-end">
        <Clock className="w-3 h-3" />
        {formatDistanceToNow(new Date(movement.detected_at), { addSuffix: true })}
      </div>
    </div>
  );
}

function MovementsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

export default function LineMovementsCard() {
  const { movements, isLoading } = useLineMovements();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5 text-orange-500" />
            Sharp Line Movements
          </CardTitle>
          {movements.length > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {movements.length} active
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Significant line changes indicating sharp action
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        {isLoading ? (
          <MovementsSkeleton />
        ) : movements.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              No significant line movements detected
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              We'll alert you when lines move sharply
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-1">
              {movements.map((movement) => (
                <MovementRow key={movement.id} movement={movement} />
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Legend */}
        <div className="mt-4 pt-3 border-t flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-red-500" />
            <span>Steam Move (sharp action)</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span>Reverse Move</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
