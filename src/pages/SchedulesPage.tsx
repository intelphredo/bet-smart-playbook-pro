
import { useState, useMemo } from "react";
import { useESPNData } from "@/hooks/useESPNData";
import { League, Team } from "@/types/sports";
import NavBar from "@/components/NavBar";
import PageFooter from "@/components/PageFooter";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const { allMatches, isLoading, error, refetch } = useESPNData({
    league: selectedLeague,
    refreshInterval: 300000,
    includeSchedule: true,
  });

  const allTeams = useMemo(() => {
    const teams = new Map<string, Team>();
    allMatches.forEach(match => {
      teams.set(match.homeTeam.id, match.homeTeam);
      teams.set(match.awayTeam.id, match.awayTeam);
    });
    return Array.from(teams.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allMatches]);

  // ============================= Date logic ============================
  const navigateDate = (direction: 'prev' | 'next') => {
    const addDays = (date: Date, amount: number) => new Date(date.getTime() + amount * 24 * 60 * 60 * 1000);
    const subDays = (date: Date, amount: number) => addDays(date, -amount);
    if (direction === 'prev') {
      if (currentView === 'day') setCurrentDate(subDays(currentDate, 1));
      else if (currentView === 'week') setCurrentDate(subDays(currentDate, 7));
      else setCurrentDate(subDays(currentDate, 30));
    } else {
      if (currentView === 'day') setCurrentDate(addDays(currentDate, 1));
      else if (currentView === 'week') setCurrentDate(addDays(currentDate, 7));
      else setCurrentDate(addDays(currentDate, 30));
    }
    setCurrentPage(1);
  };
  const goToDate = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(date);
      setCurrentPage(1);
    }
  };
  const goToTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setCurrentDate(tomorrow);
    setCurrentView('day');
    setCurrentPage(1);
    toast({
      title: "Showing tomorrow's schedule",
      description: tomorrow.toDateString(),
    });
  };
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setCurrentView('day');
    setCurrentPage(1);
  };

  // ============================ Filtering ==============================
  const filteredMatches = useMemo(() => {
    const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

    let startDate = startOfDay(currentDate);
    let endDate;
    if (currentView === 'day') {
      endDate = endOfDay(currentDate);
    } else if (currentView === 'week') {
      endDate = endOfDay(new Date(currentDate.getTime() + (6 * 86400 * 1000)));
    } else {
      endDate = endOfDay(new Date(currentDate.getTime() + (29 * 86400 * 1000)));
    }

    return allMatches.filter(match => {
      const matchDate = new Date(match.startTime);
      const matchInDateRange = matchDate >= startDate && matchDate <= endDate;
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
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    if (currentView === 'day') {
      return currentDate.toLocaleDateString(undefined, options);
    } else if (currentView === 'week') {
      const endOfWeek = new Date(currentDate.getTime() + (6 * 86400 * 1000));
      return `${currentDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
    } else {
      const endOfMonth = new Date(currentDate.getTime() + (29 * 86400 * 1000));
      return `${currentDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${endOfMonth.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container px-4 py-6">
        <div className="flex flex-col space-y-6">
          <SchedulesHeader
            isLoading={isLoading}
            handleRefreshData={handleRefreshData}
            currentDate={currentDate}
            currentView={currentView}
            setCurrentView={setCurrentView}
            navigateDate={navigateDate}
            getDateRangeLabel={getDateRangeLabel}
            goToDate={goToDate}
            goToToday={goToToday}
            goToTomorrow={goToTomorrow}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedLeague={selectedLeague}
            setSelectedLeague={setSelectedLeague}
            selectedTeam={selectedTeam}
            setSelectedTeam={setSelectedTeam}
            allTeams={allTeams}
            filtersVisible={filtersVisible}
            setFiltersVisible={setFiltersVisible}
          />
          <SchedulesResults
            isLoading={isLoading}
            error={error}
            filteredMatches={filteredMatches}
            paginatedMatches={paginatedMatches}
            totalPages={totalPages}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            handleRefreshData={handleRefreshData}
            filtersVisible={filtersVisible}
            setFiltersVisible={setFiltersVisible}
          />
        </div>
      </div>
      <PageFooter />
    </div>
  );
};

export default SchedulesPage;
