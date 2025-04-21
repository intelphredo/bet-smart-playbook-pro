import React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { League, DataSource } from "@/types/sports";
import SchedulesHeader from "@/components/schedules/SchedulesHeader";
import SchedulesResults from "@/components/schedules/SchedulesResults";
import { useSportsData } from "@/hooks/useSportsData";
import { format, startOfDay, endOfDay, addDays, parseISO } from "date-fns";
import { TeamAutocomplete } from "@/components/schedules/TeamAutocomplete";
import { Button } from "@/components/ui/button";

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

  // Get sports data
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
    defaultSource: dataSource
  });
  
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
      dateEnd = endOfDay(addDays(selectedDate, 6)); // Next 7 days including today
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
        // Filter by date
        const matchDate = parseISO(match.startTime);
        const isInDateRange = matchDate >= dateStart && matchDate <= dateEnd;
        // Filter by search query
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = searchQuery === "" || 
          match.homeTeam.name.toLowerCase().includes(searchLower) ||
          match.awayTeam.name.toLowerCase().includes(searchLower);

        // Filter by FanDuel odds if option is enabled
        const hasFanDuelOdds = !showFanDuelOddsOnly || 
          (match.liveOdds && match.liveOdds.some(odd => 
            odd.sportsbook.name.toLowerCase() === "fanduel"));
        return isInDateRange && matchesSearch && hasFanDuelOdds;
      } catch {
        return false;
      }
    });
  })();

  // Get a list of all matches for team suggestion
  const allMatchesForAutocomplete = allMatches || [];

  // Handler for input change (update query & show suggestions)
  const handleSearchChange = (v: string) => {
    setSearchQuery(v);
    setIsAutocompleteOpen(true);
  };

  // When a team is selected from autocomplete
  const handleAutocompleteSelect = (team: string) => {
    setSearchQuery(team);
    setIsAutocompleteOpen(false);
    // Optionally focus the input after selection
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Hide suggestions when losing focus from the input
  const handleBlur = () => {
    // Short timeout to allow click on suggestion before closing
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

  // Navigation to previous/next dates (disable or adjust when filtering by week)
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

  // Toggle between today, tomorrow, week
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
      
      <div className="relative mt-4 mb-2 max-w-md mx-auto">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search teams..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsAutocompleteOpen(true)}
          onBlur={handleBlur}
          className="w-full pl-8 pr-2 py-2 rounded-md border border-gray-300 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        {isAutocompleteOpen && (
          <TeamAutocomplete
            matches={allMatchesForAutocomplete}
            query={searchQuery}
            onSelect={handleAutocompleteSelect}
          />
        )}
      </div>
      
      <div className="mt-4 flex justify-between items-center max-w-md mx-auto">
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant={!showTomorrowGames && !showWeekGames ? "default" : "outline"}
            size="sm"
            onClick={handleShowToday}
          >
            Today's Games
          </Button>
          <Button 
            variant={showTomorrowGames ? "default" : "outline"}
            size="sm"
            onClick={handleShowTomorrow}
          >
            Tomorrow's Games
          </Button>
          <Button
            variant={showWeekGames ? "default" : "outline"}
            size="sm"
            onClick={handleShowWeek}
          >
            This Week's Games
          </Button>
        </div>
        <Button 
          variant={showFanDuelOddsOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFanDuelOddsOnly(!showFanDuelOddsOnly)}
          className="flex items-center gap-1"
        >
          {showFanDuelOddsOnly ? "All Sportsbooks" : "FanDuel Odds Only"}
        </Button>
      </div>
      
      <div className="mt-6">
        <Tabs defaultValue={view} value={view} onValueChange={(v) => setView(v as "schedule" | "standings")}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="schedule" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">{formattedDate}</h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={goToPreviousDay}
                      className="px-3 py-1 text-sm border rounded-md hover:bg-muted"
                    >
                      Previous Day
                    </button>
                    <button 
                      onClick={goToToday}
                      className="px-3 py-1 text-sm border rounded-md hover:bg-muted"
                    >
                      Today
                    </button>
                    <button 
                      onClick={goToNextDay}
                      className="px-3 py-1 text-sm border rounded-md hover:bg-muted"
                    >
                      Next Day
                    </button>
                  </div>
                </div>
                
                <SchedulesResults 
                  filteredMatches={filteredMatches}
                  isLoading={isLoading}
                  error={error}
                  handleRefreshData={refetchSchedule}
                  itemsPerPage={10}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="standings" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">
                  {selectedLeague === "ALL" ? "MLB" : selectedLeague} Standings
                </h2>
                
                {isLoadingStandings ? (
                  <div className="text-center p-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-t-2 border-navy-500"></div>
                    <p className="mt-4">Loading standings...</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {divisionsStandings.map((division, index) => (
                      <div key={index} className="overflow-hidden">
                        <h3 className="text-lg font-medium mb-2">{division.divisionName}</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-muted/50">
                                <th className="text-left p-2">Team</th>
                                <th className="p-2">W</th>
                                <th className="p-2">L</th>
                                <th className="p-2">PCT</th>
                                <th className="p-2">GB</th>
                                <th className="p-2">STRK</th>
                              </tr>
                            </thead>
                            <tbody>
                              {division.teams.map((team) => (
                                <tr key={team.team.id} className="border-b hover:bg-muted/50">
                                  <td className="p-2">
                                    <div className="flex items-center gap-2">
                                      {team.team.logo && (
                                        <img 
                                          src={team.team.logo} 
                                          alt={team.team.name} 
                                          className="w-5 h-5 object-contain"
                                        />
                                      )}
                                      <span>{team.team.name}</span>
                                    </div>
                                  </td>
                                  <td className="p-2 text-center">{team.wins}</td>
                                  <td className="p-2 text-center">{team.losses}</td>
                                  <td className="p-2 text-center">{team.winPercentage}</td>
                                  <td className="p-2 text-center">{team.gamesBack}</td>
                                  <td className="p-2 text-center">{team.streak}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SchedulesPage;
