import React, { useState, useEffect } from "react";
import { League, DataSource } from "@/types/sports";
import SchedulesHeader from "@/components/schedules/SchedulesHeader";
import SchedulesFilterControls from "@/components/schedules/SchedulesFilterControls";
import SchedulesTabContent from "@/components/schedules/SchedulesTabContent";
import { useSportsData } from "@/hooks/useSportsData";
import { format, startOfDay, endOfDay, addDays, parseISO, isValid } from "date-fns";
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

  // Get sports data with forced refresh every minute
  const { 
    allMatches, 
    upcomingMatches,
    liveMatches,
    finishedMatches,
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

  // Log data for debugging
  console.log('Total matches:', allMatches.length);
  console.log('Upcoming matches:', upcomingMatches.length);
  console.log('Live matches:', liveMatches.length);
  console.log('Finished matches:', finishedMatches.length);

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

  // Filter matches by date, search query
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
    
    console.log('Date range:', dateStart, 'to', dateEnd);

    // Start with all matches and display upcoming by default
    const matchesToFilter = [...allMatches, ...upcomingMatches];
    const uniqueMatches = Array.from(new Set(matchesToFilter.map(m => m.id)))
      .map(id => matchesToFilter.find(m => m.id === id))
      .filter(Boolean) as typeof matchesToFilter;

    return uniqueMatches.filter(match => {
      try {
        // Check if startTime exists and is valid
        if (!match.startTime) {
          console.warn('Match has no startTime:', match.id);
          return false;
        }
        
        const matchDate = parseISO(match.startTime);
        
        // Validate the parsed date
        if (!isValid(matchDate)) {
          console.warn('Invalid date parsed:', match.startTime);
          return false;
        }
        
        const isInDateRange = matchDate >= dateStart && matchDate <= dateEnd;
        
        // Search query filter
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = searchQuery === "" || 
          match.homeTeam.name.toLowerCase().includes(searchLower) ||
          match.awayTeam.name.toLowerCase().includes(searchLower);

        return isInDateRange && matchesSearch;
      } catch (e) {
        console.error('Error filtering match:', e);
        return false;
      }
    });
  })();
  
  console.log('Filtered matches:', filteredMatches.length);

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
    setTimeout(refetchSchedule, 100);
  };
  const handleShowTomorrow = () => {
    setShowTomorrowGames(true);
    setShowWeekGames(false);
    setTimeout(refetchSchedule, 100);
  };
  const handleShowWeek = () => {
    setShowWeekGames(true);
    setShowTomorrowGames(false);
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
        handleShowToday={handleShowToday}
        handleShowTomorrow={handleShowTomorrow}
        handleShowWeek={handleShowWeek}
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
