
import { Team, League } from "@/types/sports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import ScheduleFilters from "@/components/ScheduleFilters";

interface SchedulesHeaderProps {
  currentDate: Date;
  currentView: "day" | "week" | "month";
  dateRangeLabel: string;
  selectedLeague: League | "ALL";
  selectedTeam: string;
  searchQuery: string;
  filtersVisible: boolean;
  allTeams: Team[];
  isLoading: boolean;
  onRefresh: () => void;
  onDateNavigate: (direction: 'prev' | 'next') => void;
  onLeagueChange: (value: League | "ALL") => void;
  onTeamChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onViewChange: (view: "day" | "week" | "month") => void;
  onToggleFilters: (value: boolean) => void;
}

const SchedulesHeader = ({
  currentDate,
  currentView,
  dateRangeLabel,
  selectedLeague,
  selectedTeam,
  searchQuery,
  filtersVisible,
  allTeams,
  isLoading,
  onRefresh,
  onDateNavigate,
  onLeagueChange,
  onTeamChange,
  onSearchChange,
  onViewChange,
  onToggleFilters
}: SchedulesHeaderProps) => {
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Sports Schedules</h1>
          <p className="text-muted-foreground">
            Complete schedules and times for all professional sports teams
          </p>
        </div>
        <Button onClick={onRefresh} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh Schedules"}
        </Button>
      </div>

      {/* Filters Section Card */}
      <div className="bg-card/90 rounded-xl shadow-md p-6 border border-muted space-y-5 transition-all">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDateNavigate('prev')}
              aria-label="Previous date range"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-xl font-semibold">{dateRangeLabel}</div>
            <Button
              variant="outline"
              size="icon" 
              onClick={() => onDateNavigate('next')}
              aria-label="Next date range"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={currentView === 'day' ? "default" : "outline"}
              onClick={() => onViewChange('day')}
              size="sm"
            >
              Day
            </Button>
            <Button 
              variant={currentView === 'week' ? "default" : "outline"}
              onClick={() => onViewChange('week')}
              size="sm"
            >
              Week
            </Button>
            <Button 
              variant={currentView === 'month' ? "default" : "outline"}
              onClick={() => onViewChange('month')}
              size="sm"
            >
              Month
            </Button>
          </div>
        </div>
        <div className="block text-base font-semibold mt-1 text-muted-foreground">
          Filter Games
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-stretch mt-1">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teams..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <Select 
            value={selectedLeague} 
            onValueChange={(value) => onLeagueChange(value as League | "ALL")}
          >
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="All Leagues" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Leagues</SelectItem>
              <SelectItem value="NBA">NBA</SelectItem>
              <SelectItem value="NFL">NFL</SelectItem>
              <SelectItem value="MLB">MLB</SelectItem>
              <SelectItem value="NHL">NHL</SelectItem>
              <SelectItem value="SOCCER">Soccer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedTeam} onValueChange={onTeamChange}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_teams">All Teams</SelectItem>
              {allTeams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  <div className="flex items-center gap-2">
                    {team.logo && (
                      <img src={team.logo} alt={team.name} className="w-4 h-4 object-contain" />
                    )}
                    {team.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => onToggleFilters(!filtersVisible)} 
            className="md:ml-auto"
            size="icon"
            aria-label="Show advanced filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
        {filtersVisible && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/20">
            <ScheduleFilters 
              onClose={() => onToggleFilters(false)} 
              onApply={() => onToggleFilters(false)}
            />
          </div>
        )}
      </div>
    </>
  );
};

export default SchedulesHeader;
