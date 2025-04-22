
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { League } from "@/types/sports";
import { SportCategory } from "@/types/LeagueRegistry";
import LeagueRegistry from "@/types/LeagueRegistry";
import LeagueFilter from "./filters/LeagueFilter";
import MatchStatusFilter from "./filters/MatchStatusFilter";
import AdvancedFilters from "./filters/AdvancedFilters";
import ActiveFilters from "./filters/ActiveFilters";

interface FilterSectionProps {
  selectedLeague: League | string | "ALL";
  onLeagueChange: (league: League | string | "ALL") => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  teamFilter?: string;
  onTeamFilterChange?: (team: string) => void;
  dateRange?: { start?: Date; end?: Date };
  onDateRangeChange?: (range: { start?: Date; end?: Date }) => void;
  onReset?: () => void;
  sportCategoryFilter?: SportCategory | "ALL";
  onSportCategoryChange?: (category: SportCategory | "ALL") => void;
}

const FilterSection = ({
  selectedLeague,
  onLeagueChange,
  activeTab,
  onTabChange,
  teamFilter = "",
  onTeamFilterChange,
  dateRange,
  onDateRangeChange,
  onReset,
  sportCategoryFilter = "ALL",
  onSportCategoryChange
}: FilterSectionProps) => {
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<{start?: Date, end?: Date}>({});
  const [tempFilters, setTempFilters] = useState({
    team: teamFilter || "",
    sportCategory: sportCategoryFilter
  });

  // Get leagues from registry for sport categories
  const leagues = LeagueRegistry.getActiveLeagues();
  const sportCategories = Array.from(
    new Set(leagues.map(league => league.category))
  );

  const applyAdvancedFilters = () => {
    if (onTeamFilterChange && tempFilters.team !== teamFilter) {
      onTeamFilterChange(tempFilters.team);
    }
    
    if (onDateRangeChange && (tempDateRange.start !== dateRange?.start || tempDateRange.end !== dateRange?.end)) {
      onDateRangeChange(tempDateRange);
    }
    
    if (onSportCategoryChange && tempFilters.sportCategory !== sportCategoryFilter) {
      onSportCategoryChange(tempFilters.sportCategory as SportCategory | "ALL");
    }
    
    setIsAdvancedFiltersOpen(false);
  };

  const resetFilters = () => {
    if (onReset) {
      onReset();
    } else {
      onLeagueChange("ALL");
      onTabChange("upcoming");
      if (onTeamFilterChange) onTeamFilterChange("");
      if (onDateRangeChange) onDateRangeChange({});
      if (onSportCategoryChange) onSportCategoryChange("ALL");
    }
    setTempFilters({
      team: "",
      sportCategory: "ALL" as const
    });
    setTempDateRange({});
    setIsAdvancedFiltersOpen(false);
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-background border rounded-lg mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filters:</span>
        </div>
        
        <div className="flex ml-auto">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 lg:px-3"
            onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
          >
            {isAdvancedFiltersOpen ? "Hide Advanced Filters" : "Advanced Filters"}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <LeagueFilter
          selectedLeague={selectedLeague}
          onLeagueChange={onLeagueChange}
          sportCategoryFilter={sportCategoryFilter}
        />

        <MatchStatusFilter
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
        
        {/* Reset Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="ml-auto"
        >
          <X className="h-4 w-4 mr-1" /> Reset
        </Button>
      </div>
      
      {/* Advanced Filters Section */}
      {isAdvancedFiltersOpen && (
        <AdvancedFilters
          tempFilters={tempFilters}
          tempDateRange={tempDateRange}
          setTempFilters={(filters) => setTempFilters(filters as { team: string; sportCategory: "ALL" | SportCategory })}
          setTempDateRange={setTempDateRange}
          onApplyFilters={applyAdvancedFilters}
          sportCategories={sportCategories}
          onDateRangeChange={onDateRangeChange}
        />
      )}
      
      {/* Active Filters Display */}
      <ActiveFilters
        selectedLeague={selectedLeague}
        teamFilter={teamFilter}
        dateRange={dateRange}
        sportCategoryFilter={sportCategoryFilter}
        onLeagueChange={onLeagueChange}
        onTeamFilterChange={onTeamFilterChange}
        onDateRangeChange={onDateRangeChange}
        onSportCategoryChange={onSportCategoryChange}
      />
    </div>
  );
};

export default FilterSection;
