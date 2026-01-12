import React, { useMemo } from "react";
import { format, addDays, isToday, isTomorrow, startOfDay, isSameDay, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { CalendarDays, TrendingUp, Trophy, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Match } from "@/types/sports";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DateFilterProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
  daysAhead?: number;
  matches?: Match[];
}

interface DateStats {
  gameCount: number;
  highConfidenceCount: number;
  avgConfidence: number;
  arbitrageCount: number;
  score: number; // Overall opportunity score
  leagueBreakdown: Record<string, number>; // Games per league
}

export const DateFilter: React.FC<DateFilterProps> = ({
  selectedDate,
  onDateSelect,
  daysAhead = 7,
  matches = [],
}) => {
  const today = startOfDay(new Date());
  
  // Generate dates for the next N days
  const dates = Array.from({ length: daysAhead }, (_, i) => addDays(today, i));

  // Calculate detailed stats for each date
  const statsByDate = useMemo(() => {
    const stats: Record<string, DateStats> = {};
    
    matches.forEach((match) => {
      const matchDate = parseISO(match.startTime);
      const dateKey = format(startOfDay(matchDate), "yyyy-MM-dd");
      
      if (!stats[dateKey]) {
        stats[dateKey] = {
          gameCount: 0,
          highConfidenceCount: 0,
          avgConfidence: 0,
          arbitrageCount: 0,
          score: 0,
          leagueBreakdown: {},
        };
      }
      
      // Track league breakdown
      const league = match.league || "Other";
      stats[dateKey].leagueBreakdown[league] = (stats[dateKey].leagueBreakdown[league] || 0) + 1;
      
      stats[dateKey].gameCount++;
      
      // Check for high confidence predictions (70%+)
      const confidence = match.prediction?.confidence || 0;
      if (confidence >= 70) {
        stats[dateKey].highConfidenceCount++;
      }
      
      // Track average confidence
      stats[dateKey].avgConfidence += confidence;
      
      // Check for arbitrage opportunities based on smart score
      const smartScore = match.smartScore?.overall || 0;
      if (smartScore >= 70) {
        stats[dateKey].arbitrageCount++;
      }
    });
    
    // Calculate final averages and scores
    Object.keys(stats).forEach((dateKey) => {
      const s = stats[dateKey];
      s.avgConfidence = s.gameCount > 0 ? s.avgConfidence / s.gameCount : 0;
      
      // Calculate opportunity score (0-100)
      // Weighted: games (30%), high confidence (40%), arbitrage (30%)
      const gameScore = Math.min(s.gameCount / 30, 1) * 30;
      const confidenceScore = (s.highConfidenceCount / Math.max(s.gameCount, 1)) * 40;
      const arbScore = Math.min(s.arbitrageCount / 5, 1) * 30;
      s.score = Math.round(gameScore + confidenceScore + arbScore);
    });
    
    return stats;
  }, [matches]);

  // Find the best day (highest score) and most games day
  const { bestDay, mostGamesDay, maxGames } = useMemo(() => {
    let bestScore = 0;
    let bestDateKey = "";
    let maxGameCount = 0;
    let mostGamesDateKey = "";
    
    Object.entries(statsByDate).forEach(([dateKey, stats]) => {
      if (stats.score > bestScore) {
        bestScore = stats.score;
        bestDateKey = dateKey;
      }
      if (stats.gameCount > maxGameCount) {
        maxGameCount = stats.gameCount;
        mostGamesDateKey = dateKey;
      }
    });
    
    return { 
      bestDay: bestDateKey, 
      mostGamesDay: mostGamesDateKey,
      maxGames: maxGameCount 
    };
  }, [statsByDate]);

  const getStats = (date: Date): DateStats => {
    const dateKey = format(date, "yyyy-MM-dd");
    return statsByDate[dateKey] || {
      gameCount: 0,
      highConfidenceCount: 0,
      avgConfidence: 0,
      arbitrageCount: 0,
      score: 0,
      leagueBreakdown: {},
    };
  };

  const isBestDay = (date: Date): boolean => {
    const dateKey = format(date, "yyyy-MM-dd");
    return dateKey === bestDay && getStats(date).score > 20;
  };

  const isMostGamesDay = (date: Date): boolean => {
    const dateKey = format(date, "yyyy-MM-dd");
    return dateKey === mostGamesDay && maxGames > 10;
  };

  const totalGames = matches.length;

  const getDateLabel = (date: Date): string => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEE");
  };

  const getDateNumber = (date: Date): string => {
    return format(date, "d");
  };

  const getMonth = (date: Date): string => {
    return format(date, "MMM");
  };

  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return isSameDay(date, selectedDate);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Button
          variant={selectedDate === null ? "default" : "outline"}
          size="sm"
          onClick={() => onDateSelect(null)}
          className="shrink-0 h-auto py-2"
        >
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              <span>All Days</span>
            </div>
            {totalGames > 0 && (
              <Badge 
                variant={selectedDate === null ? "secondary" : "outline"} 
                className="mt-1 text-[10px] h-4 px-1.5"
              >
                {totalGames}
              </Badge>
            )}
          </div>
        </Button>
        
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {dates.map((date) => {
              const stats = getStats(date);
              const hasGames = stats.gameCount > 0;
              const isBest = isBestDay(date);
              const isMostGames = isMostGamesDay(date);
              const hasHighConfidence = stats.highConfidenceCount > 0;
              const hasArbitrage = stats.arbitrageCount > 0;
              
              return (
                <Tooltip key={date.toISOString()}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isSelected(date) ? "default" : "outline"}
                      size="sm"
                      onClick={() => onDateSelect(date)}
                      className={cn(
                        "flex flex-col items-center min-w-[75px] h-auto py-2 px-3 relative",
                        isToday(date) && !isSelected(date) && "border-primary/50",
                        !hasGames && "opacity-50",
                        isBest && !isSelected(date) && "border-green-500 border-2 bg-green-500/5",
                        isMostGames && !isBest && !isSelected(date) && "border-blue-500 border-2 bg-blue-500/5"
                      )}
                    >
                      {/* Best day indicator */}
                      {isBest && (
                        <div className="absolute -top-2 -right-1">
                          <div className="bg-green-500 text-white text-[8px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 font-bold">
                            <Trophy className="h-2.5 w-2.5" />
                            BEST
                          </div>
                        </div>
                      )}
                      
                      {/* Most games indicator (if not best day) */}
                      {isMostGames && !isBest && (
                        <div className="absolute -top-2 -right-1">
                          <div className="bg-blue-500 text-white text-[8px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 font-bold">
                            <Flame className="h-2.5 w-2.5" />
                            HOT
                          </div>
                        </div>
                      )}
                      
                      <span className="text-[10px] uppercase font-medium opacity-70">
                        {getDateLabel(date)}
                      </span>
                      <span className="text-lg font-bold leading-none">
                        {getDateNumber(date)}
                      </span>
                      <span className="text-[10px] uppercase opacity-70">
                        {getMonth(date)}
                      </span>
                      
                      {/* Game count badge */}
                      <Badge 
                        variant={isSelected(date) ? "secondary" : hasGames ? "default" : "outline"}
                        className={cn(
                          "mt-1 text-[10px] h-4 px-1.5",
                          !hasGames && "bg-muted text-muted-foreground",
                          hasGames && !isSelected(date) && "bg-primary/10 text-primary border-primary/20",
                          isBest && !isSelected(date) && "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30"
                        )}
                      >
                        {stats.gameCount}
                      </Badge>
                      
                      {/* Opportunity indicators */}
                      {hasGames && (
                        <div className="flex items-center gap-1 mt-1">
                          {hasHighConfidence && (
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500" title="High confidence picks" />
                          )}
                          {hasArbitrage && (
                            <div className="h-1.5 w-1.5 rounded-full bg-yellow-500" title="Arbitrage opportunities" />
                          )}
                          {stats.avgConfidence >= 60 && !hasHighConfidence && (
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" title="Good confidence" />
                          )}
                        </div>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs max-w-[280px]">
                    <div className="space-y-2">
                      <p className="font-semibold text-sm">{format(date, "EEEE, MMMM d")}</p>
                      
                      {/* League Breakdown */}
                      {Object.keys(stats.leagueBreakdown).length > 0 && (
                        <div className="border-b pb-2">
                          <p className="text-muted-foreground mb-1 font-medium">Games by League:</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                            {Object.entries(stats.leagueBreakdown)
                              .sort((a, b) => b[1] - a[1])
                              .map(([league, count]) => (
                                <div key={league} className="flex items-center justify-between">
                                  <span className="text-muted-foreground">{league}:</span>
                                  <span className="font-medium">{count}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Stats */}
                      <div className="space-y-0.5 text-muted-foreground">
                        <p className="font-medium text-foreground">{stats.gameCount} total games</p>
                        {stats.highConfidenceCount > 0 && (
                          <p className="text-green-600 dark:text-green-400 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {stats.highConfidenceCount} high-confidence picks
                          </p>
                        )}
                        {stats.arbitrageCount > 0 && (
                          <p className="text-yellow-600 dark:text-yellow-400">
                            {stats.arbitrageCount} top opportunities
                          </p>
                        )}
                        {stats.avgConfidence > 0 && (
                          <p>Avg confidence: {Math.round(stats.avgConfidence)}%</p>
                        )}
                      </div>
                      
                      {isBest && (
                        <p className="text-green-600 dark:text-green-400 font-medium pt-1 border-t">
                          ⭐ Best betting day this week
                        </p>
                      )}
                      {isMostGames && !isBest && (
                        <p className="text-blue-600 dark:text-blue-400 font-medium pt-1 border-t">
                          🔥 Most games this week
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
};
