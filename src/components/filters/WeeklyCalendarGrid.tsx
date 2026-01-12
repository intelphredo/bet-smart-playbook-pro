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
import { 
  exportMatchesToCSV, 
  exportMatchesToICal, 
  openGoogleCalendarBulk, 
  openOutlookCalendarBulk 
} from "@/utils/scheduleExport";
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

  const handleGoogleCalendar = () => {
    if (allVisibleMatches.length === 0) {
      toast.error("No games to add");
      return;
    }
    openGoogleCalendarBulk(allVisibleMatches);
    toast.success("Opening Google Calendar...");
  };

  const handleOutlookCalendar = () => {
    if (allVisibleMatches.length === 0) {
      toast.error("No games to add");
      return;
    }
    openOutlookCalendarBulk(allVisibleMatches);
    toast.success("Opening Outlook Calendar...");
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
              <DropdownMenuContent align="end" className="bg-popover w-56">
                {/* Direct Calendar Sync */}
                <div className="px-2 py-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Add to Calendar</p>
                </div>
                <DropdownMenuItem onClick={handleGoogleCalendar} className="gap-2 cursor-pointer">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <div>
                    <p className="font-medium">Google Calendar</p>
                    <p className="text-xs text-muted-foreground">Add directly to Google</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOutlookCalendar} className="gap-2 cursor-pointer">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.158.152-.353.228-.584.228h-8.547v-6.95l1.56 1.14c.078.052.168.078.27.078.103 0 .193-.026.27-.078l6.993-5.14c.078-.052.156-.06.234-.024.078.036.117.097.117.182v-.49c0-.23.08-.424.238-.576.158-.152.353-.228.584-.228h-.897zm0 2.086l-7.096 5.207-7.096-5.207v9.78h14.192V9.473zm-8.547-3.803h8.172c.23 0 .426.076.584.228.158.152.238.346.238.576v.398l-8.547 6.277V5.584h-.447zM0 5.584v13.416c0 .23.076.426.228.584.152.158.346.238.576.238h12.478V5.584H0z"/>
                  </svg>
                  <div>
                    <p className="font-medium">Outlook Calendar</p>
                    <p className="text-xs text-muted-foreground">Add to Outlook.com</p>
                  </div>
                </DropdownMenuItem>
                
                {/* Divider */}
                <div className="my-1 h-px bg-border" />
                
                {/* File Downloads */}
                <div className="px-2 py-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Download File</p>
                </div>
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
                    <p className="text-xs text-muted-foreground">Apple Calendar, etc.</p>
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