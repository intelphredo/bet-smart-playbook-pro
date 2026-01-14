// Sharp Money Section - Main container for sharp betting analysis
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, Zap, TrendingDown, ChevronRight, RefreshCw, BarChart3 } from 'lucide-react';
import { Match, League } from '@/types/sports';
import { useSharpMoneyGames, SharpMoneyGame } from '@/hooks/useSharpMoneyGames';
import { SharpMoneyFilter, SharpFilterType } from './SharpMoneyFilter';
import { SharpMoneyCard } from './SharpMoneyCard';
import { SharpSignal } from '@/types/bettingTrends';
import { cn } from '@/lib/utils';
import { InfoExplainer } from '@/components/ui/InfoExplainer';

interface SharpMoneySectionProps {
  matches: Match[];
  league?: League | 'ALL';
  maxItems?: number;
  showFilter?: boolean;
  compact?: boolean;
  className?: string;
}

export function SharpMoneySection({
  matches,
  league = 'ALL',
  maxItems = 10,
  showFilter = true,
  compact = false,
  className,
}: SharpMoneySectionProps) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<SharpFilterType>('all');
  const [signalTypes, setSignalTypes] = useState<SharpSignal['type'][]>([]);
  const [minConfidence, setMinConfidence] = useState(0);

  const { sharpGames, stats, isLoading, refetch } = useSharpMoneyGames({
    matches,
    league,
    minSharpScore: 0,
  });

  // Apply filters
  const filteredGames = useMemo(() => {
    let games = [...sharpGames];
    
    // Apply quick filter
    if (activeFilter === 'rlm') {
      games = games.filter(g => g.hasReverseLineMovement);
    } else if (activeFilter === 'steam') {
      games = games.filter(g => g.signalTypes.includes('steam_move'));
    } else if (activeFilter === 'strong') {
      games = games.filter(g => g.sharpScore >= 60);
    }
    
    // Apply signal type filter
    if (signalTypes.length > 0) {
      games = games.filter(g => 
        signalTypes.some(type => g.signalTypes.includes(type))
      );
    }
    
    // Apply confidence filter
    if (minConfidence > 0) {
      games = games.filter(g => g.confidence >= minConfidence);
    }
    
    return games;
  }, [sharpGames, activeFilter, signalTypes, minConfidence]);

  const displayGames = filteredGames.slice(0, maxItems);

  const handleMatchClick = (game: SharpMoneyGame) => {
    navigate(`/game/${game.match.id}`);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="py-3 px-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-primary" />
            Sharp Money
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (sharpGames.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="py-3 px-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-primary" />
            Sharp Money
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Brain className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No Sharp Action Detected</p>
          <p className="text-sm mt-1">Check back closer to game time</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="h-4 w-4 text-primary" />
            Sharp Money
            <InfoExplainer term="sharp_betting" size="sm" />
            <Badge variant="secondary" className="ml-1">
              {sharpGames.length}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7"
              onClick={() => navigate('/betting-trends')}
            >
              See All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
        
        {/* Stats Summary */}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendingDown className="h-3.5 w-3.5 text-purple-500" />
            {stats.withRLM} RLM
            <InfoExplainer term="reverse_line" size="sm" />
          </span>
          <span className="flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-orange-500" />
            {stats.steamMoves} Steam
            <InfoExplainer term="steam_move" size="sm" />
          </span>
          <span className="flex items-center gap-1">
            <BarChart3 className="h-3.5 w-3.5 text-green-500" />
            Avg {stats.avgConfidence}%
            <InfoExplainer term="confidence" size="sm" />
          </span>
        </div>
      </CardHeader>
      
      {showFilter && (
        <div className="px-4 pb-3 border-b">
          <SharpMoneyFilter
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            signalTypes={signalTypes}
            onSignalTypesChange={setSignalTypes}
            minConfidence={minConfidence}
            onMinConfidenceChange={setMinConfidence}
            sharpCount={sharpGames.length}
            rlmCount={stats.withRLM}
            steamCount={stats.steamMoves}
          />
        </div>
      )}
      
      <CardContent className="p-0">
        <ScrollArea className="h-auto max-h-[600px]">
          <div className={cn(
            compact ? 'divide-y' : 'space-y-3 p-4'
          )}>
            {displayGames.map((game) => (
              <SharpMoneyCard
                key={game.match.id}
                game={game}
                onClick={() => handleMatchClick(game)}
                compact={compact}
              />
            ))}
          </div>
          
          {filteredGames.length > maxItems && (
            <div className="p-4 border-t text-center">
              <Button 
                variant="outline" 
                onClick={() => navigate('/betting-trends')}
              >
                View All {filteredGames.length} Sharp Games
              </Button>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default SharpMoneySection;
