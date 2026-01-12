import React, { useMemo } from "react";
import { format, addDays, isToday, isTomorrow, startOfDay, isSameDay, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Match } from "@/types/sports";

interface DateFilterProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
  daysAhead?: number;
  matches?: Match[];
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

  // Calculate game counts for each date
  const gameCountsByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    
    matches.forEach((match) => {
      const matchDate = parseISO(match.startTime);
      const dateKey = format(startOfDay(matchDate), "yyyy-MM-dd");
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    });
    
    return counts;
  }, [matches]);

  const getGameCount = (date: Date): number => {
    const dateKey = format(date, "yyyy-MM-dd");
    return gameCountsByDate[dateKey] || 0;
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
            const gameCount = getGameCount(date);
            const hasGames = gameCount > 0;
            
            return (
              <Button
                key={date.toISOString()}
                variant={isSelected(date) ? "default" : "outline"}
                size="sm"
                onClick={() => onDateSelect(date)}
                className={cn(
                  "flex flex-col items-center min-w-[70px] h-auto py-2 px-3 relative",
                  isToday(date) && !isSelected(date) && "border-primary/50",
                  !hasGames && "opacity-50"
                )}
              >
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
                    hasGames && !isSelected(date) && "bg-primary/10 text-primary border-primary/20"
                  )}
                >
                  {gameCount} {gameCount === 1 ? "game" : "games"}
                </Badge>
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
