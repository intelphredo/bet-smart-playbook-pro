
import React, { useState, useEffect } from "react";
import { League, DataSource } from "@/types/sports";
import SchedulesHeader from "@/components/schedules/SchedulesHeader";
import SchedulesFilterControls from "@/components/schedules/SchedulesFilterControls";
import SchedulesTabContent from "@/components/schedules/SchedulesTabContent";
import { useSportsData } from "@/hooks/useSportsData";
import { format, startOfDay, endOfDay, addDays, parseISO } from "date-fns";
import { toast } from "sonner";

const SchedulesPage = () => {
  // State for filters
  const [selectedLeague, setSelectedLeague] = useState<"ALL" | League>("ALL");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<"schedule" | "standings">("schedule");
  const [dataSource, setDataSource] = useState<DataSource>("ESPN");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [showTomorrowGames, setShowTomorrowGames] = useState(false);
  const [showWeekGames, setShowWeekGames] = useState(false);
  const [showFanDuelOddsOnly, setShowFanDuelOddsOnly] = useState(false);

  // Get sports data with forced refresh every minute
  const { 
    allMatches, 
    isLoading, 
    error, 
    refetchSchedule, 
    divisionsStandings, 
    isLoadingStandings
  } = useSportsData({
    league: selectedLeague,
    includeSchedule: true,
    includeStandings: view === "standings",
    defaultSource: dataSource,
    refreshInterval: 60000  // Force refresh every 60 seconds
  });

  useEffect(() => {
    refetchSchedule();
    toast("Refreshing sports data...", {
      description: `Getting the latest ${selectedLeague} games`,
      duration: 2000
    });
  }, [selectedLeague, dataSource, refetchSchedule]);

  // Update data source
  const handleDataSourceChange = (source: DataSource) => {
    setDataSource(source);
  };

  // Filter matches by date, search query, and FanDuel odds
  const filteredMatches = (() => {
    let dateStart: Date;
    let dateEnd: Date;
    if (showWeekGames) {
      dateStart = startOfDay(selectedDate);
      dateEnd = endOfDay(addDays(selectedDate, 6));
    } else if (showTomorrowGames) {
      const dateToUse = addDays(selectedDate, 1);
      dateStart = startOfDay(dateToUse);
      dateEnd = endOfDay(dateToUse);
    } else {
      dateStart = startOfDay(selectedDate);
      dateEnd = endOfDay(selectedDate);
    }

    return allMatches.filter(match => {
      try {
        const matchDate = parseISO(match.startTime);
        const isInDateRange = matchDate >= dateStart && matchDate <= dateEnd;
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = searchQuery === "" || 
          match.homeTeam.name.toLowerCase().includes(searchLower) ||
          match.awayTeam.name.toLowerCase().includes(searchLower);

        let hasFanDuelOdds = true;
        if (showFanDuelOddsOnly) {
          hasFanDuelOdds = match.liveOdds && 
                          match.liveOdds.some(odd => 
                            odd.sportsbook.name.toLowerCase() === "fanduel");
        }
        return isInDateRange && matchesSearch && hasFanDuelOdds;
      } catch (e) {
        return false;
      }
    });
  })();

  // For autocomplete suggestions
  const allMatchesForAutocomplete = allMatches || [];

  // Handlers for autocomplete/search
  const handleSearchChange = (v: string) => {
    setSearchQuery(v);
    setIsAutocompleteOpen(true);
  };
  const handleAutocompleteSelect = (team: string) => {
    setSearchQuery(team);
    setIsAutocompleteOpen(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  const handleBlur = () => {
    setTimeout(() => setIsAutocompleteOpen(false), 120);
  };

  // Format the date for display (today, tomorrow, week)
  let formattedDate;
  if (showWeekGames) {
    formattedDate = `${format(selectedDate, "EEE, MMM d")} – ${format(addDays(selectedDate, 6), "EEE, MMM d, yyyy")}`;
  } else {
    formattedDate = format(
      showTomorrowGames ? addDays(selectedDate, 1) : selectedDate,
      "EEEE, MMMM d, yyyy"
    );
  }

  // Navigation handlers
  const goToPreviousDay = () => {
    if (showWeekGames) {
      setSelectedDate(prev => addDays(prev, -7));
    } else {
      setSelectedDate(prev => addDays(prev, -1));
    }
  };
  const goToNextDay = () => {
    if (showWeekGames) {
      setSelectedDate(prev => addDays(prev, 7));
    } else {
      setSelectedDate(prev => addDays(prev, 1));
    }
  };
  const goToToday = () => {
    setSelectedDate(new Date());
    setShowTomorrowGames(false);
    setShowWeekGames(false);
  };

  // Toggle handlers
  const handleShowToday = () => {
    setShowTomorrowGames(false);
    setShowWeekGames(false);
  };
  const handleShowTomorrow = () => {
    setShowTomorrowGames(true);
    setShowWeekGames(false);
  };
  const handleShowWeek = () => {
    setShowWeekGames(true);
    setShowTomorrowGames(false);
  };
  const toggleFanDuelOddsFilter = () => {
    setShowFanDuelOddsOnly(prev => !prev);
    setTimeout(refetchSchedule, 100);
  };

  return (
    <div className="container py-6 max-w-7xl">
      <SchedulesHeader 
        selectedLeague={selectedLeague}
        onLeagueChange={setSelectedLeague}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        view={view}
        onViewChange={setView}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onPreviousDay={goToPreviousDay}
        onNextDay={goToNextDay}
        onToday={goToToday}
        dataSource={dataSource}
        onDataSourceChange={handleDataSourceChange}
      />

      <SchedulesFilterControls
        searchQuery={searchQuery}
        isAutocompleteOpen={isAutocompleteOpen}
        searchInputRef={searchInputRef}
        onSearchChange={handleSearchChange}
        onAutocompleteSelect={handleAutocompleteSelect}
        onBlur={handleBlur}
        onFocus={() => setIsAutocompleteOpen(true)}
        matches={allMatchesForAutocomplete}
        showTomorrowGames={showTomorrowGames}
        showWeekGames={showWeekGames}
        showFanDuelOddsOnly={showFanDuelOddsOnly}
        handleShowToday={handleShowToday}
        handleShowTomorrow={handleShowTomorrow}
        handleShowWeek={handleShowWeek}
        toggleFanDuelOddsFilter={toggleFanDuelOddsFilter}
      />

      <SchedulesTabContent
        view={view}
        setView={setView}
        formattedDate={formattedDate}
        showWeekGames={showWeekGames}
        goToPreviousDay={goToPreviousDay}
        goToNextDay={goToNextDay}
        goToToday={goToToday}
        filteredMatches={filteredMatches}
        isLoading={isLoading}
        error={error}
        refetchSchedule={refetchSchedule}
        itemsPerPage={10}
        divisionsStandings={divisionsStandings}
        isLoadingStandings={isLoadingStandings}
        selectedLeague={selectedLeague}
      />
    </div>
  );
};

export default SchedulesPage;
