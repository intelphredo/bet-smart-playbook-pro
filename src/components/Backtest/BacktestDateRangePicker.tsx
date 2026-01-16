import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { CalendarIcon, X } from "lucide-react";

interface BacktestDateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange: (range: { start?: Date; end?: Date }) => void;
}

const QUICK_RANGES = [
  { label: "Last 7 days", getValue: () => ({ start: subDays(new Date(), 7), end: new Date() }) },
  { label: "Last 14 days", getValue: () => ({ start: subDays(new Date(), 14), end: new Date() }) },
  { label: "Last 30 days", getValue: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
  { label: "Last 60 days", getValue: () => ({ start: subDays(new Date(), 60), end: new Date() }) },
  { label: "Last 90 days", getValue: () => ({ start: subDays(new Date(), 90), end: new Date() }) },
  { label: "This month", getValue: () => ({ start: startOfMonth(new Date()), end: new Date() }) },
  { label: "Last month", getValue: () => ({ 
    start: startOfMonth(subMonths(new Date(), 1)), 
    end: endOfMonth(subMonths(new Date(), 1)) 
  }) },
];

export function BacktestDateRangePicker({
  startDate,
  endDate,
  onDateRangeChange,
}: BacktestDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleQuickSelect = (getValue: () => { start: Date; end: Date }) => {
    const range = getValue();
    onDateRangeChange(range);
    setIsOpen(false);
  };

  const handleReset = () => {
    onDateRangeChange({ start: undefined, end: undefined });
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !startDate && !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {startDate ? (
              endDate ? (
                <>
                  {format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
                </>
              ) : (
                format(startDate, "MMM d, yyyy")
              )
            ) : (
              <span>Select date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Quick Ranges */}
            <div className="border-r p-2 space-y-1">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">Quick Select</p>
              {QUICK_RANGES.map((range) => (
                <Button
                  key={range.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs h-7"
                  onClick={() => handleQuickSelect(range.getValue)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
            
            {/* Calendar */}
            <Calendar
              initialFocus
              mode="range"
              selected={{
                from: startDate,
                to: endDate,
              }}
              onSelect={(range) => {
                onDateRangeChange({
                  start: range?.from,
                  end: range?.to,
                });
                if (range?.from && range?.to) {
                  setIsOpen(false);
                }
              }}
              numberOfMonths={2}
              disabled={{ after: new Date() }}
              className="p-3"
            />
          </div>
        </PopoverContent>
      </Popover>
      
      {(startDate || endDate) && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReset}
          className="h-9 w-9 shrink-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Reset date filter</span>
        </Button>
      )}
    </div>
  );
}
