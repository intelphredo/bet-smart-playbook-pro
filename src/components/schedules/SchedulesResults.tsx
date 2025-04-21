
import { Match } from "@/types/sports";
import { useState, useEffect } from "react";
import ScheduleTable from "@/components/ScheduleTable";
import ScheduleCard from "@/components/ScheduleCard";
import { Button } from "@/components/ui/button";
import { 
  Pagination, 
  PaginationContent, 
  PaginationNext, 
  PaginationPrevious, 
  PaginationItem,
  PaginationLink 
} from "@/components/ui/pagination";
import { applySmartScores } from "@/utils/smartScoreCalculator";

interface SchedulesResultsProps {
  filteredMatches: Match[];
  isLoading: boolean;
  error: Error | null;
  handleRefreshData: () => void;
  itemsPerPage: number;
}

const SchedulesResults = ({ 
  filteredMatches, 
  isLoading, 
  error, 
  handleRefreshData,
  itemsPerPage
}: SchedulesResultsProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [processedMatches, setProcessedMatches] = useState<Match[]>([]);

  useEffect(() => {
    // Apply smart scores to matches
    setProcessedMatches(applySmartScores(filteredMatches));
  }, [filteredMatches]);

  const totalPages = Math.ceil(processedMatches.length / itemsPerPage);
  const paginatedMatches = (() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedMatches.slice(start, start + itemsPerPage);
  })();

  return (
    <>
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
          {processedMatches.length === 0 ? (
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
                  Showing <span className="font-medium">{Math.min(processedMatches.length, itemsPerPage)}</span> of{" "}
                  <span className="font-medium">{processedMatches.length}</span> games
                </p>
                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      {Array.from({length: Math.min(5, totalPages)}).map((_, i) => {
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
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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
    </>
  );
};

export default SchedulesResults;
