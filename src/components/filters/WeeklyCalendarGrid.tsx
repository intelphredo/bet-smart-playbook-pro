import React, { useMemo, useState } from "react";
import { Match } from "@/types/sports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Target,
  Zap,
  Flame
} from "lucide-react";
import { format, parseISO, startOfDay, addDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

interface WeeklyCalendarGridProps {
  matches: Match[];
  daysAhead?: number;
  onMatchClick?: (match: Match) => void;
}

interface TimeSlot {
  hour: number;
  label: string;
}

interface DayColumn {
  date: Date;
  dateLabel: string;
  isToday: boolean;
  matches: Match[];
}

// Generate time slots from 10 AM to 11 PM
const TIME_SLOTS: TimeSlot[] = Array.from({ length: 14 }, (_, i) => {
  const hour = i + 10; // Start at 10 AM
  return {
    hour,
    label: hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`,
  };
});

const LEAGUE_COLORS: Record<string, string> = {
  NBA: "bg-orange-500",
  NFL: "bg-green-600",
  MLB: "bg-red-500",
  NHL: "bg-blue-500",
  NCAAF: "bg-purple-500",
  NCAAB: "bg-yellow-500",
  SOCCER: "bg-emerald-500",
};

export const WeeklyCalendarGrid: React.FC<WeeklyCalendarGridProps> = ({
  matches,
  daysAhead = 7,
  onMatchClick,
}) => {
  const [weekOffset, setWeekOffset] = useState(0);
  
  const dayColumns = useMemo((): DayColumn[] => {
    const today = startOfDay(new Date());
    const columns: DayColumn[] = [];
    
    for (let i = 0; i < daysAhead; i++) {
      const date = addDays(today, i + weekOffset * daysAhead);
      const isToday = isSameDay(date, today);
      
      const dayMatches = matches.filter((match) => {
        const matchDate = parseISO(match.startTime);
        return isSameDay(startOfDay(matchDate), date);
      });
      
      columns.push({
        date,
        dateLabel: isToday ? "Today" : format(date, "EEE d"),
        isToday,
        matches: dayMatches,
      });
    }
    
    return columns;
  }, [matches, daysAhead, weekOffset]);

  const getMatchesForTimeSlot = (dayColumn: DayColumn, hour: number) => {
    return dayColumn.matches.filter((match) => {
      const matchDate = parseISO(match.startTime);
      return matchDate.getHours() === hour;
    });
  };

  const totalGames = dayColumns.reduce((sum, col) => sum + col.matches.length, 0);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Weekly Calendar</CardTitle>
              <p className="text-xs text-muted-foreground">
                {totalGames} games across {daysAhead} days
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setWeekOffset(prev => prev - 1)}
              disabled={weekOffset <= 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setWeekOffset(0)}
              disabled={weekOffset === 0}
            >
              Today
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setWeekOffset(prev => prev + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* League Legend */}
        <div className="flex flex-wrap gap-2 mt-3">
          {Object.entries(LEAGUE_COLORS).map(([league, color]) => (
            <div key={league} className="flex items-center gap-1">
              <div className={cn("w-2 h-2 rounded-full", color)} />
              <span className="text-[10px] text-muted-foreground">{league}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <div className="min-w-[800px]">
            {/* Header Row - Days */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border/50 bg-muted/30">
              <div className="p-2 text-xs font-medium text-muted-foreground flex items-center justify-center">
                <Clock className="h-3 w-3 mr-1" />
                Time
              </div>
              {dayColumns.map((col, index) => (
                <div 
                  key={index}
                  className={cn(
                    "p-2 text-center border-l border-border/30",
                    col.isToday && "bg-primary/10"
                  )}
                >
                  <p className={cn(
                    "text-sm font-medium",
                    col.isToday && "text-primary"
                  )}>
                    {col.dateLabel}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {col.matches.length} games
                  </p>
                </div>
              ))}
            </div>
            
            {/* Time Slots Grid */}
            <div className="max-h-[500px] overflow-y-auto">
              {TIME_SLOTS.map((slot) => (
                <div 
                  key={slot.hour} 
                  className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border/30 min-h-[60px]"
                >
                  <div className="p-2 text-xs text-muted-foreground flex items-start justify-center bg-muted/20 border-r border-border/30">
                    {slot.label}
                  </div>
                  {dayColumns.map((col, colIndex) => {
                    const slotMatches = getMatchesForTimeSlot(col, slot.hour);
                    
                    return (
                      <div 
                        key={colIndex}
                        className={cn(
                          "p-1 border-l border-border/30 min-h-[60px]",
                          col.isToday && "bg-primary/5"
                        )}
                      >
                        <div className="flex flex-col gap-1">
                          {slotMatches.map((match) => (
                            <MatchCell 
                              key={match.id} 
                              match={match} 
                              onClick={onMatchClick}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// Individual match cell component
const MatchCell: React.FC<{
  match: Match;
  onClick?: (match: Match) => void;
}> = ({ match, onClick }) => {
  const confidence = match.prediction?.confidence || 0;
  const smartScore = match.smartScore?.overall || 0;
  const isHighConfidence = confidence >= 70;
  const isTopPick = smartScore >= 65;
  const leagueColor = LEAGUE_COLORS[match.league] || "bg-gray-500";
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onClick?.(match)}
            className={cn(
              "w-full text-left p-1.5 rounded text-[10px] transition-all hover:scale-[1.02]",
              "border border-border/50 bg-background hover:bg-accent/50",
              isTopPick && "ring-1 ring-yellow-500/50",
              isHighConfidence && "ring-1 ring-green-500/50"
            )}
          >
            <div className="flex items-center gap-1 mb-0.5">
              <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", leagueColor)} />
              <span className="font-medium truncate">
                {match.homeTeam?.shortName || "Home"}
              </span>
              <span className="text-muted-foreground">vs</span>
              <span className="font-medium truncate">
                {match.awayTeam?.shortName || "Away"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">
                {format(parseISO(match.startTime), "h:mm a")}
              </span>
              {isHighConfidence && (
                <Target className="h-2.5 w-2.5 text-green-500" />
              )}
              {isTopPick && (
                <Zap className="h-2.5 w-2.5 text-yellow-500" />
              )}
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[200px]">
          <div className="space-y-2">
            <div className="font-medium">
              {match.homeTeam?.name} vs {match.awayTeam?.name}
            </div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">League:</span>
                <Badge variant="outline" className="text-[10px] h-4">
                  {match.league}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time:</span>
                <span>{format(parseISO(match.startTime), "h:mm a")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confidence:</span>
                <span className={cn(
                  isHighConfidence ? "text-green-500" : "text-muted-foreground"
                )}>
                  {Math.round(confidence)}%
                </span>
              </div>
              {smartScore > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SmartScore:</span>
                  <span className={cn(
                    isTopPick ? "text-yellow-500" : "text-muted-foreground"
                  )}>
                    {Math.round(smartScore)}
                  </span>
                </div>
              )}
              {match.prediction?.recommended && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pick:</span>
                  <span className="capitalize">{match.prediction.recommended}</span>
                </div>
              )}
            </div>
            {(isHighConfidence || isTopPick) && (
              <div className="flex gap-1 pt-1 border-t border-border">
                {isHighConfidence && (
                  <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-600">
                    <Target className="h-2.5 w-2.5 mr-0.5" />
                    High Conf
                  </Badge>
                )}
                {isTopPick && (
                  <Badge variant="secondary" className="text-[10px] bg-yellow-500/10 text-yellow-600">
                    <Zap className="h-2.5 w-2.5 mr-0.5" />
                    Top Pick
                  </Badge>
                )}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};