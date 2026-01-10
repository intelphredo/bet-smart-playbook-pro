import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { League } from "@/types/sports";
import { SportCategory } from "@/types/LeagueRegistry";
import LeagueRegistry from "@/types/LeagueRegistry";
import LeagueFilter from "./filters/LeagueFilter";
import MatchStatusFilter from "./filters/MatchStatusFilter";
import AdvancedFilters from "./filters/AdvancedFilters";
import ActiveFilters from "./filters/ActiveFilters";
import DataSourceFilter, { DataViewSource } from "./filters/DataSourceFilter";
import { Badge } from "@/components/ui/badge";

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
  dataViewSource?: DataViewSource;
  onDataViewSourceChange?: (source: DataViewSource) => void;
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
  onSportCategoryChange,
  dataViewSource = "combined",
  onDataViewSourceChange
}: FilterSectionProps) => {
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
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

  // Count active filters
  const activeFilterCount = [
    selectedLeague !== "ALL",
    teamFilter !== "",
    dateRange?.start || dateRange?.end,
    sportCategoryFilter !== "ALL",
    dataViewSource !== "combined"
  ].filter(Boolean).length;

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
      if (onDataViewSourceChange) onDataViewSourceChange("combined");
    }
    setTempFilters({
      team: "",
      sportCategory: "ALL" as const
    });
    setTempDateRange({});
    setIsAdvancedFiltersOpen(false);
  };

  const filterContent = (
    <>
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
        
        {/* Reset Button - show when filters active */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="ml-auto h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <X className="h-4 w-4 mr-1" /> Reset ({activeFilterCount})
          </Button>
        )}
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
    </>
  );

  return (
    <div className="filter-section mb-4 fade-in">
      {/* Desktop layout */}
      <div className="hidden md:flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            {onDataViewSourceChange && (
              <DataSourceFilter 
                value={dataViewSource} 
                onChange={onDataViewSourceChange} 
              />
            )}
            <Button
              size="sm"
              variant={isAdvancedFiltersOpen ? "secondary" : "ghost"}
              className="h-8 px-3 text-xs"
              onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
            >
              {isAdvancedFiltersOpen ? "Hide Advanced" : "Advanced"}
            </Button>
          </div>
        </div>
        {filterContent}
      </div>

      {/* Mobile layout - collapsible */}
      <div className="md:hidden">
        <Collapsible open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 px-3 gap-2">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Filters</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
                {isMobileFiltersOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            <div className="flex gap-2">
              {onDataViewSourceChange && (
                <DataSourceFilter 
                  value={dataViewSource} 
                  onChange={onDataViewSourceChange} 
                />
              )}
            </div>
          </div>
          
          <CollapsibleContent className="pt-3 space-y-3">
            <Button
              size="sm"
              variant={isAdvancedFiltersOpen ? "secondary" : "outline"}
              className="w-full h-8 text-xs"
              onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
            >
              {isAdvancedFiltersOpen ? "Hide Advanced Filters" : "Show Advanced Filters"}
            </Button>
            {filterContent}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default FilterSection;
