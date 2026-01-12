import React from "react";
import { format, addDays, isToday, isTomorrow, startOfDay, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface DateFilterProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
  daysAhead?: number;
}

export const DateFilter: React.FC<DateFilterProps> = ({
  selectedDate,
  onDateSelect,
  daysAhead = 7,
}) => {
  const today = startOfDay(new Date());
  
  // Generate dates for the next N days
  const dates = Array.from({ length: daysAhead }, (_, i) => addDays(today, i));

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
        className="shrink-0"
      >
        <CalendarDays className="h-4 w-4 mr-1" />
        All Days
      </Button>
      
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {dates.map((date) => (
            <Button
              key={date.toISOString()}
              variant={isSelected(date) ? "default" : "outline"}
              size="sm"
              onClick={() => onDateSelect(date)}
              className={cn(
                "flex flex-col items-center min-w-[60px] h-auto py-2 px-3",
                isToday(date) && !isSelected(date) && "border-primary/50"
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
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
