
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useMemo } from "react";

interface SchedulesHeaderProps {
  isLoading: boolean;
  handleRefreshData: () => void;
  currentDate: Date;
  currentView: "day" | "week" | "month";
  setCurrentView: (view: "day" | "week" | "month") => void;
  navigateDate: (direction: "prev" | "next") => void;
  getDateRangeLabel: () => string;
  goToDate: (date: Date | undefined) => void;
  goToToday: () => void;
  goToTomorrow: () => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedLeague: string;
  setSelectedLeague: (val: string) => void;
  selectedTeam: string;
  setSelectedTeam: (val: string) => void;
  allTeams: any[];
  filtersVisible: boolean;
  setFiltersVisible: (v: boolean) => void;
}

const SchedulesHeader = ({
  isLoading,
  handleRefreshData,
  currentDate,
  currentView,
  setCurrentView,
  navigateDate,
  getDateRangeLabel,
  goToDate,
  goToToday,
  goToTomorrow,
  searchQuery,
  setSearchQuery,
  selectedLeague,
  setSelectedLeague,
  selectedTeam,
  setSelectedTeam,
  allTeams,
  filtersVisible,
  setFiltersVisible,
}: SchedulesHeaderProps) => (
  <>
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold">Sports Schedules</h1>
        <p className="text-muted-foreground">
          Complete schedules and times for all professional sports teams
        </p>
      </div>
      <Button onClick={handleRefreshData} disabled={isLoading}>
        {isLoading ? "Loading..." : "Refresh Schedules"}
      </Button>
    </div>

    <div className="bg-card/90 rounded-xl shadow-md p-6 border border-muted space-y-5 transition-all">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate('prev')}
            aria-label="Previous date range"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[180px] justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {getDateRangeLabel()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={goToDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateDate('next')}
            aria-label="Next date range"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={goToToday}
            size="sm"
          >
            Today
          </Button>
          <Button
            variant="outline"
            onClick={goToTomorrow}
            size="sm"
          >
            Tomorrow
          </Button>
          <Button
            variant={currentView === 'day' ? "default" : "outline"}
            onClick={() => setCurrentView('day')}
            size="sm"
          >
            Day
          </Button>
          <Button
            variant={currentView === 'week' ? "default" : "outline"}
            onClick={() => setCurrentView('week')}
            size="sm"
          >
            Week
          </Button>
          <Button
            variant={currentView === 'month' ? "default" : "outline"}
            onClick={() => setCurrentView('month')}
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
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={selectedLeague} onValueChange={setSelectedLeague}>
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
        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
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
          onClick={() => setFiltersVisible(!filtersVisible)}
          className="md:ml-auto"
          size="icon"
          aria-label="Show advanced filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>
      {filtersVisible && (
        <div className="mt-4 p-4 border rounded-lg bg-muted/20">
          {/* Use ScheduleFilters directly here */}
          {/* (import if you want customization) */}
        </div>
      )}
    </div>
  </>
);

export default SchedulesHeader;
