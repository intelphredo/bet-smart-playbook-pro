import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "@/components/NavBar";
import PageFooter from "@/components/PageFooter";
import { useSportsData } from "@/hooks/useSportsData";
import { applySmartScores } from "@/utils/smartScoreCalculator";
import { ScoreboardRow } from "@/components/layout/ScoreboardRow";
import { ArrowLeft, Trophy, ChevronLeft, ChevronRight, Calendar, X, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, isWithinInterval, startOfDay, endOfDay, subDays, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const LEAGUES = ['ALL', 'NBA', 'NFL', 'NCAAB', 'NHL', 'MLB', 'SOCCER'];

const DATE_PRESETS = [
  { label: 'Today', getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: 'Yesterday', getValue: () => ({ from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) }) },
  { label: 'Last 3 Days', getValue: () => ({ from: startOfDay(subDays(new Date(), 2)), to: endOfDay(new Date()) }) },
  { label: 'Last 7 Days', getValue: () => ({ from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) }) },
  { label: 'This Week', getValue: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
  { label: 'Last Week', getValue: () => ({ from: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }), to: endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }) }) },
];

type SortOption = 'time-desc' | 'time-asc' | 'league-asc' | 'league-desc' | 'margin-desc' | 'margin-asc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'time-desc', label: 'Newest First' },
  { value: 'time-asc', label: 'Oldest First' },
  { value: 'league-asc', label: 'League (A-Z)' },
  { value: 'league-desc', label: 'League (Z-A)' },
  { value: 'margin-desc', label: 'Highest Margin' },
  { value: 'margin-asc', label: 'Lowest Margin' },
];

const RecentResultsPage = () => {
  const navigate = useNavigate();
  const [selectedLeague, setSelectedLeague] = useState<string>("ALL");
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('time-desc');

  const {
    finishedMatches: rawFinished,
    isLoading,
  } = useSportsData({
    league: selectedLeague as any,
    refreshInterval: 60000,
    useExternalApis: true,
  });

  const finishedMatches = useMemo(() => applySmartScores(rawFinished), [rawFinished]);

  // Helper to calculate score margin
  const getScoreMargin = (match: typeof finishedMatches[0]) => {
    if (!match.score) return 0;
    return Math.abs(match.score.home - match.score.away);
  };

  // Filter and sort matches
  const filteredAndSortedMatches = useMemo(() => {
    let matches = [...finishedMatches];
    
    // Filter by league
    if (selectedLeague !== 'ALL') {
      matches = matches.filter(m => m.league === selectedLeague);
    }
    
    // Filter by date range
    if (dateRange?.from) {
      matches = matches.filter(m => {
        const matchDate = new Date(m.startTime);
        if (dateRange.to) {
          return isWithinInterval(matchDate, { 
            start: startOfDay(dateRange.from!), 
            end: endOfDay(dateRange.to) 
          });
        }
        // Single day selection
        return isWithinInterval(matchDate, { 
          start: startOfDay(dateRange.from!), 
          end: endOfDay(dateRange.from!) 
        });
      });
    }
    
    // Sort matches
    matches.sort((a, b) => {
      switch (sortBy) {
        case 'time-desc':
          return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        case 'time-asc':
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        case 'league-asc':
          return a.league.localeCompare(b.league);
        case 'league-desc':
          return b.league.localeCompare(a.league);
        case 'margin-desc':
          return getScoreMargin(b) - getScoreMargin(a);
        case 'margin-asc':
          return getScoreMargin(a) - getScoreMargin(b);
        default:
          return 0;
      }
    });
    
    return matches;
  }, [finishedMatches, selectedLeague, dateRange, sortBy]);

  // Pagination logic
  const totalItems = filteredAndSortedMatches.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMatches = filteredAndSortedMatches.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleLeagueChange = (league: string) => {
    setSelectedLeague(league);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    setCurrentPage(1);
  };

  const handlePresetClick = (preset: typeof DATE_PRESETS[0]) => {
    setDateRange(preset.getValue());
    setCurrentPage(1);
    setIsCalendarOpen(false);
  };

  const clearDateFilter = () => {
    setDateRange(undefined);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as SortOption);
    setCurrentPage(1);
  };

  const formatDateRange = () => {
    if (!dateRange?.from) return "Select dates";
    if (!dateRange.to) return format(dateRange.from, "MMM d, yyyy");
    if (format(dateRange.from, "MMM d, yyyy") === format(dateRange.to, "MMM d, yyyy")) {
      return format(dateRange.from, "MMM d, yyyy");
    }
    return `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-muted">
              <Trophy className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Recent Results</h1>
              <p className="text-sm text-muted-foreground">
                All completed games across leagues
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="py-4 space-y-4">
            {/* Top row: League filter and date picker */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* League Filter */}
              <div className="flex flex-wrap gap-2">
                {LEAGUES.map((league) => (
                  <Button
                    key={league}
                    variant={selectedLeague === league ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleLeagueChange(league)}
                  >
                    {league}
                    {league !== 'ALL' && (
                      <Badge variant="secondary" className="ml-2">
                        {finishedMatches.filter(m => league === 'ALL' || m.league === league).length}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>

              {/* Date Range Picker */}
              <div className="flex items-center gap-2">
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal min-w-[200px]",
                        !dateRange?.from && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formatDateRange()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <div className="flex">
                      {/* Presets */}
                      <div className="border-r p-3 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Quick Select</p>
                        {DATE_PRESETS.map((preset) => (
                          <Button
                            key={preset.label}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-sm"
                            onClick={() => handlePresetClick(preset)}
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                      {/* Calendar */}
                      <div className="p-3">
                        <CalendarComponent
                          mode="range"
                          selected={dateRange}
                          onSelect={handleDateRangeSelect}
                          numberOfMonths={2}
                          disabled={{ after: new Date() }}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                
                {dateRange?.from && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearDateFilter}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Bottom row: Items per page and active filters */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t">
              {/* Active date filter badge */}
              {dateRange?.from && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Filtered:</span>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDateRange()}
                    <button onClick={clearDateFilter} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              )}
              
              {!dateRange?.from && (
                <span className="text-sm text-muted-foreground">Showing all dates</span>
              )}

              {/* Sort and Items per page */}
              <div className="flex items-center gap-4">
                {/* Sort dropdown */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-[150px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Items per page */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Show:</span>
                  <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                    <SelectTrigger className="w-[100px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEMS_PER_PAGE_OPTIONS.map(option => (
                        <SelectItem key={option} value={String(option)}>
                          {option} results
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              {totalItems} {selectedLeague === 'ALL' ? 'Total' : selectedLeague} Results
              {dateRange?.from && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({formatDateRange()})
                </span>
              )}
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {totalItems > 0 ? `Showing ${startIndex + 1}-${Math.min(endIndex, totalItems)} of ${totalItems}` : 'No results'}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))}
              </div>
            ) : paginatedMatches.length > 0 ? (
              <div className="divide-y">
                {paginatedMatches.map((match) => (
                  <ScoreboardRow key={match.id} match={match} showOdds={false} />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No results found for the selected filters</p>
                {dateRange?.from && (
                  <Button 
                    variant="link" 
                    onClick={clearDateFilter}
                    className="mt-2"
                  >
                    Clear date filter
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </Button>
            </div>
          </div>
        )}
      </main>

      <PageFooter />
    </div>
  );
};

export default RecentResultsPage;
