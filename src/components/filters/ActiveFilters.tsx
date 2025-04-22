
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { League } from "@/types/sports";
import LeagueRegistry from "@/types/LeagueRegistry";

interface ActiveFiltersProps {
  selectedLeague: League | string | "ALL";
  teamFilter: string;
  dateRange: { start?: Date; end?: Date };
  sportCategoryFilter: string;
  onLeagueChange: (league: League | string | "ALL") => void;
  onTeamFilterChange?: (team: string) => void;
  onDateRangeChange?: (range: { start?: Date; end?: Date }) => void;
  onSportCategoryChange?: (category: string) => void;
}

const ActiveFilters = ({
  selectedLeague,
  teamFilter,
  dateRange,
  sportCategoryFilter,
  onLeagueChange,
  onTeamFilterChange,
  onDateRangeChange,
  onSportCategoryChange,
}: ActiveFiltersProps) => {
  const leagues = LeagueRegistry.getActiveLeagues();

  if (selectedLeague === "ALL" && !teamFilter && !dateRange?.start && sportCategoryFilter === "ALL") {
    return null;
  }

  return (
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
  );
};

export default ActiveFilters;
