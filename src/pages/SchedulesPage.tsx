
import { useState, useMemo } from "react";
import { useESPNData } from "@/hooks/useESPNData";
import { Match, League, Team } from "@/types/sports";
import NavBar from "@/components/NavBar";
import PageFooter from "@/components/PageFooter";
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay, addDays, subDays } from "date-fns";
import SchedulesHeader from "@/components/schedules/SchedulesHeader";
import SchedulesResults from "@/components/schedules/SchedulesResults";
import { toast } from "@/hooks/use-toast";

const ITEMS_PER_PAGE = 10;

const SchedulesPage = () => {
  const [selectedLeague, setSelectedLeague] = useState<League | "ALL">("ALL");
  const [selectedTeam, setSelectedTeam] = useState<string>("all_teams");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<"day" | "week" | "month">("week");
  const [filtersVisible, setFiltersVisible] = useState(false);

  const { allMatches, isLoading, error, refetch } = useESPNData({
    league: selectedLeague,
    refreshInterval: 300000, // Every 5 minutes
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

      // selectedTeam logic: don't filter if "all_teams"
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

  // Create type-safe handlers to pass to child components
  const handleLeagueChange = (value: League | "ALL") => {
    setSelectedLeague(value);
  };

  const handleTeamChange = (value: string) => {
    setSelectedTeam(value);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleViewChange = (view: "day" | "week" | "month") => {
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container px-4 py-6">
        <div className="flex flex-col space-y-6">
          <SchedulesHeader
            currentDate={currentDate}
            currentView={currentView}
            dateRangeLabel={getDateRangeLabel()}
            selectedLeague={selectedLeague}
            selectedTeam={selectedTeam}
            searchQuery={searchQuery}
            filtersVisible={filtersVisible}
            allTeams={allTeams}
            isLoading={isLoading}
            onRefresh={handleRefreshData}
            onDateNavigate={navigateDate}
            onLeagueChange={handleLeagueChange}
            onTeamChange={handleTeamChange}
            onSearchChange={handleSearchChange}
            onViewChange={handleViewChange}
            onToggleFilters={setFiltersVisible}
          />
          
          <SchedulesResults
            filteredMatches={filteredMatches}
            isLoading={isLoading}
            error={error}
            handleRefreshData={handleRefreshData}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      </div>
      <PageFooter />
    </div>
  );
};

export default SchedulesPage;
