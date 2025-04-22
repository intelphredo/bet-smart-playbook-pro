
import { Button } from "@/components/ui/button";
import { League } from "@/types/sports";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown, Filter, Search, X } from "lucide-react";
import { useState } from "react";
import LeagueRegistry, { LeagueConfig, SportCategory } from "@/types/LeagueRegistry";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator 
} from "@/components/ui/command";

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

  // Get leagues from registry
  const leagues = LeagueRegistry.getActiveLeagues();
  const sportCategories = Array.from(
    new Set(leagues.map(league => league.category))
  );

  // Filter leagues by selected sport category
  const filteredLeagues = sportCategoryFilter === "ALL" 
    ? leagues 
    : leagues.filter(league => league.category === sportCategoryFilter);

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
      // Default reset behavior
      onLeagueChange("ALL");
      onTabChange("upcoming");
      if (onTeamFilterChange) onTeamFilterChange("");
      if (onDateRangeChange) onDateRangeChange({});
      if (onSportCategoryChange) onSportCategoryChange("ALL");
    }
    setTempFilters({
      team: "",
      sportCategory: "ALL"
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
        {/* League Filter - Using CommandMenu for better UX with many leagues */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="justify-between w-[200px]"
            >
              {selectedLeague === "ALL"
                ? "All Leagues"
                : leagues.find(l => l.id === selectedLeague)?.name || "Select League"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search league..." />
              <CommandEmpty>No league found.</CommandEmpty>
              <CommandList>
                <CommandItem
                  key="all-leagues"
                  value="ALL"
                  onSelect={() => onLeagueChange("ALL")}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      selectedLeague === "ALL" ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  All Leagues
                </CommandItem>
                
                {filteredLeagues.map((league) => (
                  <CommandItem
                    key={league.id}
                    value={league.id}
                    onSelect={() => onLeagueChange(league.id)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        selectedLeague === league.id ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    {league.name}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Match Status Filter */}
        <div className="flex gap-1 flex-wrap">
          <Button
            variant={activeTab === "future" ? "default" : "outline"}
            size="sm"
            onClick={() => onTabChange("future")}
          >
            Future
          </Button>
          <Button
            variant={activeTab === "upcoming" ? "default" : "outline"}
            size="sm"
            onClick={() => onTabChange("upcoming")}
          >
            Upcoming
          </Button>
          <Button
            variant={activeTab === "live" ? "default" : "outline"}
            size="sm"
            onClick={() => onTabChange("live")}
          >
            Live
          </Button>
          <Button
            variant={activeTab === "finished" ? "default" : "outline"}
            size="sm"
            onClick={() => onTabChange("finished")}
          >
            Finished
          </Button>
        </div>
        
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
        <div className="mt-2 pt-2 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Team Filter */}
          <div className="flex flex-col gap-1">
            <label htmlFor="team-filter" className="text-sm font-medium">
              Team
            </label>
            <div className="flex items-center gap-1">
              <Search className="h-4 w-4 opacity-70" />
              <Input 
                id="team-filter"
                placeholder="Filter by team name" 
                value={tempFilters.team}
                onChange={(e) => setTempFilters({...tempFilters, team: e.target.value})}
                className="h-8"
              />
            </div>
          </div>
          
          {/* Sport Category Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">
              Sport Category
            </label>
            <Select
              value={tempFilters.sportCategory}
              onValueChange={(value) => setTempFilters({...tempFilters, sportCategory: value as SportCategory | "ALL"})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {sportCategories.map((category) => (
                  <SelectItem key={category} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Date Range Filter */}
          {onDateRangeChange && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">
                Date Range
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={`w-full justify-start text-left font-normal h-8 ${
                      !tempDateRange.start && !tempDateRange.end ? "text-muted-foreground" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {tempDateRange.start && tempDateRange.end ? (
                      <>
                        {format(tempDateRange.start, "PPP")} - {format(tempDateRange.end, "PPP")}
                      </>
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={tempDateRange as any}
                    onSelect={(range) => setTempDateRange(range as any)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
          
          {/* Apply Filters Button */}
          <Button 
            className="mt-auto"
            onClick={applyAdvancedFilters}
          >
            Apply Filters
          </Button>
        </div>
      )}
      
      {/* Active Filters Display */}
      {(selectedLeague !== "ALL" || teamFilter || (dateRange && (dateRange.start || dateRange.end)) || sportCategoryFilter !== "ALL") && (
        <div className="flex flex-wrap gap-1 mt-2">
          <span className="text-xs text-muted-foreground mt-1">Active filters:</span>
          {selectedLeague !== "ALL" && (
            <Badge variant="secondary" className="text-xs">
              League: {leagues.find(l => l.id === selectedLeague)?.name || selectedLeague}
              <X 
                className="ml-1 h-3 w-3 cursor-pointer" 
                onClick={() => onLeagueChange("ALL")}
              />
            </Badge>
          )}
          {teamFilter && (
            <Badge variant="secondary" className="text-xs">
              Team: {teamFilter}
              <X 
                className="ml-1 h-3 w-3 cursor-pointer" 
                onClick={() => onTeamFilterChange && onTeamFilterChange("")}
              />
            </Badge>
          )}
          {sportCategoryFilter !== "ALL" && (
            <Badge variant="secondary" className="text-xs">
              Category: {sportCategoryFilter}
              <X 
                className="ml-1 h-3 w-3 cursor-pointer" 
                onClick={() => onSportCategoryChange && onSportCategoryChange("ALL")}
              />
            </Badge>
          )}
          {dateRange && dateRange.start && (
            <Badge variant="secondary" className="text-xs">
              From: {format(dateRange.start, "MMM d, yyyy")}
              {dateRange.end && ` to ${format(dateRange.end, "MMM d, yyyy")}`}
              <X 
                className="ml-1 h-3 w-3 cursor-pointer" 
                onClick={() => onDateRangeChange && onDateRangeChange({})}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterSection;
