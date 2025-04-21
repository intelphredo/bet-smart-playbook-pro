
import React from "react";
import { Button } from "@/components/ui/button";
import { TeamAutocomplete } from "@/components/schedules/TeamAutocomplete";

interface SchedulesFilterControlsProps {
  searchQuery: string;
  isAutocompleteOpen: boolean;
  searchInputRef: React.RefObject<HTMLInputElement>;
  onSearchChange: (v: string) => void;
  onAutocompleteSelect: (team: string) => void;
  onBlur: () => void;
  onFocus: () => void;
  matches: any[];
  showTomorrowGames: boolean;
  showWeekGames: boolean;
  showFanDuelOddsOnly: boolean;
  handleShowToday: () => void;
  handleShowTomorrow: () => void;
  handleShowWeek: () => void;
  toggleFanDuelOddsFilter: () => void;
}

const SchedulesFilterControls: React.FC<SchedulesFilterControlsProps> = ({
  searchQuery,
  isAutocompleteOpen,
  searchInputRef,
  onSearchChange,
  onAutocompleteSelect,
  onBlur,
  onFocus,
  matches,
  showTomorrowGames,
  showWeekGames,
  showFanDuelOddsOnly,
  handleShowToday,
  handleShowTomorrow,
  handleShowWeek,
  toggleFanDuelOddsFilter,
}) => {
  return (
    <>
      <div className="relative mt-4 mb-2 max-w-md mx-auto">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search teams..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className="w-full pl-8 pr-2 py-2 rounded-md border border-gray-300 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        {isAutocompleteOpen && (
          <TeamAutocomplete
            matches={matches}
            query={searchQuery}
            onSelect={onAutocompleteSelect}
          />
        )}
      </div>
      
      <div className="mt-4 flex justify-between items-center max-w-md mx-auto">
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant={!showTomorrowGames && !showWeekGames ? "default" : "outline"}
            size="sm"
            onClick={handleShowToday}
          >
            Today's Games
          </Button>
          <Button 
            variant={showTomorrowGames ? "default" : "outline"}
            size="sm"
            onClick={handleShowTomorrow}
          >
            Tomorrow's Games
          </Button>
          <Button
            variant={showWeekGames ? "default" : "outline"}
            size="sm"
            onClick={handleShowWeek}
          >
            This Week's Games
          </Button>
        </div>
        <Button 
          variant={showFanDuelOddsOnly ? "default" : "outline"}
          size="sm"
          onClick={toggleFanDuelOddsFilter}
          className="flex items-center gap-1"
        >
          {showFanDuelOddsOnly ? "FanDuel Odds Only" : "All Sportsbooks"}
        </Button>
      </div>
    </>
  );
};

export default SchedulesFilterControls;
