
import React from "react";

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
      <button 
        onClick={goToPreviousDay}
        className="px-3 py-1 text-sm border rounded-md hover:bg-muted"
      >
        Previous {showWeekGames ? 'Week' : 'Day'}
      </button>
      <button 
        onClick={goToToday}
        className="px-3 py-1 text-sm border rounded-md hover:bg-muted"
      >
        Today
      </button>
      <button 
        onClick={goToNextDay}
        className="px-3 py-1 text-sm border rounded-md hover:bg-muted"
      >
        Next {showWeekGames ? 'Week' : 'Day'}
      </button>
    </div>
  </div>
);

export default SchedulesDateNavigation;
