
import React from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SchedulesDateNavigationProps {
  formattedDate: string;
  showWeekGames: boolean;
  goToPreviousDay: () => void;
  goToNextDay: () => void;
  goToToday: () => void;
}

const SchedulesDateNavigation: React.FC<SchedulesDateNavigationProps> = ({
  formattedDate,
  showWeekGames,
  goToPreviousDay,
  goToNextDay,
  goToToday,
}) => (
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-semibold">{formattedDate}</h2>
    <div className="flex gap-2">
      <Button 
        onClick={goToPreviousDay}
        className="px-3 py-1 text-sm border rounded-md hover:bg-muted flex items-center gap-1"
        variant="outline"
        size="sm"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous {showWeekGames ? 'Week' : 'Day'}
      </Button>
      <Button 
        onClick={goToToday}
        className="px-3 py-1 text-sm border rounded-md hover:bg-muted flex items-center gap-1"
        variant="outline"
        size="sm"
      >
        <CalendarDays className="h-4 w-4" />
        Today
      </Button>
      <Button 
        onClick={goToNextDay}
        className="px-3 py-1 text-sm border rounded-md hover:bg-muted flex items-center gap-1"
        variant="outline"
        size="sm"
      >
        Next {showWeekGames ? 'Week' : 'Day'}
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  </div>
);

export default SchedulesDateNavigation;
