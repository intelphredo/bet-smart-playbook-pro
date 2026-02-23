import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  TrendingUp, 
  TrendingDown,
  RefreshCw, 
  Brain, 
  Users, 
  AlertTriangle,
  ChevronRight,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Calendar,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { League } from '@/types/sports';
import { useBettingTrends } from '@/hooks/useBettingTrends';
import { BettingTrend } from '@/types/bettingTrends';
import BettingTrendsCard from './BettingTrendsCard';
import { GroupedLeagueSelect } from '@/components/filters/GroupedLeagueSelect';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, subDays } from 'date-fns';

// All available leagues for the filter
const ALL_LEAGUES: League[] = [
  'NBA', 'NFL', 'MLB', 'NHL', 'NCAAB', 'NCAAF', 
  'WNBA', 'EPL', 'LA_LIGA', 'SERIE_A', 'BUNDESLIGA', 
  'LIGUE_1', 'MLS', 'CHAMPIONS_LEAGUE', 'UFC'
];

const DATE_PRESETS = [
  { label: 'Today', getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: 'Yesterday', getValue: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) }) },
  { label: 'Last 7 Days', getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
] as const;

const ITEMS_PER_PAGE = 8;

function TrendSummaryRow({ trend, onClick }: { trend: BettingTrend; onClick: () => void }) {
  const hasSharpSignals = trend.sharpBetting.signals.length > 0;
  const hasRLM = trend.lineMovement.reverseLineMovement;
  const sharpSide = trend.sharpBetting.spreadFavorite;
  const sharpTeamName = sharpSide === 'home' ? trend.homeTeam.split(' ').pop() : 
                        sharpSide === 'away' ? trend.awayTeam.split(' ').pop() : null;
  
  const publicHomePct = trend.publicBetting.spreadHome;
  const moneyHomePct = trend.moneyFlow.homeMoneyPct;
  const splitDiff = Math.abs(publicHomePct - moneyHomePct);
  const publicSharpConflict = splitDiff >= 12;
  
  return (
    <button 
      onClick={onClick}
      className={cn(
        'w-full p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left',
        hasRLM && 'border-purple-500/40 bg-purple-500/5',
        hasSharpSignals && !hasRLM && 'border-primary/30'
      )}
    >
      {/* Game Header with Spread */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">
            <span className="truncate">{trend.awayTeam.split(' ').pop()}</span>
            <span className="text-muted-foreground mx-1">@</span>
            <span className="truncate">{trend.homeTeam.split(' ').pop()}</span>
          </p>
          {/* Spread & Total */}
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Spread: {trend.lineMovement.currentSpread > 0 ? '+' : ''}{trend.lineMovement.currentSpread.toFixed(1)}
            <span className="mx-1.5">|</span>
            O/U: {trend.lineMovement.currentTotal.toFixed(1)}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Line Movement Arrow */}
          {Math.abs(trend.lineMovement.spreadMovement) >= 0.5 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn(
                    'flex items-center text-xs font-mono font-medium px-1.5 py-0.5 rounded',
                    trend.lineMovement.spreadMovement > 0 
                      ? 'text-emerald-600 bg-emerald-500/10' 
                      : 'text-red-500 bg-red-500/10'
                  )}>
                    {trend.lineMovement.spreadMovement > 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {Math.abs(trend.lineMovement.spreadMovement).toFixed(1)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>Line moved {Math.abs(trend.lineMovement.spreadMovement).toFixed(1)} pts in last 24hrs</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {hasRLM && (
            <Badge variant="outline" className="text-purple-500 bg-purple-500/10 text-xs px-1.5 border-purple-500/30">
              <Zap className="h-3 w-3 mr-0.5" />
              RLM
            </Badge>
          )}
          {hasSharpSignals && !hasRLM && (
            <Badge variant="outline" className="text-primary bg-primary/10 text-xs border-primary/30">
              <Brain className="h-3 w-3 mr-0.5" />
              Sharp
            </Badge>
          )}
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      
      {/* Public vs Sharp mini bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3 w-3" />
            Public: {publicHomePct.toFixed(0)}% / {(100 - publicHomePct).toFixed(0)}%
          </span>
          {sharpTeamName && (
            <span className={cn(
              'flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded',
              publicSharpConflict 
                ? 'bg-destructive/10 text-destructive' 
                : 'bg-emerald-500/10 text-emerald-600'
            )}>
              <Brain className="h-3 w-3" />
              Sharp: {sharpTeamName}
              {publicSharpConflict && ' ⚠️'}
            </span>
          )}
        </div>
        
        {/* Mini progress bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-blue-500 rounded-l-full transition-all" 
            style={{ width: `${publicHomePct}%` }} 
          />
          <div 
            className="h-full bg-slate-400 rounded-r-full transition-all" 
            style={{ width: `${100 - publicHomePct}%` }} 
          />
        </div>
      </div>
      
      {/* Sharp signals preview */}
      {hasSharpSignals && (
        <div className="flex gap-1 mt-2">
          {trend.sharpBetting.signals.slice(0, 2).map((signal, i) => (
            <Badge key={i} variant="secondary" className="text-xs px-1.5 py-0">
              {signal.type.replace(/_/g, ' ')}
              {signal.strength === 'strong' && ' ⚡'}
            </Badge>
          ))}
          {trend.sharpBetting.signals.length > 2 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              +{trend.sharpBetting.signals.length - 2}
            </Badge>
          )}
        </div>
      )}
    </button>
  );
}

interface BettingTrendsSectionProps {
  league?: League;
}

export function BettingTrendsSection({ league: initialLeague }: BettingTrendsSectionProps) {
  const [activeLeague, setActiveLeague] = useState<League>(initialLeague || 'NBA');
  const [selectedTrend, setSelectedTrend] = useState<BettingTrend | null>(null);
  const [showActionOnly, setShowActionOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: new Date(),
    to: new Date(),
  });
  const [datePreset, setDatePreset] = useState('Today');
  const [isDateOpen, setIsDateOpen] = useState(false);
  
  const { data: trends, isLoading, error, refetch, isFetching } = useBettingTrends(activeLeague);
  
  const filteredTrends = useMemo(() => {
    if (!trends) return [];
    if (showActionOnly) {
      return trends.filter(t => t.sharpBetting.signals.length > 0 || t.lineMovement.reverseLineMovement);
    }
    return trends;
  }, [trends, showActionOnly]);
  
  const visibleTrends = filteredTrends.slice(0, visibleCount);
  const hasMore = visibleCount < filteredTrends.length;
  
  const sharpActionGames = trends?.filter(t => t.sharpBetting.signals.length > 0) || [];
  const rlmGames = trends?.filter(t => t.lineMovement.reverseLineMovement) || [];
  
  // Reset pagination on league or filter change
  const handleLeagueChange = (v: string) => {
    setActiveLeague(v as League);
    setSelectedTrend(null);
    setVisibleCount(ITEMS_PER_PAGE);
  };
  
  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Failed to load betting trends</p>
              <p className="text-sm text-muted-foreground mt-1">
                {error instanceof Error ? error.message : 'An error occurred'}
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Betting Trends</h2>
            <p className="text-muted-foreground text-sm">
              Public vs sharp betting analysis with line movement tracking
            </p>
          </div>
        </div>
        
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>
      
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* League Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">League:</span>
          <GroupedLeagueSelect
            value={activeLeague}
            onValueChange={handleLeagueChange}
            leagues={ALL_LEAGUES}
            showAllOption={false}
            className="w-[200px]"
          />
        </div>
        
        {/* Date Range Picker */}
        <div className="flex items-center gap-2">
          <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Calendar className="h-4 w-4" />
                {datePreset !== 'Custom' ? datePreset : (
                  dateRange.from ? (
                    dateRange.to && dateRange.from !== dateRange.to
                      ? `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d')}`
                      : format(dateRange.from, 'MMM d, yyyy')
                  ) : 'Select dates'
                )}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex gap-2 p-3 border-b">
                {DATE_PRESETS.map(preset => (
                  <Button
                    key={preset.label}
                    variant={datePreset === preset.label ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      const range = preset.getValue();
                      setDateRange(range);
                      setDatePreset(preset.label);
                      setIsDateOpen(false);
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <CalendarComponent
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  setDateRange({ from: range?.from, to: range?.to });
                  setDatePreset('Custom');
                  if (range?.from && range?.to) setIsDateOpen(false);
                }}
                numberOfMonths={2}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Show Action Only Toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <Switch
            id="action-filter"
            checked={showActionOnly}
            onCheckedChange={(v) => {
              setShowActionOnly(v);
              setVisibleCount(ITEMS_PER_PAGE);
            }}
          />
          <Label htmlFor="action-filter" className="text-sm cursor-pointer flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Action Only
          </Label>
        </div>
      </div>
      
      {/* Stats Summary */}
      {!isLoading && trends && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Games</p>
                  <p className="text-2xl font-bold">{trends.length}</p>
                  {showActionOnly && filteredTrends.length !== trends.length && (
                    <p className="text-xs text-muted-foreground">
                      Showing {filteredTrends.length} with action
                    </p>
                  )}
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn(sharpActionGames.length > 0 && 'border-primary/30')}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm text-muted-foreground">Sharp Action</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-medium mb-1">What is Sharp Action?</p>
                          <p className="text-xs">Professional bettors ("sharps") placing large, informed wagers. Detected via money/ticket splits, steam moves, and line freezes.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {sharpActionGames.length > 0 ? (
                    <p className="text-2xl font-bold text-primary">{sharpActionGames.length}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1 italic">No sharp data yet</p>
                  )}
                </div>
                <Brain className="h-8 w-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn(rlmGames.length > 0 && 'border-purple-500/30')}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm text-muted-foreground">Reverse Line</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="font-medium mb-1">What is Reverse Line Movement?</p>
                          <p className="text-xs">When the line moves AGAINST public betting. E.g., 70% of bets on Home but the line moves toward Away — indicates sharp money on Away.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {rlmGames.length > 0 ? (
                    <p className="text-2xl font-bold text-purple-600">{rlmGames.length}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1 italic">No RLM detected</p>
                  )}
                </div>
                <Zap className="h-8 w-8 text-purple-500/60" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Games List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              {datePreset === 'Today' ? "Today's" : datePreset} Games
            </CardTitle>
            <CardDescription>
              Click a game to see detailed betting trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredTrends.length > 0 ? (
              <div className="space-y-2">
                <ScrollArea className="h-[480px]">
                  <div className="space-y-2 pr-4">
                    {visibleTrends.map((trend) => (
                      <TrendSummaryRow 
                        key={trend.matchId} 
                        trend={trend} 
                        onClick={() => setSelectedTrend(trend)}
                      />
                    ))}
                  </div>
                </ScrollArea>
                
                {/* Load More */}
                {hasMore && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-2"
                    onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                  >
                    Load More ({filteredTrends.length - visibleCount} remaining)
                  </Button>
                )}
                
                <p className="text-xs text-muted-foreground text-center pt-1">
                  Showing {Math.min(visibleCount, filteredTrends.length)} of {filteredTrends.length} games
                </p>
              </div>
            ) : showActionOnly && trends && trends.length > 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Brain className="h-8 w-8 mb-2" />
                <p className="font-medium">No sharp action detected</p>
                <p className="text-sm mt-1">Try turning off the "Action Only" filter</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mb-2" />
                <p>No games available for {activeLeague}</p>
                <p className="text-xs mt-1">Try a different league or date range</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Selected Game Detail */}
        <div>
          {selectedTrend ? (
            <BettingTrendsCard trend={selectedTrend} />
          ) : (
            <Card className="h-full min-h-[400px] flex items-center justify-center">
              <CardContent className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Select a game to view detailed betting trends
                </p>
                <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">
                  Click any game on the left to see public vs sharp splits, line movement history, and detected signals
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default BettingTrendsSection;
