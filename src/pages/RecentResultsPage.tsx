import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "@/components/NavBar";
import PageFooter from "@/components/PageFooter";
import { useSportsData } from "@/hooks/useSportsData";
import { applySmartScores } from "@/utils/smartScoreCalculator";
import { ScoreboardRow } from "@/components/layout/ScoreboardRow";
import { ArrowLeft, Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const LEAGUES = ['ALL', 'NBA', 'NFL', 'NCAAB', 'NHL', 'MLB', 'SOCCER'];

const RecentResultsPage = () => {
  const navigate = useNavigate();
  const [selectedLeague, setSelectedLeague] = useState<string>("ALL");
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const {
    finishedMatches: rawFinished,
    isLoading,
  } = useSportsData({
    league: selectedLeague as any,
    refreshInterval: 60000,
    useExternalApis: true,
  });

  const finishedMatches = useMemo(() => applySmartScores(rawFinished), [rawFinished]);

  // Filter by league
  const filteredMatches = useMemo(() => {
    if (selectedLeague === 'ALL') return finishedMatches;
    return finishedMatches.filter(m => m.league === selectedLeague);
  }, [finishedMatches, selectedLeague]);

  // Pagination logic
  const totalItems = filteredMatches.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMatches = filteredMatches.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleLeagueChange = (league: string) => {
    setSelectedLeague(league);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
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
          <CardContent className="py-4">
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
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              {totalItems} {selectedLeague === 'ALL' ? 'Total' : selectedLeague} Results
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
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
                No recent results found for {selectedLeague}
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
