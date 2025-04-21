import { useState, useMemo } from "react";
import { useESPNData } from "@/hooks/useESPNData";
import { Match, League, Team } from "@/types/sports";
import NavBar from "@/components/NavBar";
import PageFooter from "@/components/PageFooter";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  FilterIcon,
  Search,
  SlidersHorizontal,
  CalendarIcon
} from "lucide-react";
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay, addDays, subDays } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { 
  Pagination, 
  PaginationContent, 
  PaginationNext, 
  PaginationPrevious, 
  PaginationItem,
  PaginationLink 
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import ScheduleTable from "@/components/ScheduleTable";
import ScheduleCard from "@/components/ScheduleCard";
import ScheduleFilters from "@/components/ScheduleFilters";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";

const ITEMS_PER_PAGE = 10;

const Schedules = () => {
  const [selectedLeague, setSelectedLeague] = useState<League | "ALL">("ALL");
  const [selectedTeam, setSelectedTeam] = useState<string>("all_teams");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<"day" | "week" | "month">("week");
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const { allMatches, isLoading, error, refetch } = useESPNData({
    league: selectedLeague,
    refreshInterval: 300000, // Every 5 minutes
    includeSchedule: true, // Ensure we're getting the full schedule data
  });

  const navigateDate = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentView === 'day') setCurrentDate(subDays(currentDate, 1));
      else if (currentView === 'week') setCurrentDate(subDays(currentDate, 7));
      else setCurrentDate(subDays(currentDate, 30));
    } else {
      if (currentView === 'day') setCurrentDate(addDays(currentDate, 1));
      else if (currentView === 'week') setCurrentDate(addDays(currentDate, 7));
      else setCurrentDate(addDays(currentDate, 30));
    }
    setCurrentPage(1); // Reset to first page when changing dates
  };

  const goToDate = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(date);
      setCurrentPage(1);
    }
  };

  const goToTomorrow = () => {
    const tomorrow = addDays(new Date(), 1);
    setCurrentDate(tomorrow);
    setCurrentView('day');
    setCurrentPage(1);
    toast({
      title: "Showing tomorrow's schedule",
      description: `Games for ${format(tomorrow, 'MMMM d, yyyy')}`,
    });
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setCurrentView('day');
    setCurrentPage(1);
  };

  const allTeams = useMemo(() => {
    const teams = new Map<string, Team>();
    allMatches.forEach(match => {
      teams.set(match.homeTeam.id, match.homeTeam);
      teams.set(match.awayTeam.id, match.awayTeam);
    });
    return Array.from(teams.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allMatches]);

  const filteredMatches = useMemo(() => {
    let startDate = startOfDay(currentDate);
    let endDate;
    if (currentView === 'day') {
      endDate = endOfDay(currentDate);
    } else if (currentView === 'week') {
      endDate = endOfDay(addDays(currentDate, 6));
    } else {
      endDate = endOfDay(addDays(currentDate, 29));
    }

    return allMatches.filter(match => {
      const matchDate = parseISO(match.startTime);
      const matchInDateRange = !isBefore(matchDate, startDate) && !isAfter(matchDate, endDate);

      const teamFilter = selectedTeam && selectedTeam !== "all_teams"
        ? (match.homeTeam.id === selectedTeam || match.awayTeam.id === selectedTeam)
        : true;

      const searchFilter = searchQuery
        ? (match.homeTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           match.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;

      return matchInDateRange && teamFilter && searchFilter;
    }).sort((a, b) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  }, [allMatches, currentDate, currentView, selectedTeam, searchQuery]);

  const totalPages = Math.ceil(filteredMatches.length / ITEMS_PER_PAGE);
  const paginatedMatches = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMatches.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMatches, currentPage]);

  const handleRefreshData = () => {
    refetch();
    toast({
      title: "Refreshing schedules",
      description: "Fetching the latest schedule data",
    });
  };

  const getDateRangeLabel = () => {
    if (currentView === 'day') {
      return format(currentDate, 'MMMM d, yyyy');
    } else if (currentView === 'week') {
      const endOfWeek = addDays(currentDate, 6);
      return `${format(currentDate, 'MMM d')} - ${format(endOfWeek, 'MMM d, yyyy')}`;
    } else {
      const endOfMonth = addDays(currentDate, 29);
      return `${format(currentDate, 'MMM d')} - ${format(endOfMonth, 'MMM d, yyyy')}`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container px-4 py-6">
        <div className="flex flex-col space-y-6">
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
              <Select value={selectedLeague} onValueChange={(value) => setSelectedLeague(value as League | "ALL")}>
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
                <ScheduleFilters 
                  onClose={() => setFiltersVisible(false)} 
                  onApply={() => setFiltersVisible(false)}
                />
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="text-center p-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-navy-500"></div>
              <p className="mt-4">Loading schedules...</p>
            </div>
          ) : error ? (
            <div className="text-center p-12 text-red-500">
              <p>Error loading schedule data. Please try again later.</p>
              <Button onClick={handleRefreshData} variant="outline" className="mt-2">
                Retry
              </Button>
            </div>
          ) : (
            <>
              {filteredMatches.length === 0 ? (
                <div className="text-center p-12 border rounded-lg">
                  <p className="text-xl font-medium text-muted-foreground">No scheduled games found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try adjusting your filters or date range
                  </p>
                </div>
              ) : (
                <>
                  <div className="hidden md:block">
                    <ScheduleTable matches={paginatedMatches} />
                  </div>
                  <div className="md:hidden space-y-4">
                    {paginatedMatches.map((match) => (
                      <ScheduleCard key={match.id} match={match} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing <span className="font-medium">{Math.min(filteredMatches.length, ITEMS_PER_PAGE)}</span> of{" "}
                      <span className="font-medium">{filteredMatches.length}</span> games
                    </p>
                    {totalPages > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                          {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                            const pageNum = i + 1;
                            return (
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  isActive={currentPage === pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          })}
                          {totalPages > 5 && (
                            <>
                              <PaginationItem>
                                <span className="px-2">...</span>
                              </PaginationItem>
                              <PaginationItem>
                                <PaginationLink 
                                  isActive={currentPage === totalPages}
                                  onClick={() => setCurrentPage(totalPages)}
                                >
                                  {totalPages}
                                </PaginationLink>
                              </PaginationItem>
                            </>
                          )}
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
      <PageFooter />
    </div>
  );
};

export default Schedules;
