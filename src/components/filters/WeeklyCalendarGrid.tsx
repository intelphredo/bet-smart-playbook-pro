import React, { useMemo, useState } from "react";
import { Match } from "@/types/sports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Target,
  Zap,
  Flame,
  Thermometer,
  Download,
  FileSpreadsheet,
  Calendar
} from "lucide-react";
import { format, parseISO, startOfDay, addDays, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { exportMatchesToCSV, exportMatchesToICal } from "@/utils/scheduleExport";
import { toast } from "sonner";

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

interface HeatMapData {
  hourTotals: Record<number, number>;
  cellCounts: Record<string, number>; // "hour-dayIndex" -> count
  maxHourTotal: number;
  maxCellCount: number;
  busiestHour: number;
  busiestHourLabel: string;
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

// Heat map color function - returns opacity based on intensity
const getHeatMapColor = (count: number, maxCount: number): string => {
  if (count === 0 || maxCount === 0) return "bg-transparent";
  const intensity = count / maxCount;
  if (intensity >= 0.8) return "bg-red-500/40";
  if (intensity >= 0.6) return "bg-orange-500/35";
  if (intensity >= 0.4) return "bg-yellow-500/30";
  if (intensity >= 0.2) return "bg-green-500/20";
  return "bg-blue-500/10";
};

const getHeatMapBorder = (count: number, maxCount: number): string => {
  if (count === 0 || maxCount === 0) return "";
  const intensity = count / maxCount;
  if (intensity >= 0.8) return "ring-2 ring-red-500/50";
  if (intensity >= 0.6) return "ring-1 ring-orange-500/40";
  return "";
};

export const WeeklyCalendarGrid: React.FC<WeeklyCalendarGridProps> = ({
  matches,
  daysAhead = 7,
  onMatchClick,
}) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [showHeatMap, setShowHeatMap] = useState(false);
  
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

  // Calculate heat map data
  const heatMapData = useMemo((): HeatMapData => {
    const hourTotals: Record<number, number> = {};
    const cellCounts: Record<string, number> = {};
    
    TIME_SLOTS.forEach((slot) => {
      hourTotals[slot.hour] = 0;
    });
    
    dayColumns.forEach((col, dayIndex) => {
      col.matches.forEach((match) => {
        const hour = parseISO(match.startTime).getHours();
        if (hour >= 10 && hour <= 23) {
          hourTotals[hour] = (hourTotals[hour] || 0) + 1;
          const cellKey = `${hour}-${dayIndex}`;
          cellCounts[cellKey] = (cellCounts[cellKey] || 0) + 1;
        }
      });
    });
    
    const maxHourTotal = Math.max(...Object.values(hourTotals), 1);
    const maxCellCount = Math.max(...Object.values(cellCounts), 1);
    
    // Find busiest hour
    let busiestHour = 10;
    let busiestCount = 0;
    Object.entries(hourTotals).forEach(([hour, count]) => {
      if (count > busiestCount) {
        busiestCount = count;
        busiestHour = parseInt(hour);
      }
    });
    
    const busiestHourLabel = busiestHour === 12 
      ? "12 PM" 
      : busiestHour > 12 
        ? `${busiestHour - 12} PM` 
        : `${busiestHour} AM`;
    
    return {
      hourTotals,
      cellCounts,
      maxHourTotal,
      maxCellCount,
      busiestHour,
      busiestHourLabel,
    };
  }, [dayColumns]);

  const getMatchesForTimeSlot = (dayColumn: DayColumn, hour: number) => {
    return dayColumn.matches.filter((match) => {
      const matchDate = parseISO(match.startTime);
      return matchDate.getHours() === hour;
    });
  };

  const totalGames = dayColumns.reduce((sum, col) => sum + col.matches.length, 0);

  // Get all matches for export (flattened from all day columns)
  const allVisibleMatches = useMemo(() => {
    return dayColumns.flatMap(col => col.matches);
  }, [dayColumns]);

  const handleExportCSV = () => {
    if (allVisibleMatches.length === 0) {
      toast.error("No games to export");
      return;
    }
    const dateRange = `${format(dayColumns[0].date, "MMM-d")}-to-${format(dayColumns[dayColumns.length - 1].date, "MMM-d")}`;
    exportMatchesToCSV(allVisibleMatches, `games-schedule-${dateRange}.csv`);
    toast.success(`Exported ${allVisibleMatches.length} games to CSV`);
  };

  const handleExportICal = () => {
    if (allVisibleMatches.length === 0) {
      toast.error("No games to export");
      return;
    }
    const dateRange = `${format(dayColumns[0].date, "MMM-d")}-to-${format(dayColumns[dayColumns.length - 1].date, "MMM-d")}`;
    exportMatchesToICal(allVisibleMatches, `games-schedule-${dateRange}.ics`);
    toast.success(`Exported ${allVisibleMatches.length} games to calendar`);
  };

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
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={handleExportCSV} className="gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium">Export as CSV</p>
                    <p className="text-xs text-muted-foreground">Spreadsheet format</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportICal} className="gap-2 cursor-pointer">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium">Export as iCal</p>
                    <p className="text-xs text-muted-foreground">Add to calendar app</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
          <div className="flex flex-wrap gap-2">
            {Object.entries(LEAGUE_COLORS).map(([league, color]) => (
              <div key={league} className="flex items-center gap-1">
                <div className={cn("w-2 h-2 rounded-full", color)} />
                <span className="text-[10px] text-muted-foreground">{league}</span>
              </div>
            ))}
          </div>
          
          {/* Heat Map Toggle */}
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Thermometer className={cn(
                      "h-4 w-4 transition-colors",
                      showHeatMap ? "text-orange-500" : "text-muted-foreground"
                    )} />
                    <span className="text-xs text-muted-foreground">Heat Map</span>
                    <Switch
                      checked={showHeatMap}
                      onCheckedChange={setShowHeatMap}
                      className="scale-75"
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show busy hours overlay</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Heat Map Legend */}
        {showHeatMap && (
          <div className="flex items-center gap-3 mt-3 p-2 rounded-lg bg-muted/30 border border-border/50">
            <div className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-medium">Busiest:</span>
              <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-600">
                {heatMapData.busiestHourLabel} ({heatMapData.hourTotals[heatMapData.busiestHour]} games)
              </Badge>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <span className="text-[10px] text-muted-foreground">Low</span>
              <div className="flex gap-0.5">
                <div className="w-4 h-3 rounded-sm bg-blue-500/10" />
                <div className="w-4 h-3 rounded-sm bg-green-500/20" />
                <div className="w-4 h-3 rounded-sm bg-yellow-500/30" />
                <div className="w-4 h-3 rounded-sm bg-orange-500/35" />
                <div className="w-4 h-3 rounded-sm bg-red-500/40" />
              </div>
              <span className="text-[10px] text-muted-foreground">High</span>
            </div>
          </div>
        )}
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
              {TIME_SLOTS.map((slot) => {
                const hourTotal = heatMapData.hourTotals[slot.hour] || 0;
                const isBusiestHour = slot.hour === heatMapData.busiestHour && hourTotal > 0;
                
                return (
                  <div 
                    key={slot.hour} 
                    className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border/30 min-h-[60px]"
                  >
                    {/* Time Label with heat indicator */}
                    <div className={cn(
                      "p-2 text-xs flex items-start justify-center border-r border-border/30 relative",
                      showHeatMap && isBusiestHour 
                        ? "bg-orange-500/20 text-orange-700 dark:text-orange-300 font-medium" 
                        : "text-muted-foreground bg-muted/20"
                    )}>
                      <div className="flex flex-col items-center gap-1">
                        <span>{slot.label}</span>
                        {showHeatMap && hourTotal > 0 && (
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-[9px] h-4 px-1",
                              isBusiestHour 
                                ? "bg-orange-500/30 text-orange-700 dark:text-orange-300" 
                                : "bg-muted"
                            )}
                          >
                            {hourTotal}
                          </Badge>
                        )}
                      </div>
                      {showHeatMap && isBusiestHour && (
                        <Flame className="absolute top-1 right-1 h-3 w-3 text-orange-500 animate-pulse" />
                      )}
                    </div>
                    
                    {/* Day cells with heat map overlay */}
                    {dayColumns.map((col, colIndex) => {
                      const slotMatches = getMatchesForTimeSlot(col, slot.hour);
                      const cellKey = `${slot.hour}-${colIndex}`;
                      const cellCount = heatMapData.cellCounts[cellKey] || 0;
                      const heatColor = showHeatMap ? getHeatMapColor(cellCount, heatMapData.maxCellCount) : "";
                      const heatBorder = showHeatMap ? getHeatMapBorder(cellCount, heatMapData.maxCellCount) : "";
                      
                      return (
                        <div 
                          key={colIndex}
                          className={cn(
                            "p-1 border-l border-border/30 min-h-[60px] transition-colors relative",
                            col.isToday && !showHeatMap && "bg-primary/5",
                            heatColor,
                            heatBorder
                          )}
                        >
                          {/* Cell count badge for heat map */}
                          {showHeatMap && cellCount > 0 && (
                            <div className="absolute top-0.5 right-0.5">
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  "text-[9px] h-4 px-1 min-w-[18px] justify-center",
                                  cellCount >= heatMapData.maxCellCount * 0.8 
                                    ? "bg-red-500/40 text-red-700 dark:text-red-300" 
                                    : cellCount >= heatMapData.maxCellCount * 0.5
                                      ? "bg-orange-500/30 text-orange-700 dark:text-orange-300"
                                      : "bg-muted/80"
                                )}
                              >
                                {cellCount}
                              </Badge>
                            </div>
                          )}
                          
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
                );
              })}
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